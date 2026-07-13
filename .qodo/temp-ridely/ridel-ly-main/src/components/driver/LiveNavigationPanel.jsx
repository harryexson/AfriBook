import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  MessageCircle, 
  MapPin,
  Clock
} from 'lucide-react';

export default function LiveNavigationPanel({ 
  currentLocation, 
  destination, 
  destinationName, 
  phase,
  onCall, 
  onMessage 
}) {
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);

  // Calculate distance and ETA
  useEffect(() => {
    if (!currentLocation || !destination) return;

    const calculateDistance = (from, to) => {
      const R = 6371; // Earth radius in km
      const dLat = (to.latitude - from.latitude) * Math.PI / 180;
      const dLon = (to.longitude - from.longitude) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(from.latitude * Math.PI / 180) * Math.cos(to.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const dist = calculateDistance(currentLocation, destination);
    setDistance(dist);

    // Use current speed if available, otherwise assume 40 km/h
    const speed = currentLocation.speed || 40;
    const estimatedMinutes = Math.max(1, Math.round((dist / speed) * 60));
    
    setEta(estimatedMinutes);
  }, [currentLocation, destination]);

  if (!currentLocation || !destination) {
    return null;
  }

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
      <CardContent className="p-4 space-y-4">
        {/* ETA Display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {phase === 'pickup' ? 'To Pickup' : 'To Destination'}
            </p>
            <p className="text-xs text-gray-400 truncate max-w-[200px]">
              {destinationName}
            </p>
          </div>
          <div className="text-right">
            {eta && (
              <>
                <p className="text-3xl font-bold text-blue-600">{eta} min</p>
                <p className="text-xs text-gray-500">{distance?.toFixed(1)} km</p>
              </>
            )}
          </div>
        </div>

        {/* Speed */}
        {currentLocation?.speed && (
          <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t">
            <span>Current Speed</span>
            <Badge variant="outline">{Math.round(currentLocation.speed)} km/h</Badge>
          </div>
        )}

        {/* Communication Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onCall}
            className="w-full"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onMessage}
            className="w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}