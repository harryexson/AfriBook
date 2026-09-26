'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Star, MapPin, Shield, Zap } from 'lucide-react';
import { formatVehiclePrice, getVehicleTypeLabel, type Vehicle } from '@/lib/vehicle-rental';
import { useAuth } from '@/hooks/useAuth';
import { addToFavorites, removeFromFavorites, isFavorite } from '@/lib/vehicle-rental';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle;
  variant?: 'default' | 'compact' | 'featured';
}

export function VehicleCard({ vehicle, variant = 'default' }: VehicleCardProps) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const primaryImage = vehicle.images?.find(img => img.isPrimary && img.type.startsWith('exterior')) ||
    vehicle.images?.find(img => img.type.startsWith('exterior')) ||
    vehicle.images?.[0];

  const hostName = vehicle.hostProfiles?.companyName || 'Individual Host';

  // Check favorite status on mount
  const checkFavorite = async () => {
    if (!user) {
      setIsCheckingFavorite(false);
      return;
    }
    try {
      const favorite = await isFavorite(user.id, vehicle.id);
      setIsFavorited(favorite);
    } catch (error) {
      console.error('Failed to check favorite:', error);
    } finally {
      setIsCheckingFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to save vehicles', variant: 'destructive' });
      return;
    }
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (isFavorited) {
        await removeFromFavorites(user.id, vehicle.id);
        setIsFavorited(false);
        toast({ title: 'Removed from favorites' });
      } else {
        await addToFavorites(user.id, vehicle.id);
        setIsFavorited(true);
        toast({ title: 'Added to favorites' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update favorites', variant: 'destructive' });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="group block">
      <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl cursor-pointer">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <span className="text-6xl">🚗</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {vehicle.isInstantBook && (
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                Instant Book
              </Badge>
            )}
            {vehicle.hostProfiles?.isVerified && (
              <Badge variant="outline" className="gap-1 bg-background/90">
                <Shield className="h-3 w-3" />
                Verified Host
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(); }}
            disabled={isToggling || isCheckingFavorite || !user}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
              isFavorited
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-muted-foreground hover:bg-red-50 hover:text-red-500'
            } disabled:opacity-50`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart 
              className={`h-5 w-5 transition-transform ${isFavorited ? 'fill-current scale-100' : 'scale-100'}`} 
              fill={isFavorited ? 'currentColor' : 'none'}
              strokeWidth={2}
            />
          </button>

          {/* Vehicle Type Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm gap-1">
              {getVehicleTypeLabel(vehicle.vehicleType as any)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              {vehicle.trim && (
                <p className="text-sm text-muted-foreground truncate">{vehicle.trim}</p>
              )}
            </div>
            {vehicle.averageRating > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{vehicle.averageRating.toFixed(1)}</span>
                <span className="text-xs">({vehicle.reviewCount})</span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {vehicle.locationCity}, {vehicle.locationState}
            </span>
          </div>

          {/* Specs */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground border-t pt-3">
            <span className="flex items-center gap-1">
              <span className="font-medium text-foreground">{vehicle.seats}</span> seats
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-foreground">{vehicle.transmission}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-foreground">{vehicle.fuelType.replace('_', ' ')}</span>
            </span>
            {vehicle.features?.length && (
              <span className="flex items-center gap-1">
                <span className="font-medium text-foreground">{vehicle.features.length}</span> features
              </span>
            )}
          </div>

          {/* Host */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Hosted by</span>
            <span className="font-medium text-foreground truncate max-w-[150px]">{hostName}</span>
            {vehicle.hostProfiles?.isVerified && (
              <Shield className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            )}
          </div>
        </CardContent>

        {/* Footer with Price */}
        <CardFooter className="px-4 pb-4 pt-0 border-t">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-foreground">
                {formatVehiclePrice(vehicle.dailyRate)}
              </span>
              <span className="text-muted-foreground ml-1">/day</span>
            </div>
            <Button className="w-full sm:w-auto" variant="default">
              View Details
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}