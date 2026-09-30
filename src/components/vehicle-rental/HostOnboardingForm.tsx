'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button-primitive';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-primitive';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Hosting has no separate onboarding/profile step — a host is just a
// profile that owns vehicles (company name and fleet status live directly
// on each Vehicle via VehicleListingForm). This component now only gates
// entry into that listing flow behind the Vehicle Host Agreement.
export function HostOnboardingForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleContinue = async () => {
    if (!agreedToTerms) {
      toast({ title: 'Agreement required', description: 'Please agree to the Vehicle Host Agreement to continue', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Become a Host</CardTitle>
        <CardDescription>List your vehicles and earn money by renting them out to verified renters.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Insurance required</AlertTitle>
          <AlertDescription>
            Valid insurance is mandatory for every vehicle listed on the platform. You&apos;ll upload insurance and
            registration documents when you list your first vehicle.
          </AlertDescription>
        </Alert>

        <div className="pt-2 border-t">
          <label className="flex items-start gap-2 cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-muted-foreground">
              I agree to the{' '}
              <Link href="/legal/vehicle-host-agreement" target="_blank" className="text-primary underline hover:no-underline">
                Vehicle Host Agreement
              </Link>
              , including the vehicle-condition standards, insurance requirements and security deposit terms.
            </span>
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleContinue} disabled={isSubmitting || !agreedToTerms} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Continuing...
              </>
            ) : (
              'Continue to List a Vehicle'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
