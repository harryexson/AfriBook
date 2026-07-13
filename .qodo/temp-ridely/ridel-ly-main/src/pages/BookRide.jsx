import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Car,
  ArrowLeft,
  User as UserLucideIcon,
  Calendar as CalendarIcon,
  Clock,
  Repeat,
  Zap,
  Info,
  Loader2,
  Navigation,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import PromoCodeInput from '../components/promotions/PromoCodeInput';
import RidePreferencesCard from '../components/rides/RidePreferencesCard';
import SurgePricingMapOverlay from '../components/rides/SurgePricingMapOverlay';
import SchedulingGuide from '../components/rides/SchedulingGuide';

// Fix for default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
    iconUrl: 'https://static.vecteezy.com/system/resources/previews/027/659/535/original/element-design-of-user-location-pin-icon-png.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const rideTypes = [
  {
    id: "standard",
    name: "RideShare",
    description: "Affordable, everyday rides",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/55122b54d_rideshare_x.png",
    capacity: 4,
    baseFare: 12.50,
    estimatedTime: "5 min away"
  },
  {
    id: "comfort",
    name: "Comfort",
    description: "Newer cars with extra legroom",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/87e74f135_rideshare_comfort.png",
    capacity: 4,
    baseFare: 18.75,
    estimatedTime: "3 min away"
  },
  {
    id: "xl",
    name: "RideShare XL",
    description: "6 seats for groups and luggage",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/3e721a378_rideshare_xl.png",
    capacity: 6,
    baseFare: 20.25,
    estimatedTime: "6 min away"
  },
  {
    id: "premium",
    name: "Premium",
    description: "High-end cars with top-rated drivers",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/6ff4a0a78_rideshare_black.png",
    capacity: 4,
    baseFare: 29.95,
    estimatedTime: "8 min away"
  }
];

const MapController = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 14);
        }
    }, [center, map]);
    return null;
}

