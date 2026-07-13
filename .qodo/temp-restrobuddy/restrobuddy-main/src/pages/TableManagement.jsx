import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Edit, Trash2, Loader2, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TableManagement() {
  const [tables, setTables] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    table_number: "",
    capacity: "",
    location_section: "",
    shape: "square",
    position_x: 0,
    position_y: 0,
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const restaurants = await base44.entities.Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
        const restaurantTables = await base44.entities.Table.filter({ restaurant_id: restaurants[0].id });
        setTables(restaurantTables);
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
      const tableData = {
        restaurant_id: restaurant.id,
        table_number: formData.table_number,
        capacity: parseInt(formData.capacity),
        location_section: formData.location_section || "main",
        shape: formData.shape,
        position_x: formData.position_x,
        position_y: formData.position_y,
        notes: formData.notes,
        status: "available"
      };

      if (editingTable) {
        await base44.entities.Table.update(editingTable.id, tableData);
      } else {
        await base44.entities.Table.create(tableData);
      }

      await loadData();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save table:", error);
      alert("Failed to save table. Please try again.");
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      location_section: table.location_section || "",
      shape: table.shape,
      position_x: table.position_x || 0,
      position_y: table.position_y || 0,
      notes: table.notes || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (tableId) => {
    if (confirm("Are you sure you want to delete this table?")) {
      try {
        await base44.entities.Table.delete(tableId);
        await loadData();
      } catch (error) {
        console.error("Failed to delete table:", error);
      }
    }
  };

  const updateTableStatus = async (tableId, status) => {
    try {
      await base44.entities.Table.update(tableId, { status });
      await loadData();
    } catch (error) {
      console.error("Failed to update table status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      table_number: "",
      capacity: "",
      location_section: "",
      shape: "square",
      position_x: 0,
      position_y: 0,
      notes: ""
    });
    setEditingTable(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "occupied": return "bg-red-100 text-red-800";
      case "reserved": return "bg-amber-100 text-amber-800";
      case "needs_cleaning": return "bg-slate-100 text-slate-800";
      default: return "bg-slate-100 text-slate-800";
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Table Management</h1>
          <p className="text-slate-600">Manage tables for {restaurant?.business_name}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTable ? 'Edit' : 'Add'} Table</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Table Number *</Label>
                  <Input
                    value={formData.table_number}
                    onChange={(e) => setFormData({...formData, table_number: e.target.value})}
                    placeholder="e.g., 1, A1, Patio-3"
                    required
                  />
                </div>
                <div>
                  <Label>Capacity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Section/Location</Label>
                <Input
                  value={formData.location_section}
                  onChange={(e) => setFormData({...formData, location_section: e.target.value})}
                  placeholder="e.g., Main Dining, Patio, Bar"
                />
              </div>
              <div>
                <Label>Table Shape</Label>
                <Select value={formData.shape} onValueChange={(value) => setFormData({...formData, shape: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="rectangle">Rectangle</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                    <SelectItem value="booth">Booth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Optional notes"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {editingTable ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Total Tables</p>
            <p className="text-2xl font-bold">{tables.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Available</p>
            <p className="text-2xl font-bold text-green-600">
              {tables.filter(t => t.status === "available").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Occupied</p>
            <p className="text-2xl font-bold text-red-600">
              {tables.filter(t => t.status === "occupied").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Reserved</p>
            <p className="text-2xl font-bold text-amber-600">
              {tables.filter(t => t.status === "reserved").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {tables.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Tables Yet</h3>
            <p className="text-slate-600 mb-4">Add tables to enable reservations and table management</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Table {table.table_number}
                    </CardTitle>
                    <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                      <Users className="w-4 h-4" />
                      Seats {table.capacity}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(table)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(table.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={getStatusColor(table.status)}>
                  {table.status.replace('_', ' ')}
                </Badge>
                {table.location_section && (
                  <div>
                    <p className="text-sm text-slate-600">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {table.location_section}
                    </p>
                  </div>
                )}
                <Select
                  value={table.status}
                  onValueChange={(value) => updateTableStatus(table.id, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="needs_cleaning">Needs Cleaning</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}