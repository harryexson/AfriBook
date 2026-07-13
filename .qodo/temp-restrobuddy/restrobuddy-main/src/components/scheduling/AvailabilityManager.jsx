import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Check, X, Clock, Star } from "lucide-react";
import { StaffAvailability } from "@/entities/StaffAvailability";

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AvailabilityManager({ employees, availability, onRefresh }) {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingAvail, setEditingAvail] = useState({});
  const [saving, setSaving] = useState(false);

  const getEmployeeAvailability = (employeeId) => {
    return DAYS.map(day => {
      const avail = availability.find(a => a.employee_id === employeeId && a.day_of_week === day);
      return avail || { day_of_week: day, is_available: true, start_time: '09:00', end_time: '22:00' };
    });
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    const empAvail = getEmployeeAvailability(employee.id);
    const availMap = {};
    empAvail.forEach(a => {
      availMap[a.day_of_week] = {
        ...a,
        employee_id: employee.id,
        employee_name: employee.full_name
      };
    });
    setEditingAvail(availMap);
  };

  const handleToggleDay = (day) => {
    setEditingAvail(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        is_available: !prev[day]?.is_available
      }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setEditingAvail(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleTogglePreferred = (day) => {
    setEditingAvail(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        preferred: !prev[day]?.preferred
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const day of DAYS) {
        const dayAvail = editingAvail[day];
        const existing = availability.find(
          a => a.employee_id === selectedEmployee.id && a.day_of_week === day
        );

        const data = {
          employee_id: selectedEmployee.id,
          employee_name: selectedEmployee.full_name,
          day_of_week: day,
          is_available: dayAvail?.is_available !== false,
          start_time: dayAvail?.start_time || '09:00',
          end_time: dayAvail?.end_time || '22:00',
          preferred: dayAvail?.preferred || false
        };

        if (existing) {
          await StaffAvailability.update(existing.id, data);
        } else {
          await StaffAvailability.create(data);
        }
      }

      setSelectedEmployee(null);
      setEditingAvail({});
      onRefresh();
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability");
    }
    setSaving(false);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Employee List */}
      <Card className="border-0 shadow-xl lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Staff Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {employees.map(emp => {
              const empAvail = getEmployeeAvailability(emp.id);
              const availableDays = empAvail.filter(a => a.is_available !== false).length;

              return (
                <div
                  key={emp.id}
                  onClick={() => handleEditEmployee(emp)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedEmployee?.id === emp.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{emp.full_name}</div>
                      <div className="text-xs text-slate-500">{emp.role}</div>
                    </div>
                    <Badge variant="outline">
                      {availableDays}/7 days
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Availability Editor */}
      <Card className="border-0 shadow-xl lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedEmployee ? `${selectedEmployee.full_name}'s Availability` : 'Select an Employee'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedEmployee ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Select an employee to manage their availability</p>
            </div>
          ) : (
            <div className="space-y-4">
              {DAYS.map((day, idx) => {
                const dayData = editingAvail[day] || {};
                const isAvailable = dayData.is_available !== false;

                return (
                  <div 
                    key={day} 
                    className={`p-4 rounded-lg border-2 ${
                      isAvailable ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant={isAvailable ? "default" : "outline"}
                          onClick={() => handleToggleDay(day)}
                          className={isAvailable ? "bg-emerald-600" : ""}
                        >
                          {isAvailable ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </Button>
                        <span className="font-bold text-lg capitalize">{DAY_LABELS[idx]}</span>
                        {dayData.preferred && (
                          <Badge className="bg-amber-500">
                            <Star className="w-3 h-3 mr-1" />
                            Preferred
                          </Badge>
                        )}
                      </div>
                      {isAvailable && (
                        <Button
                          size="sm"
                          variant={dayData.preferred ? "default" : "outline"}
                          onClick={() => handleTogglePreferred(day)}
                          className={dayData.preferred ? "bg-amber-500" : ""}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {isAvailable && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <Input
                            type="time"
                            value={dayData.start_time || '09:00'}
                            onChange={(e) => handleTimeChange(day, 'start_time', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-slate-500">to</span>
                          <Input
                            type="time"
                            value={dayData.end_time || '22:00'}
                            onChange={(e) => handleTimeChange(day, 'end_time', e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedEmployee(null);
                    setEditingAvail({});
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex-1 bg-emerald-600"
                >
                  {saving ? 'Saving...' : 'Save Availability'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}