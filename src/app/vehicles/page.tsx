import { Suspense } from 'react';
import { Metadata } from 'next';
import { VehicleSearchPage } from '@/components/vehicle-rental/VehicleSearchPage';

export const metadata: Metadata = {
  title: 'Vehicle Rentals - Find & Rent Cars',
  description: 'Rent vehicles from trusted local hosts. Cars, SUVs, trucks, and more. Instant booking available.',
};

export default function VehiclesPage() {
  // VehicleSearchPage reads useSearchParams(), which needs a Suspense
  // boundary or the static prerender of /vehicles fails the build.
  return (
    <Suspense fallback={null}>
      <VehicleSearchPage />
    </Suspense>
  );
}