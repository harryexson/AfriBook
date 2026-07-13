import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus, Trash2, Mail, Phone } from "lucide-react";

const ROLES = [
  { value: 'manager', label: 'Manager', color: 'bg-purple-100 text-purple-800' },
  { value: 'chef', label: 'Chef', color: 'bg-orange-100 text-orange-800' },
  { value: 'server', label: 'Server', color: 'bg-blue-100 text-blue-800' },
  { value: 'cashier', label: 'Cashier', color: 'bg-green-100 text-green-800' },
  { value: 'kitchen_staff', label: 'Kitchen Staff', color: 'bg-amber-100 text-amber-800' },
  { value: 'delivery', label: 'Delivery Driver', color: 'bg-indigo-100 text-indigo-800' }
];

export default function OnboardingStep4({ formData, updateFormData }) {
  const [newMember, setNewMember] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'server',
    hourly_rate: 15
  });

  const addMember = () => {
    if (!newMember.full_name || !newMember.email) return;

    updateFormData({
      teamMembers: [...formData.teamMembers, { ...newMember }]
    });

    setNewMember({
      full_name: '',
      email: '',
      phone: '',
      role: 'server',
      hourly_rate: 15
    });
  };

  const removeMember = (index) => {
    updateFormData({
      teamMembers: formData.teamMembers.filter((_, i) => i !== index)
    });
  };

  const getRoleInfo = (role) => {
    return ROLES.find(r => r.value === role) || ROLES[2];
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Invite Your Team</h2>
        <p className="text-slate-600 mt-2">Add team members who will help manage your restaurant</p>
      </div>

      {/* Add New Team Member */}
      <Card className="border-2 border-dashed border-purple-300 bg-purple-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Team Member
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={newMember.full_name}
                onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                placeholder="John Doe"
                className="mt-1 bg-white"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="john@example.com"
                  className="pl-10 bg-white"
                />
              </div>
            </div>

            <div>
              <Label>Phone</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10 bg-white"
                />
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <select
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number"
                value={newMember.hourly_rate}
                onChange={(e) => setNewMember({ ...newMember, hourly_rate: parseFloat(e.target.value) || 15 })}
                min="0"
                step="0.50"
                className="mt-1 bg-white"
              />
            </div>
          </div>

          <Button
            onClick={addMember}
            disabled={!newMember.full_name || !newMember.email}
            className="mt-4 bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </CardContent>
      </Card>

      {/* Team Members List */}
      {formData.teamMembers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">
            Your Team ({formData.teamMembers.length} members)
          </h3>

          {formData.teamMembers.map((member, idx) => {
            const roleInfo = getRoleInfo(member.role);
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-white rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-600">
                      {member.full_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{member.full_name}</div>
                    <div className="text-sm text-slate-500">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge className={roleInfo.color}>
                    {roleInfo.label}
                  </Badge>
                  <span className="text-sm text-slate-600">${member.hourly_rate}/hr</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeMember(idx)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formData.teamMembers.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No team members added yet</p>
          <p className="text-sm">You can skip this step and add team members later</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Team members will receive an email invitation to join your restaurant on RESTROBUDDY. They'll be able to log in and access features based on their assigned role.
        </p>
      </div>
    </div>
  );
}