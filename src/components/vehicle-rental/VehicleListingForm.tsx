'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Image as ImageIcon, CheckCircle, Loader2, Trash2, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createVehicle, uploadVehicleImage, uploadVehicleDocument } from '@/lib/vehicle-rental';
import type { VehicleType, VehicleTransmission, VehicleFuelType, VehicleCondition, VehicleImageType, VehicleDocumentType } from '@/types';

const vehicleListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000, 'Description too long'),
  vehicleType: z.enum(['sedan', 'suv', 'truck', 'van', 'coupe', 'convertible', 'hatchback', 'wagon', 'minivan', 'pickup', 'luxury', 'electric', 'hybrid', 'motorcycle', 'scooter', 'rv', 'trailer', 'bus']),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  trim: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
  exteriorColorHex: z.string().optional(),
  interiorColor: z.string().optional(),
  interiorColorHex: z.string().optional(),
  transmission: z.enum(['automatic', 'manual', 'cvt', 'semi_automatic']),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plug_in_hybrid', 'cng', 'lpg', 'hydrogen']),
  engineSize: z.string().optional(),
  horsepower: z.number().min(1).optional(),
  drivetrain: z.string().optional(),
  doors: z.number().min(2).max(5).default(4),
  seats: z.number().min(1).max(15).default(5),
  mileage: z.number().min(0).default(0),
  condition: z.enum(['new', 'excellent', 'good', 'fair', 'poor']),
  vin: z.string().length(17, 'VIN must be 17 characters').optional().or(z.literal('')),
  licensePlate: z.string().min(1, 'License plate is required'),
  licensePlateState: z.string().optional(),
  licensePlateCountry: z.string().default('US'),
  registrationExpiryDate: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceExpiryDate: z.string().optional(),
  features: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  locationAddress: z.string().min(5, 'Address is required'),
  locationCity: z.string().min(2, 'City is required'),
  locationState: z.string().min(2, 'State is required'),
  locationPostalCode: z.string().min(5, 'Postal code is required'),
  locationCountryCode: z.string().default('US'),
  locationLatitude: z.number().optional(),
  locationLongitude: z.number().optional(),
  dailyRate: z.number().min(1, 'Daily rate must be at least $1'),
  weeklyDiscountPercent: z.number().min(0).max(100).default(0),
  monthlyDiscountPercent: z.number().min(0).max(100).default(0),
  minimumRentalDays: z.number().min(1).default(1),
  maximumRentalDays: z.number().min(1).max(365).default(30),
  securityDeposit: z.number().min(0).default(0),
  cleaningFee: z.number().min(0).default(0),
  deliveryAvailable: z.boolean().default(false),
  deliveryRadiusKm: z.number().min(0).default(0),
  deliveryFeePerKm: z.number().min(0).default(0),
  pickupInstructions: z.string().optional(),
  dropoffInstructions: z.string().optional(),
  isInstantBook: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
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
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'plug_in_hybrid', label: 'Plug-in Hybrid' },
  { value: 'cng', label: 'CNG' },
  { value: 'lpg', label: 'LPG' },
  { value: 'hydrogen', label: 'Hydrogen' },
];

