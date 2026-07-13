import React, { useState } from "react";
import { MenuItem } from "@/entities/MenuItem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Edit, Trash2, Search, UtensilsCrossed,
  Clock
} from "lucide-react";

const categories = ["appetizers", "entrees", "sides", "desserts", "beverages"];

export default function PartnerMenuManager({ restaurant, menuItems, onRefresh }) {
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isSaving, setIsSaving] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    category: "entrees",
    price: "",
    image_url: "",
    preparation_time: 15,
    available: true,
    keyword: ""
  });

  const resetForm = () => {
    setItemForm({
      name: "",
      description: "",
      category: "entrees",
      price: "",
      image_url: "",
      preparation_time: 15,
      available: true,
      keyword: ""
    });
    setEditingItem(null);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || "",
      category: item.category,
      price: item.price.toString(),
      image_url: item.image_url || "",
      preparation_time: item.preparation_time || 15,
      available: item.available !== false,
      keyword: item.keyword || ""
    });
    setShowItemDialog(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.price) {
      alert("Please fill in required fields");
      return;
    }

    setIsSaving(true);
    try {
      const itemData = {
        ...itemForm,
        price: parseFloat(itemForm.price),
        preparation_time: parseInt(itemForm.preparation_time),
        restaurant_id: restaurant.id
      };

      if (editingItem) {
        await MenuItem.update(editingItem.id, itemData);
      } else {
        await MenuItem.create(itemData);
      }

      setShowItemDialog(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save menu item");
    }
    setIsSaving(false);
  };

  const handleDeleteItem = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    
    try {
      await MenuItem.delete(item.id);
      onRefresh();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await MenuItem.update(item.id, { available: !item.available });
      onRefresh();
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = filteredItems.filter(item => item.category === cat);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Menu Management</h2>
          <p className="text-slate-600">{menuItems.length} items in your menu</p>
        </div>
        <Dialog open={showItemDialog} onOpenChange={(open) => { setShowItemDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Item Name *</Label>
                <Input
                  value={itemForm.name}
                  onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                  placeholder="e.g., Classic Cheeseburger"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                  placeholder="Describe your dish..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({...itemForm, category: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Price ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
                    placeholder="12.99"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Image URL</Label>
                <Input
                  value={itemForm.image_url}
                  onChange={(e) => setItemForm({...itemForm, image_url: e.target.value})}
                  placeholder="https://..."
                  className="mt-1"
                />
                {itemForm.image_url && (
                  <div className="mt-2 h-32 rounded-lg overflow-hidden bg-slate-100">
                    <img src={itemForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prep Time (mins)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={itemForm.preparation_time}
                    onChange={(e) => setItemForm({...itemForm, preparation_time: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>SMS Keyword</Label>
                  <Input
                    value={itemForm.keyword}
                    onChange={(e) => setItemForm({...itemForm, keyword: e.target.value.toUpperCase()})}
                    placeholder="BURGER"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Available</p>
                  <p className="text-sm text-slate-600">Show this item on your menu</p>
                </div>
                <Switch
                  checked={itemForm.available}
                  onCheckedChange={(checked) => setItemForm({...itemForm, available: checked})}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => { setShowItemDialog(false); resetForm(); }} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveItem} disabled={isSaving} className="flex-1 bg-emerald-600">
                  {isSaving ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu items..."
            className="pl-10"
          />
        </div>
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList className="bg-white border">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="capitalize">{cat}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Items */}
      {filteredItems.length === 0 ? (
        <Card className="border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <UtensilsCrossed className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No menu items found</h3>
            <p className="text-slate-600 mb-6">
              {menuItems.length === 0 ? "Start adding items to your menu" : "Try adjusting your search"}
            </p>
            {menuItems.length === 0 && (
              <Button onClick={() => setShowItemDialog(true)} className="bg-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className={`border-2 ${!item.available ? 'opacity-60 border-slate-300' : 'border-slate-200'}`}>
              <CardContent className="p-0">
                {item.image_url ? (
                  <div className="h-40 overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-40 bg-slate-100 flex items-center justify-center">
                    <UtensilsCrossed className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      <Badge variant="outline" className="text-xs capitalize mt-1">{item.category}</Badge>
                    </div>
                    <p className="text-xl font-bold text-emerald-600">${item.price.toFixed(2)}</p>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">{item.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.preparation_time || 15} mins
                    </span>
                    {item.keyword && (
                      <Badge variant="outline" className="text-xs">SMS: {item.keyword}</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.available !== false}
                        onCheckedChange={() => handleToggleAvailability(item)}
                      />
                      <span className="text-sm text-slate-600">
                        {item.available !== false ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}