import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { format, addDays, parseISO, isToday, isTomorrow } from 'date-fns';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';

export default function ScheduleWidget({ driverId }) {
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [upcomingHighDemand, setUpcomingHighDemand] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScheduleData();
  }, [driverId]);

  const loadScheduleData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

      // Load today's schedules
      const todayShifts = await base44.entities.DriverSchedule.filter({
        driver_id: driverId,
        schedule_date: today,
        status: { $in: ['scheduled', 'confirmed'] }
      });
      setTodaySchedules(todayShifts);

      // Load upcoming high-demand slots
      const highDemand = await base44.entities.DemandForecast.filter({
        forecast_date: { $gte: today, $lte: nextWeek },
        is_high_demand: true
      }, '-forecast_date', 5);

      // Filter out slots the driver is already scheduled for
      const driverSchedules = await base44.entities.DriverSchedule.filter({
        driver_id: driverId,
        schedule_date: { $gte: today, $lte: nextWeek }
      });

      const unscheduled = highDemand.filter(slot => {
        return !driverSchedules.some(schedule => 
          schedule.schedule_date === slot.forecast_date &&
          schedule.start_time <= slot.time_slot_start &&
          schedule.end_time >= slot.time_slot_end
        );
      });

      setUpcomingHighDemand(unscheduled);
    } catch (error) {
      console.error('Error loading schedule data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRelativeDate = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySchedules.length > 0 ? (
            <div className="space-y-3">
              {todaySchedules.map((schedule) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg ${
                    schedule.is_high_demand_slot
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold">
                        {schedule.start_time} - {schedule.end_time}
                      </span>
                    </div>
                    {schedule.is_high_demand_slot && schedule.bonus_multiplier > 1 && (
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">
                        {((schedule.bonus_multiplier - 1) * 100).toFixed(0)}% bonus
                      </Badge>
                    )}
                  </div>
                  {schedule.guaranteed_earnings && (
                    <p className="text-sm mt-1 opacity-90">
                      ${schedule.guaranteed_earnings} guaranteed
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No shifts scheduled for today</p>
              <Button
                variant="link"
                onClick={() => window.location.href = createPageUrl('DriverScheduling')}
                className="mt-2 text-blue-600"
              >
                Schedule a shift
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* High-Demand Opportunities */}
      {upcomingHighDemand.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                High-Demand Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingHighDemand.slice(0, 3).map((slot, idx) => (
                <div key={idx} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold">
                      {getRelativeDate(slot.forecast_date)}
                    </div>
                    {slot.bonus_multiplier > 1 && (
                      <Badge className="bg-white/20 text-white border-white/30">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {((slot.bonus_multiplier - 1) * 100).toFixed(0)}% bonus
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-90">
                      {slot.time_slot_start} - {slot.time_slot_end}
                    </span>
                    {slot.guaranteed_earnings_offered && (
                      <span className="font-bold">
                        ${slot.guaranteed_earnings_offered} guaranteed
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              <Button
                onClick={() => window.location.href = createPageUrl('DriverScheduling')}
                className="w-full bg-white text-orange-600 hover:bg-gray-100 mt-2"
              >
                View All & Schedule
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}