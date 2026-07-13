import React, { useState, useEffect } from "react";
import { AdminUser } from "@/entities/AdminUser";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus, ArrowLeft, Mail, Shield, Trash2, Edit, CheckCircle, XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function BackofficeStaff() {
  const [staffMembers, setStaffMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    full_name: "",
    role: "customer_support"
  });
  const [permissions, setPermissions] = useState({
    manage_subscriptions: false,
    manage_payments: false,
    manage_refunds: false,
    suspend_accounts: false,
    view_analytics: false,
    manage_staff: false,
    customer_support: true
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const staff = await AdminUser.list("-created_date");
      setStaffMembers(staff);
    } catch (error) {
      console.error("Error loading staff:", error);
    }
    setIsLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteData.email || !inviteData.full_name) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSending(true);
    try {
      const user = await base44.auth.me();
      
      await AdminUser.create({
        ...inviteData,
        permissions,
        status: "invited",
        invited_by: user.email
      });

      // Send invitation email
      await base44.integrations.Core.SendEmail({
        to: inviteData.email,
        subject: "You've been invited to RESTROBUDDY Backoffice",
        body: `Hello ${inviteData.full_name},\n\nYou've been invited to join the RESTROBUDDY backoffice team as ${inviteData.role}.\n\nPlease log in to accept your invitation.\n\nBest regards,\nRESTROBUDDY Team`
      });

      await loadStaff();
      setShowInviteDialog(false);
      setInviteData({ email: "", full_name: "", role: "customer_support" });
      setPermissions({
        manage_subscriptions: false,
        manage_payments: false,
        manage_refunds: false,
        suspend_accounts: false,
        view_analytics: false,
        manage_staff: false,
        customer_support: true
      });
    } catch (error) {
      console.error("Error inviting staff:", error);
      alert("Failed to send invitation");
    }
    setIsSending(false);
  };

  const handleRoleChange = (role) => {
    setInviteData({...inviteData, role});
    
    // Auto-set permissions based on role
    switch(role) {
      case "super_admin":
        setPermissions({
          manage_subscriptions: true,
          manage_payments: true,
          manage_refunds: true,
          suspend_accounts: true,
          view_analytics: true,
          manage_staff: true,
          customer_support: true
        });
        break;
      case "billing_admin":
        setPermissions({
          manage_subscriptions: true,
          manage_payments: true,
          manage_refunds: true,
          suspend_accounts: true,
          view_analytics: true,
          manage_staff: false,
          customer_support: false
        });
        break;
      case "customer_support":
        setPermissions({
          manage_subscriptions: false,
          manage_payments: false,
          manage_refunds: false,
          suspend_accounts: false,
          view_analytics: false,
          manage_staff: false,
          customer_support: true
        });
        break;
      case "hr_admin":
        setPermissions({
          manage_subscriptions: false,
          manage_payments: false,
          manage_refunds: false,
          suspend_accounts: false,
          view_analytics: true,
          manage_staff: true,
          customer_support: false
        });
        break;
      case "content_manager":
        setPermissions({
          manage_subscriptions: false,
          manage_payments: false,
          manage_refunds: false,
          suspend_accounts: false,
          view_analytics: true,
          manage_staff: false,
          customer_support: false
        });
        break;
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      await AdminUser.delete(staffId);
      await loadStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("Failed to remove staff member");
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "super_admin": return "bg-red-100 text-red-800";
      case "billing_admin": return "bg-blue-100 text-blue-800";
      case "customer_support": return "bg-purple-100 text-purple-800";
      case "hr_admin": return "bg-green-100 text-green-800";
      case "content_manager": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "invited": return "bg-blue-100 text-blue-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 border-b border-emerald-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl("DeveloperBackoffice")}>
              <Button variant="ghost" className="text-white hover:bg-emerald-500">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Shield className="w-8 h-8" />
                Staff Management
              </h1>
              <p className="text-emerald-100 mt-1">Manage backoffice team members and permissions</p>
            </div>
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="bg-white text-emerald-700 hover:bg-emerald-50"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Invite Staff Member
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Staff</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {staffMembers.length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {staffMembers.filter(s => s.status === "active").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {staffMembers.filter(s => s.status === "invited").length}
                  </p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {staffMembers.filter(s => s.status === "inactive").length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.full_name}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(staff.role)}>
                          {staff.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(staff.status)}>
                          {staff.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {staff.invited_by || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {staff.last_login ? format(new Date(staff.last_login), "MMM d, yyyy") : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {/* Edit functionality */}}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteStaff(staff.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                placeholder="John Doe"
                value={inviteData.full_name}
                onChange={(e) => setInviteData({...inviteData, full_name: e.target.value})}
              />
            </div>

            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={inviteData.email}
                onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
              />
            </div>

            <div>
              <Label>Role *</Label>
              <Select value={inviteData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin - Full Access</SelectItem>
                  <SelectItem value="billing_admin">Billing Admin - Manage Payments</SelectItem>
                  <SelectItem value="customer_support">Customer Support - Handle Tickets</SelectItem>
                  <SelectItem value="hr_admin">HR Admin - Manage Staff</SelectItem>
                  <SelectItem value="content_manager">Content Manager - Manage Content</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <Label className="text-base mb-3 block">Permissions</Label>
              <div className="space-y-3">
                {Object.entries(permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm text-slate-700">
                      {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) =>
                        setPermissions({...permissions, [key]: checked})
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={isSending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}