import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  X,
  DollarSign,
  Clock,
  TrendingUp,
  Printer
} from "lucide-react";
import { format } from "date-fns";

export default function PayrollReportView({ period, timeEntries, employees, onClose }) {
  const [taxRates, setTaxRates] = useState({
    federal: 12,
    state: 5,
    socialSecurity: 6.2,
    medicare: 1.45
  });

  // Calculate employee payroll details
  const employeePayroll = useMemo(() => {
    const periodStart = new Date(period.period_start);
    const periodEnd = new Date(period.period_end);

    const periodEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.clock_in || entry.created_date);
      return entryDate >= periodStart && entryDate <= periodEnd;
    });

    const employeeMap = {};

    periodEntries.forEach(entry => {
      if (!employeeMap[entry.employee_id]) {
        const emp = employees.find(e => e.id === entry.employee_id);
        employeeMap[entry.employee_id] = {
          id: entry.employee_id,
          name: entry.employee_name,
          role: emp?.role || 'unknown',
          hourlyRate: entry.hourly_rate || emp?.hourly_rate || 0,
          regularHours: 0,
          overtimeHours: 0,
          regularPay: 0,
          overtimePay: 0,
          tips: 0,
          grossPay: 0,
          taxInfo: emp?.tax_info || {}
        };
      }

      employeeMap[entry.employee_id].regularHours += entry.regular_hours || 0;
      employeeMap[entry.employee_id].overtimeHours += entry.overtime_hours || 0;
      employeeMap[entry.employee_id].regularPay += entry.regular_pay || 0;
      employeeMap[entry.employee_id].overtimePay += entry.overtime_pay || 0;
      employeeMap[entry.employee_id].tips += entry.tips_earned || 0;
    });

    return Object.values(employeeMap).map(emp => {
      emp.grossPay = emp.regularPay + emp.overtimePay + emp.tips;
      
      // Calculate deductions
      const federalTax = emp.taxInfo.exempt_federal ? 0 : emp.grossPay * (taxRates.federal / 100);
      const stateTax = emp.taxInfo.exempt_state ? 0 : emp.grossPay * (taxRates.state / 100);
      const socialSecurity = emp.grossPay * (taxRates.socialSecurity / 100);
      const medicare = emp.grossPay * (taxRates.medicare / 100);
      const additionalWithholding = emp.taxInfo.additional_withholding || 0;

      emp.deductions = {
        federal: federalTax,
        state: stateTax,
        socialSecurity,
        medicare,
        additional: additionalWithholding,
        total: federalTax + stateTax + socialSecurity + medicare + additionalWithholding
      };

      emp.netPay = emp.grossPay - emp.deductions.total;
      return emp;
    }).sort((a, b) => b.grossPay - a.grossPay);
  }, [period, timeEntries, employees, taxRates]);

  const totals = useMemo(() => {
    return employeePayroll.reduce((acc, emp) => ({
      regularHours: acc.regularHours + emp.regularHours,
      overtimeHours: acc.overtimeHours + emp.overtimeHours,
      regularPay: acc.regularPay + emp.regularPay,
      overtimePay: acc.overtimePay + emp.overtimePay,
      tips: acc.tips + emp.tips,
      grossPay: acc.grossPay + emp.grossPay,
      deductions: acc.deductions + emp.deductions.total,
      netPay: acc.netPay + emp.netPay
    }), {
      regularHours: 0, overtimeHours: 0, regularPay: 0, overtimePay: 0,
      tips: 0, grossPay: 0, deductions: 0, netPay: 0
    });
  }, [employeePayroll]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-6xl w-full max-h-[95vh] overflow-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white print:bg-white print:text-black">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-1">Payroll Report</CardTitle>
              <p className="text-blue-100 print:text-slate-600">
                {format(new Date(period.period_start), 'MMM d, yyyy')} - {format(new Date(period.period_end), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" onClick={handlePrint} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-blue-500">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6 print:grid-cols-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Hours</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {totals.regularHours.toFixed(1)}h
                  {totals.overtimeHours > 0 && (
                    <span className="text-sm text-amber-600 ml-2">+{totals.overtimeHours.toFixed(1)} OT</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">Gross Pay</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  ${totals.grossPay.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Deductions</span>
                </div>
                <div className="text-2xl font-bold text-red-900">
                  ${totals.deductions.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-700 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">Net Pay</span>
                </div>
                <div className="text-2xl font-bold text-emerald-900">
                  ${totals.netPay.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Rates Settings (print hidden) */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 print:hidden">
            <h4 className="font-semibold text-slate-900 mb-3">Tax Rate Settings</h4>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Federal (%)</Label>
                <Input
                  type="number"
                  value={taxRates.federal}
                  onChange={(e) => setTaxRates({...taxRates, federal: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">State (%)</Label>
                <Input
                  type="number"
                  value={taxRates.state}
                  onChange={(e) => setTaxRates({...taxRates, state: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Social Security (%)</Label>
                <Input
                  type="number"
                  value={taxRates.socialSecurity}
                  onChange={(e) => setTaxRates({...taxRates, socialSecurity: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Medicare (%)</Label>
                <Input
                  type="number"
                  value={taxRates.medicare}
                  onChange={(e) => setTaxRates({...taxRates, medicare: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Employee Details Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center">Role</TableHead>
                  <TableHead className="text-center">Reg Hrs</TableHead>
                  <TableHead className="text-center">OT Hrs</TableHead>
                  <TableHead className="text-right">Reg Pay</TableHead>
                  <TableHead className="text-right">OT Pay</TableHead>
                  <TableHead className="text-right">Tips</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeePayroll.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {emp.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{emp.regularHours.toFixed(1)}</TableCell>
                    <TableCell className="text-center">
                      {emp.overtimeHours > 0 ? (
                        <span className="text-amber-600 font-medium">{emp.overtimeHours.toFixed(1)}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">${emp.regularPay.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {emp.overtimePay > 0 ? (
                        <span className="text-amber-600">${emp.overtimePay.toFixed(2)}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {emp.tips > 0 ? `$${emp.tips.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">${emp.grossPay.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-600">-${emp.deductions.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">${emp.netPay.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <tfoot>
                <TableRow className="bg-slate-100 font-bold">
                  <TableCell colSpan={2}>TOTALS</TableCell>
                  <TableCell className="text-center">{totals.regularHours.toFixed(1)}</TableCell>
                  <TableCell className="text-center text-amber-600">{totals.overtimeHours.toFixed(1)}</TableCell>
                  <TableCell className="text-right">${totals.regularPay.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-amber-600">${totals.overtimePay.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${totals.tips.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${totals.grossPay.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-red-600">-${totals.deductions.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-emerald-600">${totals.netPay.toFixed(2)}</TableCell>
                </TableRow>
              </tfoot>
            </Table>
          </div>

          {/* Deduction Breakdown */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-3">Tax Withholding Summary</h4>
            <div className="grid md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Federal:</span>
                <span className="font-bold ml-2">${employeePayroll.reduce((s, e) => s + e.deductions.federal, 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-600">State:</span>
                <span className="font-bold ml-2">${employeePayroll.reduce((s, e) => s + e.deductions.state, 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-600">Social Security:</span>
                <span className="font-bold ml-2">${employeePayroll.reduce((s, e) => s + e.deductions.socialSecurity, 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-600">Medicare:</span>
                <span className="font-bold ml-2">${employeePayroll.reduce((s, e) => s + e.deductions.medicare, 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-600">Additional:</span>
                <span className="font-bold ml-2">${employeePayroll.reduce((s, e) => s + e.deductions.additional, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}