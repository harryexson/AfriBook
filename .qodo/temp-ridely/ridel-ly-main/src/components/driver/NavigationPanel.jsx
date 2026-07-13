import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Navigation,
  MapPin,
  ArrowRight,
  Clock,
  Map as MapIcon,
  Phone,
  MessageCircle,
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Calculate simple distance between two points
const calculateDistance = (from, to) => {
  const R = 6371; // Earth's radius in km
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLon = (to.lng - from.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) *
      Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate bearing between two points
const calculateBearing = (from, to) => {
  const dLon = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

// Get direction instruction based on bearing
const getDirectionInstruction = (bearing, currentBearing = 0) => {
  const diff = Math.abs(bearing - currentBearing);
  
  if (diff < 20) {
    return { text: 'Continue straight', icon: ArrowUp };
  } else if (diff < 90) {
    return { text: bearing > currentBearing ? 'Turn slight right' : 'Turn slight left', 
             icon: bearing > currentBearing ? ArrowUpRight : ArrowUpLeft };
  } else if (diff < 170) {
    return { text: bearing > currentBearing ? 'Turn right' : 'Turn left',
             icon: bearing > currentBearing ? ArrowRight : ArrowUpLeft };
  } else {
    return { text: 'Make a U-turn', icon: ArrowUp };
  }
};

export default function NavigationPanel({ 
  currentLocation, 
  destination, 
  destinationName,
  phase = 'pickup',
  onCall,
  onMessage,
  estimatedTime
}) {
  const [distance, setDistance] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [direction, setDirection] = useState({ text: 'Calculating...', icon: ArrowUp });

  useEffect(() => {
    if (currentLocation && destination) {
      const dist = calculateDistance(
        { lat: currentLocation.lat, lng: currentLocation.lng },
        { lat: destination.lat, lng: destination.lng }
      );
      setDistance(dist);

      const bear = calculateBearing(
        { lat: currentLocation.lat, lng: currentLocation.lng },
        { lat: destination.lat, lng: destination.lng }
      );
      setBearing(bear);

      const dir = getDirectionInstruction(bear);
      setDirection(dir);
    }
  }, [currentLocation, destination]);

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openAppleMaps = () => {
    const url = `http://maps.apple.com/?daddr=${destination.lat},${destination.lng}&dirflg=d`;
    window.open(url, '_blank');
  };

  const DirectionIcon = direction.icon;

  return (
    <div className="space-y-3">
      {/* Main Navigation Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-white/20 text-white border-white/30 text-xs">
              {phase === 'pickup' ? 'Picking Up' : 'Dropping Off'}
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              {estimatedTime || `${Math.ceil((distance / 40) * 60)} min`}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Distance Display */}
            <div className="text-center">
              <p className="text-blue-100 text-sm mb-1">Distance to Destination</p>
              <div className="flex items-end justify-center gap-2">
                <p className="text-5xl font-bold">{distance < 1 ? (distance * 1000).toFixed(0) : distance.toFixed(1)}</p>
                <p className="text-2xl font-semibold mb-1">{distance < 1 ? 'm' : 'km'}</p>
              </div>
            </div>

            {/* Direction Instruction */}
            <AnimatePresence mode="wait">
              <motion.div
                key={direction.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 bg-white/10 rounded-lg p-4"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <DirectionIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{direction.text}</p>
                  <p className="text-blue-100 text-sm">towards {destinationName}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Destination Address */}
            <div className="flex items-start gap-3 bg-white/10 rounded-lg p-3">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-100 mb-1">Destination</p>
                <p className="text-sm font-medium truncate">{destinationName}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={openGoogleMaps}
          className="h-14 bg-white hover:bg-gray-50 text-gray-900 flex flex-col items-center justify-center gap-1"
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-xs">Google Maps</span>
        </Button>
        <Button
          onClick={openAppleMaps}
          className="h-14 bg-white hover:bg-gray-50 text-gray-900 flex flex-col items-center justify-center gap-1"
        >
          <Navigation className="w-5 h-5" />
          <span className="text-xs">Apple Maps</span>
        </Button>
      </div>

      {/* Communication Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onCall}
          className="h-14 bg-green-600 hover:bg-green-700 flex flex-col items-center justify-center gap-1"
        >
          <Phone className="w-5 h-5" />
          <span className="text-xs">Call Rider</span>
        </Button>
        <Button
          onClick={onMessage}
          className="h-14 bg-purple-600 hover:bg-purple-700 flex flex-col items-center justify-center gap-1"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs">Message</span>
        </Button>
      </div>

      {/* Quick Tips */}
      <Card className="bg-gray-50">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-xs font-bold">💡</span>
            </div>
            <div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {phase === 'pickup' 
                  ? 'Call the rider if you can\'t find them. Use the in-app chat for quick updates.'
                  : 'Make sure to drop off at the exact location. Confirm with the rider if needed.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}