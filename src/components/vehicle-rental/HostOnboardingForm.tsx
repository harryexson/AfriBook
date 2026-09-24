'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { createHostProfile } from '@/lib/vehicle-rental';
import type { HostType } from '@/types';

const hostOnboardingSchema = z.object({
  hostType: z.enum(['individual', 'company', 'dealership', 'rental_company']),
  companyName: z.string().optional(),
  companyRegistrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  businessLicense: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceExpiryDate: z.string().optional(),
  contactPersonName: z.string().min(2, 'Contact person name is required'),
  contactPersonPhone: z.string().min(10, 'Valid phone number is required'),
  contactPersonEmail: z.string().email('Valid email is required'),
  addressStreet: z.string().min(5, 'Street address is required'),
  addressCity: z.string().min(2, 'City is required'),
  addressState: z.string().min(2, 'State is required'),
  addressPostalCode: z.string().min(5, 'Postal code is required'),
  addressCountryCode: z.string().default('US'),
  commissionRate: z.number().min(0).max(50).default(15),
}).refine((data) => {
  if (data.hostType !== 'individual') {
    return data.companyName && data.companyName.length >= 2;
  }
  return true;
}, {
  message: 'Company name is required for business hosts',
  path: ['companyName'],
});

type HostOnboardingFormData = z.infer<typeof hostOnboardingSchema>;

const HOST_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual', description: 'Rent out your personal vehicle(s)' },
  { value: 'company', label: 'Company', description: 'Business with fleet vehicles' },
  { value: 'dealership', label: 'Dealership', description: 'Auto dealership with inventory' },
  { value: 'rental_company', label: 'Rental Company', description: 'Professional car rental business' },
];

export function HostOnboardingForm({ onSuccess, userId }: { onSuccess?: (profile: any) => void; userId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBusinessFields, setShowBusinessFields] = useState(false);

  const form = useForm<HostOnboardingFormData>({
    resolver: zodResolver(hostOnboardingSchema),
    defaultValues: {
      hostType: 'individual',
      addressCountryCode: 'US',
      commissionRate: 15,
    },
  });

  const { watch, setValue } = form;
  const hostType = watch('hostType');

  const handleSubmit = async (data: HostOnboardingFormData) => {
    setIsSubmitting(true);
    try {
      const profile = await createHostProfile({
        ...data,
        userId,
        hostType: data.hostType as HostType,
        insuranceExpiryDate: data.insuranceExpiryDate || undefined,
      });
      toast({ title: 'Success!', description: 'Your host profile has been created.' });
      onSuccess?.(profile);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create host profile', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Become a Host</CardTitle>
          <CardDescription>
            List your vehicles and earn money by renting them out to verified renters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Host Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {HOST_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`relative cursor-pointer p-4 border-2 rounded-lg transition-all ${
                    hostType === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="hostType"
                    value={option.value}
                    checked={hostType === option.value}
                    onChange={() => {
                      setValue('hostType', option.value as HostType);
                      setShowBusinessFields(option.value !== 'individual');
                    }}
                    className="sr-only"
                  />
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                  {hostType === option.value && (
                    <div className="absolute top-2 right-2 text-primary">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {showBusinessFields && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Business Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input id="companyName" {...form.register('companyName')} placeholder="Your company name" />
                </div>
                <div>
                  <Label htmlFor="companyRegistrationNumber">Company Registration Number</Label>
                  <Input id="companyRegistrationNumber" {...form.register('companyRegistrationNumber')} placeholder="Registration number" />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID / EIN</Label>
                  <Input id="taxId" {...form.register('taxId')} placeholder="Tax identification number" />
                </div>
                <div>
                  <Label htmlFor="businessLicense">Business License</Label>
                  <Input id="businessLicense" {...form.register('businessLicense')} placeholder="Business license number" />
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Insurance Information</h3>
            <Alert variant="outline" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Required for all hosts</AlertTitle>
              <AlertDescription>
                Valid insurance is mandatory for all vehicles listed on the platform. You'll need to upload insurance documents during vehicle verification.
              </AlertDescription>
            </Alert>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                <Input id="insurancePolicyNumber" {...form.register('insurancePolicyNumber')} placeholder="Insurance policy number" />
              </div>
              <div>
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Input id="insuranceProvider" {...form.register('insuranceProvider')} placeholder="e.g., State Farm, Geico" />
              </div>
              <div>
                <Label htmlFor="insuranceExpiryDate">Expiry Date</Label>
                <Input id="insuranceExpiryDate" type="date" {...form.register('insuranceExpiryDate')} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Person</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="contactPersonName">Full Name *</Label>
                <Input id="contactPersonName" {...form.register('contactPersonName')} placeholder="Contact person name" />
              </div>
              <div>
                <Label htmlFor="contactPersonPhone">Phone *</Label>
                <Input id="contactPersonPhone" type="tel" {...form.register('contactPersonPhone')} placeholder="(555) 123-4567" />
              </div>
              <div>
                <Label htmlFor="contactPersonEmail">Email *</Label>
                <Input id="contactPersonEmail" type="email" {...form.register('contactPersonEmail')} placeholder="contact@company.com" />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Address</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="addressStreet">Street Address *</Label>
                <Input id="addressStreet" {...form.register('addressStreet')} placeholder="123 Main Street" />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="addressCity">City *</Label>
                  <Input id="addressCity" {...form.register('addressCity')} placeholder="City" />
                </div>
                <div>
                  <Label htmlFor="addressState">State *</Label>
                  <Input id="addressState" {...form.register('addressState')} placeholder="State" />
                </div>
                <div>
                  <Label htmlFor="addressPostalCode">Postal Code *</Label>
                  <Input id="addressPostalCode" {...form.register('addressPostalCode')} placeholder="ZIP Code" />
                </div>
                <div>
                  <Label htmlFor="addressCountryCode">Country</Label>
                  <Select value={form.watch('addressCountryCode')} onValueChange={(v) => setValue('addressCountryCode', v)}>
                    <SelectTrigger id="addressCountryCode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Platform Commission</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  {...form.register('commissionRate', { valueAsNumber: true })}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={false} disabled />
                  <span className="text-sm text-muted-foreground">Use default platform rate (15%)</span>
                </label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The platform takes a commission from each booking. You'll receive the remainder as your earnings.
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Create Host Profile'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}