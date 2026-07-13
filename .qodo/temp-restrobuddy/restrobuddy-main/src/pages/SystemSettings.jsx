import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Percent,
  Mail,
  CreditCard,
  Clock,
  ToggleLeft,
  Save,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Building
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SystemSettings as SystemSettingsEntity } from "@/entities/SystemSettings";

const defaultSettings = {
  settings_key: "global",
  subscription_plans: [
    {
      id: "starter",
      name: "Starter",
      monthly_price: 99,
      annual_price: 950,
      trial_days: 14,
      max_locations: 1,
      max_orders_per_month: 500,
      features: ["Online ordering", "Basic menu management", "Email support"],
      is_active: true
    },
    {
      id: "professional",
      name: "Professional",
      monthly_price: 299,
      annual_price: 2868,
      trial_days: 14,
      max_locations: 3,
      max_orders_per_month: -1,
      features: ["Unlimited orders", "Kiosk mode", "SMS ordering", "Kitchen display", "Priority support"],
      is_active: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthly_price: 599,
      annual_price: 5748,
      trial_days: 14,
      max_locations: -1,
      max_orders_per_month: -1,
      features: ["Unlimited everything", "Advanced analytics", "White-label", "API access", "Dedicated manager"],
      is_active: true
    }
  ],
  marketplace_settings: {
    default_commission_rate: 0.125,
    starter_commission_rate: 0.15,
    professional_commission_rate: 0.125,
    enterprise_commission_rate: 0.10,
    min_order_amount: 10,
    platform_fee: 0
  },
  trial_settings: {
    default_trial_days: 14,
    extended_trial_days: 30,
    trial_features: ["All Professional features", "Full access during trial"],
    require_payment_method: false
  },
  payment_settings: {
    payment_processor: "square",
    currency: "USD",
    tax_rate: 0.08,
    payout_schedule: "weekly",
    minimum_payout: 25
  },
  email_templates: [
    {
      template_id: "welcome",
      name: "Welcome Email",
      subject: "Welcome to RESTROBUDDY!",
      body: "Hi {{customer_name}},\n\nWelcome to RESTROBUDDY! We're excited to have you on board.\n\nYour {{trial_days}}-day free trial has started. Explore all our features and see how we can help your restaurant thrive.\n\nBest regards,\nThe RESTROBUDDY Team",
      is_active: true
    },
    {
      template_id: "trial_ending",
      name: "Trial Ending Soon",
      subject: "Your RESTROBUDDY trial ends in {{days_remaining}} days",
      body: "Hi {{customer_name}},\n\nYour free trial is ending soon! Subscribe now to keep all your data and continue using RESTROBUDDY.\n\nChoose your plan at: {{subscription_url}}\n\nBest regards,\nThe RESTROBUDDY Team",
      is_active: true
    },
    {
      template_id: "trial_expired",
      name: "Trial Expired",
      subject: "Your RESTROBUDDY trial has ended",
      body: "Hi {{customer_name}},\n\nYour free trial has ended. Subscribe now to continue using RESTROBUDDY and keep all your restaurant data.\n\nChoose your plan at: {{subscription_url}}\n\nBest regards,\nThe RESTROBUDDY Team",
      is_active: true
    },
    {
      template_id: "payment_success",
      name: "Payment Successful",
      subject: "Payment confirmed - RESTROBUDDY",
      body: "Hi {{customer_name}},\n\nYour payment of ${{amount}} for the {{plan_name}} plan has been processed successfully.\n\nThank you for choosing RESTROBUDDY!\n\nBest regards,\nThe RESTROBUDDY Team",
      is_active: true
    },
    {
      template_id: "payment_failed",
      name: "Payment Failed",
      subject: "Payment failed - Action required",
      body: "Hi {{customer_name}},\n\nWe were unable to process your payment. Please update your payment method to continue using RESTROBUDDY.\n\nUpdate payment: {{payment_url}}\n\nBest regards,\nThe RESTROBUDDY Team",
      is_active: true
    }
  ],
  feature_toggles: {
    sms_ordering_enabled: true,
    kiosk_mode_enabled: true,
    marketplace_enabled: true,
    loyalty_program_enabled: true,
    delivery_integration_enabled: true,
    group_ordering_enabled: true,
    reservations_enabled: true,
    inventory_management_enabled: true,
    advanced_analytics_enabled: true,
    api_access_enabled: true
  },
  branding_settings: {
    platform_name: "RESTROBUDDY",
    support_email: "support@restrobuddy.app",
    sales_email: "sales@restrobuddy.app",
    support_phone: "1-800-RESTRO"
  }
};

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("pricing");
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuthAndLoadSettings();
  }, []);

  const checkAuthAndLoadSettings = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Only allow harryxson@hotmail.com or harryexson@hotmail.com (developers)
      if (user.email === "harryxson@hotmail.com" || user.email === "harryexson@hotmail.com") {
        setIsAuthorized(true);
        await loadSettings();
      } else {
        setIsAuthorized(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Auth error:", error);
      setIsAuthorized(false);
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // Use service role to access system settings
      const allSettings = await base44.asServiceRole.entities.SystemSettings.filter({ settings_key: "global" });
      if (allSettings.length > 0) {
        setSettings(allSettings[0]);
      } else {
        // Create default settings on first access
        const newSettings = await base44.asServiceRole.entities.SystemSettings.create(defaultSettings);
        setSettings(newSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Initialize with defaults if there's an error
      setSettings(defaultSettings);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Use service role for admin operations
      if (settings.id) {
        await base44.asServiceRole.entities.SystemSettings.update(settings.id, settings);
      } else {
        const newSettings = await base44.asServiceRole.entities.SystemSettings.create(settings);
        setSettings(newSettings);
      }
      setHasChanges(false);
      alert("✅ Settings saved successfully! Changes will take effect immediately across the platform.");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("❌ Failed to save settings: " + (error.message || "Unknown error"));
    }
    setIsSaving(false);
  };

  const updateSettings = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let obj = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasChanges(true);
  };

  const updatePlan = (planId, field, value) => {
    setSettings(prev => ({
      ...prev,
      subscription_plans: prev.subscription_plans.map(p =>
        p.id === planId ? { ...p, [field]: value } : p
      )
    }));
    setHasChanges(true);
  };

  const addPlanFeature = (planId, feature) => {
    if (!feature.trim()) return;
    setSettings(prev => ({
      ...prev,
      subscription_plans: prev.subscription_plans.map(p =>
        p.id === planId ? { ...p, features: [...p.features, feature] } : p
      )
    }));
    setHasChanges(true);
  };

  const removePlanFeature = (planId, featureIndex) => {
    setSettings(prev => ({
      ...prev,
      subscription_plans: prev.subscription_plans.map(p =>
        p.id === planId ? { ...p, features: p.features.filter((_, i) => i !== featureIndex) } : p
      )
    }));
    setHasChanges(true);
  };

  const updateEmailTemplate = (templateId, field, value) => {
    setSettings(prev => ({
      ...prev,
      email_templates: prev.email_templates.map(t =>
        t.template_id === templateId ? { ...t, [field]: value } : t
      )
    }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-4">
              You do not have permission to access System Settings. This area is restricted to platform developers only.
            </p>
            <p className="text-sm text-slate-500">
              Current user: {currentUser?.email || "Not logged in"}
            </p>
          </CardContent>
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
            <h1 className="text-4xl font-bold text-slate-900 mb-2">System Settings</h1>
            <p className="text-slate-600">Configure pricing, commissions, and platform-wide settings</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-purple-100 text-purple-800">Developer Access</Badge>
              <span className="text-sm text-slate-500">Logged in as: {currentUser?.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge className="bg-amber-100 text-amber-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
            <Button onClick={handleSave} disabled={isSaving || !hasChanges} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Subscription Plans
            </TabsTrigger>
            <TabsTrigger value="commission" className="flex items-center gap-2">
              <Percent className="w-4 h-4" /> Commissions
            </TabsTrigger>
            <TabsTrigger value="trial" className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Trial Settings
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email Templates
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <ToggleLeft className="w-4 h-4" /> Feature Toggles
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Building className="w-4 h-4" /> Branding
            </TabsTrigger>
          </TabsList>

          {/* Subscription Plans Tab */}
          <TabsContent value="pricing">
            <div className="grid lg:grid-cols-3 gap-6">
              {settings?.subscription_plans?.map((plan) => (
                <Card key={plan.id} className={`border-2 ${!plan.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <Badge className={plan.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setEditingPlan(plan)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-slate-500">Monthly</Label>
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold">${plan.monthly_price}</span>
                          <span className="text-slate-500">/mo</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Annual</Label>
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold">${plan.annual_price}</span>
                          <span className="text-slate-500">/yr</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Trial:</span>
                        <span className="ml-1 font-semibold">{plan.trial_days} days</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Locations:</span>
                        <span className="ml-1 font-semibold">{plan.max_locations === -1 ? "Unlimited" : plan.max_locations}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-500">Features</Label>
                      <ul className="mt-2 space-y-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Label>Active</Label>
                      <Switch
                        checked={plan.is_active}
                        onCheckedChange={(checked) => updatePlan(plan.id, "is_active", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Commission Settings Tab */}
          <TabsContent value="commission">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Marketplace Commission Rates</CardTitle>
                <p className="text-slate-600">Set commission percentages for marketplace orders by plan</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <Label>Default Commission Rate</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={settings?.marketplace_settings?.default_commission_rate || 0}
                        onChange={(e) => updateSettings("marketplace_settings.default_commission_rate", parseFloat(e.target.value))}
                      />
                      <span className="text-slate-500">({((settings?.marketplace_settings?.default_commission_rate || 0) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div>
                    <Label>Starter Plan Commission</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={settings?.marketplace_settings?.starter_commission_rate || 0}
                        onChange={(e) => updateSettings("marketplace_settings.starter_commission_rate", parseFloat(e.target.value))}
                      />
                      <span className="text-slate-500">({((settings?.marketplace_settings?.starter_commission_rate || 0) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div>
                    <Label>Professional Plan Commission</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={settings?.marketplace_settings?.professional_commission_rate || 0}
                        onChange={(e) => updateSettings("marketplace_settings.professional_commission_rate", parseFloat(e.target.value))}
                      />
                      <span className="text-slate-500">({((settings?.marketplace_settings?.professional_commission_rate || 0) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div>
                    <Label>Enterprise Plan Commission</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={settings?.marketplace_settings?.enterprise_commission_rate || 0}
                        onChange={(e) => updateSettings("marketplace_settings.enterprise_commission_rate", parseFloat(e.target.value))}
                      />
                      <span className="text-slate-500">({((settings?.marketplace_settings?.enterprise_commission_rate || 0) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <Label>Minimum Order Amount ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings?.marketplace_settings?.min_order_amount || 0}
                      onChange={(e) => updateSettings("marketplace_settings.min_order_amount", parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Platform Fee ($ per order)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings?.marketplace_settings?.platform_fee || 0}
                      onChange={(e) => updateSettings("marketplace_settings.platform_fee", parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trial Settings Tab */}
          <TabsContent value="trial">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Trial Period Configuration</CardTitle>
                <p className="text-slate-600">Configure free trial settings for new customers</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label>Default Trial Period (days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings?.trial_settings?.default_trial_days || 14}
                      onChange={(e) => updateSettings("trial_settings.default_trial_days", parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Extended Trial Period (days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings?.trial_settings?.extended_trial_days || 30}
                      onChange={(e) => updateSettings("trial_settings.extended_trial_days", parseInt(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">For special promotions</p>
                  </div>
                  <div>
                    <Label>Require Payment Method</Label>
                    <div className="flex items-center gap-2 mt-3">
                      <Switch
                        checked={settings?.trial_settings?.require_payment_method || false}
                        onCheckedChange={(checked) => updateSettings("trial_settings.require_payment_method", checked)}
                      />
                      <span className="text-sm text-slate-600">
                        {settings?.trial_settings?.require_payment_method ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Trial Features Description</Label>
                  <div className="mt-2 space-y-2">
                    {settings?.trial_settings?.trial_features?.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...settings.trial_settings.trial_features];
                            newFeatures[idx] = e.target.value;
                            updateSettings("trial_settings.trial_features", newFeatures);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const newFeatures = settings.trial_settings.trial_features.filter((_, i) => i !== idx);
                            updateSettings("trial_settings.trial_features", newFeatures);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newFeatures = [...(settings.trial_settings.trial_features || []), "New feature"];
                        updateSettings("trial_settings.trial_features", newFeatures);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Feature
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payment">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Payment Processor Configuration</CardTitle>
                <p className="text-slate-600">Configure payment processing and payout settings</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label>Payment Processor</Label>
                    <Select
                      value={settings?.payment_settings?.payment_processor || "square"}
                      onValueChange={(value) => updateSettings("payment_settings.payment_processor", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={settings?.payment_settings?.currency || "USD"}
                      onValueChange={(value) => updateSettings("payment_settings.currency", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Tax Rate</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={settings?.payment_settings?.tax_rate || 0}
                        onChange={(e) => updateSettings("payment_settings.tax_rate", parseFloat(e.target.value))}
                      />
                      <span className="text-slate-500">({((settings?.payment_settings?.tax_rate || 0) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <Label>Payout Schedule</Label>
                    <Select
                      value={settings?.payment_settings?.payout_schedule || "weekly"}
                      onValueChange={(value) => updateSettings("payment_settings.payout_schedule", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Minimum Payout Amount ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={settings?.payment_settings?.minimum_payout || 25}
                      onChange={(e) => updateSettings("payment_settings.minimum_payout", parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="email">
            <div className="space-y-4">
              {settings?.email_templates?.map((template) => (
                <Card key={template.template_id} className="border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-slate-600" />
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-slate-500">{template.template_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => updateEmailTemplate(template.template_id, "is_active", checked)}
                      />
                      <Button size="sm" variant="outline" onClick={() => setEditingTemplate(template)}>
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm"><strong>Subject:</strong> {template.subject}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Feature Toggles Tab */}
          <TabsContent value="features">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>System-Wide Feature Toggles</CardTitle>
                <p className="text-slate-600">Enable or disable features across the entire platform</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(settings?.feature_toggles || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-semibold capitalize">{key.replace(/_/g, ' ').replace('enabled', '')}</p>
                        <p className="text-sm text-slate-500">
                          {value ? "Feature is enabled for all users" : "Feature is disabled"}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => updateSettings(`feature_toggles.${key}`, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Branding & Contact Settings</CardTitle>
                <p className="text-slate-600">Configure platform branding and contact information</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Platform Name</Label>
                    <Input
                      value={settings?.branding_settings?.platform_name || ""}
                      onChange={(e) => updateSettings("branding_settings.platform_name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Support Phone</Label>
                    <Input
                      value={settings?.branding_settings?.support_phone || ""}
                      onChange={(e) => updateSettings("branding_settings.support_phone", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={settings?.branding_settings?.support_email || ""}
                      onChange={(e) => updateSettings("branding_settings.support_email", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Sales Email</Label>
                    <Input
                      type="email"
                      value={settings?.branding_settings?.sales_email || ""}
                      onChange={(e) => updateSettings("branding_settings.sales_email", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Plan Dialog */}
        <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit {editingPlan?.name} Plan</DialogTitle>
            </DialogHeader>
            {editingPlan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Monthly Price ($)</Label>
                    <Input
                      type="number"
                      value={editingPlan.monthly_price}
                      onChange={(e) => {
                        updatePlan(editingPlan.id, "monthly_price", parseFloat(e.target.value));
                        setEditingPlan({ ...editingPlan, monthly_price: parseFloat(e.target.value) });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Annual Price ($)</Label>
                    <Input
                      type="number"
                      value={editingPlan.annual_price}
                      onChange={(e) => {
                        updatePlan(editingPlan.id, "annual_price", parseFloat(e.target.value));
                        setEditingPlan({ ...editingPlan, annual_price: parseFloat(e.target.value) });
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Trial Days</Label>
                    <Input
                      type="number"
                      value={editingPlan.trial_days}
                      onChange={(e) => {
                        updatePlan(editingPlan.id, "trial_days", parseInt(e.target.value));
                        setEditingPlan({ ...editingPlan, trial_days: parseInt(e.target.value) });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Max Locations (-1 = unlimited)</Label>
                    <Input
                      type="number"
                      value={editingPlan.max_locations}
                      onChange={(e) => {
                        updatePlan(editingPlan.id, "max_locations", parseInt(e.target.value));
                        setEditingPlan({ ...editingPlan, max_locations: parseInt(e.target.value) });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Features</Label>
                  <div className="space-y-2 mt-2">
                    {editingPlan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input value={feature} readOnly />
                        <Button size="icon" variant="ghost" onClick={() => removePlanFeature(editingPlan.id, idx)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new feature..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addPlanFeature(editingPlan.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={() => setEditingPlan(null)} className="w-full">Done</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Email Template Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Email Template: {editingTemplate?.name}</DialogTitle>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4">
                <div>
                  <Label>Subject Line</Label>
                  <Input
                    value={editingTemplate.subject}
                    onChange={(e) => {
                      updateEmailTemplate(editingTemplate.template_id, "subject", e.target.value);
                      setEditingTemplate({ ...editingTemplate, subject: e.target.value });
                    }}
                  />
                </div>
                <div>
                  <Label>Email Body</Label>
                  <Textarea
                    value={editingTemplate.body}
                    onChange={(e) => {
                      updateEmailTemplate(editingTemplate.template_id, "body", e.target.value);
                      setEditingTemplate({ ...editingTemplate, body: e.target.value });
                    }}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Available variables: {"{{customer_name}}"}, {"{{trial_days}}"}, {"{{plan_name}}"}, {"{{amount}}"}, {"{{subscription_url}}"}, {"{{payment_url}}"}
                  </p>
                </div>
                <Button onClick={() => setEditingTemplate(null)} className="w-full">Done</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}