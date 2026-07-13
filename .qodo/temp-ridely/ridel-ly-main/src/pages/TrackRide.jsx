import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, User, MapPin, Clock, DollarSign, Star, Phone, MessageCircle, Navigation, RefreshCw, AlertCircle, Share2, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import ChatDialog from '../components/ride/ChatDialog';
import RideFeedbackDialog from '../components/rides/RideFeedbackDialog';
import SafetyFeatures from '../components/rides/SafetyFeatures';
import PushNotificationManager from '../components/notifications/PushNotificationManager';
import { createPageUrl } from '@/utils';

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

const MapController = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.setView(center, 14);
        }
    }, [center, map]);
    return null;
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function TrackRide() {
    const [ride, setRide] = useState(null);
    const [driver, setDriver] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [eta, setEta] = useState(null);
    const [previousEta, setPreviousEta] = useState(null);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [rideCompleted, setRideCompleted] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [previousDriverPosition, setPreviousDriverPosition] = useState(null);
    const [driverHeading, setDriverHeading] = useState(0);
    const [requestsCount, setRequestsCount] = useState(0);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const rideId = urlParams.get('id');

        if (!rideId) {
            setError('No ride ID provided');
            setIsLoading(false);
            return;
        }

        const initUser = async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
            } catch (e) {
                console.log('Not logged in');
            }
        };
        initUser();

        loadRideData(rideId);
        
        // FIXED: More aggressive polling for real-time tracking (every 3 seconds)
        const pollInterval = setInterval(() => loadRideData(rideId), 3000);
        const messageInterval = setInterval(() => checkUnreadMessages(rideId), 5000);

        return () => {
            clearInterval(pollInterval);
            clearInterval(messageInterval);
        };
    }, []);

    const loadRideData = async (rideId) => {
        try {
            const rideData = await base44.entities.Ride.get(rideId);

            if (!rideData) {
                setError('Ride not found');
                setIsLoading(false);
                return;
            }

            console.log('[TRACK RIDE] Loaded ride:', rideData.status);
            setRide(rideData);
            
            // Check for pending requests if ride is still requested
            if (rideData.status === 'requested') {
                try {
                    const requests = await base44.entities.RideRequest.filter({
                        ride_id: rideData.id,
                        status: 'pending'
                    });
                    setRequestsCount(requests.length);
                } catch (err) {
                    console.log('Could not fetch requests:', err);
                }
            }

            // Check if ride just completed
            if (rideData.status === 'completed' && !rideCompleted) {
                setRideCompleted(true);
                setTimeout(() => {
                    setShowFeedbackDialog(true);
                }, 1500);
            }

            // Load driver if assigned
            if (rideData.driver_id) {
                try {
                    const driverData = await base44.entities.User.get(rideData.driver_id);
                    console.log('[TRACK RIDE] Driver data loaded');
                    setDriver(driverData);

                    // FIXED: Real-time driver location tracking
                    if (driverData.driver_info?.current_location) {
                        const loc = driverData.driver_info.current_location;
                        const newLocation = {
                            lat: loc.latitude,
                            lng: loc.longitude,
                            last_updated: loc.last_updated
                        };
                        
                        // Only update if location actually changed (prevent unnecessary re-renders)
                        setDriverLocation(prevLoc => {
                            if (!prevLoc || 
                                Math.abs(prevLoc.lat - newLocation.lat) > 0.00001 || 
                                Math.abs(prevLoc.lng - newLocation.lng) > 0.00001) {
                                console.log('[TRACK RIDE] Driver location updated:', newLocation);
                                return newLocation;
                            }
                            return prevLoc;
                        });

                        // Calculate ETA based on current phase
                        const targetLocation = (rideData.status === 'accepted' || rideData.status === 'arriving') 
                            ? rideData.pickup_location 
                            : rideData.destination;

                        if (targetLocation) {
                            const distance = calculateDistance(
                                loc.latitude,
                                loc.longitude,
                                targetLocation.latitude,
                                targetLocation.longitude
                            );
                            const speed = 40; // km/h average speed
                            const timeMinutes = Math.round((distance / speed) * 60);
                            setEta(timeMinutes);
                        }
                    } else {
                        console.warn('[TRACK RIDE] Driver location not available');
                    }
                } catch (driverError) {
                    console.error('[TRACK RIDE] Error loading driver:', driverError);
                }
            }

            setIsLoading(false);
        } catch (error) {
            console.error('[TRACK RIDE] Error loading ride:', error);
            setError('Could not load ride data');
            setIsLoading(false);
        }
    };

    const checkUnreadMessages = async (rideId) => {
        try {
            const currentUser = await base44.auth.me();
            const messages = await base44.entities.RideMessage.filter({
                ride_id: rideId,
                is_read: false,
                sender_id: { $ne: currentUser.id }
            });
            setUnreadMessages(messages.length);
        } catch (error) {
            // Silently fail
        }
    };

    const handleCall = async () => {
        try {
            toast.info('Connecting call...');
            const result = await base44.functions.invoke('initiateMaskedCall', {
                rideId: ride.id,
                callerType: 'rider'
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

    const cancelRide = async () => {
        if (!window.confirm('Are you sure you want to cancel this ride?')) return;

        try {
            await base44.entities.Ride.update(ride.id, { status: 'cancelled' });
            
            // Notify driver if assigned
            if (ride.driver_id) {
                try {
                    await base44.functions.invoke('sendRideStatusNotification', { 
                        rideId: ride.id,
                        newStatus: 'cancelled',
                        recipientType: 'driver'
                    });
                } catch (e) {
                    console.log('Driver notification failed (non-blocking)');
                }
            }
            
            toast.success('Ride cancelled');
            window.location.href = '/Dashboard';
        } catch (error) {
            console.error('Cancel error:', error);
            toast.error('Could not cancel ride');
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-xl font-semibold text-gray-700">Loading your ride...</p>
                </div>
            </div>
        );
    }

    if (error || !ride) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <Toaster richColors />
                <Card className="max-w-md mx-4">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ride Not Found</h2>
                        <p className="text-gray-600 mb-6">{error || "The ride you're looking for doesn't exist."}</p>
                        <Button onClick={() => window.location.href = '/Dashboard'} className="w-full">
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusConfig = {
                requested: { color: 'bg-yellow-100', label: 'Finding Driver...', icon: '🔍' },
                accepted: { color: 'bg-blue-100', label: 'Driver On The Way', icon: '🚗' },
                arriving: { color: 'bg-purple-100', label: 'Driver Has Arrived', icon: '📍' },
                in_progress: { color: 'bg-green-100', label: 'Trip In Progress', icon: '🛣️' },
                completed: { color: 'bg-emerald-100', label: 'Trip Complete', icon: '✅' },
                cancelled: { color: 'bg-red-100', label: 'Cancelled', icon: '❌' }
            };

    const currentStatus = statusConfig[ride.status] || statusConfig.requested;
    const pickupLocation = ride.pickup_location ? 
        [ride.pickup_location.latitude, ride.pickup_location.longitude] : null;
    
    const destinationLocation = ride.destination ?
        [ride.destination.latitude, ride.destination.longitude] : null;

    return (
        <div className="h-screen w-full relative">
            <Toaster richColors />
            
            {/* Push Notification Manager for real-time status updates */}
            <PushNotificationManager 
                rideId={ride.id}
                userType="rider"
                onRideStatusChange={(updatedRide) => {
                    setRide(updatedRide);
                }}
            />
            
            {chatOpen && (
                <ChatDialog
                    rideId={ride.id}
                    isOpen={chatOpen}
                    onClose={() => setChatOpen(false)}
                    userType="rider"
                />
            )}

            {/* Map with Real-Time Tracking */}
            {pickupLocation && (
                <MapContainer 
                    center={driverLocation ? [driverLocation.lat, driverLocation.lng] : pickupLocation} 
                    zoom={14} 
                    scrollWheelZoom={true} 
                    className="h-full w-full"
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />
                    
                    {/* FIXED: Show driver marker with real-time updates */}
                    {driverLocation && ['accepted', 'arriving', 'in_progress'].includes(ride.status) && (
                        <Marker 
                            position={[driverLocation.lat, driverLocation.lng]} 
                            icon={driverIcon}
                        />
                    )}
                    
                    {/* Show pickup marker when driver hasn't picked up yet */}
                    {['accepted', 'arriving'].includes(ride.status) && (
                        <Marker position={pickupLocation} icon={pickupIcon} />
                    )}
                    
                    {/* Show destination marker during trip */}
                    {ride.status === 'in_progress' && destinationLocation && (
                        <Marker position={destinationLocation} icon={pickupIcon} />
                    )}
                    
                    {/* Draw line from driver to target location */}
                    {driverLocation && (
                        <Polyline 
                            positions={[
                                [driverLocation.lat, driverLocation.lng],
                                ride.status === 'in_progress' ? destinationLocation : pickupLocation
                            ]} 
                            color="#3b82f6" 
                            weight={5}
                            opacity={0.7}
                            dashArray={ride.status === 'in_progress' ? undefined : "10, 10"}
                        />
                    )}
                    
                    {/* Show pickup location if no driver yet */}
                    {!driverLocation && ride.status === 'requested' && (
                        <Marker position={pickupLocation} icon={pickupIcon} />
                    )}
                    
                    <MapController center={driverLocation ? [driverLocation.lat, driverLocation.lng] : pickupLocation} />
                </MapContainer>
            )}

            {/* Status Banner */}
            <div className="absolute top-4 left-4 right-4 z-[1000]">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full ${currentStatus.color} flex items-center justify-center`}>
                                        <span className="text-2xl">{currentStatus.icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{currentStatus.label}</h3>
                                        {ride.status === 'requested' && requestsCount > 0 && (
                                           <p className="text-xs text-green-600 mt-0.5 font-medium">
                                               📤 {requestsCount} driver{requestsCount > 1 ? 's' : ''} notified
                                           </p>
                                        )}
                                        {ride.status === 'requested' && requestsCount === 0 && (
                                           <p className="text-xs text-gray-600 mt-0.5">Finding nearby drivers...</p>
                                        )}
                                        {driver && ['accepted', 'arriving'].includes(ride.status) && eta !== null && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {eta} min away
                                                </Badge>
                                                {driverLocation?.last_updated && (
                                                    <Badge className="bg-green-100 text-green-700 text-xs">
                                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                                        Live
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                        {ride.status === 'in_progress' && eta !== null && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                                    <Navigation className="w-3 h-3 mr-1" />
                                                    {eta} min to destination
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {ride.status === 'requested' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={cancelRide}
                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Driver Info Card */}
            {driver && ride.status !== 'requested' && (
                <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="shadow-2xl">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {driver.full_name?.charAt(0) || 'D'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold">{driver.full_name}</h3>
                                            {driver.average_rating && (
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                    <span className="text-sm font-semibold">{driver.average_rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                        {driver.driver_info && (
                                            <p className="text-sm text-gray-600">
                                                {driver.driver_info.vehicle_make} {driver.driver_info.vehicle_model} • {driver.driver_info.vehicle_color}
                                            </p>
                                        )}
                                        {driver.driver_info?.license_plate && (
                                            <p className="text-sm font-semibold text-gray-800 mt-1">
                                                🚗 {driver.driver_info.license_plate}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleCall}
                                        className="flex items-center gap-2"
                                    >
                                        <Phone className="w-4 h-4" />
                                        Call
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setChatOpen(true)}
                                        className="flex items-center gap-2 relative"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Message
                                        {unreadMessages > 0 && (
                                            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-0.5 text-xs">
                                                {unreadMessages}
                                            </Badge>
                                        )}
                                    </Button>
                                </div>

                                {ride.fare && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Total Fare</span>
                                            <span className="text-2xl font-bold">${ride.fare.total_fare?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        {ride.fare.surge_multiplier > 1 && (
                                            <p className="text-xs text-orange-600 mt-1">
                                                {ride.fare.surge_multiplier.toFixed(1)}x surge applied
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Safety Features */}
                                <div className="mt-4 pt-4 border-t">
                                    <SafetyFeatures ride={ride} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* Finding Driver State */}
            {!driver && ride.status === 'requested' && (
                <FindingDriverStatus ride={ride} requestsCount={requestsCount} />
            )}

            {/* Ride Completed State */}
            {ride.status === 'completed' && (
                <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                            <CardContent className="p-6">
                                <div className="text-center mb-4">
                                    <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-3" />
                                    <h3 className="text-xl font-bold text-gray-900">Ride Completed!</h3>
                                    <p className="text-sm text-gray-600 mt-1">Thank you for riding with Ride-ly</p>
                                </div>

                                {ride.fare && (
                                    <div className="bg-white rounded-lg p-4 mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-gray-600">Total Fare</span>
                                            <span className="text-2xl font-bold">${ride.fare.total_fare?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        {ride.fare.tip_amount > 0 && (
                                            <div className="flex items-center justify-between text-sm text-green-600">
                                                <span>Tip included</span>
                                                <span>+${ride.fare.tip_amount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {driver && !ride.rider_rating && (
                                        <Button
                                            onClick={() => setShowFeedbackDialog(true)}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                        >
                                            <Star className="w-4 h-4 mr-2" />
                                            Rate Your Driver
                                        </Button>
                                    )}
                                    {ride.rider_rating && (
                                        <div className="flex items-center justify-center gap-1 py-2">
                                            <span className="text-sm text-gray-600">You rated this ride:</span>
                                            {[1,2,3,4,5].map(i => (
                                                <Star key={i} className={`w-5 h-5 ${i <= ride.rider_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.href = createPageUrl('MyRides')}
                                        className="w-full"
                                    >
                                        View Ride History
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.href = createPageUrl('BookRide')}
                                        className="w-full"
                                    >
                                        Book Another Ride
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}

            {/* Ride Cancelled State */}
            {ride.status === 'cancelled' && (
                <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                    <Card className="shadow-2xl bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                        <CardContent className="p-6 text-center">
                            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-3" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Ride Cancelled</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                This ride has been cancelled. No charges were applied.
                            </p>
                            <Button
                                onClick={() => window.location.href = createPageUrl('BookRide')}
                                className="w-full"
                            >
                                Book a New Ride
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Feedback Dialog */}
            {driver && (
                <RideFeedbackDialog
                    ride={ride}
                    driver={driver}
                    isOpen={showFeedbackDialog}
                    onClose={() => setShowFeedbackDialog(false)}
                />
            )}
        </div>
    );
}