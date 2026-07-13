import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Download,
  X,
  FileSpreadsheet,
  FileText,
  Database,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

export default function PayrollExport({ period, timeEntries, employees, onClose }) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const periodStart = new Date(period.period_start);
  const periodEnd = new Date(period.period_end);

  const periodEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.clock_in || entry.created_date);
    return entryDate >= periodStart && entryDate <= periodEnd;
  });

  const generateCSV = () => {
    const headers = [
      'Employee ID', 'Employee Name', 'Role', 'SSN Last 4', 'Regular Hours',
      'Overtime Hours', 'Hourly Rate', 'Regular Pay', 'Overtime Pay', 'Tips',
      'Gross Pay', 'Federal Tax', 'State Tax', 'Social Security', 'Medicare',
      'Net Pay', 'Pay Date'
    ];

    const employeeMap = {};
    periodEntries.forEach(entry => {
      if (!employeeMap[entry.employee_id]) {
        const emp = employees.find(e => e.id === entry.employee_id);
        employeeMap[entry.employee_id] = {
          id: entry.employee_id,
          name: entry.employee_name,
          role: emp?.role || '',
          ssnLast4: emp?.tax_info?.ssn_last4 || '',
          hourlyRate: entry.hourly_rate || emp?.hourly_rate || 0,
          regularHours: 0,
          overtimeHours: 0,
          regularPay: 0,
          overtimePay: 0,
          tips: 0
        };
      }
      employeeMap[entry.employee_id].regularHours += entry.regular_hours || 0;
      employeeMap[entry.employee_id].overtimeHours += entry.overtime_hours || 0;
      employeeMap[entry.employee_id].regularPay += entry.regular_pay || 0;
      employeeMap[entry.employee_id].overtimePay += entry.overtime_pay || 0;
      employeeMap[entry.employee_id].tips += entry.tips_earned || 0;
    });

    const rows = Object.values(employeeMap).map(emp => {
      const grossPay = emp.regularPay + emp.overtimePay + emp.tips;
      const federalTax = grossPay * 0.12;
      const stateTax = grossPay * 0.05;
      const socialSecurity = grossPay * 0.062;
      const medicare = grossPay * 0.0145;
      const netPay = grossPay - federalTax - stateTax - socialSecurity - medicare;

      return [
        emp.id,
        emp.name,
        emp.role,
        emp.ssnLast4,
        emp.regularHours.toFixed(2),
        emp.overtimeHours.toFixed(2),
        emp.hourlyRate.toFixed(2),
        emp.regularPay.toFixed(2),
        emp.overtimePay.toFixed(2),
        emp.tips.toFixed(2),
        grossPay.toFixed(2),
        federalTax.toFixed(2),
        stateTax.toFixed(2),
        socialSecurity.toFixed(2),
        medicare.toFixed(2),
        netPay.toFixed(2),
        period.pay_date
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const generateQuickBooksIIF = () => {
    let iif = '!TIMEACT\tDATE\tJOB\tEMP\tITEM\tDURATION\tNOTE\n';
    
    periodEntries.forEach(entry => {
      const date = format(new Date(entry.clock_in || entry.created_date), 'MM/dd/yyyy');
      iif += `TIMEACT\t${date}\t\t${entry.employee_name}\tRegular\t${entry.regular_hours || 0}\t\n`;
      if (entry.overtime_hours > 0) {
        iif += `TIMEACT\t${date}\t\t${entry.employee_name}\tOvertime\t${entry.overtime_hours}\t\n`;
      }
    });

    return iif;
  };

  const generateADPFormat = () => {
    const headers = ['Co Code', 'Batch ID', 'File #', 'Reg Hours', 'OT Hours', 'Reg Earnings', 'OT Earnings'];
    
    const employeeMap = {};
    periodEntries.forEach(entry => {
      if (!employeeMap[entry.employee_id]) {
        employeeMap[entry.employee_id] = {
          fileNo: entry.employee_id.slice(-6),
          regularHours: 0,
          overtimeHours: 0,
          regularPay: 0,
          overtimePay: 0
        };
      }
      employeeMap[entry.employee_id].regularHours += entry.regular_hours || 0;
      employeeMap[entry.employee_id].overtimeHours += entry.overtime_hours || 0;
      employeeMap[entry.employee_id].regularPay += entry.regular_pay || 0;
      employeeMap[entry.employee_id].overtimePay += entry.overtime_pay || 0;
    });

    const rows = Object.values(employeeMap).map(emp => [
      'REST01',
      format(new Date(), 'yyyyMMdd'),
      emp.fileNo,
      emp.regularHours.toFixed(2),
      emp.overtimeHours.toFixed(2),
      emp.regularPay.toFixed(2),
      emp.overtimePay.toFixed(2)
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  };

  const handleExport = () => {
    setExporting(true);

    let content, filename, mimeType;

    switch (exportFormat) {
      case 'csv':
        content = generateCSV();
        filename = `payroll_${format(periodStart, 'yyyy-MM-dd')}_${format(periodEnd, 'yyyy-MM-dd')}.csv`;
        mimeType = 'text/csv';
        break;
      case 'quickbooks':
        content = generateQuickBooksIIF();
        filename = `payroll_${format(periodStart, 'yyyy-MM-dd')}.iif`;
        mimeType = 'text/plain';
        break;
      case 'adp':
        content = generateADPFormat();
        filename = `payroll_adp_${format(periodStart, 'yyyy-MM-dd')}.csv`;
        mimeType = 'text/csv';
        break;
      default:
        content = generateCSV();
        filename = `payroll_${format(periodStart, 'yyyy-MM-dd')}.csv`;
        mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

    setExporting(false);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const exportFormats = [
    {
      id: 'csv',
      name: 'Standard CSV',
      description: 'Universal format for Excel, Google Sheets',
      icon: FileSpreadsheet,
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks IIF',
      description: 'Import directly into QuickBooks Desktop',
      icon: Database,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'adp',
      name: 'ADP Format',
      description: 'Compatible with ADP payroll systems',
      icon: FileText,
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Payroll Data
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-emerald-500">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6">
            <p className="text-slate-600 mb-2">
              Export payroll data for period:
            </p>
            <p className="font-semibold text-slate-900">
              {format(periodStart, 'MMM d, yyyy')} - {format(periodEnd, 'MMM d, yyyy')}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {Object.keys(periodEntries.reduce((acc, e) => { acc[e.employee_id] = true; return acc; }, {})).length} employees • {periodEntries.length} time entries
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <Label>Select Export Format</Label>
            {exportFormats.map(fmt => {
              const Icon = fmt.icon;
              return (
                <div
                  key={fmt.id}
                  onClick={() => setExportFormat(fmt.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    exportFormat === fmt.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${fmt.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{fmt.name}</div>
                      <div className="text-sm text-slate-500">{fmt.description}</div>
                    </div>
                    {exportFormat === fmt.id && (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {exporting ? (
              'Exporting...'
            ) : exported ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Payroll Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}