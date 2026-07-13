import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  DollarSign
} from "lucide-react";
import { Employee } from "@/entities/Employee";
import { ShiftSchedule } from "@/entities/ShiftSchedule";
import { ShiftSwapRequest } from "@/entities/ShiftSwapRequest";
import { StaffAvailability } from "@/entities/StaffAvailability";
import { TimeEntry } from "@/entities/TimeEntry";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import ShiftEditor from "../components/scheduling/ShiftEditor";
import SwapRequestsPanel from "../components/scheduling/SwapRequestsPanel";
import AvailabilityManager from "../components/scheduling/AvailabilityManager";
import WeeklyScheduleView from "../components/scheduling/WeeklyScheduleView";
import OvertimeReport from "../components/scheduling/OvertimeReport";

export default function ShiftScheduling() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schedule");
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [stats, setStats] = useState({
    totalShifts: 0,
    hoursScheduled: 0,
    pendingSwaps: 0,
    overtimeHours: 0
  });

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const [emps, allShifts, swaps, avail, entries] = await Promise.all([
        Employee.filter({ status: 'active' }),
        ShiftSchedule.list("-shift_date", 500),
        ShiftSwapRequest.filter({ status: 'pending' }),
        StaffAvailability.list(),
        TimeEntry.list("-created_date", 200)
      ]);

      setEmployees(emps);
      
      // Filter shifts for current week
      const weekShifts = allShifts.filter(s => 
        s.shift_date >= weekStart && s.shift_date <= weekEnd
      );
      setShifts(weekShifts);
      setSwapRequests(swaps);
      setAvailability(avail);
      setTimeEntries(entries);

      // Calculate stats
      const totalHours = weekShifts.reduce((sum, s) => sum + (s.scheduled_hours || 0), 0);
      const overtimeHrs = weekShifts.reduce((sum, s) => sum + (s.overtime_hours || 0), 0);
      
      setStats({
        totalShifts: weekShifts.length,
        hoursScheduled: totalHours,
        pendingSwaps: swaps.length,
        overtimeHours: overtimeHrs
      });

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handlePrevWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const handleAddShift = (date, employee) => {
    setSelectedDate(date);
    setSelectedEmployee(employee);
    setSelectedShift(null);
    setShowShiftEditor(true);
  };

  const handleEditShift = (shift) => {
    setSelectedShift(shift);
    setSelectedDate(null);
    setSelectedEmployee(null);
    setShowShiftEditor(true);
  };

  const handleDeleteShift = async (shiftId) => {
    if (!confirm("Delete this shift?")) return;
    try {
      await ShiftSchedule.delete(shiftId);
      loadData();
    } catch (error) {
      console.error("Error deleting shift:", error);
    }
  };

  const handleClockIn = async (shift) => {
    try {
      await ShiftSchedule.update(shift.id, {
        status: 'in_progress',
        actual_clock_in: new Date().toISOString()
      });
      loadData();
    } catch (error) {
      console.error("Error clocking in:", error);
    }
  };

  const handleClockOut = async (shift) => {
    try {
      const clockOut = new Date();
      const clockIn = new Date(shift.actual_clock_in);
      const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60) - (shift.break_minutes || 0) / 60;
      const regularHours = Math.min(hoursWorked, 8);
      const overtimeHours = Math.max(0, hoursWorked - 8);

      await ShiftSchedule.update(shift.id, {
        status: 'completed',
        actual_clock_out: clockOut.toISOString(),
        actual_hours: parseFloat(hoursWorked.toFixed(2)),
        overtime_hours: parseFloat(overtimeHours.toFixed(2)),
        is_overtime: overtimeHours > 0
      });

      // Create time entry for payroll
      const emp = employees.find(e => e.id === shift.employee_id);
      await TimeEntry.create({
        employee_id: shift.employee_id,
        employee_name: shift.employee_name,
        clock_in: shift.actual_clock_in,
        clock_out: clockOut.toISOString(),
        total_hours: parseFloat(hoursWorked.toFixed(2)),
        regular_hours: parseFloat(regularHours.toFixed(2)),
        overtime_hours: parseFloat(overtimeHours.toFixed(2)),
        hourly_rate: emp?.hourly_rate || 15,
        regular_pay: parseFloat((regularHours * (emp?.hourly_rate || 15)).toFixed(2)),
        overtime_pay: parseFloat((overtimeHours * (emp?.hourly_rate || 15) * 1.5).toFixed(2)),
        total_earnings: parseFloat((regularHours * (emp?.hourly_rate || 15) + overtimeHours * (emp?.hourly_rate || 15) * 1.5).toFixed(2)),
        location: shift.location
      });

      loadData();
    } catch (error) {
      console.error("Error clocking out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Shift Scheduling</h1>
            <p className="text-slate-600">Manage staff shifts, availability, and time tracking</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => handleAddShift(new Date(), null)} className="bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Shift
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <Calendar className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.totalShifts}</div>
              <div className="text-sm opacity-90">Shifts This Week</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-4">
              <Clock className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.hoursScheduled.toFixed(0)}</div>
              <div className="text-sm opacity-90">Hours Scheduled</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <AlertTriangle className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.pendingSwaps}</div>
              <div className="text-sm opacity-90">Pending Swaps</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-4">
              <DollarSign className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.overtimeHours.toFixed(1)}</div>
              <div className="text-sm opacity-90">Overtime Hours</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="schedule">
              <Calendar className="w-4 h-4 mr-2" />
              Weekly Schedule
            </TabsTrigger>
            <TabsTrigger value="swaps">
              <RefreshCw className="w-4 h-4 mr-2" />
              Swap Requests
              {stats.pendingSwaps > 0 && (
                <Badge className="ml-2 bg-amber-500">{stats.pendingSwaps}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="availability">
              <Users className="w-4 h-4 mr-2" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="overtime">
              <DollarSign className="w-4 h-4 mr-2" />
              Overtime Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={handlePrevWeek} className="text-white hover:bg-slate-600">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <CardTitle className="text-xl">
                    {format(currentWeek, 'MMM d')} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                  </CardTitle>
                  <Button variant="ghost" onClick={handleNextWeek} className="text-white hover:bg-slate-600">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <WeeklyScheduleView
                    currentWeek={currentWeek}
                    employees={employees}
                    shifts={shifts}
                    availability={availability}
                    onAddShift={handleAddShift}
                    onEditShift={handleEditShift}
                    onDeleteShift={handleDeleteShift}
                    onClockIn={handleClockIn}
                    onClockOut={handleClockOut}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="swaps">
            <SwapRequestsPanel
              requests={swapRequests}
              employees={employees}
              shifts={shifts}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityManager
              employees={employees}
              availability={availability}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="overtime">
            <OvertimeReport
              shifts={shifts}
              employees={employees}
              timeEntries={timeEntries}
              currentWeek={currentWeek}
            />
          </TabsContent>
        </Tabs>

        {/* Shift Editor Dialog */}
        {showShiftEditor && (
          <ShiftEditor
            shift={selectedShift}
            date={selectedDate}
            employee={selectedEmployee}
            employees={employees}
            availability={availability}
            onClose={() => {
              setShowShiftEditor(false);
              setSelectedShift(null);
              setSelectedDate(null);
              setSelectedEmployee(null);
            }}
            onSuccess={loadData}
          />
        )}
      </div>
    </div>
  );
}