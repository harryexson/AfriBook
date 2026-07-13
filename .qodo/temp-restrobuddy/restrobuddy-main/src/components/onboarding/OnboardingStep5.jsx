import React from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Store, Star, Calendar, Truck, Leaf, Check } from "lucide-react";
import AIPricingAssistant from "./AIPricingAssistant";

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { value: 'vegan', label: 'Vegan', icon: '🌱' },
  { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
  { value: 'halal', label: 'Halal', icon: '☪️' },
  { value: 'kosher', label: 'Kosher', icon: '✡️' },
  { value: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
  { value: 'nut-free', label: 'Nut-Free', icon: '🥜' }
];

export default function OnboardingStep5({ formData, updateFormData }) {
  const handleApplyPricing = (recommendation) => {
    updateFormData({
      price_range: recommendation.recommended_price_range,
      pricing_recommendation: recommendation
    });
  };

  const toggleDietary = (option) => {
    const current = formData.dietary_options || [];
    if (current.includes(option)) {
      updateFormData({ dietary_options: current.filter(d => d !== option) });
    } else {
      updateFormData({ dietary_options: [...current, option] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Final Preferences</h2>
        <p className="text-slate-600 mt-2">Get pricing insights and customize features</p>
      </div>

      {/* AI Pricing Assistant */}
      <div className="mb-6">
        <AIPricingAssistant formData={formData} onApplyPricing={handleApplyPricing} />
      </div>

      {/* Dietary Options */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Dietary Options Available</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Select dietary options your restaurant accommodates
          </p>

          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(option => (
              <Badge
                key={option.value}
                variant={formData.dietary_options?.includes(option.value) ? "default" : "outline"}
                className={`cursor-pointer py-2 px-4 text-sm transition-all ${
                  formData.dietary_options?.includes(option.value)
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'hover:border-green-400'
                }`}
                onClick={() => toggleDietary(option.value)}
              >
                <span className="mr-2">{option.icon}</span>
                {option.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Enable Features</h3>

          <div className="space-y-4">
            {/* Marketplace */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Store className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">Marketplace Listing</div>
                  <div className="text-sm text-slate-500">
                    List your restaurant on our public marketplace
                  </div>
                </div>
              </div>
              <Switch
                checked={formData.marketplace_enabled}
                onCheckedChange={(checked) => updateFormData({ marketplace_enabled: checked })}
              />
            </div>

            {/* Loyalty Program */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">Loyalty Program</div>
                  <div className="text-sm text-slate-500">
                    Reward customers with points and exclusive offers
                  </div>
                </div>
              </div>
              <Switch
                checked={formData.enable_loyalty}
                onCheckedChange={(checked) => updateFormData({ enable_loyalty: checked })}
              />
            </div>

            {/* Reservations */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">Table Reservations</div>
                  <div className="text-sm text-slate-500">
                    Allow customers to book tables online
                  </div>
                </div>
              </div>
              <Switch
                checked={formData.enable_reservations}
                onCheckedChange={(checked) => updateFormData({ enable_reservations: checked })}
              />
            </div>

            {/* Delivery */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">Delivery Service</div>
                  <div className="text-sm text-slate-500">
                    Offer delivery to your customers
                  </div>
                </div>
              </div>
              <Switch
                checked={formData.enable_delivery}
                onCheckedChange={(checked) => updateFormData({ enable_delivery: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-2 border-emerald-200 bg-emerald-50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
            <Check className="w-5 h-5" />
            You're Almost Done!
          </h3>

          <div className="space-y-2 text-sm text-emerald-800">
            <p>✓ Restaurant: <strong>{formData.business_name || 'Not set'}</strong></p>
            <p>✓ Menu Items: <strong>{formData.menuItems.length} items</strong></p>
            <p>✓ Team Members: <strong>{formData.teamMembers.length} members</strong></p>
            <p>✓ Features: <strong>
              {[
                formData.marketplace_enabled && 'Marketplace',
                formData.enable_loyalty && 'Loyalty',
                formData.enable_reservations && 'Reservations',
                formData.enable_delivery && 'Delivery'
              ].filter(Boolean).join(', ') || 'None selected'}
            </strong></p>
          </div>

          <p className="mt-4 text-sm text-emerald-700">
            Click "Complete Setup" to finish and start using RESTROBUDDY!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}