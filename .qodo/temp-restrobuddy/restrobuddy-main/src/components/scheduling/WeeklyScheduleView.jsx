import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Play, Square } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";

export default function WeeklyScheduleView({
  currentWeek,
  employees,
  shifts,
  availability,
  onAddShift,
  onEditShift,
  onDeleteShift,
  onClockIn,
  onClockOut
}) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getShiftsForDay = (employeeId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(s => s.employee_id === employeeId && s.shift_date === dateStr);
  };

  const getAvailability = (employeeId, date) => {
    const dayName = format(date, 'EEEE').toLowerCase();
    return availability.find(a => a.employee_id === employeeId && a.day_of_week === dayName);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      in_progress: 'bg-amber-100 text-amber-800 border-amber-300',
      completed: 'bg-slate-100 text-slate-800 border-slate-300',
      missed: 'bg-red-100 text-red-800 border-red-300',
      cancelled: 'bg-slate-100 text-slate-500 border-slate-300'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const isToday = (date) => isSameDay(date, new Date());

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50">
            <th className="p-4 text-left font-semibold text-slate-700 border-b w-48">Employee</th>
            {weekDays.map((day, idx) => (
              <th 
                key={idx} 
                className={`p-4 text-center font-semibold border-b min-w-32 ${
                  isToday(day) ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700'
                }`}
              >
                <div>{dayNames[idx]}</div>
                <div className={`text-sm font-normal ${isToday(day) ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {format(day, 'MMM d')}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map(employee => (
            <tr key={employee.id} className="border-b hover:bg-slate-50">
              <td className="p-4">
                <div className="font-medium text-slate-900">{employee.full_name}</div>
                <Badge className="text-xs mt-1" variant="outline">
                  {employee.role.replace('_', ' ')}
                </Badge>
              </td>
              {weekDays.map((day, idx) => {
                const dayShifts = getShiftsForDay(employee.id, day);
                const avail = getAvailability(employee.id, day);
                const isAvailable = avail?.is_available !== false;

                return (
                  <td 
                    key={idx} 
                    className={`p-2 border-l ${
                      isToday(day) ? 'bg-emerald-50/50' : ''
                    } ${!isAvailable ? 'bg-red-50/50' : ''}`}
                  >
                    <div className="space-y-1 min-h-16">
                      {dayShifts.map(shift => (
                        <div 
                          key={shift.id} 
                          className={`p-2 rounded-lg border ${getStatusColor(shift.status)} text-xs`}
                        >
                          <div className="font-semibold flex items-center justify-between">
                            <span>{shift.start_time} - {shift.end_time}</span>
                            <div className="flex gap-1">
                              {shift.status === 'scheduled' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5"
                                  onClick={() => onClockIn(shift)}
                                >
                                  <Play className="w-3 h-3" />
                                </Button>
                              )}
                              {shift.status === 'in_progress' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5"
                                  onClick={() => onClockOut(shift)}
                                >
                                  <Square className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5"
                                onClick={() => onEditShift(shift)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 text-red-600"
                                onClick={() => onDeleteShift(shift.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs opacity-80 mt-1">
                            {shift.scheduled_hours}h
                            {shift.is_overtime && (
                              <Badge className="ml-1 bg-red-500 text-white text-xs px-1">OT</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {dayShifts.length === 0 && isAvailable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full h-full min-h-12 border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50"
                          onClick={() => onAddShift(day, employee)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}

                      {!isAvailable && dayShifts.length === 0 && (
                        <div className="text-xs text-center text-red-500 py-4">
                          Not Available
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {employees.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No active employees found
        </div>
      )}
    </div>
  );
}