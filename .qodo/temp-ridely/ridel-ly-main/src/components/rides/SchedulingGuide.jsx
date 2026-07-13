import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Repeat, 
  Bell, 
  Car,
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SchedulingGuide({ mode, scheduledTime, recurringOptions }) {
  if (mode === 'now') {
    return null;
  }

  const features = {
    reserve: [
      { icon: Calendar, label: 'Pick your date & time', desc: 'Schedule up to 30 days ahead' },
      { icon: Car, label: 'Driver assigned 2 hours before', desc: 'Guaranteed availability' },
      { icon: Bell, label: 'Reminders sent', desc: '30 minutes before pickup' },
      { icon: CheckCircle2, label: 'Fixed pricing', desc: 'No surge on scheduled rides' }
    ],
    recurring: [
      { icon: Repeat, label: 'Set it and forget it', desc: 'Rides created automatically' },
      { icon: Calendar, label: 'Flexible patterns', desc: 'Daily, weekly, or custom days' },
      { icon: Car, label: 'Priority driver assignment', desc: 'Same driver when possible' },
      { icon: Bell, label: 'Daily confirmations', desc: 'Email sent each morning' }
    ]
  };

  const currentFeatures = features[mode] || features.reserve;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {mode === 'recurring' ? (
              <>
                <Repeat className="w-5 h-5 text-purple-600" />
                Recurring Rides
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 text-blue-600" />
                Schedule in Advance
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{feature.label}</p>
                  <p className="text-xs text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {mode === 'reserve' && scheduledTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Info className="w-4 h-4" />
                <p className="text-sm font-medium">
                  Your ride will be ready at {scheduledTime}
                </p>
              </div>
            </div>
          )}

          {mode === 'recurring' && recurringOptions?.scheduleName && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2 text-purple-800">
                <Repeat className="w-4 h-4" />
                <p className="text-sm font-medium">
                  "{recurringOptions.scheduleName}" - 
                  {recurringOptions.recurrencePattern === 'daily' && ' Every day'}
                  {recurringOptions.recurrencePattern === 'weekdays' && ' Monday-Friday'}
                  {recurringOptions.recurrencePattern === 'weekends' && ' Weekends'}
                  {recurringOptions.recurrencePattern === 'custom' && ` ${recurringOptions.daysOfWeek.length} days/week`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}