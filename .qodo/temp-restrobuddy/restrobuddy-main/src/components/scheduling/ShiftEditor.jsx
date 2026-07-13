import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Clock, AlertTriangle } from "lucide-react";
import { ShiftSchedule } from "@/entities/ShiftSchedule";
import { format } from "date-fns";

export default function ShiftEditor({ shift, date, employee, employees, availability, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    employee_name: "",
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: "09:00",
    end_time: "17:00",
    scheduled_hours: 8,
    role: "server",
    location: "Main",
    notes: ""
  });
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (shift) {
      setFormData({
        employee_id: shift.employee_id,
        employee_name: shift.employee_name,
        shift_date: shift.shift_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        scheduled_hours: shift.scheduled_hours,
        role: shift.role || "server",
        location: shift.location || "Main",
        notes: shift.notes || ""
      });
    } else if (date && employee) {
      setFormData(prev => ({
        ...prev,
        employee_id: employee.id,
        employee_name: employee.full_name,
        shift_date: format(date, 'yyyy-MM-dd'),
        role: employee.role
      }));
    } else if (date) {
      setFormData(prev => ({
        ...prev,
        shift_date: format(date, 'yyyy-MM-dd')
      }));
    }
  }, [shift, date, employee]);

  useEffect(() => {
    // Calculate hours
    if (formData.start_time && formData.end_time) {
      const [startH, startM] = formData.start_time.split(':').map(Number);
      const [endH, endM] = formData.end_time.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const hours = (endMinutes - startMinutes) / 60;
      
      setFormData(prev => ({
        ...prev,
        scheduled_hours: hours > 0 ? parseFloat(hours.toFixed(2)) : 0
      }));

      // Check for warnings
      const newWarnings = [];
      if (hours > 8) {
        newWarnings.push(`Shift exceeds 8 hours (${hours.toFixed(1)}h) - overtime will apply`);
      }
      if (hours > 12) {
        newWarnings.push("Shift exceeds 12 hours - verify this is correct");
      }

      // Check availability
      if (formData.employee_id && formData.shift_date) {
        const dayName = format(new Date(formData.shift_date), 'EEEE').toLowerCase();
        const avail = availability.find(a => 
          a.employee_id === formData.employee_id && a.day_of_week === dayName
        );
        if (avail && !avail.is_available) {
          newWarnings.push("Employee marked as unavailable on this day");
        }
      }

      setWarnings(newWarnings);
    }
  }, [formData.start_time, formData.end_time, formData.employee_id, formData.shift_date, availability]);

  const handleEmployeeChange = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employee_id: emp.id,
        employee_name: emp.full_name,
        role: emp.role
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.shift_date || !formData.start_time || !formData.end_time) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const overtimeHours = Math.max(0, formData.scheduled_hours - 8);
      const shiftData = {
        ...formData,
        overtime_hours: parseFloat(overtimeHours.toFixed(2)),
        is_overtime: overtimeHours > 0
      };

      if (shift) {
        await ShiftSchedule.update(shift.id, shiftData);
      } else {
        await ShiftSchedule.create({
          ...shiftData,
          status: 'scheduled'
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving shift:", error);
      alert("Failed to save shift");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle>{shift ? 'Edit Shift' : 'Create Shift'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-emerald-500">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Selection */}
            <div>
              <Label>Employee *</Label>
              <select
                value={formData.employee_id}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <Label>Shift Date *</Label>
              <Input
                type="date"
                value={formData.shift_date}
                onChange={(e) => setFormData({...formData, shift_date: e.target.value})}
                className="mt-1"
                required
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            {/* Hours Display */}
            <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                <span className="font-medium">Scheduled Hours:</span>
              </div>
              <span className="text-2xl font-bold text-emerald-600">
                {formData.scheduled_hours}h
              </span>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                {warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {warning}
                  </div>
                ))}
              </div>
            )}

            {/* Location */}
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Main Location"
                className="mt-1"
              />
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any special instructions..."
                className="mt-1"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-emerald-600">
                {saving ? 'Saving...' : shift ? 'Update Shift' : 'Create Shift'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}