export default function BookRide() {
  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedRideType, setSelectedRideType] = useState(rideTypes[0]);
  const [isBooking, setIsBooking] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([34.0522, -118.2437]);
  const [bookingMode, setBookingMode] = useState('now');
  const [scheduledDateTime, setScheduledDateTime] = useState({ date: null, time: '' });
  const [surgeData, setSurgeData] = useState({ multiplier: 1.0, reason: null });
  const [isLoadingSurge, setIsLoadingSurge] = useState(false);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [isLoadingFare, setIsLoadingFare] = useState(false);
  const [fareRefreshInterval, setFareRefreshInterval] = useState(null);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [ridePreferences, setRidePreferences] = useState({
    music_genre: 'none',
    temperature: 'moderate',
    conversation_level: 'minimal',
    route_preference: 'fastest',
    special_requests: ''
  });
  
  const [recurringOptions, setRecurringOptions] = useState({
    scheduleName: '',
    recurrencePattern: 'daily',
    daysOfWeek: [],
    startDate: null,
    endDate: null,
    advanceAssignmentHours: 2,
    notifyBeforeMinutes: 30
  });

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      toast.error("Your browser doesn't support location services");
      // Set default location (LA) so user can still use the app
      setUserLocation({ latitude: 34.0522, longitude: -118.2437 });
      setPickup("Los Angeles, CA");
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(newLocation);
        setPickup("Current Location");
        setMapCenter([newLocation.latitude, newLocation.longitude]);
        setIsLoadingLocation(false);
        toast.success("📍 Location detected!");
      },
      (error) => {
        console.error('Location error:', error);
        setIsLoadingLocation(false);
        
        // Set default location so user can still proceed
        const defaultLocation = { latitude: 34.0522, longitude: -118.2437 };
        setUserLocation(defaultLocation);
        setMapCenter([defaultLocation.latitude, defaultLocation.longitude]);
        
        let errorMessage = "";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Using default location.";
            setLocationError("Permission denied - using default");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Using default location.";
            setLocationError("Unavailable - using default");
            break;
          case error.TIMEOUT:
            errorMessage = "Location timed out. Using default location.";
            setLocationError("Timed out - using default");
            break;
          default:
            errorMessage = "Could not detect location. Using default.";
            setLocationError("Using default location");
            break;
        }
        
        toast.info(errorMessage, { duration: 4000 });
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  useEffect(() => {
    if (step === 2 && userLocation && destination) {
      calculateFareEstimate();
      
      if (bookingMode === 'now') {
        const interval = setInterval(() => {
          calculateFareEstimate(true);
        }, 30000);
        
        setFareRefreshInterval(interval);
        
        return () => {
          if (interval) clearInterval(interval);
        };
      }
    } else if (fareRefreshInterval) {
        clearInterval(fareRefreshInterval);
        setFareRefreshInterval(null);
    }
  }, [step, userLocation, selectedRideType, bookingMode, scheduledDateTime, destination]);

  const calculateFareEstimate = async (silentRefresh = false) => {
    if (!userLocation || !destination) return;
    
    if (!silentRefresh) setIsLoadingFare(true);
    
    try {
      const dropoffLocation = {
        latitude: userLocation.latitude + 0.05,
        longitude: userLocation.longitude + 0.05
      };
      
      const scheduledTimeISO = (bookingMode === 'reserve' && scheduledDateTime.date && scheduledDateTime.time) 
        ? (() => {
            const [hours, minutes] = scheduledDateTime.time.split(':');
            const dateWithTime = new Date(scheduledDateTime.date);
            dateWithTime.setHours(parseInt(hours, 10));
            dateWithTime.setMinutes(parseInt(minutes, 10));
            return dateWithTime.toISOString();
          })()
        : null;
      
      const result = await base44.functions.invoke('calculateDynamicFare', {
        pickupLat: userLocation.latitude,
        pickupLng: userLocation.longitude,
        dropoffLat: dropoffLocation.latitude,
        dropoffLng: dropoffLocation.longitude,
        rideType: selectedRideType.id,
        isScheduled: bookingMode !== 'now',
        scheduledTime: scheduledTimeISO
      });
      
      if (result.data?.success) {
        const newFare = result.data.fare;
        
        if (silentRefresh && fareEstimate) {
          const oldTotal = fareEstimate.total_fare;
          const newTotal = newFare.total_fare;
          const percentChange = oldTotal === 0 ? (newTotal !== 0 ? 100 : 0) : Math.abs((newTotal - oldTotal) / oldTotal) * 100;
          
          if (percentChange >= 10) {
            toast.warning(`💰 Fare updated: ${newFare.surge_reason || 'Market conditions changed'}`, {
              description: `New price: $${newFare.total_fare.toFixed(2)}`,
              duration: 6000
            });
          }
        }
        
        setFareEstimate(newFare);
        setSurgeData({
          multiplier: newFare.surge_multiplier || 1.0,
          reason: newFare.surge_reason
        });
      } else {
        console.error('Error in calculateDynamicFare response:', result.data || result);
        if (!silentRefresh) {
            toast.error('Could not calculate fare estimate. Using base fare.');
        }
        // Set a default fare estimate so button isn't disabled
        setFareEstimate({
          total_fare: selectedRideType.baseFare,
          base_fare: selectedRideType.baseFare,
          distance_fare: 0,
          time_fare: 0,
          surge_multiplier: 1.0,
          estimated_distance_miles: 5, 
          estimated_duration_minutes: 15
        });
        setSurgeData({ multiplier: 1.0, reason: null });
      }
    } catch (error) {
      console.error('Error calculating fare:', error);
      if (!silentRefresh) {
        toast.error('Could not calculate fare estimate. Using base fare.');
      }
      // Set a default fare estimate so button isn't disabled
      setFareEstimate({
        total_fare: selectedRideType.baseFare,
        base_fare: selectedRideType.baseFare,
        distance_fare: 0,
        time_fare: 0,
        surge_multiplier: 1.0,
        estimated_distance_miles: 5, 
        estimated_duration_minutes: 15
      });
      setSurgeData({ multiplier: 1.0, reason: null });
    } finally {
      setIsLoadingFare(false);
    }
  };

  const handleLocationSubmit = () => {
    if (!userLocation) {
      toast.error("Please enable location services or enter your pickup address manually");
      return;
    }
    
    if (bookingMode === 'reserve') {
        if (!scheduledDateTime.date || !scheduledDateTime.time) {
            toast.error("Please select a date and time for your reservation.");
            return;
        }
    }
    
    if (bookingMode === 'recurring') {
        if (!recurringOptions.scheduleName) {
            toast.error("Please provide a name for your recurring schedule.");
            return;
        }
        if (!scheduledDateTime.time) {
            toast.error("Please select a time for your rides.");
            return;
        }
        if (!recurringOptions.startDate) {
            toast.error("Please select a start date.");
            return;
        }
        if (recurringOptions.recurrencePattern === 'custom' && recurringOptions.daysOfWeek.length === 0) {
            toast.error("Please select at least one day of the week.");
            return;
        }
    }
    
    if (pickup && destination) {
      setStep(2);
    } else {
        toast.error("Please enter both pickup and destination addresses.");
    }
  };
  
  const handleBack = () => {
      setStep(1);
      if (fareRefreshInterval) {
        clearInterval(fareRefreshInterval);
        setFareRefreshInterval(null);
      }
      setFareEstimate(null);
      setIsLoadingFare(false);
      setAppliedPromo(null);
  }

  const handleBookRide = async () => {
    console.log('[BOOKING] Starting ride booking...');

    if (!userLocation) {
      toast.error("Location is required. Please enable location services.");
      return;
    }
    
    setIsBooking(true);
    
    try {
      const user = await base44.auth.me();
      
      if (!fareEstimate && bookingMode !== 'recurring') {
          console.error('[BOOKING] No fare estimate available');
          toast.error("Fare estimate not available. Please try again.");
          setIsBooking(false);
          return;
      }

      let finalFareAmount = fareEstimate ? fareEstimate.total_fare : selectedRideType.baseFare;
      
      if (appliedPromo) {
        finalFareAmount = appliedPromo.final_fare;
      }

      // Apply Prime discount (20% off)
      let primeDiscount = 0;
      if (user.is_prime_member) {
        primeDiscount = finalFareAmount * 0.20;
        finalFareAmount = finalFareAmount - primeDiscount;
      }

      const finalFare = fareEstimate ? {
        total_fare: finalFareAmount,
        base_fare: fareEstimate.base_fare,
        distance_fare: fareEstimate.distance_fare,
        time_fare: fareEstimate.time_fare,
        surge_multiplier: fareEstimate.surge_multiplier,
        platform_fee: fareEstimate.platform_fee,
        promo_discount: appliedPromo ? appliedPromo.discount_amount : undefined,
        promo_code: appliedPromo ? appliedPromo.promo_id : undefined,
        prime_discount: primeDiscount
      } : {
        total_fare: finalFareAmount,
        base_fare: selectedRideType.baseFare,
        prime_discount: primeDiscount
      };

      if (bookingMode === 'recurring') {
        const recurringData = {
          user_id: user.id,
          schedule_name: recurringOptions.scheduleName,
          pickup_location: {
            address: pickup,
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          },
          destination: {
            address: destination,
            latitude: userLocation.latitude + 0.05,
            longitude: userLocation.longitude + 0.05
          },
          ride_type: selectedRideType.id,
          recurrence_pattern: recurringOptions.recurrencePattern,
          days_of_week: recurringOptions.daysOfWeek,
          scheduled_time: scheduledDateTime.time,
          start_date: recurringOptions.startDate.toISOString().split('T')[0],
          end_date: recurringOptions.endDate ? recurringOptions.endDate.toISOString().split('T')[0] : null,
          advance_assignment_hours: recurringOptions.advanceAssignmentHours,
          notification_settings: {
            notify_before_minutes: recurringOptions.notifyBeforeMinutes,
            send_sms: true,
            send_email: true
          },
          ride_preferences: ridePreferences,
        };

        await base44.entities.RecurringSchedule.create(recurringData);
        toast.success('✅ Recurring schedule created!');
        navigate(createPageUrl('ScheduledRides'));
        return;
      }

      let rideStatus = "requested";
      let rideScheduledTime = null;

      if (bookingMode === 'reserve' && scheduledDateTime.date && scheduledDateTime.time) {
        const [hours, minutes] = scheduledDateTime.time.split(':');
        const dateWithTime = new Date(scheduledDateTime.date);
        dateWithTime.setHours(parseInt(hours, 10));
        dateWithTime.setMinutes(parseInt(minutes, 10));
        rideScheduledTime = dateWithTime.toISOString();
        rideStatus = "scheduled";
      }

      const rideData = {
        rider_id: user.id,
        pickup_location: {
          address: pickup,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        destination: {
          address: destination,
          latitude: userLocation.latitude + 0.05,
          longitude: userLocation.longitude + 0.05
        },
        ride_type: selectedRideType.id,
        status: rideStatus,
        scheduled_time: rideScheduledTime,
        fare: finalFare,
        duration_minutes: fareEstimate?.estimated_duration_minutes || 15,
        distance_km: fareEstimate?.estimated_distance_miles || 5, // Here we keep miles for distance_km in DB for consistency based on previous logic
        ride_preferences: ridePreferences,
        original_eta_minutes: fareEstimate?.estimated_duration_minutes
      };

      const newRide = await base44.entities.Ride.create(rideData);
      
      if (appliedPromo && appliedPromo.promo_id) {
        try {
          await base44.entities.UserPromoUsage.create({
            user_id: user.id,
            promo_code_id: appliedPromo.promo_id,
            promo_code: appliedPromo.code || appliedPromo.promo_id,
            ride_id: newRide.id,
            discount_amount: appliedPromo.discount_amount,
            original_fare: appliedPromo.original_fare,
            final_fare: appliedPromo.final_fare
          });
        } catch (promoError) {
          console.error('Error recording promo usage:', promoError);
        }
      }
      
      if (rideStatus === 'requested') {
        toast.success('🎉 Ride booked! Finding drivers nearby...');
        
        // Navigate immediately
        setTimeout(() => {
          navigate(`/TrackRide?id=${newRide.id}`);
        }, 500);
        
        // Dispatch drivers in background
        base44.functions.invoke('findAvailableDrivers', { 
          rideId: newRide.id 
        }).catch(() => {}); // Catch error silently, toast already covers user
      } else {
        toast.success(`✅ Ride scheduled for ${format(new Date(rideScheduledTime), 'MMM d, yyyy \'at\' h:mm a')}!`);
        navigate(createPageUrl('ScheduledRides'));
      }
    } catch (error) {
      console.error("Error booking ride:", error);
      toast.error(`Failed to book ride: ${error.message || 'Unknown error'}`, {
        description: 'Please try again or contact support',
        duration: 6000
      });
    } finally {
      setIsBooking(false);
    }
  };

  const toggleDayOfWeek = (day) => {
    setRecurringOptions(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  // Helper function to safely get distance
  const getDistance = (estimate) => {
    if (!estimate) return null;
    return estimate.estimated_distance_miles || estimate.estimated_distance_km || null;
  };

  // Helper function to format distance
  const formatDistance = (estimate) => {
    const distance = getDistance(estimate);
    if (distance === null) return 'N/A';
    
    if (estimate.estimated_distance_miles !== undefined) {
      return `${distance.toFixed(1)} mi`;
    } else if (estimate.estimated_distance_km !== undefined) {
      return `${distance.toFixed(1)} km`;
    }
    // Fallback if neither is explicitly defined but distance exists
    return `${distance.toFixed(1)} units`;
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="p-2 bg-gray-800 rounded-t-lg">
                 <div className="grid grid-cols-3 gap-1 bg-gray-700 p-1 rounded-md">
                     <Button 
                        onClick={() => setBookingMode('now')} 
                        className={cn("h-auto py-2 text-xs transition-colors", bookingMode === 'now' ? 'bg-gray-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-600/50')}>
                        Ride Now
                     </Button>
                     <Button 
                        onClick={() => setBookingMode('reserve')}
                        className={cn("h-auto py-2 text-xs transition-colors", bookingMode === 'reserve' ? 'bg-gray-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-600/50')}>
                        Schedule
                    </Button>
                    <Button 
                        onClick={() => setBookingMode('recurring')}
                        className={cn("h-auto py-2 text-xs transition-colors", bookingMode === 'recurring' ? 'bg-gray-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-600/50')}>
                        <Repeat className="w-3 h-3 mr-1" />
                        Recurring
                    </Button>
                 </div>
              </div>
              
              <CardHeader className="pt-4">
                <CardTitle className="flex items-center gap-2 text-white">
                  {bookingMode === 'recurring' ? <Repeat className="w-5 h-5 text-purple-400" /> : bookingMode === 'reserve' ? <CalendarIcon className="w-5 h-5 text-blue-400" /> : <MapPin className="w-5 h-5 text-blue-400" />}
                  {bookingMode === 'recurring' ? 'Set up recurring rides' : bookingMode === 'reserve' ? 'Reserve a ride' : 'Where are you going?' }
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Location Status Banner */}
                {isLoadingLocation && (
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <p className="text-sm font-medium text-blue-900">Getting your location...</p>
                    </div>
                  </div>
                )}
                
                {locationError && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-red-900">{locationError}</p>
                          <p className="text-xs text-red-700">Please enable location permissions</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
                
                {userLocation && !isLoadingLocation && (
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-medium text-green-900">
                          📍 Location detected: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={getCurrentLocation}
                        className="text-green-700 hover:bg-green-100"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              
                {/* Scheduling Guide */}
                {bookingMode !== 'now' && (
                  <SchedulingGuide 
                    mode={bookingMode} 
                    scheduledTime={scheduledDateTime.time}
                    recurringOptions={recurringOptions}
                  />
                )}
                
                {/* Surge Info Banner for "Ride Now" mode */}
                {bookingMode === 'now' && surgeData.multiplier > 1.0 && (
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <p className="font-bold text-sm text-orange-900">
                        {surgeData.multiplier.toFixed(1)}x Surge Active
                      </p>
                    </div>
                    <p className="text-xs text-orange-800 mb-2 capitalize">
                      {surgeData.reason?.replace('_', ' ')}
                    </p>
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-gray-700">
                        💡 <strong>Save money:</strong> Schedule this ride instead to avoid surge pricing and save up to 60%!
                      </p>
                    </div>
                  </div>
                )}
              
                {bookingMode === 'recurring' && (
                    <Input 
                      placeholder="Schedule name (e.g., 'Morning Commute')" 
                      value={recurringOptions.scheduleName}
                      onChange={(e) => setRecurringOptions({...recurringOptions, scheduleName: e.target.value})}
                      className="h-12 bg-gray-800 border-gray-700 placeholder:text-gray-400" 
                    />
                )}
                
                {(bookingMode === 'reserve' || bookingMode === 'recurring') && (
                    <div className="space-y-3">
                      {bookingMode === 'recurring' && (
                        <>
                          <Select 
                            value={recurringOptions.recurrencePattern}
                            onValueChange={(value) => setRecurringOptions({...recurringOptions, recurrencePattern: value})}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700">
                              <SelectValue placeholder="Recurrence pattern" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                              <SelectItem value="weekends">Weekends (Sat-Sun)</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="custom">Custom days</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {(recurringOptions.recurrencePattern === 'custom' || recurringOptions.recurrencePattern === 'weekly') && (
                            <div className="grid grid-cols-7 gap-1">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                                const fullDay = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][idx];
                                return (
                                  <Button
                                    key={day}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleDayOfWeek(fullDay)}
                                    className={cn(
                                      "h-10 text-xs",
                                      recurringOptions.daysOfWeek.includes(fullDay) 
                                        ? 'bg-purple-600 text-white border-purple-600' 
                                        : 'bg-gray-800 border-gray-700'
                                    )}
                                  >
                                    {day}
                                  </Button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-white">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {(bookingMode === 'recurring' ? recurringOptions.startDate : scheduledDateTime.date) 
                                      ? format(bookingMode === 'recurring' ? recurringOptions.startDate : scheduledDateTime.date, "PPP") 
                                      : <span>{bookingMode === 'recurring' ? 'Start date' : 'Pick a date'}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                    mode="single"
                                    selected={bookingMode === 'recurring' ? recurringOptions.startDate : scheduledDateTime.date}
                                    onSelect={(date) => bookingMode === 'recurring' 
                                      ? setRecurringOptions({...recurringOptions, startDate: date})
                                      : setScheduledDateTime(prev => ({...prev, date}))}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <div className="relative">
                             <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                             <Input 
                                type="time" 
                                value={scheduledDateTime.time}
                                onChange={(e) => setScheduledDateTime(prev => ({...prev, time: e.target.value}))}
                                className="h-10 bg-gray-800 border-gray-700 pl-9"
                            />
                        </div>
                      </div>
                      
                      {bookingMode === 'recurring' && (
                        <>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-white">
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {recurringOptions.endDate ? format(recurringOptions.endDate, "PPP") : <span>End date (optional)</span>}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                  <CalendarComponent
                                      mode="single"
                                      selected={recurringOptions.endDate}
                                      onSelect={(date) => setRecurringOptions({...recurringOptions, endDate: date})}
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                  />
                              </PopoverContent>
                          </Popover>
                          
                          <div className="space-y-2 pt-2 border-t border-gray-700">
                            <Label className="text-gray-300 text-sm">Driver Assignment</Label>
                            <Select 
                              value={recurringOptions.advanceAssignmentHours.toString()}
                              onValueChange={(value) => setRecurringOptions({...recurringOptions, advanceAssignmentHours: parseInt(value)})}
                            >
                              <SelectTrigger className="bg-gray-800 border-gray-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 hour before</SelectItem>
                                <SelectItem value="2">2 hours before</SelectItem>
                                <SelectItem value="3">3 hours before</SelectItem>
                                <SelectItem value="6">6 hours before</SelectItem>
                                <SelectItem value="12">12 hours before</SelectItem>
                                <SelectItem value="24">1 day before</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                )}
                
                <Input 
                  placeholder="Enter pickup address" 
                  value={pickup} 
                  onChange={(e) => setPickup(e.target.value)} 
                  className="h-12 bg-gray-800 border-gray-700 placeholder:text-gray-400"
                  disabled={isLoadingLocation}
                />
                <Input 
                  placeholder="Where to?" 
                  value={destination} 
                  onChange={(e) => setDestination(e.target.value)} 
                  className="h-12 bg-gray-800 border-gray-700 placeholder:text-gray-400" 
                />
                <Button 
                  onClick={handleLocationSubmit} 
                  disabled={!pickup || !destination || isLoadingLocation || !userLocation} 
                  className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold"
                >
                  {isLoadingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    bookingMode === 'recurring' ? 'Continue' : bookingMode === 'reserve' ? 'Continue to ride selection' : 'Find a ride'
                  )}
                </Button>
              </CardContent>
          </motion.div>
        );
      case 2:
        const isButtonDisabled = isBooking || isLoadingFare || (!fareEstimate && bookingMode !== 'recurring');
        
        return (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Choose a ride</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleBack}><ArrowLeft/></Button>
            </CardHeader>
              <CardContent className="p-0">
                {/* Scheduling Summary */}
                {bookingMode !== 'now' && scheduledDateTime.date && scheduledDateTime.time && (
                  <div className="px-4 pt-2 mb-3">
                    <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                      <CardContent className="p-3 flex items-center gap-3">
                        <CalendarIcon className="w-5 h-5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {bookingMode === 'recurring' ? 'Recurring Schedule' : 'Scheduled for'}
                          </p>
                          <p className="text-xs opacity-90">
                            {format(scheduledDateTime.date, 'MMM d, yyyy')} at {scheduledDateTime.time}
                          </p>
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30">
                          {bookingMode === 'recurring' ? <Repeat className="w-3 h-3" /> : '📅'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                )}
              
                {isLoadingFare ? (
                  <div className="px-4 pt-2 mb-4">
                    <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                  </div>
                ) : fareEstimate && (
                  <div className="px-4 pt-2 mb-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-medium text-gray-600">
                              {bookingMode === 'reserve' ? 'Guaranteed Fare' : 'Estimated Fare'}
                            </h3>
                            <p className="text-3xl font-bold text-gray-900">${(appliedPromo ? appliedPromo.final_fare : fareEstimate.total_fare).toFixed(2)}</p>
                            {bookingMode === 'reserve' && (
                              <p className="text-xs text-green-600 mt-1 font-semibold">✅ No surge on scheduled rides</p>
                            )}
                          </div>
                          {fareEstimate.surge_multiplier > 1.0 && bookingMode === 'now' && (
                            <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1 text-lg px-3 py-1">
                              <Zap className="w-4 h-4" />
                              {fareEstimate.surge_multiplier.toFixed(1)}x
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Base fare</span>
                            <span>${fareEstimate.base_fare.toFixed(2)}</span>
                          </div>
                          {getDistance(fareEstimate) !== null && (
                            <div className="flex justify-between text-gray-600">
                              <span>Distance ({formatDistance(fareEstimate)})</span>
                              <span>${fareEstimate.distance_fare.toFixed(2)}</span>
                            </div>
                          )}
                          {fareEstimate.time_fare > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>Time ({fareEstimate.estimated_duration_minutes} min)</span>
                              <span>${fareEstimate.time_fare.toFixed(2)}</span>
                            </div>
                          )}
                          {fareEstimate.surge_multiplier > 1.0 && bookingMode === 'now' && fareEstimate.subtotal_before_surge && (
                            <div className="flex justify-between text-orange-600 font-bold border-t pt-1">
                              <span>Surge pricing</span>
                              <span>+${(fareEstimate.total_fare - fareEstimate.subtotal_before_surge).toFixed(2)}</span>
                            </div>
                          )}
                          {appliedPromo && (
                            <div className="flex justify-between text-green-600 font-medium">
                              <span>Promo discount</span>
                              <span>-${appliedPromo.discount_amount.toFixed(2)}</span>
                            </div>
                          )}
                          {fareEstimate?.prime_discount > 0 && (
                            <div className="flex justify-between text-yellow-600 font-bold">
                              <span className="flex items-center gap-1">
                                <Crown className="w-4 h-4" />
                                Prime discount (20%)
                              </span>
                              <span>-${fareEstimate.prime_discount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        
                        {fareEstimate.surge_reason && bookingMode === 'now' && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-orange-700 font-medium capitalize">
                              ⚡ {fareEstimate.surge_reason.replace('_', ' ')}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="space-y-2 px-4 pt-2 pb-4">
                    {rideTypes.map((ride) => {
                      const isSelected = selectedRideType.id === ride.id;
                      
                      return (
                        <button
                          key={ride.id}
                          onClick={() => setSelectedRideType(ride)}
                          className={cn(
                            "w-full p-3 rounded-lg text-left transition-all flex items-center gap-4 border-2",
                            isSelected 
                              ? 'bg-gray-100 border-gray-300' 
                              : 'hover:bg-gray-50 border-transparent'
                          )}
                        >
                          <img src={ride.image} alt={ride.name} className="w-24 h-auto object-contain"/>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{ride.name}</h3>
                              <div className="flex items-center text-xs text-gray-500">
                                  <UserLucideIcon className="w-3 h-3 mr-1"/>
                                  {ride.capacity}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">{ride.estimatedTime}</p>
                          </div>
                          <div className="text-right">
                            {isSelected && fareEstimate ? (
                              <>
                                <p className="font-bold text-xl">${(appliedPromo ? appliedPromo.final_fare : fareEstimate.total_fare).toFixed(2)}</p>
                                <p className="text-xs text-gray-500">{fareEstimate.estimated_duration_minutes} min</p>
                              </>
                            ) : (
                              <p className="font-bold text-xl">${ride.baseFare.toFixed(2)}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
                
                {/* Ride Preferences Card */}
                <div className="px-4 pb-4">
                  <RidePreferencesCard
                    preferences={ridePreferences}
                    onChange={setRidePreferences}
                  />
                </div>
                
                {/* Prime Discount Badge */}
                {user?.is_prime_member && fareEstimate && (
                  <div className="px-4 pb-2">
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-900">
                        <Crown className="w-5 h-5 text-yellow-600" />
                        <span className="font-bold">Prime Member Savings</span>
                      </div>
                      <p className="text-sm text-yellow-800 mt-1">
                        You're saving ${(fareEstimate.total_fare * 0.20).toFixed(2)} (20%) on this ride!
                      </p>
                    </div>
                  </div>
                )}

                {/* Promo Code Section */}
                <div className="px-4 pb-4">
                  <PromoCodeInput 
                    fareAmount={fareEstimate?.total_fare || selectedRideType.baseFare}
                    serviceType="ride"
                    onPromoApplied={setAppliedPromo}
                  />
                </div>
                
                 <div className="p-4 border-t bg-gray-900">
                    {fareEstimate && fareEstimate.surge_multiplier > 1.0 && bookingMode === 'now' && (
                      <p className="text-xs text-center text-orange-400 mb-3 font-medium">
                        ⚡ {fareEstimate.surge_reason} - Total: ${(appliedPromo ? appliedPromo.final_fare : fareEstimate.total_fare).toFixed(2)}
                      </p>
                    )}
                    {bookingMode === 'reserve' && (
                      <p className="text-xs text-center text-green-400 mb-3 font-semibold">
                        ✨ No surge pricing - Fixed fare guaranteed!
                      </p>
                    )}
                    
                    <Button 
                      onClick={handleBookRide} 
                      disabled={isButtonDisabled} 
                      className={cn(
                        "w-full h-12 text-lg font-semibold",
                        isButtonDisabled 
                          ? "bg-gray-400 cursor-not-allowed" 
                          : "bg-white hover:bg-gray-200 text-black cursor-pointer"
                      )}
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isLoadingFare ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Calculating...
                        </>
                      ) : bookingMode === 'recurring' ? (
                        'Create Schedule'
                      ) : bookingMode === 'reserve' ? (
                        'Schedule Ride'
                      ) : (
                        `Confirm ${selectedRideType.name}`
                      )}
                    </Button>
                    {appliedPromo && (
                      <p className="text-center text-sm text-green-400 mt-2 font-medium">
                        ✨ ${appliedPromo.discount_amount.toFixed(2)} discount applied!
                      </p>
                    )}
                 </div>
              </CardContent>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] lg:h-screen w-full relative">
        <Toaster richColors />
        
        {/* Info Banner at Top */}
        {bookingMode === 'now' && (
          <div className="absolute top-4 right-4 left-4 lg:left-auto lg:right-96 z-[999] max-w-md">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Live Demand & Surge Map</p>
                      <p className="text-xs opacity-90">
                        Solid areas = Surge pricing. Dashed areas = High demand. Tap zones for details.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
        
        <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0" zoomControl={false}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {userLocation && <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon} />}
            
            {/* Enhanced Surge & Demand Overlay */}
            <SurgePricingMapOverlay 
              userLocation={userLocation}
              currentPickupLocation={userLocation}
              onSurgeSelect={(zone) => {
                toast.info(`${zone.surge_multiplier.toFixed(1)}x surge in this area`, {
                  description: zone.reason?.replace('_', ' '),
                  duration: 4000
                });
              }}
            />
            
            <MapController center={mapCenter} />
        </MapContainer>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <Card className="max-w-md mx-auto shadow-2xl bg-gray-900 text-white border-gray-700 max-h-[80vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                    {renderStepContent()}
                </AnimatePresence>
            </Card>
        </div>
    </div>
  );
}