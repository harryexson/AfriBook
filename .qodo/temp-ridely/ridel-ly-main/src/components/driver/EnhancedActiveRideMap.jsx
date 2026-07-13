import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Check, MessageCircle, Navigation as NavigationIcon, Layers, MapPin, Phone, DollarSign, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ChatDialog from '../ride/ChatDialog';
import LiveNavigationPanel from './LiveNavigationPanel';
import TripSummary from './TripSummary';
import TurnByTurnNavigation from './TurnByTurnNavigation';
import PushNotificationManager from '../notifications/PushNotificationManager';

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

const pickupIcon = new L.Icon({
    iconUrl: 'https://img.icons8.com/color/96/marker.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const dropoffIcon = new L.Icon({
    iconUrl: 'https://img.icons8.com/color-filled/96/marker.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

const MapController = ({ center, bounds }) => {
    const map = useMap();
    
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
        } else if (center) {
            map.setView(center, 15);
        }
    }, [center, bounds, map]);
    
    return null;
};

const TrafficOverlay = ({ route }) => {
    if (!route || !route.waypoints) return null;
    
    return (
        <>
            {route.waypoints.map((waypoint, idx) => {
                if (idx === 0 || idx === route.waypoints.length - 1) return null;
                
                const instruction = route.instructions.find(inst => 
                    Math.abs(inst.location.lat - waypoint.lat) < 0.001 &&
                    Math.abs(inst.location.lng - waypoint.lng) < 0.001
                );
                
                let color = '#22c55e';
                let radius = 50;
                
                if (instruction) {
                    if (instruction.traffic_level === 'heavy') {
                        color = '#ef4444';
                        radius = 100;
                    } else if (instruction.traffic_level === 'moderate') {
                        color = '#f59e0b';
                        radius = 75;
                    }
                }
                
                return (
                    <Circle
                        key={`traffic-${idx}`}
                        center={[waypoint.lat, waypoint.lng]}
                        radius={radius}
                        pathOptions={{
                            color: color,
                            fillColor: color,
                            fillOpacity: 0.15,
                            weight: 2,
                            opacity: 0.4
                        }}
                    />
                );
            })}
        </>
    );
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function EnhancedActiveRideMap({ ride, onRideUpdate }) {
  const [rider, setRider] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showNavPanel, setShowNavPanel] = useState(true);
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [navExpanded, setNavExpanded] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);
  const [locationError, setLocationError] = useState(null);
  const [isRetryingLocation, setIsRetryingLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [previousDriverLocation, setPreviousDriverLocation] = useState(null);
  const previousEtaRef = useRef(null);

  const isPickupPhase = useMemo(() => 
    ride.status === 'accepted' || ride.status === 'arriving', 
    [ride.status]
  );

  // Fetch rider only ONCE
  useEffect(() => {
    let isMounted = true;
    
    const fetchRider = async () => {
      if (!ride.rider_id) return;
      if (rider?.id === ride.rider_id) return;
      
      try {
        const riderData = await base44.entities.User.get(ride.rider_id);
        if (isMounted) {
          setRider(riderData);
        }
      } catch (e) { 
        console.log("Could not fetch rider (will retry):", e.message);
        setTimeout(() => {
          if (isMounted && !rider) {
            fetchRider();
          }
        }, 10000);
      }
    };
    
    fetchRider();
    
    return () => {
      isMounted = false;
    };
  }, [ride.rider_id]);

  // FIXED: Enhanced geolocation with better error handling and retry logic
  useEffect(() => {
    let watchId = null;
    let isMounted = true;
    let retryTimeout = null;
    let consecutiveErrors = 0;
    
    const getLocationOptions = (attempt = 0) => {
      // Progressive enhancement: start with high accuracy, fall back to faster/less accurate
      if (attempt === 0) {
        return {
          enableHighAccuracy: true,
          timeout: 30000,        // 30 seconds timeout (increased from 15s)
          maximumAge: 0          // Don't use cached location initially
        };
      } else if (attempt === 1) {
        return {
          enableHighAccuracy: false, // Faster, less accurate
          timeout: 20000,            // 20 seconds
          maximumAge: 10000          // Accept 10s old location
        };
      } else {
        return {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 30000          // Accept 30s old location
        };
      }
    };

    const handleLocationSuccess = (position) => {
      if (!isMounted) return;
      
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        heading: position.coords.heading || 0,
        speed: position.coords.speed || 0,
        accuracy: position.coords.accuracy || 0
      };
      
      console.log('[DRIVER LOCATION] Updated:', newLocation);
      
      // Store previous location for smooth animation
      setDriverLocation(prev => {
        if (prev) {
          setPreviousDriverLocation(prev);
        }
        return newLocation;
      });
      setLocationAccuracy(position.coords.accuracy);
      setLocationError(null);
      setIsRetryingLocation(false);
      consecutiveErrors = 0;
      
      // Update backend less frequently
      setLocationUpdateCount(prev => {
        const newCount = prev + 1;
        if (newCount % 10 === 0) {
          base44.functions.invoke('updateDriverLocation', {
            latitude: newLocation.lat,
            longitude: newLocation.lng,
            heading: newLocation.heading,
            speed: newLocation.speed,
            accuracy: newLocation.accuracy
          }).catch(e => {
            console.log("Location update skipped:", e.message);
          });
        }
        return newCount;
      });
    };

    const handleLocationError = (error) => {
      if (!isMounted) return;
      
      consecutiveErrors++;
      console.error("Geolocation error:", error);
      
      let errorMessage = "Could not get your location.";
      let shouldRetry = true;
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission denied. Please enable location access.";
          shouldRetry = false;
          setLocationError(errorMessage);
          toast.error(errorMessage);
          break;
          
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location unavailable. Check your GPS signal.";
          setLocationError(errorMessage);
          break;
          
        case error.TIMEOUT:
          errorMessage = "Location request timed out. Retrying...";
          setLocationError(errorMessage);
          break;
          
        default:
          errorMessage = "Location error. Retrying...";
          setLocationError(errorMessage);
      }
      
      // Retry with progressively less strict requirements
      if (shouldRetry && consecutiveErrors < 5) {
        setIsRetryingLocation(true);
        
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        
        retryTimeout = setTimeout(() => {
          if (isMounted) {
            console.log(`[LOCATION] Retry attempt ${consecutiveErrors}...`);
            startWatchingPosition(consecutiveErrors);
          }
        }, Math.min(5000 * consecutiveErrors, 20000)); // 5s, 10s, 15s, 20s
      } else if (consecutiveErrors >= 5) {
        setLocationError("Unable to get location after multiple attempts. Using approximate location.");
        // Use pickup location as fallback
        if (ride.pickup_location) {
          setDriverLocation({
            lat: ride.pickup_location.latitude,
            lng: ride.pickup_location.longitude,
            heading: 0,
            speed: 0,
            accuracy: 5000 // Very low accuracy to indicate estimate
          });
          setLocationAccuracy(5000);
        }
      }
    };

    const startWatchingPosition = (attempt = 0) => {
      if (!isMounted) return;
      
      const options = getLocationOptions(attempt);
      
      try {
        watchId = navigator.geolocation.watchPosition(
          handleLocationSuccess,
          handleLocationError,
          options
        );
      } catch (error) {
        console.error("Failed to start geolocation watch:", error);
        setLocationError("Geolocation not available on this device.");
      }
    };
    
    if (navigator.geolocation) {
      startWatchingPosition(0);
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      toast.error("Geolocation is not supported by your browser");
    }
    
    return () => {
      isMounted = false;
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  // Route calculation
  useEffect(() => {
    let isMounted = true;
    
    const calculateRoute = async () => {
      if (!isMounted || !driverLocation || !currentTarget) return;

      try {
        const result = await base44.functions.invoke('calculateOptimalRoute', {
          startLat: driverLocation.lat,
          startLng: driverLocation.lng,
          endLat: currentTarget.lat,
          endLng: currentTarget.lng
        });

        if (isMounted && result.data?.success && result.data.recommended_route) {
          const route = result.data.recommended_route;
          setRouteData(route);
          
          const polyline = route.waypoints.map(wp => [wp.lat, wp.lng]);
          setRoutePolyline(polyline);
        }
      } catch (error) {
        // Silently fail
      }
    };

    const initialTimeout = setTimeout(() => {
      if (isMounted) {
        calculateRoute();
      }
    }, 2000);
    
    const interval = setInterval(() => {
      if (isMounted) {
        calculateRoute();
      }
    }, 300000);
    
    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [driverLocation?.lat, driverLocation?.lng]);

  // Check unread messages
  useEffect(() => {
    let isMounted = true;
    let lastCheck = 0;
    let consecutiveErrors = 0;

    const checkUnreadMessages = async () => {
      if (!isMounted) return;
      
      const now = Date.now();
      const minInterval = Math.min(20000 * Math.pow(2, consecutiveErrors), 60000);
      
      if (now - lastCheck < minInterval) return;
      
      lastCheck = now;
      
      try {
        const messages = await base44.entities.RideMessage.filter({
          ride_id: ride.id,
          is_read: false
        });
        
        const currentUser = await base44.auth.me();
        const unread = messages.filter(msg => msg.sender_id !== currentUser.id);
        
        if (isMounted) {
          setUnreadMessages(unread.length);
          consecutiveErrors = 0;
        }
      } catch (error) {
        consecutiveErrors++;
      }
    };

    const initialTimeout = setTimeout(() => {
      if (isMounted) {
        checkUnreadMessages();
      }
    }, 3000);
    
    const interval = setInterval(() => {
      if (isMounted) {
        checkUnreadMessages();
      }
    }, 20000);
    
    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [ride.id]);
  
  const pickupLocation = ride.pickup_location ? 
    { lat: ride.pickup_location.latitude, lng: ride.pickup_location.longitude } : null;
  const dropoffLocation = ride.destination ? 
    { lat: ride.destination.latitude, lng: ride.destination.longitude } : null;

  const currentTarget = isPickupPhase ? pickupLocation : dropoffLocation;
  
  const distanceToTarget = useMemo(() => {
    if (!driverLocation || !currentTarget) return null;
    
    try {
        const distance = calculateDistance(
            driverLocation.lat, 
            driverLocation.lng, 
            currentTarget.lat, 
            currentTarget.lng
        );
        return distance;
    } catch (error) {
        return null;
    }
  }, [driverLocation, currentTarget]);
  
  const estimatedTime = useMemo(() => {
    if (routeData?.total_duration_minutes) {
        return routeData.total_duration_minutes;
    }
    
    if (distanceToTarget !== null) {
        const speed = 25;
        const timeHours = distanceToTarget / speed;
        return Math.round(timeHours * 60);
    }
    
    return null;
  }, [routeData, distanceToTarget]);

  const estimatedTimeDisplay = estimatedTime ? `${estimatedTime}min` : '...';
  
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

  const openInGoogleMaps = () => {
    const destination = currentTarget;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${driverLocation.lat},${driverLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openInWaze = () => {
    const destination = currentTarget;
    const url = `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  const handleUpdateRideStatus = async (newStatus) => {
      const updateData = { status: newStatus };
      if (newStatus === 'completed') {
          updateData.completion_time = new Date().toISOString();
      }
      try {
        const updatedRide = await base44.entities.Ride.update(ride.id, updateData);
        onRideUpdate(updatedRide);
        
        // Send notification to rider about status change
        try {
            await base44.functions.invoke('sendRideStatusNotification', { 
                rideId: ride.id,
                newStatus: newStatus,
                recipientType: 'rider'
            });
        } catch (notifError) {
            console.log('Notification error (non-blocking):', notifError.message);
        }
        
        if (newStatus === 'completed') {
            await base44.functions.invoke('sendCompletionMessage', { rideId: ride.id });
            setShowTripSummary(true);
        }

        // Show toast for driver
        const statusMessages = {
            arriving: 'Rider notified that you have arrived',
            in_progress: 'Trip started! Navigate to destination',
            completed: 'Trip complete!'
        };
        if (statusMessages[newStatus]) {
            toast.success(statusMessages[newStatus]);
        }

      } catch(e) {
          console.error("Failed to update ride status", e);
          toast.error("Failed to update ride status");
      }
  };

  const handleRetryLocation = () => {
    setLocationError(null);
    setIsRetryingLocation(true);
    window.location.reload(); // Reload to restart geolocation
  };

  const handleRecalculateRoute = async () => {
    if (!driverLocation || !currentTarget) return;
    
    try {
      toast.info('Recalculating route...');
      const result = await base44.functions.invoke('calculateOptimalRoute', {
        startLat: driverLocation.lat,
        startLng: driverLocation.lng,
        endLat: currentTarget.lat,
        endLng: currentTarget.lng,
        avoidTraffic: true
      });

      if (result.data?.success && result.data.recommended_route) {
        const route = result.data.recommended_route;
        setRouteData(route);
        const polyline = route.waypoints.map(wp => [wp.lat, wp.lng]);
        setRoutePolyline(polyline);
        toast.success('Route updated!');
      }
    } catch (error) {
      console.error('Route recalculation error:', error);
      toast.error('Could not recalculate route');
    }
  };

  if (!driverLocation) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center max-w-md px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg mb-2">
              {isRetryingLocation ? 'Retrying location...' : 'Getting your location...'}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {locationError || 'Please enable location services'}
            </p>
            
            {locationError && !isRetryingLocation && (
              <div className="space-y-3">
                <Button 
                  onClick={handleRetryLocation}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Retry Location
                </Button>
                
                <div className="text-xs text-gray-500 mt-4 space-y-2">
                  <p>💡 <strong>Troubleshooting:</strong></p>
                  <ul className="text-left space-y-1">
                    <li>• Make sure Location Services are enabled</li>
                    <li>• Check browser permissions for location</li>
                    <li>• Try moving to an area with better GPS signal</li>
                    <li>• Enable WiFi for better location accuracy</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      );
  }
  
  if (!pickupLocation || !dropoffLocation) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <p className="text-lg">⚠️ Ride location data missing</p>
            <p className="text-sm text-gray-400 mt-2">Please contact support</p>
          </div>
        </div>
      );
  }

  const bounds = routePolyline.length > 0 
    ? routePolyline 
    : [[driverLocation.lat, driverLocation.lng], [currentTarget.lat, currentTarget.lng]];

  return (
    <div className="h-full w-full relative">
      {/* Push Notifications for driver */}
      <PushNotificationManager 
        rideId={ride.id}
        userType="driver"
        onRideStatusChange={(updatedRide) => {
          onRideUpdate(updatedRide);
        }}
      />
      
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

      <MapContainer 
        center={[driverLocation.lat, driverLocation.lng]} 
        zoom={15} 
        scrollWheelZoom={true} 
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon} />
        
        <Marker 
          position={[currentTarget.lat, currentTarget.lng]} 
          icon={isPickupPhase ? pickupIcon : dropoffIcon} 
        />
        
        {routePolyline.length > 0 ? (
          <Polyline 
            positions={routePolyline} 
            color="#3b82f6" 
            weight={6} 
            opacity={0.8}
          />
        ) : (
          <Polyline 
            positions={[[driverLocation.lat, driverLocation.lng], [currentTarget.lat, currentTarget.lng]]} 
            color="#3b82f6" 
            weight={5}
            dashArray="10, 10"
            opacity={0.5}
          />
        )}
        
        {showTrafficLayer && routeData && (
          <TrafficOverlay route={routeData} />
        )}
        
        <MapController center={[driverLocation.lat, driverLocation.lng]} bounds={bounds} />
      </MapContainer>

      {/* Location Accuracy Warning */}
      {locationAccuracy && locationAccuracy > 100 && (
        <div className="absolute top-4 left-4 z-[999] bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>Low GPS accuracy ({Math.round(locationAccuracy)}m)</span>
        </div>
      )}

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setShowNavPanel(!showNavPanel)}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <NavigationIcon className={`w-6 h-6 ${showNavPanel ? 'text-blue-600' : 'text-gray-600'}`} />
        </button>
        
        <button
          onClick={() => setShowTrafficLayer(!showTrafficLayer)}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Layers className={`w-6 h-6 ${showTrafficLayer ? 'text-green-600' : 'text-gray-600'}`} />
        </button>
      </div>

      {showNavPanel && (
        <div className="absolute top-4 left-4 right-20 z-[1000] max-w-md">
          <TurnByTurnNavigation
            routeData={routeData}
            currentLocation={driverLocation}
            destination={currentTarget}
            destinationName={isPickupPhase ? ride.pickup_location.address : ride.destination.address}
            phase={isPickupPhase ? 'pickup' : 'dropoff'}
            eta={estimatedTime}
            distance={distanceToTarget}
            onRecalculate={handleRecalculateRoute}
            isExpanded={navExpanded}
            onToggleExpand={() => setNavExpanded(!navExpanded)}
          />
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 z-[1000] space-y-2">
        {/* Quick Actions Bar */}
        <Card className="shadow-lg bg-white/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setChatOpen(true)}
                className="relative h-12 flex flex-col items-center justify-center gap-1"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">Chat</span>
                {unreadMessages > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold animate-pulse">
                    {unreadMessages}
                  </div>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={openInGoogleMaps}
                className="h-12 flex flex-col items-center justify-center gap-1"
              >
                <ExternalLink className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Google</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={openInWaze}
                className="h-12 flex flex-col items-center justify-center gap-1"
              >
                <ExternalLink className="w-5 h-5 text-cyan-600" />
                <span className="text-xs">Waze</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Control Card */}
        <Card className="shadow-2xl">
          <CardContent className="p-4">
            {/* Rider Info & ETA */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
               <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {isPickupPhase ? "Pickup Location" : "Drop-off Location"}
                  </p>
                  <h3 className="font-bold text-base">
                    {isPickupPhase ? ride.pickup_location?.address : ride.destination?.address}
                  </h3>
                  <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                    <User className="w-3 h-3"/> {rider?.full_name || 'Loading...'}
                  </p>
               </div>
               <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{estimatedTimeDisplay}</p>
                    {distanceToTarget !== null && (
                        <p className="text-xs text-gray-500">{distanceToTarget.toFixed(1)} mi away</p>
                    )}
               </div>
            </div>
            
            {/* Status Update Buttons */}
            <div className="space-y-2">
              {ride.status === 'accepted' && (
                <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg" onClick={() => handleUpdateRideStatus('arriving')}>
                  <MapPin className="w-6 h-6 mr-2"/>
                  I've Arrived at Pickup
                </Button>
              )}
              {ride.status === 'arriving' && (
                <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg" onClick={() => handleUpdateRideStatus('in_progress')}>
                  <NavigationIcon className="w-6 h-6 mr-2"/>
                  Start Trip
                </Button>
              )}
              {ride.status === 'in_progress' && (
                <>
                  {/* Fare Display */}
                  {ride.fare && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-3 border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          Trip Earnings
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          ${ride.fare.total_fare?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      {ride.fare.platform_contribution && (
                        <p className="text-xs text-green-600 mt-1">
                          +${ride.fare.platform_contribution.toFixed(2)} platform bonus
                        </p>
                      )}
                    </div>
                  )}
                  <Button 
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg" 
                    onClick={() => handleUpdateRideStatus('completed')}
                  >
                    <Check className="w-6 h-6 mr-2"/>
                    Complete Ride
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}