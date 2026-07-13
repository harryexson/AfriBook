import React, { useState, useEffect } from "react";
import { CompetitorAnalysis } from "@/entities/CompetitorAnalysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Target, ArrowLeft, Plus, TrendingUp, DollarSign, CheckCircle, XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BackofficeCompetitive() {
  const [competitors, setCompetitors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    competitor_name: "",
    website: "",
    pricing: {
      starter_monthly: 0,
      professional_monthly: 0,
      enterprise_monthly: 0,
      hardware_cost: 0,
      setup_fee: 0
    },
    features: {
      pos_system: false,
      online_ordering: false,
      kiosk_mode: false,
      sms_ordering: false,
      kitchen_display: false,
      inventory_management: false,
      employee_management: false,
      payroll: false,
      loyalty_program: false,
      marketplace: false,
      table_management: false,
      delivery_integration: false,
      analytics: false
    },
    strengths: [],
    weaknesses: [],
    market_share: 0,
    target_customers: "",
    contract_terms: "",
    our_advantage: ""
  });
  const [strengthInput, setStrengthInput] = useState("");
  const [weaknessInput, setWeaknessInput] = useState("");

  useEffect(() => {
    loadCompetitors();
  }, []);

  const loadCompetitors = async () => {
    setIsLoading(true);
    try {
      const data = await CompetitorAnalysis.list();
      setCompetitors(data);
    } catch (error) {
      console.error("Error loading competitors:", error);
    }
    setIsLoading(false);
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitor.competitor_name) {
      alert("Please enter competitor name");
      return;
    }

    try {
      await CompetitorAnalysis.create(newCompetitor);
      await loadCompetitors();
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error adding competitor:", error);
      alert("Failed to add competitor");
    }
  };

  const resetForm = () => {
    setNewCompetitor({
      competitor_name: "",
      website: "",
      pricing: {
        starter_monthly: 0,
        professional_monthly: 0,
        enterprise_monthly: 0,
        hardware_cost: 0,
        setup_fee: 0
      },
      features: {
        pos_system: false,
        online_ordering: false,
        kiosk_mode: false,
        sms_ordering: false,
        kitchen_display: false,
        inventory_management: false,
        employee_management: false,
        payroll: false,
        loyalty_program: false,
        marketplace: false,
        table_management: false,
        delivery_integration: false,
        analytics: false
      },
      strengths: [],
      weaknesses: [],
      market_share: 0,
      target_customers: "",
      contract_terms: "",
      our_advantage: ""
    });
    setStrengthInput("");
    setWeaknessInput("");
  };

  const addStrength = () => {
    if (strengthInput.trim()) {
      setNewCompetitor({
        ...newCompetitor,
        strengths: [...newCompetitor.strengths, strengthInput.trim()]
      });
      setStrengthInput("");
    }
  };

  const addWeakness = () => {
    if (weaknessInput.trim()) {
      setNewCompetitor({
        ...newCompetitor,
        weaknesses: [...newCompetitor.weaknesses, weaknessInput.trim()]
      });
      setWeaknessInput("");
    }
  };

  const ourFeatures = {
    pos_system: true,
    online_ordering: true,
    kiosk_mode: true,
    sms_ordering: true,
    kitchen_display: true,
    inventory_management: true,
    employee_management: true,
    payroll: true,
    loyalty_program: true,
    marketplace: true,
    table_management: true,
    delivery_integration: true,
    analytics: true
  };

  const ourPricing = {
    starter_monthly: 99,
    professional_monthly: 199,
    enterprise_monthly: 399,
    hardware_cost: 0,
    setup_fee: 0
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading competitive analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 border-b border-amber-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl("DeveloperBackoffice")}>
              <Button variant="ghost" className="text-white hover:bg-amber-500">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Target className="w-8 h-8" />
                Competitive Analysis
              </h1>
              <p className="text-amber-100 mt-1">Compare with competitors and plan strategy</p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-white text-amber-700 hover:bg-amber-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Competitor
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Our Positioning */}
        <Card className="border-0 shadow-2xl mb-8 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              RESTROBUDDY - Our Competitive Advantage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Pricing Strategy</h3>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Starter:</strong> ${ourPricing.starter_monthly}/mo</p>
                  <p className="text-sm"><strong>Professional:</strong> ${ourPricing.professional_monthly}/mo</p>
                  <p className="text-sm"><strong>Enterprise:</strong> ${ourPricing.enterprise_monthly}/mo</p>
                  <p className="text-sm text-green-600"><strong>No setup fees or hardware costs!</strong></p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Key Differentiators</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>All-in-one platform with SMS ordering & marketplace</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>No long-term contracts or hidden fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Built-in payroll & EWA for employees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>Restaurant discovery marketplace included</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitor Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {competitors.map((comp) => (
            <Card key={comp.id} className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{comp.competitor_name}</CardTitle>
                    {comp.website && (
                      <a 
                        href={comp.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {comp.website}
                      </a>
                    )}
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    {comp.market_share}% market share
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Pricing
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-xs text-slate-600">Starter</p>
                      <p className="font-semibold">${comp.pricing?.starter_monthly || 0}/mo</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-xs text-slate-600">Pro</p>
                      <p className="font-semibold">${comp.pricing?.professional_monthly || 0}/mo</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-xs text-slate-600">Enterprise</p>
                      <p className="font-semibold">${comp.pricing?.enterprise_monthly || 0}/mo</p>
                    </div>
                  </div>
                  {comp.pricing?.hardware_cost > 0 && (
                    <p className="text-xs text-red-600 mt-2">+ ${comp.pricing.hardware_cost} hardware cost</p>
                  )}
                  {comp.pricing?.setup_fee > 0 && (
                    <p className="text-xs text-red-600">+ ${comp.pricing.setup_fee} setup fee</p>
                  )}
                </div>

                {/* Features Comparison */}
                <div>
                  <h4 className="font-semibold mb-2">Feature Comparison</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(comp.features || {}).map(([feature, hasIt]) => {
                      const weHaveIt = ourFeatures[feature];
                      return (
                        <div key={feature} className="flex items-center gap-2">
                          {hasIt ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          <span className={!hasIt && weHaveIt ? "text-emerald-600 font-semibold" : ""}>
                            {feature.replace(/_/g, " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-green-700">Strengths</h4>
                    <ul className="space-y-1 text-xs">
                      {comp.strengths?.map((s, idx) => (
                        <li key={idx} className="text-slate-700">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-red-700">Weaknesses</h4>
                    <ul className="space-y-1 text-xs">
                      {comp.weaknesses?.map((w, idx) => (
                        <li key={idx} className="text-slate-700">• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Our Advantage */}
                {comp.our_advantage && (
                  <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded">
                    <h4 className="font-semibold text-sm text-emerald-900 mb-1">How We Win</h4>
                    <p className="text-xs text-emerald-800">{comp.our_advantage}</p>
                  </div>
                )}

                {/* Target & Contract */}
                <div className="flex gap-4 text-xs">
                  {comp.target_customers && (
                    <div>
                      <strong>Target:</strong> {comp.target_customers}
                    </div>
                  )}
                  {comp.contract_terms && (
                    <div>
                      <strong>Contract:</strong> {comp.contract_terms}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Competitor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Competitor Analysis</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Competitor Name *</Label>
                <Input
                  placeholder="Square, Toast, etc."
                  value={newCompetitor.competitor_name}
                  onChange={(e) => setNewCompetitor({...newCompetitor, competitor_name: e.target.value})}
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  placeholder="https://..."
                  value={newCompetitor.website}
                  onChange={(e) => setNewCompetitor({...newCompetitor, website: e.target.value})}
                />
              </div>
            </div>

            {/* Pricing */}
            <div>
              <Label className="text-base">Pricing</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                <Input
                  type="number"
                  placeholder="Starter/mo"
                  value={newCompetitor.pricing.starter_monthly}
                  onChange={(e) => setNewCompetitor({
                    ...newCompetitor,
                    pricing: {...newCompetitor.pricing, starter_monthly: parseFloat(e.target.value) || 0}
                  })}
                />
                <Input
                  type="number"
                  placeholder="Pro/mo"
                  value={newCompetitor.pricing.professional_monthly}
                  onChange={(e) => setNewCompetitor({
                    ...newCompetitor,
                    pricing: {...newCompetitor.pricing, professional_monthly: parseFloat(e.target.value) || 0}
                  })}
                />
                <Input
                  type="number"
                  placeholder="Enterprise/mo"
                  value={newCompetitor.pricing.enterprise_monthly}
                  onChange={(e) => setNewCompetitor({
                    ...newCompetitor,
                    pricing: {...newCompetitor.pricing, enterprise_monthly: parseFloat(e.target.value) || 0}
                  })}
                />
                <Input
                  type="number"
                  placeholder="Hardware"
                  value={newCompetitor.pricing.hardware_cost}
                  onChange={(e) => setNewCompetitor({
                    ...newCompetitor,
                    pricing: {...newCompetitor.pricing, hardware_cost: parseFloat(e.target.value) || 0}
                  })}
                />
                <Input
                  type="number"
                  placeholder="Setup Fee"
                  value={newCompetitor.pricing.setup_fee}
                  onChange={(e) => setNewCompetitor({
                    ...newCompetitor,
                    pricing: {...newCompetitor.pricing, setup_fee: parseFloat(e.target.value) || 0}
                  })}
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <Label className="text-base mb-2 block">Features</Label>
              <div className="grid grid-cols-3 gap-3">
                {Object.keys(newCompetitor.features).map((feature) => (
                  <div key={feature} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <label className="text-sm">{feature.replace(/_/g, " ")}</label>
                    <Switch
                      checked={newCompetitor.features[feature]}
                      onCheckedChange={(checked) =>
                        setNewCompetitor({
                          ...newCompetitor,
                          features: {...newCompetitor.features, [feature]: checked}
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Strengths</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add strength..."
                    value={strengthInput}
                    onChange={(e) => setStrengthInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addStrength()}
                  />
                  <Button type="button" onClick={addStrength} size="sm">Add</Button>
                </div>
                <div className="space-y-1">
                  {newCompetitor.strengths.map((s, idx) => (
                    <div key={idx} className="text-sm bg-green-50 p-2 rounded">• {s}</div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Weaknesses</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add weakness..."
                    value={weaknessInput}
                    onChange={(e) => setWeaknessInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addWeakness()}
                  />
                  <Button type="button" onClick={addWeakness} size="sm">Add</Button>
                </div>
                <div className="space-y-1">
                  {newCompetitor.weaknesses.map((w, idx) => (
                    <div key={idx} className="text-sm bg-red-50 p-2 rounded">• {w}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Market Share (%)</Label>
                <Input
                  type="number"
                  placeholder="0-100"
                  value={newCompetitor.market_share}
                  onChange={(e) => setNewCompetitor({...newCompetitor, market_share: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Target Customers</Label>
                <Input
                  placeholder="e.g., Enterprise, SMB"
                  value={newCompetitor.target_customers}
                  onChange={(e) => setNewCompetitor({...newCompetitor, target_customers: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Contract Terms</Label>
              <Input
                placeholder="e.g., 3-year contract required"
                value={newCompetitor.contract_terms}
                onChange={(e) => setNewCompetitor({...newCompetitor, contract_terms: e.target.value})}
              />
            </div>

            <div>
              <Label>How We Win Against Them</Label>
              <Textarea
                placeholder="Describe our competitive advantage..."
                value={newCompetitor.our_advantage}
                onChange={(e) => setNewCompetitor({...newCompetitor, our_advantage: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCompetitor} className="bg-amber-600 hover:bg-amber-700">
              Add Competitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}