import React, { useState, useEffect } from "react";
import { PayrollPeriod } from "@/entities/PayrollPeriod";
import { TimeEntry } from "@/entities/TimeEntry";
import { Employee } from "@/entities/Employee";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, DollarSign, Users, CheckCircle, Clock, Plus, FileText, Download, Settings } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import PayrollReportView from "../components/payroll/PayrollReportView";
import PayrollExport from "../components/payroll/PayrollExport";
import EmployeeTaxInfo from "../components/payroll/EmployeeTaxInfo";

export default function PayrollManagement() {
  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReportView, setShowReportView] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showTaxInfo, setShowTaxInfo] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("periods");
  const [newPeriod, setNewPeriod] = useState({
    period_start: "",
    period_end: "",
    pay_date: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const periods = await PayrollPeriod.list("-created_date");
    const entries = await TimeEntry.filter({}, "-created_date", 500);
    const emps = await Employee.list();
    
    setPayrollPeriods(periods);
    setTimeEntries(entries);
    setEmployees(emps);
  };

  const handleCreatePayrollPeriod = async () => {
    try {
      // Get all unpaid time entries for this period
      const periodEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.created_date);
        const start = new Date(newPeriod.period_start);
        const end = new Date(newPeriod.period_end);
        return entryDate >= start && entryDate <= end && !entry.paid;
      });

      // Calculate totals
      const totals = periodEntries.reduce((acc, entry) => ({
        regular_hours: acc.regular_hours + (entry.regular_hours || 0),
        overtime_hours: acc.overtime_hours + (entry.overtime_hours || 0),
        regular_pay: acc.regular_pay + (entry.regular_pay || 0),
        overtime_pay: acc.overtime_pay + (entry.overtime_pay || 0),
        tips: acc.tips + (entry.tips_earned || 0)
      }), { regular_hours: 0, overtime_hours: 0, regular_pay: 0, overtime_pay: 0, tips: 0 });

      const uniqueEmployees = new Set(periodEntries.map(e => e.employee_id)).size;
      const grossPay = totals.regular_pay + totals.overtime_pay + totals.tips;

      const period = await PayrollPeriod.create({
        ...newPeriod,
        total_regular_hours: parseFloat(totals.regular_hours.toFixed(2)),
        total_overtime_hours: parseFloat(totals.overtime_hours.toFixed(2)),
        total_regular_pay: parseFloat(totals.regular_pay.toFixed(2)),
        total_overtime_pay: parseFloat(totals.overtime_pay.toFixed(2)),
        total_tips: parseFloat(totals.tips.toFixed(2)),
        total_gross_pay: parseFloat(grossPay.toFixed(2)),
        employee_count: uniqueEmployees,
        status: "draft"
      });

      setShowCreateDialog(false);
      setNewPeriod({ period_start: "", period_end: "", pay_date: "" });
      loadData();
    } catch (error) {
      console.error("Error creating payroll period:", error);
      alert("Failed to create payroll period");
    }
  };

  const handleApprovePayroll = async (periodId) => {
    try {
      const user = await base44.auth.me();
      
      await PayrollPeriod.update(periodId, {
        status: "approved",
        approved_by: user.email,
        approved_date: new Date().toISOString()
      });

      loadData();
    } catch (error) {
      console.error("Error approving payroll:", error);
    }
  };

  const handleProcessPayroll = async (periodId) => {
    try {
      const user = await base44.auth.me();
      const period = payrollPeriods.find(p => p.id === periodId);

      // Mark all time entries as paid
      const periodEntries = timeEntries.filter(entry => {
        const entryDate = new Date(entry.created_date);
        const start = new Date(period.period_start);
        const end = new Date(period.period_end);
        return entryDate >= start && entryDate <= end && !entry.paid;
      });

      for (const entry of periodEntries) {
        await TimeEntry.update(entry.id, {
          paid: true,
          paid_date: new Date().toISOString(),
          pay_period_id: periodId
        });
      }

      await PayrollPeriod.update(periodId, {
        status: "completed",
        processed_by: user.email,
        processed_date: new Date().toISOString()
      });

      loadData();
      alert(`Payroll processed successfully! $${period.total_gross_pay.toFixed(2)} paid to ${period.employee_count} employees.`);
    } catch (error) {
      console.error("Error processing payroll:", error);
      alert("Failed to process payroll");
    }
  };

  const totalPending = payrollPeriods
    .filter(p => p.status !== "completed")
    .reduce((sum, p) => sum + p.total_gross_pay, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Payroll Management</h1>
          <p className="text-slate-600">Process payroll and manage pay periods</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Pay Periods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{payrollPeriods.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">
                {payrollPeriods.filter(p => p.status === "pending_approval").length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-[#10b981]/10 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#059669] flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#10b981]">
                ${totalPending.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {employees.filter(e => e.status === "active").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="periods">
              <Calendar className="w-4 h-4 mr-2" />
              Pay Periods
            </TabsTrigger>
            <TabsTrigger value="tax">
              <FileText className="w-4 h-4 mr-2" />
              Tax Information
            </TabsTrigger>
          </TabsList>

      <TabsContent value="periods">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Payroll Periods</CardTitle>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#10b981] hover:bg-[#059669]">
                    <Plus className="w-4 h-4 mr-2" />
                    New Pay Period
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Payroll Period</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Period Start Date</Label>
                      <Input
                        type="date"
                        value={newPeriod.period_start}
                        onChange={(e) => setNewPeriod({...newPeriod, period_start: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Period End Date</Label>
                      <Input
                        type="date"
                        value={newPeriod.period_end}
                        onChange={(e) => setNewPeriod({...newPeriod, period_end: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Pay Date</Label>
                      <Input
                        type="date"
                        value={newPeriod.pay_date}
                        onChange={(e) => setNewPeriod({...newPeriod, pay_date: e.target.value})}
                      />
                    </div>
                    <Button 
                      onClick={handleCreatePayrollPeriod} 
                      className="w-full bg-[#10b981] hover:bg-[#059669]"
                    >
                      Create Pay Period
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Pay Date</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollPeriods.map(period => (
                  <TableRow key={period.id}>
                    <TableCell className="font-semibold">
                      {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{new Date(period.pay_date).toLocaleDateString()}</TableCell>
                    <TableCell>{period.employee_count}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Regular: {period.total_regular_hours.toFixed(1)}h</div>
                        {period.total_overtime_hours > 0 && (
                          <div className="text-amber-600">OT: {period.total_overtime_hours.toFixed(1)}h</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-[#10b981]">
                      ${period.total_gross_pay.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        period.status === "completed" ? "bg-green-100 text-green-800" :
                        period.status === "approved" ? "bg-blue-100 text-blue-800" :
                        period.status === "pending_approval" ? "bg-amber-100 text-amber-800" :
                        "bg-slate-100 text-slate-800"
                      }>
                        {period.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {period.status === "draft" && (
                        <Button 
                          size="sm" 
                          onClick={() => handleApprovePayroll(period.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Approve
                        </Button>
                      )}
                      {period.status === "approved" && (
                        <Button 
                          size="sm" 
                          onClick={() => handleProcessPayroll(period.id)}
                          className="bg-[#10b981] hover:bg-[#059669]"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Process
                        </Button>
                      )}
                      {period.status === "completed" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPeriod(period);
                              setShowReportView(true);
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Report
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPeriod(period);
                              setShowExport(true);
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Employee Tax Info Tab */}
      <TabsContent value="tax">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Employee Tax Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Filing Status</TableHead>
                  <TableHead>W-4 Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.filter(e => e.status === 'active').map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-semibold">{emp.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{emp.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {emp.tax_info?.filing_status?.replace('_', ' ') || 'Not set'}
                    </TableCell>
                    <TableCell>
                      {emp.tax_info?.w4_submitted ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setShowTaxInfo(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    {/* Dialogs */}
    {showReportView && selectedPeriod && (
      <PayrollReportView
        period={selectedPeriod}
        timeEntries={timeEntries}
        employees={employees}
        onClose={() => {
          setShowReportView(false);
          setSelectedPeriod(null);
        }}
      />
    )}

    {showExport && selectedPeriod && (
      <PayrollExport
        period={selectedPeriod}
        timeEntries={timeEntries}
        employees={employees}
        onClose={() => {
          setShowExport(false);
          setSelectedPeriod(null);
        }}
      />
    )}

    {showTaxInfo && selectedEmployee && (
      <EmployeeTaxInfo
        employee={selectedEmployee}
        onClose={() => {
          setShowTaxInfo(false);
          setSelectedEmployee(null);
        }}
        onSuccess={loadData}
      />
    )}
      </div>
    </div>
  );
}