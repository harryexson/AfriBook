import React, { useState, useEffect } from "react";
import { Promotion } from "@/entities/Promotion";
import { MenuItem } from "@/entities/MenuItem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Edit, Trash2, Tag, Clock, Percent, Gift, Zap,
  Calendar, TrendingUp, Copy, Pause, Play, Star, DollarSign, Layers, ShoppingBag, AlertCircle
} from "lucide-react";

const PROMO_TYPES = [
  { value: "percentage_off", label: "Percentage Off", icon: Percent, description: "e.g., 20% off entire order" },
  { value: "fixed_amount_off", label: "Fixed Amount Off", icon: DollarSign, description: "e.g., $10 off your order" },
  { value: "bogo", label: "Buy One Get One", icon: Gift, description: "e.g., Buy 1 burger, get 1 free" },
  { value: "free_item", label: "Free Item", icon: ShoppingBag, description: "Free item with purchase" },
  { value: "tiered_discount", label: "Tiered Discount", icon: Layers, description: "Spend more, save more" },
  { value: "flash_sale", label: "Flash Sale", icon: Zap, description: "Limited time deep discounts" },
  { value: "free_delivery", label: "Free Delivery", icon: Tag, description: "Waive delivery fees" }
];

const DAYS_OF_WEEK = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" }
];

const PROMO_CATEGORIES = [
  { value: "general", label: "General", icon: Tag },
  { value: "happy_hour", label: "Happy Hour", icon: Clock },
  { value: "daily_special", label: "Daily Special", icon: Calendar },
  { value: "flash_sale", label: "Flash Sale", icon: Zap },
  { value: "loyalty_exclusive", label: "Loyalty Exclusive", icon: Star }
];

