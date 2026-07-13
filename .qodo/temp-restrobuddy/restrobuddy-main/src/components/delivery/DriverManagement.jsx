import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, User, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function DriverManagement({ restaurant }) {
  const [drivers, setDrivers] = useState([]);
  const [zones, setZones] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle_type: "car",
    license_plate: "",
    delivery_zones: [],
    max_concurrent_deliveries: 1
  });

  useEffect(() => {
    if (restaurant) {
      loadData();
    }
  }, [restaurant]);

  const loadData = async () => {
    try {
      const [driverData, zoneData] = await Promise.all([
        base44.entities.DeliveryDriver.filter({ restaurant_id: restaurant.id }),
        base44.entities.DeliveryZone.filter({ restaurant_id: restaurant.id })
      ]);
      setDrivers(driverData);
      setZones(zoneData);
    } catch (error) {
      console.error("Failed to load drivers:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const driverData = {
        ...formData,
        restaurant_id: restaurant.id,
        max_concurrent_deliveries: parseInt(formData.max_concurrent_deliveries)
      };

      if (editingDriver) {
        await base44.entities.DeliveryDriver.update(editingDriver.id, driverData);
        toast.success("Driver updated");
      } else {
        await base44.entities.DeliveryDriver.create(driverData);
        toast.success("Driver added");
      }

      await loadData();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save driver:", error);
      toast.error("Failed to save driver");
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || "",
      vehicle_type: driver.vehicle_type,
      license_plate: driver.license_plate || "",
      delivery_zones: driver.delivery_zones || [],
      max_concurrent_deliveries: driver.max_concurrent_deliveries || 1
    });
    setDialogOpen(true);
  };

  const handleDelete = async (driverId) => {
    if (confirm("Are you sure you want to delete this driver?")) {
      try {
        await base44.entities.DeliveryDriver.delete(driverId);
        await loadData();
        toast.success("Driver deleted");
      } catch (error) {
        console.error("Failed to delete driver:", error);
        toast.error("Failed to delete driver");
      }
    }
  };

  const toggleDriverStatus = async (driver) => {
    try {
      const newStatus = driver.status === "available" ? "offline" : "available";
      await base44.entities.DeliveryDriver.update(driver.id, { status: newStatus });
      await loadData();
      toast.success(`Driver ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      vehicle_type: "car",
      license_plate: "",
      delivery_zones: [],
      max_concurrent_deliveries: 1
    });
    setEditingDriver(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "on_delivery": return "bg-blue-100 text-blue-800";
      case "break": return "bg-yellow-100 text-yellow-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Delivery Drivers</h2>
          <p className="text-slate-600">Manage your delivery team</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDriver ? 'Edit' : 'Add'} Driver</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="driver@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vehicle Type</Label>
                  <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({...formData, vehicle_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="bicycle">Bicycle</SelectItem>
                      <SelectItem value="scooter">Scooter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>License Plate</Label>
                  <Input
                    value={formData.license_plate}
                    onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                    placeholder="ABC-1234"
                  />
                </div>
              </div>
              <div>
                <Label>Max Concurrent Deliveries</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.max_concurrent_deliveries}
                  onChange={(e) => setFormData({...formData, max_concurrent_deliveries: e.target.value})}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {editingDriver ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {drivers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Drivers</h3>
            <p className="text-slate-600 mb-4">Add drivers to manage your own deliveries</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Driver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <Card key={driver.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{driver.name}</CardTitle>
                      <p className="text-sm text-slate-600">{driver.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(driver)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(driver.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status</span>
                  <Badge className={getStatusColor(driver.status)}>
                    {driver.status || "offline"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Vehicle</span>
                  <span className="text-sm font-medium capitalize">{driver.vehicle_type}</span>
                </div>
                {driver.license_plate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Plate</span>
                    <span className="text-sm font-medium">{driver.license_plate}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Deliveries</span>
                  <span className="text-sm font-medium">{driver.total_deliveries || 0}</span>
                </div>
                {driver.current_order_id && (
                  <div className="bg-blue-50 rounded p-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-blue-900">On active delivery</span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => toggleDriverStatus(driver)}
                >
                  {driver.status === "available" ? "Set Offline" : "Set Available"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}