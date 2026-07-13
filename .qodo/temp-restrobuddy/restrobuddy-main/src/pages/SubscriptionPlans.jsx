import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Users, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SubscriptionPlan } from "@/entities/SubscriptionPlan";
import { Restaurant } from "@/entities/Restaurant";
import { MenuItem } from "@/entities/MenuItem";
import { toast } from "sonner";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";

export default function SubscriptionPlans() {
  const [restaurant, setRestaurant] = useState(null);
  const [plans, setPlans] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billing_cycle: "weekly",
    delivery_frequency: "weekly",
    delivery_days: [],
    included_items: [],
    customizable: false,
    delivery_type: "delivery",
    max_subscribers: "",
    active: true,
    image_url: ""
  });

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
        const [planList, items] = await Promise.all([
          SubscriptionPlan.filter({ restaurant_id: restaurants[0].id }),
          MenuItem.filter({ restaurant_id: restaurants[0].id })
        ]);
        setPlans(planList);
        setMenuItems(items);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || "",
        price: plan.price,
        billing_cycle: plan.billing_cycle,
        delivery_frequency: plan.delivery_frequency,
        delivery_days: plan.delivery_days || [],
        included_items: plan.included_items || [],
        customizable: plan.customizable || false,
        delivery_type: plan.delivery_type || "delivery",
        max_subscribers: plan.max_subscribers || "",
        active: plan.active !== false,
        image_url: plan.image_url || ""
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        billing_cycle: "weekly",
        delivery_frequency: "weekly",
        delivery_days: [],
        included_items: [],
        customizable: false,
        delivery_type: "delivery",
        max_subscribers: "",
        active: true,
        image_url: ""
      });
    }
    setDialogOpen(true);
  };

  const toggleDeliveryDay = (day) => {
    setFormData(prev => ({
      ...prev,
      delivery_days: prev.delivery_days.includes(day)
        ? prev.delivery_days.filter(d => d !== day)
        : [...prev.delivery_days, day]
    }));
  };

  const toggleMenuItem = (item) => {
    setFormData(prev => {
      const exists = prev.included_items.find(i => i.menu_item_id === item.id);
      if (exists) {
        return {
          ...prev,
          included_items: prev.included_items.filter(i => i.menu_item_id !== item.id)
        };
      } else {
        return {
          ...prev,
          included_items: [...prev.included_items, {
            menu_item_id: item.id,
            name: item.name,
            quantity: 1
          }]
        };
      }
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const planData = {
        ...formData,
        restaurant_id: restaurant.id,
        price: parseFloat(formData.price),
        max_subscribers: formData.max_subscribers ? parseInt(formData.max_subscribers) : undefined
      };

      if (editingPlan) {
        await SubscriptionPlan.update(editingPlan.id, planData);
        toast.success("Plan updated");
      } else {
        await SubscriptionPlan.create(planData);
        toast.success("Plan created");
      }

      await loadData();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan");
    }
  };

  const handleDelete = async (planId) => {
    if (!confirm("Are you sure? Active subscribers will be affected.")) return;
    
    try {
      await SubscriptionPlan.delete(planId);
      await loadData();
      toast.success("Plan deleted");
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SubscriptionGate feature="subscription_plans">
      <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-slate-600">Create and manage recurring meal plans</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit" : "Create"} Subscription Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Plan Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Weekly Meal Plan"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what's included..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="29.99"
                  />
                </div>
                <div>
                  <Label>Billing Cycle</Label>
                  <Select value={formData.billing_cycle} onValueChange={(v) => setFormData({ ...formData, billing_cycle: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delivery Frequency</Label>
                  <Select value={formData.delivery_frequency} onValueChange={(v) => setFormData({ ...formData, delivery_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delivery Type</Label>
                  <Select value={formData.delivery_type} onValueChange={(v) => setFormData({ ...formData, delivery_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.delivery_frequency === "weekly" && (
                <div>
                  <Label>Delivery Days</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {weekDays.map(day => (
                      <Badge
                        key={day}
                        variant={formData.delivery_days.includes(day) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => toggleDeliveryDay(day)}
                      >
                        {day.slice(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Included Items</Label>
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                  {menuItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                      <Checkbox
                        checked={formData.included_items.some(i => i.menu_item_id === item.id)}
                        onCheckedChange={() => toggleMenuItem(item)}
                      />
                      <span className="flex-1">{item.name}</span>
                      <span className="text-sm text-slate-600">${item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <Label>Allow Customization</Label>
                <Switch
                  checked={formData.customizable}
                  onCheckedChange={(checked) => setFormData({ ...formData, customizable: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <Label>Active</Label>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {editingPlan ? "Update" : "Create"} Plan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className={!plan.active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">
                    ${plan.price}<span className="text-sm text-slate-600">/{plan.billing_cycle}</span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(plan)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{plan.description}</p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span className="capitalize">{plan.delivery_frequency} delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span>{plan.active_subscribers || 0} subscribers</span>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Includes:</p>
                <div className="text-xs text-slate-600">
                  {plan.included_items?.length || 0} items
                </div>
              </div>
              <Badge className={plan.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                {plan.active ? "Active" : "Inactive"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Subscription Plans</h3>
            <p className="text-slate-600 mb-4">Create your first recurring meal plan</p>
            <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    </SubscriptionGate>
  );
}