import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Repeat,
  Zap,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, isSameDay, parseISO, isAfter, isBefore } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DriverScheduling() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedules, setSchedules] = useState([]);
  const [highDemandSlots, setHighDemandSlots] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  const [formData, setFormData] = useState({
    start_time: '09:00',
    end_time: '17:00',
    is_recurring: false,
    recurrence_pattern: 'none',
    recurrence_days: [],
    recurrence_end_date: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Calculate week range
      const weekEnd = addDays(currentWeekStart, 6);

      // Load driver schedules for the week
      const driverSchedules = await base44.entities.DriverSchedule.filter({
        driver_id: currentUser.id,
        schedule_date: {
          $gte: format(currentWeekStart, 'yyyy-MM-dd'),
          $lte: format(weekEnd, 'yyyy-MM-dd')
        }
      });
      setSchedules(driverSchedules);

      // Load high-demand forecasts
      const forecasts = await base44.entities.DemandForecast.filter({
        forecast_date: {
          $gte: format(currentWeekStart, 'yyyy-MM-dd'),
          $lte: format(weekEnd, 'yyyy-MM-dd')
        },
        is_high_demand: true
      });
      setHighDemandSlots(forecasts);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load schedule data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      const scheduleData = {
        driver_id: user.id,
        schedule_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : 'none',
        recurrence_days: formData.is_recurring ? formData.recurrence_days : [],
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date 
          ? formData.recurrence_end_date 
          : null,
        notes: formData.notes,
        status: 'scheduled'
      };

      // Check for high-demand slot
      const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase();
      const matchingForecast = highDemandSlots.find(slot => 
        slot.forecast_date === scheduleData.schedule_date &&
        slot.time_slot_start <= formData.start_time &&
        slot.time_slot_end >= formData.end_time
      );

      if (matchingForecast) {
        scheduleData.is_high_demand_slot = true;
        scheduleData.guaranteed_earnings = matchingForecast.guaranteed_earnings_offered;
        scheduleData.bonus_multiplier = matchingForecast.bonus_multiplier;
      }

      if (formData.is_recurring && formData.recurrence_pattern !== 'none') {
        // Create multiple schedules for recurring pattern
        const schedulesToCreate = [];
        const endDate = formData.recurrence_end_date 
          ? parseISO(formData.recurrence_end_date) 
          : addWeeks(selectedDate, 12); // Default 12 weeks

        let currentDate = selectedDate;
        
        while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
          const dayOfWeek = format(currentDate, 'EEEE').toLowerCase();
          
          let shouldCreateSchedule = false;
          
          if (formData.recurrence_pattern === 'daily') {
            shouldCreateSchedule = true;
          } else if (formData.recurrence_pattern === 'weekly' && formData.recurrence_days.includes(dayOfWeek)) {
            shouldCreateSchedule = true;
          }

          if (shouldCreateSchedule) {
            schedulesToCreate.push({
              ...scheduleData,
              schedule_date: format(currentDate, 'yyyy-MM-dd')
            });
          }

          currentDate = addDays(currentDate, 1);
        }

        await base44.entities.DriverSchedule.bulkCreate(schedulesToCreate);
        toast.success(`Created ${schedulesToCreate.length} recurring schedules`);
      } else {
        await base44.entities.DriverSchedule.create(scheduleData);
        toast.success('Schedule added successfully');
      }

      setShowAddDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await base44.entities.DriverSchedule.delete(scheduleId);
      toast.success('Schedule deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const resetForm = () => {
    setFormData({
      start_time: '09:00',
      end_time: '17:00',
      is_recurring: false,
      recurrence_pattern: 'none',
      recurrence_days: [],
      recurrence_end_date: '',
      notes: ''
    });
    setSelectedDate(null);
    setEditingSchedule(null);
  };

  const openAddDialog = (date) => {
    setSelectedDate(date);
    setShowAddDialog(true);
  };

  const getSchedulesForDate = (date) => {
    return schedules.filter(s => s.schedule_date === format(date, 'yyyy-MM-dd'));
  };

  const getHighDemandSlotsForDate = (date) => {
    return highDemandSlots.filter(s => s.forecast_date === format(date, 'yyyy-MM-dd'));
  };

  const previousWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, -1));
  };

  const nextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const toggleRecurrenceDay = (day) => {
    setFormData(prev => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter(d => d !== day)
        : [...prev.recurrence_days, day]
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const totalScheduledHours = schedules.reduce((sum, s) => {
    const start = parseISO(`2000-01-01T${s.start_time}`);
    const end = parseISO(`2000-01-01T${s.end_time}`);
    return sum + (end - start) / (1000 * 60 * 60);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <Toaster richColors />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              My Schedule
            </h1>
            <p className="text-gray-600 mt-2">Plan your driving hours and earn bonuses</p>
          </div>
          <div className="flex items-center gap-3">
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <p className="text-sm text-green-100">This Week</p>
                <p className="text-2xl font-bold">{totalScheduledHours.toFixed(1)}h</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* High-Demand Alerts */}
        {highDemandSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">🔥 High-Demand Slots Available!</h3>
                    <p className="text-orange-100 mb-3">
                      {highDemandSlots.length} high-demand slots this week with guaranteed earnings and bonuses
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {highDemandSlots.slice(0, 3).map((slot, idx) => (
                        <Badge key={idx} className="bg-white/20 text-white border-white/30">
                          {format(parseISO(slot.forecast_date), 'EEE')} {slot.time_slot_start}-{slot.time_slot_end}
                          {slot.bonus_multiplier > 1 && ` • ${((slot.bonus_multiplier - 1) * 100).toFixed(0)}% bonus`}
                        </Badge>
                      ))}
                      {highDemandSlots.length > 3 && (
                        <Badge className="bg-white/20 text-white border-white/30">
                          +{highDemandSlots.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Week Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={previousWeek}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous Week
              </Button>
              <h2 className="text-lg font-semibold">
                {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
              </h2>
              <Button variant="outline" onClick={nextWeek}>
                Next Week
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((date, idx) => {
            const daySchedules = getSchedulesForDate(date);
            const dayHighDemand = getHighDemandSlotsForDate(date);
            const isToday = isSameDay(date, new Date());
            const isPast = isBefore(date, new Date()) && !isToday;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`${isToday ? 'ring-2 ring-blue-500' : ''} ${isPast ? 'opacity-60' : ''}`}>
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm font-semibold text-center">
                      <div>{format(date, 'EEE')}</div>
                      <div className={`text-2xl mt-1 ${isToday ? 'text-blue-600' : ''}`}>
                        {format(date, 'd')}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    {/* High-demand indicators */}
                    {dayHighDemand.length > 0 && (
                      <div className="space-y-1">
                        {dayHighDemand.map((slot, i) => (
                          <div
                            key={i}
                            className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-300 rounded-lg p-2 text-xs"
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <Zap className="w-3 h-3 text-orange-600" />
                              <span className="font-semibold text-orange-900">High Demand</span>
                            </div>
                            <div className="text-orange-800">
                              {slot.time_slot_start}-{slot.time_slot_end}
                            </div>
                            {slot.guaranteed_earnings_offered && (
                              <div className="text-orange-700 font-semibold mt-1">
                                ${slot.guaranteed_earnings_offered} guaranteed
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Scheduled shifts */}
                    {daySchedules.length > 0 ? (
                      daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className={`rounded-lg p-2 text-xs ${
                            schedule.is_high_demand_slot
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="font-semibold">
                                {schedule.start_time}-{schedule.end_time}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="opacity-70 hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          {schedule.is_recurring && (
                            <div className="flex items-center gap-1 text-[10px] opacity-90">
                              <Repeat className="w-2 h-2" />
                              Recurring
                            </div>
                          )}
                          {schedule.is_high_demand_slot && schedule.bonus_multiplier > 1 && (
                            <div className="flex items-center gap-1 text-[10px] mt-1 bg-white/20 rounded px-1 py-0.5">
                              <TrendingUp className="w-2 h-2" />
                              {((schedule.bonus_multiplier - 1) * 100).toFixed(0)}% bonus
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddDialog(date)}
                        className="w-full text-xs"
                        disabled={isPast}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Shift
                      </Button>
                    )}

                    {daySchedules.length > 0 && !isPast && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddDialog(date)}
                        className="w-full text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add More
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Add Schedule Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Schedule Shift - {selectedDate && format(selectedDate, 'EEEE, MMM d, yyyy')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Recurring Schedule</Label>
                  <p className="text-xs text-gray-500">Repeat this shift</p>
                </div>
                <Switch
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
              </div>

              {formData.is_recurring && (
                <>
                  <div>
                    <Label>Recurrence Pattern</Label>
                    <Select
                      value={formData.recurrence_pattern}
                      onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly (select days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recurrence_pattern === 'weekly' && (
                    <div>
                      <Label>Repeat On</Label>
                      <div className="grid grid-cols-7 gap-2 mt-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day}
                            onClick={() => toggleRecurrenceDay(day)}
                            className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                              formData.recurrence_days.includes(day)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {day.slice(0, 3).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>End Date (optional)</Label>
                    <Input
                      type="date"
                      value={formData.recurrence_end_date}
                      onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for 12 weeks</p>
                  </div>
                </>
              )}

              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any notes about this shift..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSchedule} className="bg-blue-600 hover:bg-blue-700">
                Schedule Shift
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}