'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCountry } from '@/components/shared/CountryProvider';

// This page used to be a standalone demo with a hardcoded `services` array
// and a "Book Now" button with no href/onClick at all — a real dead end.
// The actual, working, data-driven service browse experience lives at
// /[country]/search (real businesses, real categories including the
// granular gig-provider ones like Barber/Spa/Photographer, real booking
// flow). Rather than maintain two disconnected browse experiences, this
// is now a real front door into that one: forward the query string
// (q, category) straight through so a deep link like
// /marketplace/services?category=Barber keeps working.
function ServicesRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { countryCode } = useCountry();

  useEffect(() => {
    const qs = searchParams?.toString();
    router.replace(`/${countryCode}/search${qs ? `?${qs}` : ''}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, searchParams?.toString()])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
    </div>
  );
}

export default function MarketplaceServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ServicesRedirect />
    </Suspense>
  );
}
