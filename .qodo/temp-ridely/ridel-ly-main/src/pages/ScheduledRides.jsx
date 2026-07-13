
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Repeat, 
  Car,
  Edit,
  Trash2,
  Plus,
  Package,
  User,
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { createPageUrl } from '@/utils';

export default function ScheduledRides() {
  const [user, setUser] = useState(null);
  const [scheduledRides, setScheduledRides] = useState([]);
  const [recurringSchedules, setRecurringSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScheduled: 0,
    upcomingToday: 0,
    activeRecurring: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load scheduled rides
      const scheduled = await base44.entities.Ride.filter({
        rider_id: currentUser.id,
        status: 'scheduled'
      }, '-scheduled_time');
      setScheduledRides(scheduled);

      // Load recurring schedules
      const recurring = await base44.entities.RecurringSchedule.filter({
        user_id: currentUser.id
      }, '-created_date');
      setRecurringSchedules(recurring);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const upcomingToday = scheduled.filter(ride => {
        const rideDate = new Date(ride.scheduled_time);
        return rideDate >= today && rideDate < tomorrow;
      }).length;

      const activeRecurring = recurring.filter(s => s.is_active).length;

      setStats({
        totalScheduled: scheduled.length,
        upcomingToday,
        activeRecurring
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Could not load scheduled rides');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSchedule = async (scheduleId, currentStatus) => {
    try {
      await base44.entities.RecurringSchedule.update(scheduleId, {
        is_active: !currentStatus
      });
      toast.success(currentStatus ? 'Schedule paused' : 'Schedule activated');
      loadData();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast.error('Could not update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this recurring schedule?')) return;
    
    try {
      await base44.entities.RecurringSchedule.delete(scheduleId);
      toast.success('Schedule deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Could not delete schedule');
    }
  };

  const handleCancelRide = async (rideId) => {
    if (!confirm('Are you sure you want to cancel this scheduled ride?')) return;
    
    try {
      await base44.entities.Ride.update(rideId, { status: 'cancelled' });
      toast.success('Ride cancelled');
      loadData();
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast.error('Could not cancel ride');
    }
  };

  const getRecurrenceLabel = (schedule) => {
    if (schedule.recurrence_pattern === 'daily') return 'Daily';
    if (schedule.recurrence_pattern === 'weekdays') return 'Weekdays (Mon-Fri)';
    if (schedule.recurrence_pattern === 'weekends') return 'Weekends (Sat-Sun)';
    if (schedule.recurrence_pattern === 'weekly') return `Weekly (${schedule.days_of_week?.join(', ').replace(/\b\w/g, l => l.toUpperCase())})`;
    if (schedule.recurrence_pattern === 'custom') return schedule.days_of_week?.join(', ').replace(/\b\w/g, l => l.toUpperCase()) || 'Custom';
    return schedule.recurrence_pattern;
  };

  const isDelivery = (schedule) => {
    return schedule.delivery_info && Object.keys(schedule.delivery_info).length > 0;
  };

  const isRidePast = (ride) => {
    return isBefore(new Date(ride.scheduled_time), new Date());
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      <Toaster richColors />
      
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header with Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scheduled Rides & Deliveries</h1>
            <p className="text-gray-600 mt-2">Manage your upcoming and recurring rides</p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                {stats.totalScheduled} scheduled
              </Badge>
              <Badge className="bg-green-100 text-green-800 px-3 py-1">
                {stats.upcomingToday} today
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                {stats.activeRecurring} recurring
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = createPageUrl('BookRide')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Car className="w-4 h-4 mr-2" />
              Schedule Ride
            </Button>
            <Button 
              onClick={() => window.location.href = createPageUrl('BookPackage')}
              variant="outline"
            >
              <Package className="w-4 h-4 mr-2" />
              Schedule Delivery
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Upcoming Rides ({scheduledRides.length})
            </TabsTrigger>
            <TabsTrigger value="recurring">
              <Repeat className="w-4 h-4 mr-2" />
              Recurring Schedules ({recurringSchedules.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming/One-Time Scheduled Rides */}
          <TabsContent value="upcoming" className="space-y-4">
            {scheduledRides.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled rides</h3>
                  <p className="text-gray-500 mb-6">Schedule a ride or delivery for a future date and time</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => window.location.href = createPageUrl('BookRide')}>
                      <Car className="w-4 h-4 mr-2" />
                      Schedule a Ride
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = createPageUrl('BookPackage')}>
                      <Package className="w-4 h-4 mr-2" />
                      Schedule a Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              scheduledRides.map((ride) => {
                const isPast = isRidePast(ride);
                
                return (
                  <motion.div
                    key={ride.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`${isPast ? 'opacity-60' : 'border-blue-200 bg-blue-50'}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              {ride.notes?.includes('Delivery') ? (
                                <Package className="w-5 h-5 text-blue-600" />
                              ) : (
                                <CalendarIcon className="w-5 h-5 text-blue-600" />
                              )}
                              <h3 className="font-bold text-lg">
                                {format(parseISO(ride.scheduled_time), 'MMM d, yyyy')}
                              </h3>
                              <Badge className="bg-blue-100 text-blue-800">
                                {isPast ? 'Past' : 'Scheduled'}
                              </Badge>
                              {ride.notes?.includes('Delivery') && (
                                <Badge className="bg-purple-100 text-purple-800">Delivery</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              {format(parseISO(ride.scheduled_time), 'h:mm a')}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              ${ride.fare?.total_fare?.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">{ride.ride_type}</p>
                            <Badge className="bg-green-100 text-green-800 mt-2">
                              No surge
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">From</p>
                              <p className="text-gray-900 font-medium">{ride.pickup_location?.address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">To</p>
                              <p className="text-gray-900 font-medium">{ride.destination?.address}</p>
                            </div>
                          </div>
                        </div>

                        {ride.notes && (
                          <div className="p-3 bg-white rounded-lg mb-4">
                            <p className="text-sm text-gray-600">{ride.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-blue-200">
                          {!isPast && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancelRide(ride.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Cancel {ride.notes?.includes('Delivery') ? 'Delivery' : 'Ride'}
                            </Button>
                          )}
                          {ride.driver_id ? (
                            <Badge className="ml-auto bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Driver Assigned
                            </Badge>
                          ) : (
                            <Badge className="ml-auto bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Assignment
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* Recurring Schedules Tab */}
          <TabsContent value="recurring" className="space-y-4">
            {recurringSchedules.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Repeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recurring schedules</h3>
                  <p className="text-gray-500 mb-6">Set up recurring rides for your daily commute or regular trips</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => window.location.href = createPageUrl('BookRide')}>
                      <Car className="w-4 h-4 mr-2" />
                      Create Recurring Ride
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = createPageUrl('BookPackage')}>
                      <Package className="w-4 h-4 mr-2" />
                      Create Recurring Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              recurringSchedules.map((schedule) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`${schedule.is_active ? 'border-purple-200 bg-purple-50' : 'bg-gray-50'}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-3">
                            {isDelivery(schedule) ? (
                              <Package className="w-5 h-5 text-purple-600" />
                            ) : (
                              <Repeat className="w-5 h-5 text-purple-600" />
                            )}
                            {schedule.schedule_name}
                            {schedule.is_active ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Paused</Badge>
                            )}
                            {isDelivery(schedule) && (
                              <Badge className="bg-blue-100 text-blue-800">Delivery</Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {getRecurrenceLabel(schedule)} at {schedule.scheduled_time}
                          </p>
                        </div>
                        <Switch
                          checked={schedule.is_active}
                          onCheckedChange={() => handleToggleSchedule(schedule.id, schedule.is_active)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">From</p>
                              <p className="text-sm font-medium">{schedule.pickup_location.address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">To</p>
                              <p className="text-sm font-medium">{schedule.destination.address}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="w-4 h-4 text-gray-500" />
                            <span>
                              {format(parseISO(schedule.start_date), 'MMM d, yyyy')}
                              {schedule.end_date && ` - ${format(parseISO(schedule.end_date), 'MMM d, yyyy')}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Car className="w-4 h-4 text-gray-500" />
                            <span className="capitalize">{schedule.ride_type}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            Driver assigned {schedule.advance_assignment_hours}h before
                          </div>
                        </div>
                      </div>

                      {/* Delivery Info */}
                      {isDelivery(schedule) && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs font-medium text-blue-900 mb-2">Delivery Details</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-blue-700" />
                              <span>{schedule.delivery_info.recipient_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-blue-700" />
                              <span>{schedule.delivery_info.recipient_phone}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                              <Package className="w-3 h-3 text-blue-700" />
                              <span className="capitalize">{schedule.delivery_info.package_size} package</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                        <div className="ml-auto text-sm text-gray-500">
                          {schedule.total_rides_created || 0} rides created
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* How it Works */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              How Scheduling Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-sm">Schedule Your Ride</p>
                  <p className="text-xs text-gray-600">Pick date, time, and preferences</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-sm">Guaranteed Fixed Pricing</p>
                  <p className="text-xs text-gray-600">No surge, pay what you see</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-sm">Driver Auto-Assigned</p>
                  <p className="text-xs text-gray-600">2 hours before your ride</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-semibold text-sm">Reminder Notifications</p>
                  <p className="text-xs text-gray-600">Email & SMS 30 min before</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
