'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button-primitive';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-primitive';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createVehicle, uploadVehicleImage, type Vehicle } from '@/lib/vehicle-rental';
import type { VehicleType, VehicleTransmission, VehicleFuelType } from '@/types';

const vehicleListingSchema = z.object({
  companyName: z.string().optional(),
  isCompanyFleet: z.boolean(),
  vehicleType: z.enum(['sedan', 'suv', 'truck', 'van', 'coupe', 'convertible', 'hatchback', 'wagon', 'minivan', 'pickup', 'luxury', 'electric', 'hybrid', 'motorcycle', 'scooter', 'rv', 'trailer', 'bus']),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().optional(),
  transmission: z.enum(['automatic', 'manual', 'cvt', 'semi_automatic']),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg']),
  seats: z.number().min(1).max(60),
  vin: z.string().optional(),
  licensePlate: z.string().min(1, 'License plate is required'),
  countryCode: z.string().min(2, 'Country is required'),
  city: z.string().min(2, 'City is required'),
  address: z.string().optional(),
  pricePerDay: z.number().min(1, 'Daily rate must be at least 1'),
  currencyCode: z.string(),
  securityDeposit: z.number().min(0),
  mileageLimitPerDay: z.number().min(0).optional(),
  insuranceExpiry: z.string().optional(),
  features: z.array(z.string()),
});

type VehicleListingFormData = z.infer<typeof vehicleListingSchema>;

const VEHICLE_TYPE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'convertible', label: 'Convertible' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'wagon', label: 'Wagon' },
  { value: 'minivan', label: 'Minivan' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'rv', label: 'RV' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'bus', label: 'Bus' },
];

const TRANSMISSION_OPTIONS: { value: VehicleTransmission; label: string }[] = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
  { value: 'cvt', label: 'CVT' },
  { value: 'semi_automatic', label: 'Semi-Automatic' },
];

const FUEL_TYPE_OPTIONS: { value: VehicleFuelType; label: string }[] = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'cng', label: 'CNG' },
  { value: 'lpg', label: 'LPG' },
];

const FEATURE_OPTIONS = [
  'Bluetooth', 'USB Ports', 'Apple CarPlay', 'Android Auto', 'Navigation', 'Backup Camera',
  'Blind Spot Monitoring', 'Lane Keep Assist', 'Adaptive Cruise Control', 'Parking Sensors',
  'Sunroof/Moonroof', 'Leather Seats', 'Heated Seats', 'Premium Audio', 'Wireless Charging',
  'Keyless Entry', 'Remote Start', 'All-Wheel Drive', 'Roof Rack', 'Tow Hitch', 'Third Row Seating',
];

interface ImageUpload {
  file: File;
  preview: string;
}