export default function PartnerPromotionManager({ restaurant }) {
  const [promotions, setPromotions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    code: "",
    type: "percentage_off",
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: null,
    schedule_type: "always",
    start_date: "",
    end_date: "",
    active_days: [],
    active_hours: { start: "", end: "" },
    bogo_item_id: "",
    bogo_free_item_id: "",
    bogo_buy_quantity: 1,
    bogo_get_quantity: 1,
    free_item_id: "",
    tiered_discounts: [
      { min_spend: 50, discount_type: "percentage", discount_value: 10 },
      { min_spend: 100, discount_type: "percentage", discount_value: 20 }
    ],
    flash_sale_discount: 30,
    flash_sale_duration_minutes: 60,
    applicable_to: "all_items",
    applicable_categories: [],
    applicable_item_ids: [],
    auto_apply: false,
    featured: false,
    first_order_only: false,
    usage_limit: null,
    per_customer_limit: null,
    promotion_category: "general",
    status: "active"
  });

  useEffect(() => {
    loadData();
  }, [restaurant]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [promos, items] = await Promise.all([
        Promotion.filter({ restaurant_id: restaurant.id }),
        MenuItem.filter({ restaurant_id: restaurant.id })
      ]);
      setPromotions(promos);
      setMenuItems(items);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      code: "",
      type: "percentage_off",
      discount_value: 10,
      min_order_amount: 0,
      max_discount_amount: null,
      schedule_type: "always",
      start_date: "",
      end_date: "",
      active_days: [],
      active_hours: { start: "", end: "" },
      bogo_item_id: "",
      bogo_free_item_id: "",
      bogo_buy_quantity: 1,
      bogo_get_quantity: 1,
      free_item_id: "",
      tiered_discounts: [
        { min_spend: 50, discount_type: "percentage", discount_value: 10 },
        { min_spend: 100, discount_type: "percentage", discount_value: 20 }
      ],
      flash_sale_discount: 30,
      flash_sale_duration_minutes: 60,
      applicable_to: "all_items",
      applicable_categories: [],
      applicable_item_ids: [],
      auto_apply: false,
      featured: false,
      first_order_only: false,
      usage_limit: null,
      per_customer_limit: null,
      promotion_category: "general",
      status: "active"
    });
    setEditingPromo(null);
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setForm({
      title: promo.title || "",
      description: promo.description || "",
      code: promo.code || "",
      type: promo.type || "percentage_off",
      discount_value: promo.discount_value || 10,
      min_order_amount: promo.min_order_amount || 0,
      max_discount_amount: promo.max_discount_amount || null,
      schedule_type: promo.schedule_type || "always",
      start_date: promo.start_date ? promo.start_date.slice(0, 16) : "",
      end_date: promo.end_date ? promo.end_date.slice(0, 16) : "",
      active_days: promo.active_days || [],
      active_hours: promo.active_hours || { start: "", end: "" },
      bogo_item_id: promo.bogo_item_id || "",
      bogo_free_item_id: promo.bogo_free_item_id || "",
      bogo_buy_quantity: promo.bogo_buy_quantity || 1,
      bogo_get_quantity: promo.bogo_get_quantity || 1,
      free_item_id: promo.free_item_id || "",
      tiered_discounts: promo.tiered_discounts || [
        { min_spend: 50, discount_type: "percentage", discount_value: 10 },
        { min_spend: 100, discount_type: "percentage", discount_value: 20 }
      ],
      flash_sale_discount: promo.flash_sale_discount || 30,
      flash_sale_duration_minutes: promo.flash_sale_duration_minutes || 60,
      applicable_to: promo.applicable_to || "all_items",
      applicable_categories: promo.applicable_categories || [],
      applicable_item_ids: promo.applicable_item_ids || [],
      auto_apply: promo.auto_apply || false,
      featured: promo.featured || false,
      first_order_only: promo.first_order_only || false,
      usage_limit: promo.usage_limit || null,
      per_customer_limit: promo.per_customer_limit || null,
      promotion_category: promo.promotion_category || "general",
      status: promo.status || "active"
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      alert("Please enter a promotion title");
      return;
    }

    setIsSaving(true);
    try {
      const promoData = {
        ...form,
        restaurant_id: restaurant.id,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        max_discount_amount: form.max_discount_amount || null,
        usage_limit: form.usage_limit || null,
        per_customer_limit: form.per_customer_limit || null
      };

      if (editingPromo) {
        await Promotion.update(editingPromo.id, promoData);
      } else {
        await Promotion.create(promoData);
      }

      setShowDialog(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error saving promotion:", error);
      alert("Failed to save promotion");
    }
    setIsSaving(false);
  };

  const handleDelete = async (promo) => {
    if (!confirm(`Delete "${promo.title}"?`)) return;
    try {
      await Promotion.delete(promo.id);
      await loadData();
    } catch (error) {
      console.error("Error deleting promotion:", error);
    }
  };

  const handleToggleStatus = async (promo) => {
    const newStatus = promo.status === "active" ? "paused" : "active";
    try {
      await Promotion.update(promo.id, { status: newStatus });
      await loadData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDuplicate = async (promo) => {
    try {
      const { id, created_date, updated_date, usage_count, ...promoData } = promo;
      await Promotion.create({
        ...promoData,
        title: `${promo.title} (Copy)`,
        code: promo.code ? `${promo.code}_COPY` : "",
        usage_count: 0
      });
      await loadData();
    } catch (error) {
      console.error("Error duplicating promotion:", error);
    }
  };

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      active_days: prev.active_days.includes(day)
        ? prev.active_days.filter(d => d !== day)
        : [...prev.active_days, day]
    }));
  };

  const addTier = () => {
    const lastTier = form.tiered_discounts[form.tiered_discounts.length - 1];
    setForm(prev => ({
      ...prev,
      tiered_discounts: [
        ...prev.tiered_discounts,
        { min_spend: (lastTier?.min_spend || 50) + 50, discount_type: "percentage", discount_value: (lastTier?.discount_value || 10) + 5 }
      ]
    }));
  };

  const removeTier = (index) => {
    setForm(prev => ({
      ...prev,
      tiered_discounts: prev.tiered_discounts.filter((_, i) => i !== index)
    }));
  };

  const updateTier = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      tiered_discounts: prev.tiered_discounts.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      )
    }));
  };

  const filteredPromotions = activeCategory === "all"
    ? promotions
    : promotions.filter(p => p.promotion_category === activeCategory);

  const getPromoIcon = (type) => {
    const promoType = PROMO_TYPES.find(t => t.value === type);
    return promoType ? promoType.icon : Tag;
  };

  const getStatusBadge = (promo) => {
    const now = new Date();
    if (promo.status === "paused") return <Badge className="bg-amber-500">Paused</Badge>;
    if (promo.status === "inactive") return <Badge className="bg-slate-500">Inactive</Badge>;
    if (promo.end_date && new Date(promo.end_date) < now) return <Badge className="bg-red-500">Expired</Badge>;
    if (promo.start_date && new Date(promo.start_date) > now) return <Badge className="bg-blue-500">Scheduled</Badge>;
    return <Badge className="bg-green-500">Active</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Promotions & Offers</h2>
          <p className="text-slate-600">Create deals to attract more customers</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPromo ? "Edit Promotion" : "Create Promotion"}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="discount">Discount</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="rules">Rules</TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div>
                  <Label>Promotion Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    placeholder="e.g., Happy Hour Special"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Describe your promotion..."
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Promo Code (Optional)</Label>
                    <Input
                      value={form.code}
                      onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})}
                      placeholder="e.g., SAVE20"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      value={form.promotion_category}
                      onChange={(e) => setForm({...form, promotion_category: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      {PROMO_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Auto Apply</p>
                      <p className="text-xs text-slate-600">Apply without code</p>
                    </div>
                    <Switch
                      checked={form.auto_apply}
                      onCheckedChange={(checked) => setForm({...form, auto_apply: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Featured</p>
                      <p className="text-xs text-slate-600">Show on homepage</p>
                    </div>
                    <Switch
                      checked={form.featured}
                      onCheckedChange={(checked) => setForm({...form, featured: checked})}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Discount Tab */}
              <TabsContent value="discount" className="space-y-4 mt-4">
                <div>
                  <Label>Promotion Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {PROMO_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setForm({...form, type: type.value})}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            form.type === type.value
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${form.type === type.value ? "text-emerald-600" : "text-slate-600"}`} />
                            <span className="font-medium text-sm">{type.label}</span>
                          </div>
                          <p className="text-xs text-slate-500">{type.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Percentage Off / Fixed Amount */}
                {["percentage_off", "fixed_amount_off"].includes(form.type) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Discount {form.type === "percentage_off" ? "%" : "$"}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.discount_value}
                        onChange={(e) => setForm({...form, discount_value: parseFloat(e.target.value)})}
                        className="mt-1"
                      />
                    </div>
                    {form.type === "percentage_off" && (
                      <div>
                        <Label>Max Discount ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.max_discount_amount || ""}
                          onChange={(e) => setForm({...form, max_discount_amount: e.target.value ? parseFloat(e.target.value) : null})}
                          placeholder="No limit"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* BOGO */}
                {form.type === "bogo" && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold">Buy One Get One Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Buy Item</Label>
                        <select
                          value={form.bogo_item_id}
                          onChange={(e) => setForm({...form, bogo_item_id: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border rounded-lg"
                        >
                          <option value="">Any item</option>
                          {menuItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name} - ${item.price}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Get Free Item</Label>
                        <select
                          value={form.bogo_free_item_id}
                          onChange={(e) => setForm({...form, bogo_free_item_id: e.target.value})}
                          className="w-full mt-1 px-3 py-2 border rounded-lg"
                        >
                          <option value="">Same item</option>
                          {menuItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name} - ${item.price}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Buy Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={form.bogo_buy_quantity}
                          onChange={(e) => setForm({...form, bogo_buy_quantity: parseInt(e.target.value)})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Get Free Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={form.bogo_get_quantity}
                          onChange={(e) => setForm({...form, bogo_get_quantity: parseInt(e.target.value)})}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Free Item */}
                {form.type === "free_item" && (
                  <div>
                    <Label>Free Item</Label>
                    <select
                      value={form.free_item_id}
                      onChange={(e) => setForm({...form, free_item_id: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select item...</option>
                      {menuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} - ${item.price}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tiered Discount */}
                {form.type === "tiered_discount" && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Discount Tiers</h4>
                      <Button size="sm" variant="outline" onClick={addTier}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Tier
                      </Button>
                    </div>
                    {form.tiered_discounts.map((tier, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <span className="text-sm font-medium">Spend $</span>
                        <Input
                          type="number"
                          min="0"
                          value={tier.min_spend}
                          onChange={(e) => updateTier(index, "min_spend", parseFloat(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm">→ Get</span>
                        <Input
                          type="number"
                          min="0"
                          value={tier.discount_value}
                          onChange={(e) => updateTier(index, "discount_value", parseFloat(e.target.value))}
                          className="w-20"
                        />
                        <select
                          value={tier.discount_type}
                          onChange={(e) => updateTier(index, "discount_type", e.target.value)}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="percentage">% off</option>
                          <option value="fixed">$ off</option>
                        </select>
                        {form.tiered_discounts.length > 1 && (
                          <Button size="sm" variant="ghost" onClick={() => removeTier(index)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Flash Sale */}
                {form.type === "flash_sale" && (
                  <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-red-900">Flash Sale Settings</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Discount %</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={form.flash_sale_discount}
                          onChange={(e) => setForm({...form, flash_sale_discount: parseInt(e.target.value)})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          min="15"
                          value={form.flash_sale_duration_minutes}
                          onChange={(e) => setForm({...form, flash_sale_duration_minutes: parseInt(e.target.value)})}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Flash sales create urgency and drive immediate orders
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-4 mt-4">
                <div>
                  <Label>Schedule Type</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { value: "always", label: "Always Active", icon: Play },
                      { value: "scheduled", label: "Date Range", icon: Calendar },
                      { value: "recurring", label: "Recurring", icon: Clock }
                    ].map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setForm({...form, schedule_type: type.value})}
                          className={`p-3 border-2 rounded-lg text-center transition-all ${
                            form.schedule_type === type.value
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1 ${form.schedule_type === type.value ? "text-emerald-600" : "text-slate-600"}`} />
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.schedule_type === "scheduled" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={form.start_date}
                        onChange={(e) => setForm({...form, start_date: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>End Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={form.end_date}
                        onChange={(e) => setForm({...form, end_date: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {form.schedule_type === "recurring" && (
                  <>
                    <div>
                      <Label>Active Days</Label>
                      <div className="flex gap-2 mt-2">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day.value}
                            onClick={() => toggleDay(day.value)}
                            className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                              form.active_days.includes(day.value)
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time (e.g., Happy Hour)</Label>
                        <Input
                          type="time"
                          value={form.active_hours.start}
                          onChange={(e) => setForm({...form, active_hours: {...form.active_hours, start: e.target.value}})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={form.active_hours.end}
                          onChange={(e) => setForm({...form, active_hours: {...form.active_hours, end: e.target.value}})}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Rules Tab */}
              <TabsContent value="rules" className="space-y-4 mt-4">
                <div>
                  <Label>Minimum Order Amount ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({...form, min_order_amount: parseFloat(e.target.value)})}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Usage Limit</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.usage_limit || ""}
                      onChange={(e) => setForm({...form, usage_limit: e.target.value ? parseInt(e.target.value) : null})}
                      placeholder="Unlimited"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Per Customer Limit</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.per_customer_limit || ""}
                      onChange={(e) => setForm({...form, per_customer_limit: e.target.value ? parseInt(e.target.value) : null})}
                      placeholder="Unlimited"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">First Order Only</p>
                    <p className="text-sm text-slate-600">Only for new customers</p>
                  </div>
                  <Switch
                    checked={form.first_order_only}
                    onCheckedChange={(checked) => setForm({...form, first_order_only: checked})}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-emerald-600">
                {isSaving ? "Saving..." : (editingPromo ? "Update" : "Create")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <Tag className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{promotions.length}</p>
            <p className="text-xs text-slate-600">Total Promos</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <Play className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{promotions.filter(p => p.status === "active").length}</p>
            <p className="text-xs text-slate-600">Active</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{promotions.reduce((sum, p) => sum + (p.usage_count || 0), 0)}</p>
            <p className="text-xs text-slate-600">Total Uses</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{promotions.filter(p => p.featured).length}</p>
            <p className="text-xs text-slate-600">Featured</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-white border">
          <TabsTrigger value="all">All</TabsTrigger>
          {PROMO_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <TabsTrigger key={cat.value} value={cat.value}>
                <Icon className="w-4 h-4 mr-1" />
                {cat.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Promotions List */}
      {filteredPromotions.length === 0 ? (
        <Card className="border-0 shadow-xl text-center p-12">
          <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Promotions Yet</h3>
          <p className="text-slate-600 mb-6">Create your first promotion to attract more customers</p>
          <Button onClick={() => setShowDialog(true)} className="bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            Create First Promotion
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromotions.map(promo => {
            const PromoIcon = getPromoIcon(promo.type);
            return (
              <Card key={promo.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        promo.type === "flash_sale" ? "bg-red-100" :
                        promo.type === "bogo" ? "bg-purple-100" :
                        promo.type === "tiered_discount" ? "bg-blue-100" :
                        "bg-emerald-100"
                      }`}>
                        <PromoIcon className={`w-5 h-5 ${
                          promo.type === "flash_sale" ? "text-red-600" :
                          promo.type === "bogo" ? "text-purple-600" :
                          promo.type === "tiered_discount" ? "text-blue-600" :
                          "text-emerald-600"
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{promo.title}</h3>
                        {promo.code && (
                          <Badge variant="outline" className="text-xs mt-1">{promo.code}</Badge>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(promo)}
                  </div>

                  {promo.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{promo.description}</p>
                  )}

                  <div className="text-sm space-y-1 mb-3">
                    {promo.type === "percentage_off" && (
                      <p className="text-emerald-600 font-semibold">{promo.discount_value}% off</p>
                    )}
                    {promo.type === "fixed_amount_off" && (
                      <p className="text-emerald-600 font-semibold">${promo.discount_value} off</p>
                    )}
                    {promo.type === "bogo" && (
                      <p className="text-purple-600 font-semibold">Buy {promo.bogo_buy_quantity} Get {promo.bogo_get_quantity} Free</p>
                    )}
                    {promo.type === "tiered_discount" && (
                      <p className="text-blue-600 font-semibold">
                        Up to {Math.max(...(promo.tiered_discounts || []).map(t => t.discount_value))}% off
                      </p>
                    )}
                    {promo.type === "flash_sale" && (
                      <p className="text-red-600 font-semibold flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {promo.flash_sale_discount}% off for {promo.flash_sale_duration_minutes} mins
                      </p>
                    )}
                    {promo.min_order_amount > 0 && (
                      <p className="text-slate-500 text-xs">Min order: ${promo.min_order_amount}</p>
                    )}
                    {promo.usage_count > 0 && (
                      <p className="text-slate-500 text-xs">{promo.usage_count} uses</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(promo)}
                    >
                      {promo.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleDuplicate(promo)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(promo)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(promo)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}