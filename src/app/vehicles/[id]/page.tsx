import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VehicleDetailPage } from '@/components/vehicle-rental/VehicleDetailPage';
import { getVehicle } from '@/lib/vehicle-rental';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicle(id);
  
  if (!vehicle) {
    return { title: 'Vehicle Not Found' };
  }

  return {
    title: `${vehicle.year} ${vehicle.make} ${vehicle.model} - Rent from $${vehicle.dailyRate}/day`,
    description: vehicle.description?.slice(0, 160) || `Rent this ${vehicle.year} ${vehicle.make} ${vehicle.model} from a trusted local host.`,
    openGraph: {
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      description: vehicle.description?.slice(0, 160) || '',
      images: vehicle.images?.[0]?.url ? [vehicle.images[0].url] : [],
    },
  };
}

export default async function VehiclePage({ params }: Props) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

  return <VehicleDetailPage vehicle={vehicle} />;
}