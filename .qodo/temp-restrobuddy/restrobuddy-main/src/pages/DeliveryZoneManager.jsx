import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Plus, Trash2, Edit, Loader2, Truck, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DriverManagement from "@/components/delivery/DriverManagement";

export default function DeliveryZoneManager() {
  const [zones, setZones] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    postal_codes: "",
    delivery_fee: "",
    fee_type: "flat",
    distance_rate: "",
    percentage_rate: "",
    max_distance: "",
    min_order_amount: "",
    free_delivery_threshold: "",
    estimated_delivery_time: "",
    third_party_provider: "none",
    active: true
  });
  const [activeTab, setActiveTab] = useState("zones");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
        const deliveryZones = await base44.entities.DeliveryZone.filter({ restaurant_id: restaurants[0].id });
        setZones(deliveryZones);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const zoneData = {
        restaurant_id: restaurant.id,
        name: formData.name,
        postal_codes: formData.postal_codes.split(',').map(code => code.trim()).filter(Boolean),
        delivery_fee: parseFloat(formData.delivery_fee),
        fee_type: formData.fee_type,
        distance_rate: formData.distance_rate ? parseFloat(formData.distance_rate) : undefined,
        percentage_rate: formData.percentage_rate ? parseFloat(formData.percentage_rate) : undefined,
        max_distance: formData.max_distance ? parseFloat(formData.max_distance) : undefined,
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        free_delivery_threshold: formData.free_delivery_threshold ? parseFloat(formData.free_delivery_threshold) : undefined,
        estimated_delivery_time: parseInt(formData.estimated_delivery_time),
        third_party_provider: formData.third_party_provider,
        active: formData.active
      };

      if (editingZone) {
        await base44.entities.DeliveryZone.update(editingZone.id, zoneData);
      } else {
        await base44.entities.DeliveryZone.create(zoneData);
      }

      await loadData();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save zone:", error);
    }
  };

  const handleEdit = (zone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      postal_codes: zone.postal_codes.join(', '),
      delivery_fee: zone.delivery_fee,
      fee_type: zone.fee_type || "flat",
      distance_rate: zone.distance_rate || '',
      percentage_rate: zone.percentage_rate || '',
      max_distance: zone.max_distance || '',
      min_order_amount: zone.min_order_amount || '',
      free_delivery_threshold: zone.free_delivery_threshold || '',
      estimated_delivery_time: zone.estimated_delivery_time,
      third_party_provider: zone.third_party_provider || "none",
      active: zone.active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (zoneId) => {
    if (confirm("Are you sure you want to delete this delivery zone?")) {
      try {
        await base44.entities.DeliveryZone.delete(zoneId);
        await loadData();
      } catch (error) {
        console.error("Failed to delete zone:", error);
      }
    }
  };

  const toggleZoneStatus = async (zone) => {
    try {
      await base44.entities.DeliveryZone.update(zone.id, { active: !zone.active });
      await loadData();
    } catch (error) {
      console.error("Failed to update zone:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      postal_codes: "",
      delivery_fee: "",
      fee_type: "flat",
      distance_rate: "",
      percentage_rate: "",
      max_distance: "",
      min_order_amount: "",
      free_delivery_threshold: "",
      estimated_delivery_time: "",
      third_party_provider: "none",
      active: true
    });
    setEditingZone(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Delivery Management</h1>
        <p className="text-slate-600">Manage zones, drivers, and third-party integrations for {restaurant?.business_name}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Delivery Zones
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="third-party" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Third-Party Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Delivery Zones</h2>
          <p className="text-slate-600">Configure delivery areas and pricing</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingZone ? 'Edit' : 'Add'} Delivery Zone</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Zone Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Downtown"
                  required
                />
              </div>
              <div>
                <Label>Postal/Zip Codes (comma-separated)</Label>
                <Input
                  value={formData.postal_codes}
                  onChange={(e) => setFormData({...formData, postal_codes: e.target.value})}
                  placeholder="e.g., 10001, 10002, 10003"
                  required
                />
              </div>
              <div>
                <Label>Fee Type</Label>
                <Select value={formData.fee_type} onValueChange={(value) => setFormData({...formData, fee_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Fee</SelectItem>
                    <SelectItem value="distance_based">Distance-Based</SelectItem>
                    <SelectItem value="order_value_percentage">Order Value %</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.fee_type === 'flat' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Delivery Fee ({restaurant?.currency || 'USD'})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData({...formData, delivery_fee: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Free Delivery Over</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.free_delivery_threshold}
                      onChange={(e) => setFormData({...formData, free_delivery_threshold: e.target.value})}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              {formData.fee_type === 'distance_based' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Rate per Mile</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.distance_rate}
                      onChange={(e) => setFormData({...formData, distance_rate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Max Distance (miles)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.max_distance}
                      onChange={(e) => setFormData({...formData, max_distance: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {formData.fee_type === 'order_value_percentage' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Percentage Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.percentage_rate}
                      onChange={(e) => setFormData({...formData, percentage_rate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Minimum Fee</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData({...formData, delivery_fee: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Minimum Order Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Est. Delivery Time (minutes)</Label>
                <Input
                  type="number"
                  value={formData.estimated_delivery_time}
                  onChange={(e) => setFormData({...formData, estimated_delivery_time: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label>Third-Party Delivery Provider</Label>
                <Select value={formData.third_party_provider} onValueChange={(value) => setFormData({...formData, third_party_provider: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Own Drivers</SelectItem>
                    <SelectItem value="doordash">DoorDash Drive</SelectItem>
                    <SelectItem value="uber_direct">Uber Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {editingZone ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {zones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Delivery Zones</h3>
            <p className="text-slate-600 mb-4">Add delivery zones to enable delivery orders</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Zone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <Card key={zone.id} className={!zone.active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      {zone.name}
                    </CardTitle>
                    <Badge className={`mt-2 ${zone.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {zone.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(zone)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(zone.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Delivery Fee</p>
                  <p className="text-lg">{restaurant?.currency || '$'}{zone.delivery_fee}</p>
                </div>
                {zone.min_order_amount > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Min Order</p>
                    <p>{restaurant?.currency || '$'}{zone.min_order_amount}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-700">Delivery Time</p>
                  <p>{zone.estimated_delivery_time} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Postal Codes</p>
                  <p className="text-sm text-slate-600">{zone.postal_codes.join(', ')}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => toggleZoneStatus(zone)}
                >
                  {zone.active ? 'Deactivate' : 'Activate'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>

        <TabsContent value="drivers">
          <DriverManagement restaurant={restaurant} />
        </TabsContent>

        <TabsContent value="third-party">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Delivery Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Truck className="w-8 h-8 text-red-600" />
                      <div>
                        <CardTitle>DoorDash Drive</CardTitle>
                        <p className="text-sm text-slate-600">On-demand delivery network</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p className="font-semibold mb-2">Benefits:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        <li>Nationwide coverage</li>
                        <li>Real-time tracking</li>
                        <li>Enterprise-grade reliability</li>
                      </ul>
                    </div>
                    <Badge variant="outline">API Key Required</Badge>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Truck className="w-8 h-8 text-slate-900" />
                      <div>
                        <CardTitle>Uber Direct</CardTitle>
                        <p className="text-sm text-slate-600">Fast, flexible deliveries</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p className="font-semibold mb-2">Benefits:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        <li>Same-day delivery</li>
                        <li>Live courier tracking</li>
                        <li>Flexible scheduling</li>
                      </ul>
                    </div>
                    <Badge variant="outline">OAuth Required</Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Setup Instructions</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-blue-800">
                  <li>Contact the provider to create a business account</li>
                  <li>Obtain API credentials from their developer portal</li>
                  <li>Configure credentials in System Settings</li>
                  <li>Assign providers to delivery zones</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}