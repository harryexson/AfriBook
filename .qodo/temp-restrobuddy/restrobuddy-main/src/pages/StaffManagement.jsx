import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  Clock,
  Activity,
  Mail,
  Phone,
  DollarSign,
  Calendar
} from "lucide-react";
import { Employee } from "@/entities/Employee";
import EditStaffDialog from "../components/staff/EditStaffDialog";
import StaffActivityView from "../components/staff/StaffActivityView";
import RolePermissionsManager from "../components/staff/RolePermissionsManager";
import { format } from "date-fns";

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showActivityView, setShowActivityView] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onBreak: 0,
    offDuty: 0
  });

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [searchQuery, selectedRole, staff]);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const allStaff = await Employee.list("-created_date");
      setStaff(allStaff);

      // Calculate stats
      setStats({
        total: allStaff.length,
        active: allStaff.filter(s => s.status === 'active').length,
        onBreak: allStaff.filter(s => s.status === 'on_break').length,
        offDuty: allStaff.filter(s => s.status === 'off_duty').length
      });
    } catch (error) {
      console.error("Error loading staff:", error);
    }
    setIsLoading(false);
  };

  const filterStaff = () => {
    let filtered = [...staff];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.full_name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.phone?.includes(query)
      );
    }

    if (selectedRole !== "all") {
      filtered = filtered.filter(s => s.role === selectedRole);
    }

    setFilteredStaff(filtered);
  };

  const handleAdd = () => {
    setSelectedStaff(null);
    setShowEditDialog(true);
  };

  const handleEdit = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowEditDialog(true);
  };

  const handleDelete = async (staffId) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      await Employee.delete(staffId);
      loadStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      alert("Failed to delete staff member");
    }
  };

  const viewActivity = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowActivityView(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      on_break: 'bg-amber-100 text-amber-800',
      off_duty: 'bg-slate-100 text-slate-800',
      terminated: 'bg-red-100 text-red-800',
      invited: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getRoleColor = (role) => {
    const colors = {
      manager: 'bg-purple-100 text-purple-800',
      chef: 'bg-orange-100 text-orange-800',
      server: 'bg-blue-100 text-blue-800',
      cashier: 'bg-green-100 text-green-800',
      kitchen_staff: 'bg-amber-100 text-amber-800',
      delivery: 'bg-indigo-100 text-indigo-800'
    };
    return colors[role] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Staff Management</h1>
            <p className="text-slate-600">Manage your team members, roles, and permissions</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowPermissions(true)} variant="outline">
              <Shield className="w-4 h-4 mr-2" />
              Manage Roles
            </Button>
            <Button onClick={handleAdd} className="bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <Users className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm opacity-90">Total Staff</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <Activity className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.active}</div>
              <div className="text-sm opacity-90">Active Now</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <Clock className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.onBreak}</div>
              <div className="text-sm opacity-90">On Break</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white border-0">
            <CardContent className="p-4">
              <Users className="w-8 h-8 mb-2 opacity-80" />
              <div className="text-3xl font-bold">{stats.offDuty}</div>
              <div className="text-sm opacity-90">Off Duty</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={selectedRole} onValueChange={setSelectedRole}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="manager">Managers</TabsTrigger>
                  <TabsTrigger value="chef">Chefs</TabsTrigger>
                  <TabsTrigger value="server">Servers</TabsTrigger>
                  <TabsTrigger value="cashier">Cashiers</TabsTrigger>
                  <TabsTrigger value="kitchen_staff">Kitchen</TabsTrigger>
                  <TabsTrigger value="delivery">Delivery</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Staff List */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-48 animate-pulse bg-slate-200" />
            ))}
          </div>
        ) : filteredStaff.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No staff members found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredStaff.map(staffMember => (
              <Card key={staffMember.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{staffMember.full_name}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getRoleColor(staffMember.role)}>
                          {staffMember.role.replace('_', ' ')}
                        </Badge>
                        <Badge className={getStatusColor(staffMember.status)}>
                          {staffMember.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      {staffMember.email}
                    </div>
                    {staffMember.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        {staffMember.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <DollarSign className="w-4 h-4" />
                      ${staffMember.hourly_rate}/hr
                    </div>
                    {staffMember.hire_date && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        Hired: {format(new Date(staffMember.hire_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewActivity(staffMember)}
                      className="flex-1"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Activity
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(staffMember)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(staffMember.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        {showEditDialog && (
          <EditStaffDialog
            staff={selectedStaff}
            onClose={() => {
              setShowEditDialog(false);
              setSelectedStaff(null);
            }}
            onSuccess={loadStaff}
          />
        )}

        {showActivityView && selectedStaff && (
          <StaffActivityView
            staff={selectedStaff}
            onClose={() => {
              setShowActivityView(false);
              setSelectedStaff(null);
            }}
          />
        )}

        {showPermissions && (
          <RolePermissionsManager
            onClose={() => setShowPermissions(false)}
          />
        )}
      </div>
    </div>
  );
}