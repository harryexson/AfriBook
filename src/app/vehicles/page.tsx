import { Metadata } from 'next';
import { VehicleSearchPage } from '@/components/vehicle-rental/VehicleSearchPage';

export const metadata: Metadata = {
  title: 'Vehicle Rentals - Find & Rent Cars',
  description: 'Rent vehicles from trusted local hosts. Cars, SUVs, trucks, and more. Instant booking available.',
};

export default function VehiclesPage() {
  return <VehicleSearchPage />;
}