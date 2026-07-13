import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Employee } from "@/entities/Employee";
import { base44 } from "@/api/base44Client";

export default function EditStaffDialog({ staff, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "server",
    hourly_rate: 15,
    location: "",
    status: "invited",
    hire_date: new Date().toISOString().split('T')[0],
    permissions: {
      manage_inventory: false,
      manage_orders: true,
      manage_menu: false,
      manage_tables: false,
      view_reports: false,
      manage_employees: false,
      process_payroll: false
    }
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        full_name: staff.full_name || "",
        email: staff.email || "",
        phone: staff.phone || "",
        role: staff.role || "server",
        hourly_rate: staff.hourly_rate || 15,
        location: staff.location || "",
        status: staff.status || "active",
        hire_date: staff.hire_date || new Date().toISOString().split('T')[0],
        permissions: staff.permissions || {
          manage_inventory: false,
          manage_orders: true,
          manage_menu: false,
          manage_tables: false,
          view_reports: false,
          manage_employees: false,
          process_payroll: false
        }
      });
    }
  }, [staff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.role) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      if (staff) {
        await Employee.update(staff.id, formData);
      } else {
        await Employee.create(formData);
        
        // Send invitation email (optional)
        try {
          await base44.functions.invoke('sendEmployeeInvitation', {
            email: formData.email,
            name: formData.full_name,
            role: formData.role
          });
        } catch (e) {
          console.log("Could not send invitation:", e);
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("Failed to save staff member");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
          <div className="flex items-center justify-between">
            <CardTitle>{staff ? 'Edit Staff Member' : 'Add New Staff Member'}</CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-emerald-500">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="John Doe"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@example.com"
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Main Location"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Role & Pay */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Role *</Label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="manager">Manager</option>
                  <option value="chef">Chef</option>
                  <option value="server">Server</option>
                  <option value="cashier">Cashier</option>
                  <option value="kitchen_staff">Kitchen Staff</option>
                  <option value="delivery">Delivery Driver</option>
                </select>
              </div>
              <div>
                <Label>Hourly Rate ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.50"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                >
                  <option value="invited">Invited</option>
                  <option value="active">Active</option>
                  <option value="on_break">On Break</option>
                  <option value="off_duty">Off Duty</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Hire Date</Label>
              <Input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                className="mt-1"
              />
            </div>

            {/* Permissions */}
            <div>
              <Label className="text-lg font-bold mb-3 block">Permissions</Label>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(formData.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={value}
                      onChange={(e) => setFormData({
                        ...formData,
                        permissions: {...formData.permissions, [key]: e.target.checked}
                      })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={key} className="cursor-pointer">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-emerald-600">
                {saving ? 'Saving...' : staff ? 'Update Staff' : 'Add Staff'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}