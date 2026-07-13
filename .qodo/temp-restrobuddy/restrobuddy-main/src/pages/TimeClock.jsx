import React, { useState, useEffect } from "react";
import { Employee } from "@/entities/Employee";
import { TimeEntry } from "@/entities/TimeEntry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, LogOut, DollarSign, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TimeClock() {
  const [currentUser, setCurrentUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [activeEntry, setActiveEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadEmployeeData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadEmployeeData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Find employee record for this user
      const employees = await Employee.filter({ email: user.email });
      if (employees.length > 0) {
        const emp = employees[0];
        setEmployee(emp);

        // Check for active time entry
        const activeEntries = await TimeEntry.filter({
          employee_id: emp.id,
          clock_out: null
        });

        if (activeEntries.length > 0) {
          setActiveEntry(activeEntries[0]);
        }
      }
    } catch (error) {
      console.error("Error loading employee data:", error);
    }
    setIsLoading(false);
  };

  const handleClockIn = async () => {
    try {
      const entry = await TimeEntry.create({
        employee_id: employee.id,
        employee_name: employee.full_name,
        clock_in: new Date().toISOString(),
        hourly_rate: employee.hourly_rate,
        location: employee.location
      });

      await Employee.update(employee.id, { status: "active" });

      setActiveEntry(entry);
      setEmployee({...employee, status: "active"});
      setNotification({ type: 'success', message: 'Clocked in successfully!' });
    } catch (error) {
      console.error("Error clocking in:", error);
      setNotification({ type: 'error', message: 'Failed to clock in. Please try again.' });
    }
  };

  const handleStartBreak = async () => {
    try {
      await TimeEntry.update(activeEntry.id, {
        break_start: new Date().toISOString()
      });

      await Employee.update(employee.id, { status: "on_break" });

      setEmployee({...employee, status: "on_break"});
      loadEmployeeData();
      setNotification({ type: 'info', message: 'Break started. Enjoy your break!' });
    } catch (error) {
      console.error("Error starting break:", error);
    }
  };

  const handleEndBreak = async () => {
    try {
      const breakEnd = new Date();
      const breakStart = new Date(activeEntry.break_start);
      const breakMinutes = Math.floor((breakEnd - breakStart) / 60000);

      await TimeEntry.update(activeEntry.id, {
        break_end: breakEnd.toISOString(),
        total_break_minutes: (activeEntry.total_break_minutes || 0) + breakMinutes,
        break_start: null
      });

      await Employee.update(employee.id, { status: "active" });

      setEmployee({...employee, status: "active"});
      loadEmployeeData();
      setNotification({ type: 'success', message: 'Break ended. Back to work!' });
    } catch (error) {
      console.error("Error ending break:", error);
    }
  };

  const handleClockOut = async () => {
    try {
      const clockOut = new Date();
      const clockIn = new Date(activeEntry.clock_in);
      
      // Calculate total hours (minus breaks)
      const totalMinutes = Math.floor((clockOut - clockIn) / 60000);
      const workMinutes = totalMinutes - (activeEntry.total_break_minutes || 0);
      const totalHours = workMinutes / 60;

      // Calculate regular vs overtime
      const regularHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(0, totalHours - 8);

      // Calculate pay
      const regularPay = regularHours * employee.hourly_rate;
      const overtimePay = overtimeHours * (employee.hourly_rate * 1.5);
      const totalEarnings = regularPay + overtimePay + (activeEntry.tips_earned || 0);

      // Calculate PTO accrual
      const ptoAccrued = totalHours * (employee.pto_accrual_rate || 0.0385);

      await TimeEntry.update(activeEntry.id, {
        clock_out: clockOut.toISOString(),
        total_hours: parseFloat(totalHours.toFixed(2)),
        regular_hours: parseFloat(regularHours.toFixed(2)),
        overtime_hours: parseFloat(overtimeHours.toFixed(2)),
        regular_pay: parseFloat(regularPay.toFixed(2)),
        overtime_pay: parseFloat(overtimePay.toFixed(2)),
        total_earnings: parseFloat(totalEarnings.toFixed(2)),
        pto_hours_accrued: parseFloat(ptoAccrued.toFixed(2))
      });

      // Update employee PTO
      await Employee.update(employee.id, {
        status: "off_duty",
        pto_hours_accrued: (employee.pto_hours_accrued || 0) + ptoAccrued
      });

      setActiveEntry(null);
      setEmployee({...employee, status: "off_duty"});
      setNotification({ 
        type: 'success', 
        message: `Clocked out! You worked ${totalHours.toFixed(2)} hours and earned $${totalEarnings.toFixed(2)}`
      });
    } catch (error) {
      console.error("Error clocking out:", error);
      setNotification({ type: 'error', message: 'Failed to clock out. Please try again.' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="text-center py-12">
            <p className="text-slate-600 text-lg mb-4">
              No employee record found for your account.
            </p>
            <p className="text-sm text-slate-500">
              Please contact your manager to set up your employee profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateCurrentShiftDuration = () => {
    if (!activeEntry) return "0:00:00";
    
    const now = new Date();
    const start = new Date(activeEntry.clock_in);
    let diff = Math.floor((now - start) / 1000);

    // Subtract break time if on break
    if (activeEntry.break_start) {
      const breakStart = new Date(activeEntry.break_start);
      diff -= Math.floor((now - breakStart) / 1000);
    }

    // Subtract completed breaks
    if (activeEntry.total_break_minutes) {
      diff -= activeEntry.total_break_minutes * 60;
    }

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const estimatedEarnings = () => {
    if (!activeEntry) return 0;

    const duration = calculateCurrentShiftDuration();
    const [hours, minutes] = duration.split(':').map(Number);
    const totalHours = hours + minutes / 60;
    
    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(0, totalHours - 8);
    
    return (regularHours * employee.hourly_rate) + (overtimeHours * employee.hourly_rate * 1.5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {notification && (
          <Alert className={`mb-6 ${
            notification.type === 'success' ? 'bg-green-50 border-green-200' :
            notification.type === 'info' ? 'bg-blue-50 border-blue-200' :
            'bg-red-50 border-red-200'
          }`}>
            <AlertDescription className={
              notification.type === 'success' ? 'text-green-800' :
              notification.type === 'info' ? 'text-blue-800' :
              'text-red-800'
            }>
              {notification.message}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-2xl mb-8">
          <CardHeader className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl mb-2">{employee.full_name}</CardTitle>
                <p className="text-emerald-100">{employee.role.replace('_', ' ')}</p>
              </div>
              <div className="text-right">
                <Badge className={
                  employee.status === "active" ? "bg-white text-[#10b981]" :
                  employee.status === "on_break" ? "bg-amber-500 text-white" :
                  "bg-slate-600 text-white"
                }>
                  {employee.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <p className="text-emerald-100 mt-2">${employee.hourly_rate}/hour</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="text-6xl font-mono font-bold text-slate-900 mb-2">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-xl text-slate-600">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            {activeEntry && (
              <div className="bg-gradient-to-br from-[#10b981]/10 to-emerald-50 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Current Shift Duration</p>
                    <p className="text-3xl font-bold text-[#10b981]">
                      {calculateCurrentShiftDuration()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Estimated Earnings</p>
                    <p className="text-3xl font-bold text-[#10b981]">
                      ${estimatedEarnings().toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!activeEntry ? (
                <Button
                  onClick={handleClockIn}
                  className="h-24 text-xl bg-[#10b981] hover:bg-[#059669] col-span-full"
                >
                  <Clock className="w-8 h-8 mr-3" />
                  Clock In
                </Button>
              ) : (
                <>
                  {employee.status === "active" ? (
                    <Button
                      onClick={handleStartBreak}
                      className="h-24 text-xl bg-amber-500 hover:bg-amber-600"
                    >
                      <Coffee className="w-8 h-8 mr-3" />
                      Start Break
                    </Button>
                  ) : (
                    <Button
                      onClick={handleEndBreak}
                      className="h-24 text-xl bg-blue-600 hover:bg-blue-700"
                    >
                      <Coffee className="w-8 h-8 mr-3" />
                      End Break
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleClockOut}
                    className="h-24 text-xl bg-red-600 hover:bg-red-700"
                  >
                    <LogOut className="w-8 h-8 mr-3" />
                    Clock Out
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                PTO Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#10b981]">
                {((employee.pto_hours_accrued || 0) - (employee.pto_hours_used || 0)).toFixed(2)} hours
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Available paid time off
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">0 hours</p>
              <p className="text-sm text-slate-500 mt-1">
                Total hours worked
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                EWA Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employee.ewa_enabled ? (
                <>
                  <p className="text-2xl font-bold text-purple-600">$0.00</p>
                  <p className="text-sm text-purple-600 mt-1">
                    Request instant payout
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">Not enabled</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}