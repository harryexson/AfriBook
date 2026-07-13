import React, { useState, useEffect } from "react";
import { MenuItem } from "@/entities/MenuItem";
import { Restaurant } from "@/entities/Restaurant";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Tag, Wrench, Copy, CheckSquare } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "appetizers", label: "Appetizers" },
  { value: "entrees", label: "Entrées" },
  { value: "sides", label: "Sides" },
  { value: "desserts", label: "Desserts" },
  { value: "beverages", label: "Beverages" }
];

const commonTags = [
  "vegetarian", "vegan", "gluten-free", "dairy-free", 
  "spicy", "nut-free", "keto", "low-carb",
  "chef-special", "popular", "new"
];

export default function MenuManagement() {
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "entrees",
    price: "",
    image_url: "",
    available: true,
    preparation_time: "",
    tags: [],
    modifiers: []
  });
  const [newTag, setNewTag] = useState("");
  const [newModifier, setNewModifier] = useState({ name: "", price_adjustment: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const restaurants = await Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
        const items = await MenuItem.filter({ restaurant_id: restaurants[0].id });
        const sorted = items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setMenuItems(sorted);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        category: item.category,
        price: item.price,
        image_url: item.image_url || "",
        available: item.available !== false,
        preparation_time: item.preparation_time || "",
        tags: item.tags || [],
        modifiers: item.modifiers || []
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        category: "entrees",
        price: "",
        image_url: "",
        available: true,
        preparation_time: "",
        tags: [],
        modifiers: []
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : 0
      };

      if (editingItem) {
        await MenuItem.update(editingItem.id, data);
        toast.success("Menu item updated");
      } else {
        await MenuItem.create({
          ...data,
          restaurant_id: restaurant.id
        });
        toast.success("Menu item created");
      }
      
      await loadData();
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast.error("Failed to save menu item");
    }
    setIsSaving(false);
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await MenuItem.delete(itemId);
      await loadData();
      toast.success("Menu item deleted");
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast.error("Failed to delete menu item");
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await MenuItem.update(item.id, { available: !item.available });
      await loadData();
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(filteredItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order for all items
    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index
    }));

    try {
      for (const update of updates) {
        await MenuItem.update(update.id, { sort_order: update.sort_order });
      }
      await loadData();
      toast.success("Menu order updated");
    } catch (error) {
      console.error("Error reordering:", error);
      toast.error("Failed to reorder items");
    }
  };

  const addTag = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addModifier = () => {
    if (!newModifier.name) return;
    setFormData({
      ...formData,
      modifiers: [...formData.modifiers, { ...newModifier }]
    });
    setNewModifier({ name: "", price_adjustment: 0 });
  };

  const removeModifier = (index) => {
    setFormData({
      ...formData,
      modifiers: formData.modifiers.filter((_, i) => i !== index)
    });
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBulkEdit = async (updates) => {
    try {
      for (const itemId of selectedItems) {
        await MenuItem.update(itemId, updates);
      }
      await loadData();
      setSelectedItems([]);
      setBulkEditMode(false);
      setShowBulkDialog(false);
      toast.success(`Updated ${selectedItems.length} items`);
    } catch (error) {
      console.error("Error bulk updating:", error);
      toast.error("Failed to bulk update items");
    }
  };

  const handleDuplicateItem = async (item) => {
    try {
      await MenuItem.create({
        ...item,
        id: undefined,
        name: `${item.name} (Copy)`,
        restaurant_id: restaurant.id
      });
      await loadData();
      toast.success("Item duplicated");
    } catch (error) {
      console.error("Error duplicating:", error);
      toast.error("Failed to duplicate item");
    }
  };

  const filteredItems = selectedCategory === "all"
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">No restaurant found. Please set up your restaurant first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Menu Management</h1>
            <p className="text-slate-600">{restaurant.business_name}</p>
          </div>
          <div className="flex gap-2">
            {bulkEditMode && selectedItems.length > 0 && (
              <Button
                onClick={() => setShowBulkDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Bulk Edit ({selectedItems.length})
              </Button>
            )}
            <Button
              onClick={() => setBulkEditMode(!bulkEditMode)}
              variant={bulkEditMode ? "default" : "outline"}
            >
              {bulkEditMode ? "Exit Bulk Mode" : "Bulk Edit"}
            </Button>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Item Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Caesar Salad"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your menu item..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Prep Time (min)</Label>
                      <Input
                        type="number"
                        value={formData.preparation_time}
                        onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                        placeholder="15"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1"
                    />
                  </div>

                  {/* Tags Section */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {commonTags.map(tag => (
                        <Badge
                          key={tag}
                          variant={formData.tags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => formData.tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTag) {
                            addTag(newTag);
                            setNewTag("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newTag) {
                            addTag(newTag);
                            setNewTag("");
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Modifiers Section */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Wrench className="w-4 h-4" />
                      Modifiers
                    </Label>
                    <div className="space-y-2 mb-3">
                      {formData.modifiers.map((mod, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                          <span className="flex-1">{mod.name}</span>
                          <span className="text-sm text-slate-600">
                            {mod.price_adjustment > 0 ? `+$${mod.price_adjustment.toFixed(2)}` : mod.price_adjustment < 0 ? `-$${Math.abs(mod.price_adjustment).toFixed(2)}` : 'Free'}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => removeModifier(idx)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Modifier name (e.g., Extra Cheese)"
                        value={newModifier.name}
                        onChange={(e) => setNewModifier({ ...newModifier, name: e.target.value })}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        className="w-24"
                        value={newModifier.price_adjustment}
                        onChange={(e) => setNewModifier({ ...newModifier, price_adjustment: parseFloat(e.target.value) || 0 })}
                      />
                      <Button type="button" onClick={addModifier}>
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <Label>Available for ordering</Label>
                    <Switch
                      checked={formData.available}
                      onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      {isSaving ? "Saving..." : "Save Item"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              All Items ({menuItems.length})
            </TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                {cat.label} ({menuItems.filter(item => item.category === cat.value).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="menu-items">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {filteredItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`hover:shadow-lg transition-all ${!item.available ? 'opacity-60' : ''} ${snapshot.isDragging ? 'shadow-2xl' : ''} ${selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-5 h-5 text-slate-400" />
                            </div>
                            
                            {bulkEditMode && (
                              <Checkbox
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={() => toggleItemSelection(item.id)}
                              />
                            )}

                            {item.image_url && (
                              <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-1">
                                <h3 className="font-bold text-lg text-slate-900">{item.name}</h3>
                                <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                  {item.available ? "Available" : "Hidden"}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-slate-600 mb-2 line-clamp-1">{item.description}</p>
                              
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1 mb-2 flex-wrap">
                                  {item.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-3 text-sm">
                                <span className="font-bold text-emerald-600">${item.price?.toFixed(2)}</span>
                                {item.preparation_time && (
                                  <span className="text-slate-500">{item.preparation_time} min</span>
                                )}
                                {item.modifiers && item.modifiers.length > 0 && (
                                  <span className="text-slate-500">{item.modifiers.length} modifiers</span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleAvailability(item)}
                              >
                                {item.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDuplicateItem(item)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDialog(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-slate-500 text-lg">No menu items in this category</p>
          </div>
        )}

        {/* Bulk Edit Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Edit {selectedItems.length} Items</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                onClick={() => handleBulkEdit({ available: true })}
                className="w-full"
              >
                Make All Available
              </Button>
              <Button
                onClick={() => handleBulkEdit({ available: false })}
                className="w-full"
                variant="outline"
              >
                Hide All
              </Button>
              <Button
                onClick={async () => {
                  if (confirm(`Delete ${selectedItems.length} items?`)) {
                    for (const id of selectedItems) {
                      await MenuItem.delete(id);
                    }
                    await loadData();
                    setSelectedItems([]);
                    setShowBulkDialog(false);
                    toast.success("Items deleted");
                  }
                }}
                className="w-full"
                variant="destructive"
              >
                Delete All Selected
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}