import React, { useState } from "react";
import { CustomerProfile } from "@/entities/CustomerProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User, Mail, Phone, MapPin, Bell, Edit, Save,
  Plus, X, Home, Briefcase
} from "lucide-react";
import { format } from "date-fns";

export default function PortalProfileSection({ profile, user, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile || {});
  const [profileTab, setProfileTab] = useState("info");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await CustomerProfile.update(profile.id, editedProfile);
      onRefresh();
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    }
    setIsSaving(false);
  };

  const handleAddAddress = () => {
    const addresses = editedProfile.delivery_addresses || [];
    addresses.push({
      label: "Home",
      street: "",
      city: "",
      state: "",
      zip: "",
      is_default: addresses.length === 0
    });
    setEditedProfile({ ...editedProfile, delivery_addresses: addresses });
  };

  const handleRemoveAddress = (index) => {
    const addresses = editedProfile.delivery_addresses.filter((_, i) => i !== index);
    setEditedProfile({ ...editedProfile, delivery_addresses: addresses });
  };

  const handleUpdateAddress = (index, field, value) => {
    const addresses = [...editedProfile.delivery_addresses];
    addresses[index][field] = value;
    setEditedProfile({ ...editedProfile, delivery_addresses: addresses });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-emerald-600">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setIsEditing(false); setEditedProfile(profile); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      <Tabs value={profileTab} onValueChange={setProfileTab}>
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg mb-6">
          <TabsTrigger value="info" className="rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="addresses" className="rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Addresses
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="info">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    value={isEditing ? editedProfile.full_name : profile?.full_name || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input value={user?.email || ''} disabled className="mt-2 bg-slate-100" />
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    value={isEditing ? editedProfile.phone : profile?.phone || ''}
                    onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Member Since</Label>
                  <Input
                    value={profile?.customer_since ? format(new Date(profile.customer_since), 'MMMM d, yyyy') : 'N/A'}
                    disabled
                    className="mt-2 bg-slate-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Dietary Preferences</Label>
                  <Input
                    value={isEditing 
                      ? (editedProfile.dietary_preferences || []).join(', ')
                      : (profile?.dietary_preferences || []).join(', ')}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      dietary_preferences: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="e.g., Vegetarian, Gluten-Free"
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Allergies</Label>
                  <Input
                    value={isEditing 
                      ? (editedProfile.allergies || []).join(', ')
                      : (profile?.allergies || []).join(', ')}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="e.g., Peanuts, Shellfish"
                    disabled={!isEditing}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card className="border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Delivery Addresses
              </CardTitle>
              {isEditing && (
                <Button size="sm" onClick={handleAddAddress}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {(!editedProfile.delivery_addresses || editedProfile.delivery_addresses.length === 0) ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 mb-4">No saved addresses</p>
                  {isEditing && (
                    <Button onClick={handleAddAddress} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {(isEditing ? editedProfile : profile)?.delivery_addresses?.map((addr, idx) => (
                    <Card key={idx} className={`border-2 ${addr.is_default ? 'border-emerald-500 bg-emerald-50' : ''}`}>
                      <CardContent className="p-4">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <select
                                value={addr.label}
                                onChange={(e) => handleUpdateAddress(idx, 'label', e.target.value)}
                                className="px-3 py-1 border rounded"
                              >
                                <option value="Home">Home</option>
                                <option value="Work">Work</option>
                                <option value="Other">Other</option>
                              </select>
                              <Button size="sm" variant="ghost" onClick={() => handleRemoveAddress(idx)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <Input
                              placeholder="Street address"
                              value={addr.street || ''}
                              onChange={(e) => handleUpdateAddress(idx, 'street', e.target.value)}
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                placeholder="City"
                                value={addr.city || ''}
                                onChange={(e) => handleUpdateAddress(idx, 'city', e.target.value)}
                              />
                              <Input
                                placeholder="State"
                                value={addr.state || ''}
                                onChange={(e) => handleUpdateAddress(idx, 'state', e.target.value)}
                              />
                              <Input
                                placeholder="ZIP"
                                value={addr.zip || ''}
                                onChange={(e) => handleUpdateAddress(idx, 'zip', e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {addr.label === 'Home' ? <Home className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                              <span className="font-bold">{addr.label}</span>
                              {addr.is_default && <Badge className="bg-emerald-600 text-xs">Default</Badge>}
                            </div>
                            <p className="text-slate-700">{addr.street}</p>
                            <p className="text-slate-700">{addr.city}, {addr.state} {addr.zip}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold">SMS Notifications</p>
                  <p className="text-sm text-slate-600">Order updates via text message</p>
                </div>
                <Switch
                  checked={editedProfile.notification_preferences?.sms_notifications !== false}
                  onCheckedChange={(checked) => setEditedProfile({
                    ...editedProfile,
                    notification_preferences: {
                      ...(editedProfile.notification_preferences || {}),
                      sms_notifications: checked
                    }
                  })}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold">Email Notifications</p>
                  <p className="text-sm text-slate-600">Order confirmations and receipts</p>
                </div>
                <Switch
                  checked={editedProfile.notification_preferences?.email_notifications !== false}
                  onCheckedChange={(checked) => setEditedProfile({
                    ...editedProfile,
                    notification_preferences: {
                      ...(editedProfile.notification_preferences || {}),
                      email_notifications: checked
                    }
                  })}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold">Promotional Offers</p>
                  <p className="text-sm text-slate-600">Special deals and promotions</p>
                </div>
                <Switch
                  checked={editedProfile.notification_preferences?.promotional_offers === true}
                  onCheckedChange={(checked) => setEditedProfile({
                    ...editedProfile,
                    notification_preferences: {
                      ...(editedProfile.notification_preferences || {}),
                      promotional_offers: checked
                    }
                  })}
                  disabled={!isEditing}
                />
              </div>

              {isEditing && (
                <Button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-600 mt-4">
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}