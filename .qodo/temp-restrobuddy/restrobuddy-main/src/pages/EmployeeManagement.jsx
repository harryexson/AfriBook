
import React, { useState, useEffect } from "react";
import { Employee } from "@/entities/Employee";
import { TimeEntry } from "@/entities/TimeEntry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, DollarSign, Mail, UserPlus, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "server",
    hourly_rate: 15,
    location: "Main Location",
    status: "invited",
    ewa_enabled: false,
    permissions: {
      manage_inventory: false,
      manage_orders: true,  // Set to true by default so staff can access Kitchen Display
      manage_menu: false,
      manage_tables: false,
      view_reports: false,
      manage_employees: false,
      process_payroll: false
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allEmployees = await Employee.list("-created_date");
    const allTimeEntries = await TimeEntry.filter({}, "-created_date", 50);
    setEmployees(allEmployees);
    setTimeEntries(allTimeEntries);
  };

  const handleInviteEmployee = async () => {
    try {
      const user = await base44.auth.me();
      
      const employeeData = {
        ...newEmployee,
        invited_by: user.email,
        invitation_sent_date: new Date().toISOString()
      };

      const newEmp = await Employee.create(employeeData);

      // Send invitation email
      await base44.functions.invoke('sendEmployeeInvitation', {
        employee: newEmp,
        invitedBy: user.full_name || user.email
      });

      setShowInviteDialog(false);
      setNewEmployee({
        full_name: "",
        email: "",
        phone: "",
        role: "server",
        hourly_rate: 15,
        location: "Main Location",
        status: "invited",
        ewa_enabled: false,
        permissions: {
          manage_inventory: false,
          manage_orders: true, // Reset to true
          manage_menu: false,
          manage_tables: false,
          view_reports: false,
          manage_employees: false,
          process_payroll: false
        }
      });
      loadData();
    } catch (error) {
      console.error("Error inviting employee:", error);
      alert("Failed to invite employee. Please try again.");
    }
  };

  const activeEmployees = employees.filter(e => e.status === "active" || e.status === "on_break");
  const totalHoursToday = timeEntries
    .filter(t => {
      const entryDate = new Date(t.created_date);
      const today = new Date();
      return entryDate.toDateString() === today.toDateString();
    })
    .reduce((sum, t) => sum + (t.total_hours || 0), 0);

  const roleColors = {
    manager: "bg-purple-100 text-purple-800",
    chef: "bg-orange-100 text-orange-800",
    server: "bg-blue-100 text-blue-800",
    cashier: "bg-green-100 text-green-800",
    kitchen_staff: "bg-amber-100 text-amber-800",
    delivery: "bg-cyan-100 text-cyan-800"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Employee Management</h1>
          <p className="text-slate-600">Manage staff, track hours, and handle payroll</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{employees.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-green-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Active Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{activeEmployees.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Hours Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{totalHoursToday.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Pending Invites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {employees.filter(e => e.status === "invited").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="employees" className="mb-8">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
            <TabsTrigger value="payroll">
              <Calendar className="w-4 h-4 mr-2" />
              Payroll
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Team Members</CardTitle>
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#10b981] hover:bg-[#059669]">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Employee
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Invite New Employee</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input
                            value={newEmployee.full_name}
                            onChange={(e) => setNewEmployee({...newEmployee, full_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newEmployee.email}
                            onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={newEmployee.phone}
                            onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Select
                            value={newEmployee.role}
                            onValueChange={(value) => setNewEmployee({...newEmployee, role: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="chef">Chef</SelectItem>
                              <SelectItem value="server">Server</SelectItem>
                              <SelectItem value="cashier">Cashier</SelectItem>
                              <SelectItem value="kitchen_staff">Kitchen Staff</SelectItem>
                              <SelectItem value="delivery">Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Hourly Rate ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newEmployee.hourly_rate}
                            onChange={(e) => setNewEmployee({...newEmployee, hourly_rate: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input
                            value={newEmployee.location}
                            onChange={(e) => setNewEmployee({...newEmployee, location: e.target.value})}
                          />
                        </div>

                        <div className="col-span-2 border-t pt-4 mt-4">
                          <Label className="text-base font-semibold mb-4 block">Permissions</Label>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(newEmployee.permissions).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <Checkbox
                                  id={key}
                                  checked={value}
                                  onCheckedChange={(checked) => setNewEmployee({
                                    ...newEmployee,
                                    permissions: {...newEmployee.permissions, [key]: checked}
                                  })}
                                />
                                <label htmlFor={key} className="text-sm capitalize cursor-pointer">
                                  {key.replace(/_/g, ' ')}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center space-x-2 border-t pt-4">
                          <Checkbox
                            id="ewa_enabled"
                            checked={newEmployee.ewa_enabled}
                            onCheckedChange={(checked) => setNewEmployee({...newEmployee, ewa_enabled: checked})}
                          />
                          <label htmlFor="ewa_enabled" className="text-sm font-medium cursor-pointer">
                            Enable Earned Wage Access (EWA) - Instant pay option
                          </label>
                        </div>
                      </div>
                      <Button onClick={handleInviteEmployee} className="w-full bg-[#10b981] hover:bg-[#059669] mt-4">
                        <Mail className="w-4 h-4 mr-2" />
                        Send Invitation
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>EWA</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-semibold">{emp.full_name}</TableCell>
                        <TableCell>
                          <Badge className={roleColors[emp.role]}>
                            {emp.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{emp.email}</div>
                            <div className="text-slate-500">{emp.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-[#10b981]">
                          ${emp.hourly_rate}/hr
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            emp.status === "active" ? "bg-green-100 text-green-800" :
                            emp.status === "invited" ? "bg-blue-100 text-blue-800" :
                            emp.status === "on_break" ? "bg-amber-100 text-amber-800" :
                            "bg-slate-100 text-slate-800"
                          }>
                            {emp.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {emp.ewa_enabled ? (
                            <Badge className="bg-purple-100 text-purple-800">Enabled</Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(createPageUrl("EmployeeDetails"), { state: { employeeId: emp.id } })}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timesheets">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Recent Time Entries</CardTitle>
                  <Button onClick={() => navigate(createPageUrl("TimeClock"))}>
                    <Clock className="w-4 h-4 mr-2" />
                    Go to Time Clock
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Regular Pay</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>Tips</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-semibold">{entry.employee_name}</TableCell>
                        <TableCell>
                          {new Date(entry.clock_in).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {entry.clock_out ? new Date(entry.clock_out).toLocaleString() : (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {entry.total_hours ? `${entry.total_hours.toFixed(2)} hrs` : '-'}
                        </TableCell>
                        <TableCell className="text-[#10b981]">
                          ${(entry.regular_pay || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-amber-600">
                          {entry.overtime_hours > 0 ? `${entry.overtime_hours.toFixed(2)}h / $${entry.overtime_pay.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          ${(entry.tips_earned || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-bold text-[#10b981]">
                          ${(entry.total_earnings || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Payroll Management</CardTitle>
                  <Button 
                    onClick={() => navigate(createPageUrl("PayrollManagement"))}
                    className="bg-[#10b981] hover:bg-[#059669]"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Payroll
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg mb-4">
                    Process payroll, approve timesheets, and manage pay periods
                  </p>
                  <Button onClick={() => navigate(createPageUrl("PayrollManagement"))}>
                    Go to Payroll Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
