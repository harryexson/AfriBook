import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, Clock, TrendingUp } from "lucide-react";
import { format, endOfWeek } from "date-fns";

export default function OvertimeReport({ shifts, employees, timeEntries, currentWeek }) {
  // Calculate overtime by employee
  const employeeStats = employees.map(emp => {
    const empShifts = shifts.filter(s => s.employee_id === emp.id);
    const scheduledHours = empShifts.reduce((sum, s) => sum + (s.scheduled_hours || 0), 0);
    const actualHours = empShifts.reduce((sum, s) => sum + (s.actual_hours || 0), 0);
    const overtimeHours = empShifts.reduce((sum, s) => sum + (s.overtime_hours || 0), 0);
    
    const regularPay = Math.min(actualHours, 40) * emp.hourly_rate;
    const overtimePay = overtimeHours * emp.hourly_rate * 1.5;
    const totalPay = regularPay + overtimePay;

    return {
      ...emp,
      scheduledHours,
      actualHours,
      overtimeHours,
      regularPay,
      overtimePay,
      totalPay,
      isOvertime: scheduledHours > 40 || overtimeHours > 0
    };
  }).filter(e => e.scheduledHours > 0).sort((a, b) => b.overtimeHours - a.overtimeHours);

  const totalScheduled = employeeStats.reduce((sum, e) => sum + e.scheduledHours, 0);
  const totalActual = employeeStats.reduce((sum, e) => sum + e.actualHours, 0);
  const totalOvertime = employeeStats.reduce((sum, e) => sum + e.overtimeHours, 0);
  const totalLabor = employeeStats.reduce((sum, e) => sum + e.totalPay, 0);
  const totalOvertimeCost = employeeStats.reduce((sum, e) => sum + e.overtimePay, 0);

  const weekRange = `${format(currentWeek, 'MMM d')} - ${format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}`;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <Clock className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">{totalScheduled.toFixed(1)}</div>
            <div className="text-sm opacity-90">Hours Scheduled</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4">
            <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">{totalActual.toFixed(1)}</div>
            <div className="text-sm opacity-90">Hours Worked</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-4">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">{totalOvertime.toFixed(1)}</div>
            <div className="text-sm opacity-90">Overtime Hours</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <DollarSign className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold">${totalLabor.toFixed(0)}</div>
            <div className="text-sm opacity-90">Total Labor Cost</div>
          </CardContent>
        </Card>
      </div>

      {/* Overtime Alert */}
      {totalOvertimeCost > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
            <div>
              <div className="font-bold text-amber-900">Overtime Alert</div>
              <p className="text-amber-800">
                ${totalOvertimeCost.toFixed(2)} in overtime costs this week. 
                Consider adjusting schedules to reduce overtime.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Breakdown */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Employee Hours Breakdown - {weekRange}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-3 text-left font-semibold">Employee</th>
                  <th className="p-3 text-center font-semibold">Role</th>
                  <th className="p-3 text-center font-semibold">Scheduled</th>
                  <th className="p-3 text-center font-semibold">Worked</th>
                  <th className="p-3 text-center font-semibold">Overtime</th>
                  <th className="p-3 text-center font-semibold">Rate</th>
                  <th className="p-3 text-right font-semibold">Regular Pay</th>
                  <th className="p-3 text-right font-semibold">OT Pay</th>
                  <th className="p-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {employeeStats.map(emp => (
                  <tr key={emp.id} className={`border-b ${emp.isOvertime ? 'bg-red-50' : ''}`}>
                    <td className="p-3">
                      <div className="font-medium">{emp.full_name}</div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">{emp.role}</Badge>
                    </td>
                    <td className="p-3 text-center">{emp.scheduledHours.toFixed(1)}h</td>
                    <td className="p-3 text-center">{emp.actualHours.toFixed(1)}h</td>
                    <td className="p-3 text-center">
                      {emp.overtimeHours > 0 ? (
                        <Badge className="bg-red-500">
                          {emp.overtimeHours.toFixed(1)}h
                        </Badge>
                      ) : (
                        <span className="text-slate-400">0h</span>
                      )}
                    </td>
                    <td className="p-3 text-center">${emp.hourly_rate}/hr</td>
                    <td className="p-3 text-right">${emp.regularPay.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      {emp.overtimePay > 0 ? (
                        <span className="text-red-600 font-semibold">
                          ${emp.overtimePay.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">$0.00</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold">${emp.totalPay.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td className="p-3" colSpan="2">Totals</td>
                  <td className="p-3 text-center">{totalScheduled.toFixed(1)}h</td>
                  <td className="p-3 text-center">{totalActual.toFixed(1)}h</td>
                  <td className="p-3 text-center">{totalOvertime.toFixed(1)}h</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-right">${(totalLabor - totalOvertimeCost).toFixed(2)}</td>
                  <td className="p-3 text-right text-red-600">${totalOvertimeCost.toFixed(2)}</td>
                  <td className="p-3 text-right">${totalLabor.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {employeeStats.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No shifts scheduled for this week</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}