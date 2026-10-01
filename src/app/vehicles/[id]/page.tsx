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

  const description = `Rent this ${vehicle.year} ${vehicle.make} ${vehicle.model} from a trusted local host.`;

  return {
    title: `${vehicle.year} ${vehicle.make} ${vehicle.model} - Rent from $${vehicle.pricePerDay}/day`,
    description,
    openGraph: {
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      description,
      images: vehicle.coverImageUrl ? [vehicle.coverImageUrl] : [],
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