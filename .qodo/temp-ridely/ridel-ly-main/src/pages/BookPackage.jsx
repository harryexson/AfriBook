import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Package, MapPin, User as UserIcon, CheckCircle, Clock, Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BookPackage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickup_address: '',
    dropoff_address: '',
    recipient_name: '',
    recipient_phone: '',
    package_description: '',
    package_size: 'medium',
  });
  const [deliveryMode, setDeliveryMode] = useState('now'); // now, schedule, recurring
  const [scheduledDateTime, setScheduledDateTime] = useState({ date: null, time: '' });
  const [recurringOptions, setRecurringOptions] = useState({
    scheduleName: '',
    recurrencePattern: 'daily',
    daysOfWeek: [],
    startDate: null,
    endDate: null,
    advanceAssignmentHours: 2
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value) => {
    setFormData({ ...formData, package_size: value });
  };

  const toggleDayOfWeek = (day) => {
    setRecurringOptions(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (deliveryMode === 'schedule' && (!scheduledDateTime.date || !scheduledDateTime.time)) {
      toast.error('Please select a date and time for scheduled delivery');
      return;
    }
    
    if (deliveryMode === 'recurring') {
      if (!recurringOptions.scheduleName) {
        toast.error('Please provide a name for your recurring delivery');
        return;
      }
      if (!scheduledDateTime.time) {
        toast.error('Please select a time for deliveries');
        return;
      }
      if (!recurringOptions.startDate) {
        toast.error('Please select a start date');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const user = await base44.auth.me();
      if (!user) {
        toast.error("You must be logged in to book a delivery.");
        setIsSubmitting(false);
        return;
      }

      let userLocation = { latitude: 34.0522, longitude: -118.2437 };
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (e) {
          console.log('Could not get location');
        }
      }

      const packageFare = formData.package_size === 'small' ? 8.50 : 
                         formData.package_size === 'large' ? 15.00 : 10.50;

      // Handle recurring delivery schedule
      if (deliveryMode === 'recurring') {
        const recurringData = {
          user_id: user.id,
          schedule_name: recurringOptions.scheduleName,
          pickup_location: {
            address: formData.pickup_address,
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          },
          destination: {
            address: formData.dropoff_address,
            latitude: userLocation.latitude + 0.05,
            longitude: userLocation.longitude + 0.05
          },
          ride_type: 'standard',
          recurrence_pattern: recurringOptions.recurrencePattern,
          days_of_week: recurringOptions.daysOfWeek,
          scheduled_time: scheduledDateTime.time,
          start_date: recurringOptions.startDate.toISOString().split('T')[0],
          end_date: recurringOptions.endDate ? recurringOptions.endDate.toISOString().split('T')[0] : null,
          advance_assignment_hours: recurringOptions.advanceAssignmentHours,
          notification_settings: {
            notify_before_minutes: 30,
            send_sms: true,
            send_email: true
          },
          delivery_info: {
            recipient_name: formData.recipient_name,
            recipient_phone: formData.recipient_phone,
            package_description: formData.package_description,
            package_size: formData.package_size
          }
        };

        await base44.entities.RecurringSchedule.create(recurringData);
        toast.success('Recurring delivery schedule created!');
        navigate(createPageUrl('ScheduledRides'));
        return;
      }

      // Handle one-time scheduled or immediate delivery
      let rideStatus = "requested";
      let rideScheduledTime = null;

      if (deliveryMode === 'schedule') {
        const [hours, minutes] = scheduledDateTime.time.split(':');
        const dateWithTime = new Date(scheduledDateTime.date);
        dateWithTime.setHours(parseInt(hours, 10));
        dateWithTime.setMinutes(parseInt(minutes, 10));
        rideScheduledTime = dateWithTime.toISOString();
        rideStatus = "scheduled";
      }

      const ride = await base44.entities.Ride.create({
        rider_id: user.id,
        pickup_location: {
          address: formData.pickup_address,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        destination: {
          address: formData.dropoff_address,
          latitude: userLocation.latitude + 0.05,
          longitude: userLocation.longitude + 0.05
        },
        ride_type: 'standard',
        status: rideStatus,
        scheduled_time: rideScheduledTime,
        fare: { total_fare: packageFare },
        distance_km: 5,
        duration_minutes: 15,
        notes: `Package delivery for ${formData.recipient_name} - ${formData.package_size} package - ${formData.package_description}`
      });

      if (deliveryMode === 'now') {
        toast.info("Finding a driver for your package...");
        
        try {
          const dispatchResult = await base44.functions.invoke('findAvailableDrivers', { 
            rideId: ride.id 
          });

          if (dispatchResult.data?.success) {
            toast.success(dispatchResult.data.message);
          } else {
            toast.warning(dispatchResult.data?.message || 'No drivers available right now.');
          }
        } catch (dispatchError) {
          console.error('Dispatch error:', dispatchError);
          toast.error('Error finding drivers. Please try again.');
        }
      } else {
        toast.success('Delivery scheduled successfully! Driver will be assigned 2 hours before pickup.');
        navigate(createPageUrl('ScheduledRides'));
      }

      setIsSuccess(true);
    } catch (error) {
      console.error('Error booking package delivery:', error);
      toast.error("Could not book delivery. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess && deliveryMode === 'now') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[80vh]">
        <Toaster richColors />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="max-w-lg">
            <CardContent className="p-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Request Sent!</h2>
              <p className="text-gray-600">We are finding a driver to pick up your package. You can track the progress in the Activity tab.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <Toaster richColors />
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <Package className="w-12 h-12 mx-auto text-blue-600 mb-2" />
          <h1 className="text-3xl font-bold">Send a Package</h1>
          <p className="text-gray-600">Fast and reliable local delivery.</p>
        </header>

        <Card>
          <CardHeader>
            <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
              <Button
                type="button"
                onClick={() => setDeliveryMode('now')}
                variant={deliveryMode === 'now' ? 'default' : 'ghost'}
                className={cn(deliveryMode === 'now' && 'bg-blue-600 text-white')}
              >
                Now
              </Button>
              <Button
                type="button"
                onClick={() => setDeliveryMode('schedule')}
                variant={deliveryMode === 'schedule' ? 'default' : 'ghost'}
                className={cn(deliveryMode === 'schedule' && 'bg-blue-600 text-white')}
              >
                <CalendarIcon className="w-4 h-4 mr-1" />
                Schedule
              </Button>
              <Button
                type="button"
                onClick={() => setDeliveryMode('recurring')}
                variant={deliveryMode === 'recurring' ? 'default' : 'ghost'}
                className={cn(deliveryMode === 'recurring' && 'bg-blue-600 text-white')}
              >
                <Repeat className="w-4 h-4 mr-1" />
                Recurring
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recurring Schedule Name */}
              {deliveryMode === 'recurring' && (
                <div className="space-y-2">
                  <Label>Schedule Name</Label>
                  <Input
                    placeholder="e.g., 'Daily Office Delivery'"
                    value={recurringOptions.scheduleName}
                    onChange={(e) => setRecurringOptions({...recurringOptions, scheduleName: e.target.value})}
                    required
                  />
                </div>
              )}

              {/* Scheduling Options */}
              {(deliveryMode === 'schedule' || deliveryMode === 'recurring') && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 space-y-4">
                    {deliveryMode === 'recurring' && (
                      <div className="space-y-2">
                        <Label>Recurrence Pattern</Label>
                        <Select
                          value={recurringOptions.recurrencePattern}
                          onValueChange={(value) => setRecurringOptions({...recurringOptions, recurrencePattern: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                            <SelectItem value="weekends">Weekends (Sat-Sun)</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="custom">Custom days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {deliveryMode === 'recurring' && (recurringOptions.recurrencePattern === 'custom' || recurringOptions.recurrencePattern === 'weekly') && (
                      <div className="space-y-2">
                        <Label>Select Days</Label>
                        <div className="grid grid-cols-7 gap-2">
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
                                  recurringOptions.daysOfWeek.includes(fullDay) && 'bg-blue-600 text-white'
                                )}
                              >
                                {day}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{deliveryMode === 'recurring' ? 'Start Date' : 'Delivery Date'}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {(deliveryMode === 'recurring' ? recurringOptions.startDate : scheduledDateTime.date)
                                ? format(deliveryMode === 'recurring' ? recurringOptions.startDate : scheduledDateTime.date, "PPP")
                                : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={deliveryMode === 'recurring' ? recurringOptions.startDate : scheduledDateTime.date}
                              onSelect={(date) => deliveryMode === 'recurring'
                                ? setRecurringOptions({...recurringOptions, startDate: date})
                                : setScheduledDateTime(prev => ({...prev, date}))}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Time</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="time"
                            value={scheduledDateTime.time}
                            onChange={(e) => setScheduledDateTime(prev => ({...prev, time: e.target.value}))}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {deliveryMode === 'recurring' && (
                      <div className="space-y-2">
                        <Label>End Date (Optional)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {recurringOptions.endDate
                                ? format(recurringOptions.endDate, "PPP")
                                : <span>No end date</span>}
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
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4"/>Pickup Location
                </Label>
                <Input name="pickup_address" placeholder="Enter pickup address" onChange={handleChange} required />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4"/>Dropoff Location
                </Label>
                <Input name="dropoff_address" placeholder="Enter destination address" onChange={handleChange} required />
              </div>

              <hr/>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4"/>Recipient Details
                </Label>
                <Input name="recipient_name" placeholder="Recipient's full name" onChange={handleChange} required />
                <Input name="recipient_phone" type="tel" placeholder="Recipient's phone number" onChange={handleChange} required />
              </div>

              <hr/>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4"/>Package Details
                </Label>
                <Select onValueChange={handleSelectChange} defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select package size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (Fits in a backpack) - $8.50</SelectItem>
                    <SelectItem value="medium">Medium (Fits in a car's trunk) - $10.50</SelectItem>
                    <SelectItem value="large">Large (Requires an SUV) - $15.00</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea name="package_description" placeholder="Describe the contents (e.g., 'Documents, a small box')" onChange={handleChange} />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 
                 deliveryMode === 'recurring' ? 'Create Recurring Delivery' :
                 deliveryMode === 'schedule' ? 'Schedule Delivery' : 
                 'Request Delivery Now'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}