const CONDITION_OPTIONS: { value: VehicleCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const FEATURE_OPTIONS = [
  'Bluetooth', 'USB Ports', 'Apple CarPlay', 'Android Auto', 'Navigation', 'Backup Camera',
  'Blind Spot Monitoring', 'Lane Keep Assist', 'Adaptive Cruise Control', 'Parking Sensors',
  'Sunroof/Moonroof', 'Leather Seats', 'Heated Seats', 'Ventilated Seats', 'Memory Seats',
  'Premium Audio', 'Wireless Charging', 'Keyless Entry', 'Remote Start', 'All-Wheel Drive',
  'Roof Rack', 'Tow Hitch', 'Bed Liner', 'Running Boards', 'Third Row Seating',
];

const AMENITY_OPTIONS = [
  'Air Conditioning', 'Heating', 'GPS Navigation', 'Phone Mount', 'Charging Cables',
  'First Aid Kit', 'Emergency Kit', 'Spare Tire', 'Jack & Tools', 'Owner\'s Manual',
  'Roadside Assistance', 'Unlimited Mileage', 'Pet Friendly', 'Smoke Free', 'Child Seat Available',
];

const RULE_OPTIONS = [
  'No smoking', 'No pets', 'No off-road driving', 'No racing', 'No towing',
  'Must be 25+ years old', 'Clean license required', 'International license accepted',
  'Return with same fuel level', 'No additional drivers without approval',
];

const IMAGE_TYPE_OPTIONS: { value: VehicleImageType; label: string; required: boolean }[] = [
  { value: 'exterior_front', label: 'Front Exterior *', required: true },
  { value: 'exterior_rear', label: 'Rear Exterior *', required: true },
  { value: 'exterior_side', label: 'Side Exterior *', required: true },
  { value: 'interior_front', label: 'Front Interior *', required: true },
  { value: 'interior_rear', label: 'Rear Interior', required: false },
  { value: 'dashboard', label: 'Dashboard', required: false },
  { value: 'engine', label: 'Engine Bay', required: false },
  { value: 'trunk', label: 'Trunk/Cargo Area', required: false },
  { value: 'wheels', label: 'Wheels/Tires', required: false },
];

const DOCUMENT_TYPE_OPTIONS: { value: VehicleDocumentType; label: string; required: boolean }[] = [
  { value: 'insurance', label: 'Insurance Policy *', required: true },
  { value: 'registration', label: 'Vehicle Registration *', required: true },
  { value: 'inspection', label: 'Safety Inspection *', required: true },
  { value: 'title', label: 'Vehicle Title', required: false },
];

interface ImageUpload {
  file: File;
  preview: string;
  type: VehicleImageType;
  isPrimary: boolean;
}

interface DocumentUpload {
  file: File;
  type: VehicleDocumentType;
  expiryDate?: string;
}

export function VehicleListingForm({ 
  hostId, 
  onSuccess,
  initialData 
}: { 
  hostId: string; 
  onSuccess?: (vehicle: any) => void;
  initialData?: Partial<VehicleListingFormData>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
  const [documentUploads, setDocumentUploads] = useState<DocumentUpload[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const form = useForm<VehicleListingFormData>({
    resolver: zodResolver(vehicleListingSchema),
    defaultValues: {
      vehicleType: 'sedan',
      transmission: 'automatic',
      fuelType: 'gasoline',
      condition: 'good',
      doors: 4,
      seats: 5,
      mileage: 0,
      licensePlateCountry: 'US',
      dailyRate: 50,
      weeklyDiscountPercent: 10,
      monthlyDiscountPercent: 20,
      minimumRentalDays: 1,
      maximumRentalDays: 30,
      securityDeposit: 200,
      cleaningFee: 50,
      deliveryAvailable: false,
      deliveryRadiusKm: 0,
      deliveryFeePerKm: 0,
      isInstantBook: false,
      requiresApproval: true,
      features: [],
      amenities: [],
      rules: [],
      ...initialData,
    },
  });

  const { watch, setValue } = form;
  const features = watch('features');
  const amenities = watch('amenities');
  const rules = watch('rules');

  const handleImageUpload = (files: FileList, type: VehicleImageType) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const preview = URL.createObjectURL(file);
      setImageUploads(prev => [...prev, { file, preview, type, isPrimary: false }]);
    });
  };

  const removeImageUpload = (index: number) => {
    setImageUploads(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDocumentUpload = (files: FileList, type: VehicleDocumentType) => {
    Array.from(files).forEach(file => {
      setDocumentUploads(prev => [...prev, { file, type, expiryDate: undefined }]);
    });
  };

  const removeDocumentUpload = (index: number) => {
    setDocumentUploads(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: VehicleListingFormData) => {
    setIsSubmitting(true);
    try {
      // Create vehicle first
      const vehicle = await createVehicle({
        ...data,
        hostId,
        features: data.features || [],
        amenities: data.amenities || [],
        rules: data.rules || [],
        images: [],
        vin: data.vin || undefined,
        registrationExpiryDate: data.registrationExpiryDate || undefined,
        insuranceExpiryDate: data.insuranceExpiryDate || undefined,
      });

      // Upload images
      for (const upload of imageUploads) {
        await uploadVehicleImage(vehicle.id, upload.file, upload.type, upload.isPrimary);
      }

      // Upload documents
      for (const upload of documentUploads) {
        await uploadVehicleDocument(vehicle.id, upload.file, upload.type, upload.expiryDate);
      }

      toast({ title: 'Success!', description: 'Your vehicle has been listed and is pending review.' });
      onSuccess?.(vehicle);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to list vehicle', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell renters about your vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Listing Title *</Label>
                  <Input
                    id="title"
                    {...form.register('title')}
                    placeholder="e.g., 2023 Toyota Camry - Clean, Reliable Sedan"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleType">Vehicle Type *</Label>
                  <Select {...form.register('vehicleType')}>
                    <SelectTrigger id="vehicleType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  rows={4}
                  placeholder="Describe your vehicle's condition, features, and what makes it special. Mention any unique details renters should know."
                />
              </div>

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
                  <Label htmlFor="trim">Trim</Label>
                  <Input id="trim" {...form.register('trim')} placeholder="LE, XLE, Limited" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="color">Exterior Color *</Label>
                  <Input id="color" {...form.register('color')} placeholder="White, Black, Silver, etc." />
                </div>
                <div>
                  <Label htmlFor="exteriorColorHex">Color Hex Code</Label>
                  <Input id="exteriorColorHex" {...form.register('exteriorColorHex')} placeholder="#FFFFFF" />
                </div>
                <div>
                  <Label htmlFor="interiorColor">Interior Color</Label>
                  <Input id="interiorColor" {...form.register('interiorColor')} placeholder="Black, Beige, Gray" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where is the vehicle located for pickup?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="locationAddress">Street Address *</Label>
                <Input id="locationAddress" {...form.register('locationAddress')} placeholder="123 Main Street" />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="locationCity">City *</Label>
                  <Input id="locationCity" {...form.register('locationCity')} placeholder="City" />
                </div>
                <div>
                  <Label htmlFor="locationState">State *</Label>
                  <Input id="locationState" {...form.register('locationState')} placeholder="State" />
                </div>
                <div>
                  <Label htmlFor="locationPostalCode">Postal Code *</Label>
                  <Input id="locationPostalCode" {...form.register('locationPostalCode')} placeholder="ZIP Code" />
                </div>
                <div>
                  <Label htmlFor="locationCountryCode">Country</Label>
                  <Select value={form.watch('locationCountryCode')} onValueChange={(v) => setValue('locationCountryCode', v)}>
                    <SelectTrigger id="locationCountryCode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select {...form.register('transmission')}>
                    <SelectTrigger id="transmission"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRANSMISSION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fuelType">Fuel Type *</Label>
                  <Select {...form.register('fuelType')}>
                    <SelectTrigger id="fuelType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <Select {...form.register('condition')}>
                    <SelectTrigger id="condition"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="engineSize">Engine Size</Label>
                  <Input id="engineSize" {...form.register('engineSize')} placeholder="2.0L, 3.5L V6" />
                </div>
                <div>
                  <Label htmlFor="horsepower">Horsepower</Label>
                  <Input id="horsepower" type="number" {...form.register('horsepower', { valueAsNumber: true })} placeholder="200" />
                </div>
                <div>
                  <Label htmlFor="drivetrain">Drivetrain</Label>
                  <Input id="drivetrain" {...form.register('drivetrain')} placeholder="FWD, RWD, AWD, 4WD" />
                </div>
                <div>
                  <Label htmlFor="doors">Doors</Label>
                  <Input id="doors" type="number" min="2" max="5" {...form.register('doors', { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="seats">Seats</Label>
                  <Input id="seats" type="number" min="1" max="15" {...form.register('seats', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input id="mileage" type="number" min="0" {...form.register('mileage', { valueAsNumber: true })} placeholder="45,000" />
                </div>
                <div>
                  <Label htmlFor="vin">VIN (17 characters)</Label>
                  <Input id="vin" {...form.register('vin')} placeholder="1HGCM82633A123456" maxLength={17} />
                </div>
                <div>
                  <Label htmlFor="licensePlate">License Plate *</Label>
                  <Input id="licensePlate" {...form.register('licensePlate')} placeholder="ABC1234" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="licensePlateState">License Plate State</Label>
                  <Input id="licensePlateState" {...form.register('licensePlateState')} placeholder="CA" />
                </div>
                <div>
                  <Label htmlFor="registrationExpiryDate">Registration Expiry</Label>
                  <Input id="registrationExpiryDate" type="date" {...form.register('registrationExpiryDate')} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features & Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Vehicle Features</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {FEATURE_OPTIONS.map(feature => (
                    <label key={feature} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={features.includes(feature)}
                        onChange={e => setValue('features', e.target.checked ? [...features, feature] : features.filter(f => f !== feature), { shouldDirty: true })}
                        className="rounded border-input"
                      />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AMENITY_OPTIONS.map(amenity => (
                    <label key={amenity} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={amenities.includes(amenity)}
                        onChange={e => setValue('amenities', e.target.checked ? [...amenities, amenity] : amenities.filter(a => a !== amenity), { shouldDirty: true })}
                        className="rounded border-input"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>House Rules</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {RULE_OPTIONS.map(rule => (
                    <label key={rule} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={rules.includes(rule)}
                        onChange={e => setValue('rules', e.target.checked ? [...rules, rule] : rules.filter(r => r !== rule), { shouldDirty: true })}
                        className="rounded border-input"
                      />
                      <span className="text-sm">{rule}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="dailyRate">Daily Rate ($) *</Label>
                  <Input id="dailyRate" type="number" min="1" step="1" {...form.register('dailyRate', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="weeklyDiscountPercent">Weekly Discount (%)</Label>
                  <Input id="weeklyDiscountPercent" type="number" min="0" max="100" step="1" {...form.register('weeklyDiscountPercent', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="monthlyDiscountPercent">Monthly Discount (%)</Label>
                  <Input id="monthlyDiscountPercent" type="number" min="0" max="100" step="1" {...form.register('monthlyDiscountPercent', { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="minimumRentalDays">Min Rental Days</Label>
                  <Input id="minimumRentalDays" type="number" min="1" {...form.register('minimumRentalDays', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="maximumRentalDays">Max Rental Days</Label>
                  <Input id="maximumRentalDays" type="number" min="1" max="365" {...form.register('maximumRentalDays', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="securityDeposit">Security Deposit ($)</Label>
                  <Input id="securityDeposit" type="number" min="0" step="1" {...form.register('securityDeposit', { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="cleaningFee">Cleaning Fee ($)</Label>
                  <Input id="cleaningFee" type="number" min="0" step="1" {...form.register('cleaningFee', { valueAsNumber: true })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={form.watch('deliveryAvailable')}
                  onCheckedChange={checked => setValue('deliveryAvailable', checked)}
                />
                <div>
                  <Label>Offer Delivery</Label>
                  <p className="text-sm text-muted-foreground">Deliver the vehicle to the renter's location</p>
                </div>
              </div>

              {form.watch('deliveryAvailable') && (
                <div className="grid gap-4 md:grid-cols-3 ml-10">
                  <div>
                    <Label htmlFor="deliveryRadiusKm">Delivery Radius (km)</Label>
                    <Input id="deliveryRadiusKm" type="number" min="0" {...form.register('deliveryRadiusKm', { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label htmlFor="deliveryFeePerKm">Fee per km ($)</Label>
                    <Input id="deliveryFeePerKm" type="number" min="0" step="0.01" {...form.register('deliveryFeePerKm', { valueAsNumber: true })} />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="pickupInstructions">Pickup Instructions</Label>
                  <Textarea id="pickupInstructions" {...form.register('pickupInstructions')} rows={2} placeholder="e.g., Meet at the front desk, key in lockbox #1234" />
                </div>
                <div>
                  <Label htmlFor="dropoffInstructions">Dropoff Instructions</Label>
                  <Textarea id="dropoffInstructions" {...form.register('dropoffInstructions')} rows={2} placeholder="e.g., Return to same location, park in spot #5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={form.watch('isInstantBook')}
                  onCheckedChange={checked => setValue('isInstantBook', checked)}
                />
                <div>
                  <Label>Instant Book</Label>
                  <p className="text-sm text-muted-foreground">Allow renters to book without approval</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={form.watch('requiresApproval')}
                  onCheckedChange={checked => setValue('requiresApproval', checked)}
                />
                <div>
                  <Label>Require Approval</Label>
                  <p className="text-sm text-muted-foreground">Manually approve each booking request</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Images</CardTitle>
              <CardDescription>
                Upload clear photos of your vehicle. Required images are marked with *.
                At minimum, we need front, rear, side exterior, and front interior photos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {IMAGE_TYPE_OPTIONS.map(({ value, label, required }) => (
                  <div key={value} className="border-2 border-dashed rounded-lg p-4 transition-colors hover:border-primary/50">
                    <Label className="block mb-2">{label} {required && <span className="text-red-500">*</span>}</Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files && handleImageUpload(e.target.files, value)}
                      className="sr-only"
                      id={`image-${value}`}
                    />
                    <label
                      htmlFor={`image-${value}`}
                      className="cursor-pointer flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-md"
                    >
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm">Click to upload</span>
                    </label>
                    {imageUploads.filter(u => u.type === value).map((upload, idx) => (
                      <div key={idx} className="relative mt-2">
                        <img src={upload.preview} alt={value} className="h-24 w-full object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => removeImageUpload(imageUploads.findIndex(u => u === upload))}
                          className="absolute top-1 right-1 rounded-full bg-red-500 text-white p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {upload.isPrimary && (
                          <CheckCircle className="absolute bottom-1 right-1 text-green-500 bg-white rounded-full p-0.5" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>
                Upload the required documents for verification. All documents must be valid and not expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {DOCUMENT_TYPE_OPTIONS.map(({ value, label, required }) => (
                  <div key={value} className="border-2 border-dashed rounded-lg p-4">
                    <Label className="block mb-2">{label} {required && <span className="text-red-500">*</span>}</Label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => e.target.files && handleDocumentUpload(e.target.files, value)}
                      className="sr-only"
                      id={`doc-${value}`}
                    />
                    <label
                      htmlFor={`doc-${value}`}
                      className="cursor-pointer flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-md"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm">Upload PDF or Image</span>
                    </label>
                    {documentUploads.filter(u => u.type === value).map((upload, idx) => (
                      <div key={idx} className="relative mt-2 flex items-center gap-2 bg-muted p-2 rounded">
                        <span className="text-sm flex-1">{upload.file.name}</span>
                        <input
                          type="date"
                          value={upload.expiryDate || ''}
                          onChange={e => setDocumentUploads(prev => prev.map((u, i) => i === idx ? { ...u, expiryDate: e.target.value } : u))}
                          className="text-sm border rounded px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeDocumentUpload(documentUploads.findIndex(u => u === upload))}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-sm">
        <Button type="button" variant="outline">Save as Draft</Button>
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