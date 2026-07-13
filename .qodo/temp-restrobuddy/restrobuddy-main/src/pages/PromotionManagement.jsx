import React, { useState, useEffect } from "react";
import { Promotion } from "@/entities/Promotion";
import { MenuItem } from "@/entities/MenuItem";
import { Restaurant } from "@/entities/Restaurant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Clock,
  TrendingUp,
  Gift,
  Percent,
  DollarSign,
  Package
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const promotionTypes = [
  { value: "percentage_off", label: "Percentage Off", icon: Percent, example: "20% off order" },
  { value: "fixed_amount_off", label: "Fixed Amount Off", icon: DollarSign, example: "$5 off order" },
  { value: "free_delivery", label: "Free Delivery", icon: Package, example: "Free delivery" },
  { value: "bogo", label: "Buy One Get One", icon: Gift, example: "BOGO deals" },
  { value: "free_item", label: "Free Item", icon: Gift, example: "Free dessert" }
];

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [newPromotion, setNewPromotion] = useState({
    code: "",
    title: "",
    description: "",
    type: "percentage_off",
    discount_value: 0,
    min_order_amount: 0,
    usage_limit: null,
    per_customer_limit: 1,
    start_date: "",
    end_date: "",
    active_days: [],
    active_hours: { start: "", end: "" },
    applicable_to: "all_items",
    applicable_categories: [],
    applicable_item_ids: [],
    exclude_item_ids: [],
    first_order_only: false,
    auto_apply: false,
    status: "active",
    featured: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Get restaurant
      const restaurants = await Restaurant.filter({ owner_email: user.email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
        
        // Load promotions for this restaurant
        const promos = await Promotion.filter({ restaurant_id: restaurants[0].id });
        setPromotions(promos);
        
        // Load menu items
        const items = await MenuItem.filter({ restaurant_id: restaurants[0].id });
        setMenuItems(items);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleCreatePromotion = async () => {
    try {
      const promoData = {
        ...newPromotion,
        restaurant_id: restaurant.id,
        code: newPromotion.code.toUpperCase(),
        usage_count: 0
      };
      
      await Promotion.create(promoData);
      await loadData();
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error creating promotion:", error);
      alert("Failed to create promotion");
    }
  };

  const handleUpdatePromotion = async () => {
    try {
      await Promotion.update(editingPromotion.id, newPromotion);
      await loadData();
      setEditingPromotion(null);
      resetForm();
    } catch (error) {
      console.error("Error updating promotion:", error);
      alert("Failed to update promotion");
    }
  };

  const handleDeletePromotion = async (promoId) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;
    
    try {
      await Promotion.delete(promoId);
      await loadData();
    } catch (error) {
      console.error("Error deleting promotion:", error);
      alert("Failed to delete promotion");
    }
  };

  const handleToggleStatus = async (promo) => {
    try {
      const newStatus = promo.status === "active" ? "paused" : "active";
      await Promotion.update(promo.id, { status: newStatus });
      await loadData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDuplicatePromotion = (promo) => {
    setNewPromotion({
      ...promo,
      code: promo.code + "_COPY",
      title: promo.title + " (Copy)",
      usage_count: 0
    });
    setShowCreateDialog(true);
  };

  const handleEditPromotion = (promo) => {
    setEditingPromotion(promo);
    setNewPromotion({ ...promo });
  };

  const resetForm = () => {
    setNewPromotion({
      code: "",
      title: "",
      description: "",
      type: "percentage_off",
      discount_value: 0,
      min_order_amount: 0,
      usage_limit: null,
      per_customer_limit: 1,
      start_date: "",
      end_date: "",
      active_days: [],
      active_hours: { start: "", end: "" },
      applicable_to: "all_items",
      applicable_categories: [],
      applicable_item_ids: [],
      exclude_item_ids: [],
      first_order_only: false,
      auto_apply: false,
      status: "active",
      featured: false
    });
  };

  const getPromotionStats = () => {
    const active = promotions.filter(p => p.status === "active").length;
    const totalUsage = promotions.reduce((sum, p) => sum + (p.usage_count || 0), 0);
    const featured = promotions.filter(p => p.featured).length;
    return { active, totalUsage, featured };
  };

  const stats = getPromotionStats();

  const PromoForm = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Basic Information</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Promotion Code *</Label>
            <Input
              value={newPromotion.code}
              onChange={(e) => setNewPromotion({...newPromotion, code: e.target.value.toUpperCase()})}
              placeholder="SAVE20"
              className="font-mono"
            />
          </div>
          
          <div>
            <Label>Title *</Label>
            <Input
              value={newPromotion.title}
              onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
              placeholder="20% Off Your Order"
            />
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={newPromotion.description}
            onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
            placeholder="Get 20% off your entire order"
            rows={2}
          />
        </div>
      </div>

      {/* Discount Type */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Discount Details</h3>
        
        <div>
          <Label>Promotion Type *</Label>
          <Select
            value={newPromotion.type}
            onValueChange={(value) => setNewPromotion({...newPromotion, type: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {promotionTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 mt-1">
            {promotionTypes.find(t => t.value === newPromotion.type)?.example}
          </p>
        </div>

        {(newPromotion.type === "percentage_off" || newPromotion.type === "fixed_amount_off") && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Discount Value *</Label>
              <Input
                type="number"
                step={newPromotion.type === "percentage_off" ? "1" : "0.01"}
                value={newPromotion.discount_value}
                onChange={(e) => setNewPromotion({...newPromotion, discount_value: parseFloat(e.target.value)})}
                placeholder={newPromotion.type === "percentage_off" ? "20" : "5.00"}
              />
            </div>
            
            {newPromotion.type === "percentage_off" && (
              <div>
                <Label>Max Discount Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPromotion.max_discount_amount || ""}
                  onChange={(e) => setNewPromotion({...newPromotion, max_discount_amount: parseFloat(e.target.value) || null})}
                  placeholder="Optional"
                />
              </div>
            )}
          </div>
        )}

        {newPromotion.type === "bogo" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Buy This Item</Label>
              <Select
                value={newPromotion.bogo_item_id}
                onValueChange={(value) => setNewPromotion({...newPromotion, bogo_item_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Get This Free (optional)</Label>
              <Select
                value={newPromotion.bogo_free_item_id}
                onValueChange={(value) => setNewPromotion({...newPromotion, bogo_free_item_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Same item" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {newPromotion.type === "free_item" && (
          <div>
            <Label>Free Item</Label>
            <Select
              value={newPromotion.free_item_id}
              onValueChange={(value) => setNewPromotion({...newPromotion, free_item_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Requirements */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Requirements</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Minimum Order Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={newPromotion.min_order_amount}
              onChange={(e) => setNewPromotion({...newPromotion, min_order_amount: parseFloat(e.target.value)})}
            />
          </div>
          
          <div>
            <Label>Usage Limit (Total)</Label>
            <Input
              type="number"
              value={newPromotion.usage_limit || ""}
              onChange={(e) => setNewPromotion({...newPromotion, usage_limit: parseInt(e.target.value) || null})}
              placeholder="Unlimited"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={newPromotion.first_order_only}
            onCheckedChange={(checked) => setNewPromotion({...newPromotion, first_order_only: checked})}
            id="first-order"
          />
          <label htmlFor="first-order" className="text-sm font-medium">
            First order only
          </label>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Schedule</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Start Date & Time</Label>
            <Input
              type="datetime-local"
              value={newPromotion.start_date}
              onChange={(e) => setNewPromotion({...newPromotion, start_date: e.target.value})}
            />
          </div>
          
          <div>
            <Label>End Date & Time</Label>
            <Input
              type="datetime-local"
              value={newPromotion.end_date}
              onChange={(e) => setNewPromotion({...newPromotion, end_date: e.target.value})}
            />
          </div>
        </div>

        <div>
          <Label>Active Days</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {daysOfWeek.map(day => (
              <Button
                key={day}
                variant={newPromotion.active_days?.includes(day) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const days = newPromotion.active_days || [];
                  setNewPromotion({
                    ...newPromotion,
                    active_days: days.includes(day)
                      ? days.filter(d => d !== day)
                      : [...days, day]
                  });
                }}
                className="capitalize"
              >
                {day.slice(0, 3)}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Start Time (optional)</Label>
            <Input
              type="time"
              value={newPromotion.active_hours?.start || ""}
              onChange={(e) => setNewPromotion({
                ...newPromotion,
                active_hours: { ...newPromotion.active_hours, start: e.target.value }
              })}
            />
          </div>
          
          <div>
            <Label>End Time (optional)</Label>
            <Input
              type="time"
              value={newPromotion.active_hours?.end || ""}
              onChange={(e) => setNewPromotion({
                ...newPromotion,
                active_hours: { ...newPromotion.active_hours, end: e.target.value }
              })}
            />
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Display Options</h3>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium">Auto-apply</p>
            <p className="text-sm text-slate-600">Apply automatically without code</p>
          </div>
          <Switch
            checked={newPromotion.auto_apply}
            onCheckedChange={(checked) => setNewPromotion({...newPromotion, auto_apply: checked})}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <p className="font-medium">Featured</p>
            <p className="text-sm text-slate-600">Show prominently on restaurant page</p>
          </div>
          <Switch
            checked={newPromotion.featured}
            onCheckedChange={(checked) => setNewPromotion({...newPromotion, featured: checked})}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => {
            setShowCreateDialog(false);
            setEditingPromotion(null);
            resetForm();
          }}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={editingPromotion ? handleUpdatePromotion : handleCreatePromotion}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          {editingPromotion ? "Update" : "Create"} Promotion
        </Button>
      </div>
    </div>
  );

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
        <Card className="max-w-md w-full text-center p-12">
          <p className="text-2xl font-bold text-slate-900 mb-4">No Restaurant Found</p>
          <p className="text-slate-600">Please set up your restaurant first</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Promotions</h1>
            <p className="text-slate-600">Create and manage discounts for {restaurant.business_name}</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-5 h-5 mr-2" />
                Create Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
                </DialogTitle>
              </DialogHeader>
              <PromoForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Tag className="w-8 h-8" />
                <Badge className="bg-white/20 text-white">{promotions.length}</Badge>
              </div>
              <div className="text-2xl font-bold mb-1">Total Promotions</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8" />
                <Badge className="bg-white/20 text-white">{stats.active}</Badge>
              </div>
              <div className="text-2xl font-bold mb-1">Active Now</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Gift className="w-8 h-8" />
                <Badge className="bg-white/20 text-white">{stats.totalUsage}</Badge>
              </div>
              <div className="text-2xl font-bold mb-1">Total Uses</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Tag className="w-8 h-8" />
                <Badge className="bg-white/20 text-white">{stats.featured}</Badge>
              </div>
              <div className="text-2xl font-bold mb-1">Featured</div>
            </CardContent>
          </Card>
        </div>

        {/* Promotions Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>All Promotions</CardTitle>
          </CardHeader>
          <CardContent>
            {promotions.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg mb-2">No promotions yet</p>
                <p className="text-slate-400 mb-6">Create your first promotion to start offering discounts</p>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Promotion
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map(promo => {
                    const typeInfo = promotionTypes.find(t => t.value === promo.type);
                    return (
                      <TableRow key={promo.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                              {promo.code}
                            </code>
                            {promo.featured && (
                              <Badge className="bg-amber-500">★</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{promo.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {typeInfo && <typeInfo.icon className="w-4 h-4" />}
                            <span className="text-sm">{typeInfo?.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {promo.type === "percentage_off" && `${promo.discount_value}%`}
                          {promo.type === "fixed_amount_off" && `$${promo.discount_value}`}
                          {promo.type === "free_delivery" && "Free"}
                          {promo.type === "bogo" && "BOGO"}
                          {promo.type === "free_item" && "Free"}
                        </TableCell>
                        <TableCell>
                          {promo.end_date ? format(new Date(promo.end_date), 'MMM d, yyyy') : "No expiry"}
                        </TableCell>
                        <TableCell>
                          {promo.usage_count || 0}
                          {promo.usage_limit && ` / ${promo.usage_limit}`}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            promo.status === "active" ? "bg-green-100 text-green-800" :
                            promo.status === "paused" ? "bg-amber-100 text-amber-800" :
                            "bg-slate-100 text-slate-800"
                          }>
                            {promo.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleToggleStatus(promo)}
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditPromotion(promo)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDuplicatePromotion(promo)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeletePromotion(promo.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPromotion} onOpenChange={(open) => {
        if (!open) {
          setEditingPromotion(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promotion</DialogTitle>
          </DialogHeader>
          <PromoForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}