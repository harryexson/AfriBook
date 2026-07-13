import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Package, Navigation, Phone, Check, X, MessageCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ChatDialog from '../ride/ChatDialog';
import NavigationPanel from './NavigationPanel';
import TripSummary from './TripSummary';

// Fix for default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
    iconUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/83d8d3f34_PassageroruserInterface-appbase44com-20251016-22_16_13.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const locationIcon = (isPickup) => new L.Icon({
    iconUrl: isPickup 
        ? 'https://img.icons8.com/color/96/marker.png' 
        : 'https://img.icons8.com/color-filled/96/marker.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0 && map) {
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [bounds, map]);
  return null;
};

// Haversine distance calculation
const getDistance = (from, to) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function ActiveRideMap({ ride, onRideUpdate }) {
  const [rider, setRider] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showNavPanel, setShowNavPanel] = useState(true);
  const [showTripSummary, setShowTripSummary] = useState(false);

  const isPickupPhase = useMemo(() => ride.status === 'accepted' || ride.status === 'arriving', [ride.status]);

  useEffect(() => {
    // Fetch initial rider data
    const fetchRider = async () => {
      if (ride.rider_id) {
        try {
            const riderData = await base44.entities.User.get(ride.rider_id);
            setRider(riderData);
        } catch (e) { 
            console.error("Could not fetch rider", e);
        }
      }
    };
    fetchRider();

    // Start watching driver's position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDriverLocation(newLocation);

        // Send location update to backend
        base44.functions.invoke('updateDriverLocation', {
            latitude: newLocation.lat,
            longitude: newLocation.lng,
            heading: position.coords.heading || 0,
            speed: position.coords.speed || 0,
            accuracy: position.coords.accuracy || 0
        }).catch(e => console.error("Failed to update location", e));
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [ride.rider_id, ride.id]);

  // Poll for unread messages
  useEffect(() => {
    const checkUnreadMessages = async () => {
      try {
        const messages = await base44.entities.RideMessage.filter({
          ride_id: ride.id,
          is_read: false
        });
        
        const currentUser = await base44.auth.me();
        const unread = messages.filter(msg => msg.sender_id !== currentUser.id);
        setUnreadMessages(unread.length);
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
    };

    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 3000);
    return () => clearInterval(interval);
  }, [ride.id]);
  
  const pickupLocation = ride.pickup_location ? { lat: ride.pickup_location.latitude, lng: ride.pickup_location.longitude } : null;
  const dropoffLocation = ride.destination ? { lat: ride.destination.latitude, lng: ride.destination.longitude } : null;

  const currentTarget = isPickupPhase ? pickupLocation : dropoffLocation;
  
  const eta = useMemo(() => {
      if (!driverLocation || !currentTarget) return '...';
      const distance = getDistance(driverLocation, currentTarget);
      const speed = 40;
      const timeHours = distance / speed;
      const timeMinutes = Math.round(timeHours * 60);
      return `${timeMinutes} min`;
  }, [driverLocation, currentTarget]);
  
  const handleCall = async () => {
    try {
      toast.info('Connecting call...');
      const result = await base44.functions.invoke('initiateMaskedCall', {
        rideId: ride.id,
        callerType: 'driver'
      });
      
      if (result.data?.success) {
        toast.success('Call initiated!');
      } else {
        toast.error(result.data?.message || 'Could not initiate call');
      }
    } catch (error) {
      console.error('Call error:', error);
      toast.error('Could not initiate call');
    }
  };

  const handleUpdateRideStatus = async (newStatus) => {
      const updateData = { status: newStatus };
      if (newStatus === 'completed') {
          updateData.completion_time = new Date().toISOString();
      }
      try {
        const updatedRide = await base44.entities.Ride.update(ride.id, updateData);
        onRideUpdate(updatedRide);
        
        if (newStatus === 'completed') {
            await base44.functions.invoke('sendCompletionMessage', { rideId: ride.id });
            setShowTripSummary(true);
        }

      } catch(e) {
          console.error("Failed to update ride status", e);
      }
  }

  if (!driverLocation || !pickupLocation || !dropoffLocation) {
      return <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">Getting your location...</div>;
  }

  const bounds = [
      [driverLocation.lat, driverLocation.lng],
      [currentTarget.lat, currentTarget.lng],
  ];

  return (
    <div className="h-full w-full relative">
      {chatOpen && (
        <ChatDialog
          rideId={ride.id}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          userType="driver"
        />
      )}

      {showTripSummary && (
        <TripSummary
          ride={ride}
          isOpen={showTripSummary}
          onClose={() => {
            setShowTripSummary(false);
            onRideUpdate({ ...ride, status: 'completed' });
          }}
        />
      )}

      <MapContainer center={[driverLocation.lat, driverLocation.lng]} zoom={15} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon} />
        <Marker position={[currentTarget.lat, currentTarget.lng]} icon={locationIcon(isPickupPhase)} />
        <Polyline positions={[[driverLocation.lat, driverLocation.lng], [currentTarget.lat, currentTarget.lng]]} color="#3b82f6" weight={5} />
        <FitBounds bounds={bounds} />
      </MapContainer>

      {/* Toggle Navigation Panel Button */}
      <button
        onClick={() => setShowNavPanel(!showNavPanel)}
        className="absolute top-4 right-4 z-[1000] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <Navigation className={`w-6 h-6 ${showNavPanel ? 'text-blue-600' : 'text-gray-600'}`} />
      </button>

      {/* Navigation Panel (Overlay) */}
      {showNavPanel && (
        <div className="absolute top-4 left-4 right-20 z-[1000] max-w-md">
          <NavigationPanel
            currentLocation={driverLocation}
            destination={currentTarget}
            destinationName={isPickupPhase ? ride.pickup_location.address : ride.destination.address}
            phase={isPickupPhase ? 'pickup' : 'dropoff'}
            onCall={handleCall}
            onMessage={() => setChatOpen(true)}
            estimatedTime={eta}
          />
        </div>
      )}

      {/* Bottom Action Card */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <Card className="shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
               <div>
                  <h3 className="font-bold text-lg">{isPickupPhase ? "Pick up Rider" : "Drop off Rider"}</h3>
                  <p className="text-gray-600 text-sm flex items-center gap-2"><User className="w-4 h-4"/> {rider?.full_name || '...'}</p>
               </div>
               <div className="text-right">
                    <p className="text-2xl font-bold">{eta}</p>
                    <p className="text-sm text-gray-500">ETA</p>
               </div>
            </div>
            
            <div className="mb-3">
              <Button 
                variant="outline" 
                className="w-full relative"
                onClick={() => setChatOpen(true)}
              >
                <MessageCircle className="w-4 h-4 mr-2"/> 
                Message Rider
                {unreadMessages > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-0.5 text-xs">
                    {unreadMessages}
                  </Badge>
                )}
              </Button>
            </div>
            
            <div>
              {ride.status === 'accepted' && (
                <Button className="w-full h-12 text-lg" onClick={() => handleUpdateRideStatus('arriving')}>Confirm Pickup</Button>
              )}
              {ride.status === 'arriving' && (
                <Button className="w-full h-12 text-lg" onClick={() => handleUpdateRideStatus('in_progress')}>Start Trip</Button>
              )}
              {ride.status === 'in_progress' && (
                <Button className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" onClick={() => handleUpdateRideStatus('completed')}>
                  <Check className="w-5 h-5 mr-2"/>
                  Complete Ride
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}