async function uploadDocument(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', 'vehicles');
  formData.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to upload document');
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

export function VehicleListingForm({
  hostId,
  onSuccess,
  initialData,
}: {
  hostId: string;
  onSuccess?: (vehicle: Vehicle) => void;
  initialData?: Partial<VehicleListingFormData>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
  const [insuranceDoc, setInsuranceDoc] = useState<File | null>(null);
  const [registrationDoc, setRegistrationDoc] = useState<File | null>(null);

  const form = useForm<VehicleListingFormData>({
    resolver: zodResolver(vehicleListingSchema),
    defaultValues: {
      vehicleType: 'sedan',
      transmission: 'automatic',
      fuelType: 'petrol',
      seats: 5,
      countryCode: 'US',
      currencyCode: 'USD',
      pricePerDay: 50,
      securityDeposit: 200,
      isCompanyFleet: false,
      features: [],
      ...initialData,
    },
  });

  const { watch, setValue } = form;
  const features = watch('features');

  const handleImageUpload = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const preview = URL.createObjectURL(file);
      setImageUploads((prev) => [...prev, { file, preview }]);
    });
  };

  const removeImageUpload = (index: number) => {
    setImageUploads((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (data: VehicleListingFormData) => {
    setIsSubmitting(true);
    try {
      const [insuranceDocUrl, registrationDocUrl] = await Promise.all([
        insuranceDoc ? uploadDocument(insuranceDoc, `vehicles/${hostId}/documents`) : Promise.resolve(undefined),
        registrationDoc ? uploadDocument(registrationDoc, `vehicles/${hostId}/documents`) : Promise.resolve(undefined),
      ]);

      const vehicle = await createVehicle(hostId, {
        ...data,
        vin: data.vin || undefined,
        insuranceExpiry: data.insuranceExpiry || undefined,
        insuranceDocUrl,
        registrationDocUrl,
        galleryImages: [],
      });

      let updated = vehicle;
      for (const upload of imageUploads) {
        updated = await uploadVehicleImage(vehicle.id, upload.file, !updated.coverImageUrl);
      }

      toast({ title: 'Success!', description: 'Your vehicle has been listed and is pending review.' });
      onSuccess?.(updated);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to list vehicle', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="documents">Photos & Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell renters about your vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="make">Make *</Label>
                  <Input id="make" {...form.register('make')} placeholder="Toyota" />
                </div>
                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Input id="model" {...form.register('model')} placeholder="Camry" />
                </div>
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input id="year" type="number" {...form.register('year', { valueAsNumber: true })} placeholder="2023" />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" {...form.register('color')} placeholder="White, Black, Silver" />
                </div>
              </div>

              <div>
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <Select
                  id="vehicleType"
                  value={watch('vehicleType')}
                  onChange={(e) => setValue('vehicleType', e.target.value as VehicleType)}
                >
                  {VEHICLE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <Switch checked={watch('isCompanyFleet')} onCheckedChange={(checked) => setValue('isCompanyFleet', checked)} />
                <div>
                  <Label>Company Fleet Vehicle</Label>
                  <p className="text-sm text-muted-foreground">List this as part of a company/rental-company fleet</p>
                </div>
              </div>
              {watch('isCompanyFleet') && (
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" {...form.register('companyName')} placeholder="Acme Rentals" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where is the vehicle located for pickup?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" {...form.register('address')} placeholder="123 Main Street" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" {...form.register('city')} placeholder="City" />
                </div>
                <div>
                  <Label htmlFor="countryCode">Country Code *</Label>
                  <Input id="countryCode" {...form.register('countryCode')} placeholder="US" maxLength={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specs" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="transmission">Transmission *</Label>
                  <Select id="transmission" value={watch('transmission')} onChange={(e) => setValue('transmission', e.target.value as VehicleTransmission)}>
                    {TRANSMISSION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fuelType">Fuel Type *</Label>
                  <Select id="fuelType" value={watch('fuelType')} onChange={(e) => setValue('fuelType', e.target.value as VehicleFuelType)}>
                    {FUEL_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="seats">Seats</Label>
                  <Input id="seats" type="number" min="1" max="60" {...form.register('seats', { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="vin">VIN</Label>
                  <Input id="vin" {...form.register('vin')} placeholder="1HGCM82633A123456" maxLength={17} />
                </div>
                <div>
                  <Label htmlFor="licensePlate">License Plate *</Label>
                  <Input id="licensePlate" {...form.register('licensePlate')} placeholder="ABC1234" />
                </div>
              </div>

              <div>
                <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                <Input id="insuranceExpiry" type="date" {...form.register('insuranceExpiry')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {FEATURE_OPTIONS.map((feature) => (
                  <label key={feature} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={features.includes(feature)}
                      onChange={(e) =>
                        setValue('features', e.target.checked ? [...features, feature] : features.filter((f) => f !== feature), {
                          shouldDirty: true,
                        })
                      }
                      className="rounded border-input"
                    />
                    <span className="text-sm">{feature}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="pricePerDay">Daily Rate *</Label>
                  <Input id="pricePerDay" type="number" min="1" step="1" {...form.register('pricePerDay', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="currencyCode">Currency</Label>
                  <Input id="currencyCode" {...form.register('currencyCode')} placeholder="USD" maxLength={3} />
                </div>
                <div>
                  <Label htmlFor="securityDeposit">Security Deposit</Label>
                  <Input id="securityDeposit" type="number" min="0" step="1" {...form.register('securityDeposit', { valueAsNumber: true })} />
                </div>
              </div>
              <div>
                <Label htmlFor="mileageLimitPerDay">Mileage Limit (per day)</Label>
                <Input id="mileageLimitPerDay" type="number" min="0" {...form.register('mileageLimitPerDay', { valueAsNumber: true })} placeholder="Leave blank for unlimited" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Photos</CardTitle>
              <CardDescription>Upload clear photos of your vehicle. The first photo becomes the cover image.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleImageUpload(e.target.files)} className="sr-only" id="vehicle-images" />
              <label htmlFor="vehicle-images" className="cursor-pointer flex flex-col items-center gap-2 p-8 bg-muted/50 rounded-md border-2 border-dashed hover:border-primary/50">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm">Click to upload photos</span>
              </label>
              {imageUploads.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                  {imageUploads.map((upload, idx) => (
                    <div key={idx} className="relative">
                      <img src={upload.preview} alt="" className="h-24 w-full object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeImageUpload(idx)}
                        className="absolute top-1 right-1 rounded-full bg-red-500 text-white p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Documents</CardTitle>
              <CardDescription>Upload insurance and registration documents for verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border-2 border-dashed rounded-lg p-4">
                  <Label className="block mb-2">Insurance Policy</Label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setInsuranceDoc(e.target.files?.[0] ?? null)} className="sr-only" id="doc-insurance" />
                  <label htmlFor="doc-insurance" className="cursor-pointer flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-md">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">{insuranceDoc ? insuranceDoc.name : 'Upload PDF or Image'}</span>
                  </label>
                </div>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <Label className="block mb-2">Vehicle Registration</Label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setRegistrationDoc(e.target.files?.[0] ?? null)} className="sr-only" id="doc-registration" />
                  <label htmlFor="doc-registration" className="cursor-pointer flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-md">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">{registrationDoc ? registrationDoc.name : 'Upload PDF or Image'}</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-sm">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish Vehicle'
          )}
        </Button>
      </div>
    </form>
  );
}
