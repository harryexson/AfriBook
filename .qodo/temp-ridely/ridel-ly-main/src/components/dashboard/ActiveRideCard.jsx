import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Car, ArrowRight, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const STATUS_CONFIG = {
  requested: { label: 'Finding Driver', color: 'bg-yellow-500', icon: Clock },
  accepted: { label: 'Driver Assigned', color: 'bg-blue-500', icon: Car },
  arriving: { label: 'Driver Arriving', color: 'bg-purple-500', icon: Navigation },
  in_progress: { label: 'In Progress', color: 'bg-green-500', icon: Car }
};

export default function ActiveRideCard({ initialRide }) {
  const [ride, setRide] = useState(initialRide);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);

  // Simple polling for ride updates
  useEffect(() => {
    if (!initialRide?.id) return;
    let isMounted = true;

    const pollRide = async () => {
      if (!isMounted) return;
      
      try {
        const updatedRide = await base44.entities.Ride.get(initialRide.id);
        if (isMounted && updatedRide) {
          setRide(updatedRide);
        }
      } catch (error) {
        // Silent fail
      }
    };

    // Initial check after delay
    const initialTimeout = setTimeout(() => {
      if (isMounted) pollRide();
    }, 2000);

    // Poll every 10 seconds
    const interval = setInterval(() => {
      if (isMounted) pollRide();
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [initialRide?.id]);

  // Simple polling for driver location
  useEffect(() => {
    if (!ride?.driver_id) return;
    let isMounted = true;

    const pollLocation = async () => {
      if (!isMounted) return;
      
      try {
        const locations = await base44.entities.DriverLocation.filter({
          driver_id: ride.driver_id
        }, '-last_ping', 1);

        if (isMounted && locations.length > 0) {
          setDriverLocation(locations[0]);
          
          // Simple ETA calculation
          const targetLocation = ride.status === 'accepted' || ride.status === 'arriving'
            ? ride.pickup_location
            : ride.destination;
            
          if (targetLocation) {
            const R = 6371;
            const dLat = (targetLocation.latitude - locations[0].latitude) * Math.PI / 180;
            const dLon = (targetLocation.longitude - locations[0].longitude) * Math.PI / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(locations[0].latitude * Math.PI / 180) * Math.cos(targetLocation.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            
            const speed = locations[0].speed || 40;
            const minutes = Math.max(1, Math.round((distance / speed) * 60));
            
            setEta({ minutes, distance });
          }
        }
      } catch (error) {
        // Silent fail
      }
    };

    // Initial check after delay
    const initialTimeout = setTimeout(() => {
      if (isMounted) pollLocation();
    }, 2000);

    // Poll every 10 seconds
    const interval = setInterval(() => {
      if (isMounted) pollLocation();
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [ride?.driver_id, ride?.status, ride?.pickup_location, ride?.destination]);

  if (!ride) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[ride.status] || STATUS_CONFIG.requested;
  const StatusIcon = statusConfig.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={ride.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden border-2 border-blue-200 shadow-xl">
          <CardHeader className={`${statusConfig.color} text-white pb-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <StatusIcon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{statusConfig.label}</CardTitle>
                  {eta && (
                    <p className="text-sm opacity-90 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {eta.minutes} min • {eta.distance.toFixed(1)} km
                    </p>
                  )}
                </div>
              </div>
              {driverLocation && (
                <Badge className="bg-white/20 text-white border-white/30">
                  Live
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Location Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Pickup</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {ride.pickup_location.address}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Destination</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {ride.destination.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Real-time tracking indicator */}
            {driverLocation && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Tracking driver location</span>
                </div>
                {driverLocation.speed && (
                  <span>{Math.round(driverLocation.speed)} km/h</span>
                )}
              </div>
            )}

            {/* Action Button */}
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => window.location.href = `/TrackRide?id=${ride.id}`}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Track Live on Map
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}