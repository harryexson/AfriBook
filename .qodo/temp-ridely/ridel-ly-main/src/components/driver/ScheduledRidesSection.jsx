import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  CheckCircle2,
  XCircle,
  Navigation,
  ChevronRight,
  Bell,
  Car
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function ScheduledRidesSection({ driverId }) {
  const [scheduledRides, setScheduledRides] = useState([]);
  const [availableScheduledRides, setAvailableScheduledRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [acceptingRideId, setAcceptingRideId] = useState(null);

  useEffect(() => {
    if (driverId) {
      loadScheduledRides();
    }
  }, [driverId]);

  const loadScheduledRides = async () => {
    try {
      // Load rides already assigned to this driver
      const myScheduled = await base44.entities.Ride.filter({
        driver_id: driverId,
        status: 'scheduled'
      }, 'scheduled_time', 20).catch(() => []);

      setScheduledRides(myScheduled || []);

      // Load available scheduled rides (no driver assigned yet)
      // Note: We filter client-side since querying for null driver_id may not be supported
      const allScheduled = await base44.entities.Ride.filter({
        status: 'scheduled'
      }, 'scheduled_time', 50).catch(() => []);

      // Filter to rides without a driver and scheduled at least 1 hour from now
      const now = new Date();
      const filteredAvailable = (allScheduled || []).filter(ride => {
        if (ride.driver_id) return false; // Skip rides with assigned drivers
        const scheduledTime = new Date(ride.scheduled_time);
        return differenceInHours(scheduledTime, now) >= 1;
      });

      setAvailableScheduledRides(filteredAvailable);
    } catch (error) {
      console.error('Error loading scheduled rides:', error);
      // Silently fail - don't show error toast for background loading
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptScheduledRide = async (ride) => {
    setAcceptingRideId(ride.id);
    try {
      await base44.entities.Ride.update(ride.id, {
        driver_id: driverId
      });

      toast.success('Scheduled ride accepted!');
      loadScheduledRides();

      // Send notification to rider
      try {
        await base44.functions.invoke('sendRideStatusNotification', {
          rideId: ride.id,
          newStatus: 'driver_assigned',
          recipientType: 'rider'
        });
      } catch (e) {
        // Non-blocking
      }
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast.error('Could not accept ride');
    } finally {
      setAcceptingRideId(null);
    }
  };

  const handleCancelScheduledRide = async (rideId) => {
    if (!confirm('Are you sure you want to cancel this scheduled ride?')) return;

    try {
      await base44.entities.Ride.update(rideId, {
        driver_id: null
      });

      toast.success('Ride removed from your schedule');
      loadScheduledRides();
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast.error('Could not cancel ride');
    }
  };

  const getTimeLabel = (scheduledTime) => {
    const date = parseISO(scheduledTime);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const getUrgencyBadge = (scheduledTime) => {
    const hours = differenceInHours(new Date(scheduledTime), new Date());
    if (hours <= 2) {
      return <Badge className="bg-red-100 text-red-800 animate-pulse">Starting Soon</Badge>;
    }
    if (hours <= 6) {
      return <Badge className="bg-orange-100 text-orange-800">In {hours}h</Badge>;
    }
    if (hours <= 24) {
      return <Badge className="bg-blue-100 text-blue-800">In {hours}h</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Scheduled Rides
          </div>
          <div className="flex gap-2">
            <Badge className="bg-green-100 text-green-800">
              {scheduledRides.length} accepted
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800">
              {availableScheduledRides.length} available
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="available">
              Available ({availableScheduledRides.length})
            </TabsTrigger>
            <TabsTrigger value="my-schedule">
              My Schedule ({scheduledRides.length})
            </TabsTrigger>
          </TabsList>

          {/* Available Scheduled Rides */}
          <TabsContent value="available" className="space-y-3">
            {availableScheduledRides.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No scheduled rides available</p>
                <p className="text-sm">Check back later for new opportunities</p>
              </div>
            ) : (
              <AnimatePresence>
                {availableScheduledRides.map((ride) => (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg">
                                {getTimeLabel(ride.scheduled_time)}
                              </span>
                              {getUrgencyBadge(ride.scheduled_time)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              {format(parseISO(ride.scheduled_time), 'h:mm a')}
                              <span className="capitalize">• {ride.ride_type}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              ${ride.fare?.total_fare?.toFixed(2) || '0.00'}
                            </p>
                            <p className="text-xs text-gray-500">Guaranteed fare</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div className="flex-1 text-sm">
                              <p className="text-gray-500">Pickup</p>
                              <p className="font-medium truncate">{ride.pickup_location?.address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                            <div className="flex-1 text-sm">
                              <p className="text-gray-500">Dropoff</p>
                              <p className="font-medium truncate">{ride.destination?.address}</p>
                            </div>
                          </div>
                        </div>

                        {ride.distance_km && (
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span>{ride.distance_km?.toFixed(1)} km</span>
                            <span>~{ride.duration_minutes || 15} min</span>
                          </div>
                        )}

                        <Button
                          onClick={() => handleAcceptScheduledRide(ride)}
                          disabled={acceptingRideId === ride.id}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {acceptingRideId === ride.id ? (
                            'Accepting...'
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Accept This Ride
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* My Scheduled Rides */}
          <TabsContent value="my-schedule" className="space-y-3">
            {scheduledRides.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No rides in your schedule</p>
                <p className="text-sm">Accept available rides to add them here</p>
              </div>
            ) : (
              <AnimatePresence>
                {scheduledRides.map((ride) => (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="font-bold text-lg">
                                {getTimeLabel(ride.scheduled_time)}
                              </span>
                              {getUrgencyBadge(ride.scheduled_time)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              {format(parseISO(ride.scheduled_time), 'h:mm a')}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              ${ride.fare?.total_fare?.toFixed(2) || '0.00'}
                            </p>
                            <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div className="flex-1 text-sm">
                              <p className="font-medium truncate">{ride.pickup_location?.address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                            <div className="flex-1 text-sm">
                              <p className="font-medium truncate">{ride.destination?.address}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelScheduledRide(ride.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                          >
                            <Bell className="w-4 h-4 mr-1" />
                            Set Reminder
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}