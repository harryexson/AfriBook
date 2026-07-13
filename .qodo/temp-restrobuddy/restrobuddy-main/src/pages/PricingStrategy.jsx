import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, DollarSign, TrendingUp, Zap } from "lucide-react";

export default function PricingStrategy() {
  const [billingCycle, setBillingCycle] = useState("monthly");

  const tiers = [
    {
      name: "Starter",
      monthlyPrice: 99,
      annualPrice: 950,
      description: "Perfect for single-location restaurants getting started",
      features: [
        { name: "1 location", included: true },
        { name: "Up to 500 orders/month", included: true },
        { name: "Online ordering", included: true },
        { name: "Basic menu management", included: true },
        { name: "Email support", included: true },
        { name: "Kiosk mode (1 tablet)", included: false },
        { name: "SMS ordering", included: false },
        { name: "Kitchen display", included: false },
        { name: "Advanced analytics", included: false },
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Professional",
      monthlyPrice: 299,
      annualPrice: 2868,
      description: "Most popular for growing restaurants",
      features: [
        { name: "Up to 3 locations", included: true },
        { name: "Unlimited orders", included: true },
        { name: "Online ordering", included: true },
        { name: "Full menu management", included: true },
        { name: "Kiosk mode (unlimited tablets)", included: true },
        { name: "SMS ordering (500 SMS/mo included)", included: true },
        { name: "Kitchen display system", included: true },
        { name: "Priority support", included: true },
        { name: "Custom branding", included: true },
        { name: "Advanced analytics", included: false },
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      monthlyPrice: 599,
      annualPrice: 5748,
      description: "For multi-location restaurants and chains",
      features: [
        { name: "Unlimited locations", included: true },
        { name: "Unlimited orders", included: true },
        { name: "Everything in Professional", included: true },
        { name: "SMS ordering (2000 SMS/mo included)", included: true },
        { name: "Advanced analytics & reporting", included: true },
        { name: "Multi-language support", included: true },
        { name: "White-label options", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "Custom integrations", included: true },
        { name: "API access", included: true },
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const addOns = [
    {
      name: "Additional SMS Credits",
      price: "$25/month",
      description: "500 additional SMS messages per month",
      icon: "📱"
    },
    {
      name: "Extra Tablet License",
      price: "$49/month",
      description: "Per additional kiosk tablet",
      icon: "📱"
    },
    {
      name: "Marketing Automation",
      price: "$99/month",
      description: "Automated SMS campaigns, promotions, and customer engagement",
      icon: "📈"
    },
    {
      name: "Loyalty Program",
      price: "$149/month",
      description: "Built-in customer rewards and points system",
      icon: "🎁"
    },
    {
      name: "Multi-language Support",
      price: "$79/month",
      description: "Additional language packs (Spanish, French, etc.)",
      icon: "🌎"
    },
    {
      name: "Setup & Training",
      price: "$299 one-time",
      description: "White-glove onboarding with menu setup and staff training",
      icon: "🚀"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mb-6 shadow-lg">
            <DollarSign className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Pricing Strategy
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Simple, transparent pricing that scales with your business
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-full p-1 shadow-lg border-2 border-slate-200">
            <Button
              variant={billingCycle === "monthly" ? "default" : "ghost"}
              onClick={() => setBillingCycle("monthly")}
              className="rounded-full px-8"
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === "annual" ? "default" : "ghost"}
              onClick={() => setBillingCycle("annual")}
              className="rounded-full px-8"
            >
              Annual
              <Badge className="ml-2 bg-emerald-500">Save 20%</Badge>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, idx) => (
            <Card 
              key={idx} 
              className={`relative border-0 shadow-xl ${
                tier.popular ? 'ring-4 ring-emerald-500 scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-emerald-600 text-white px-6 py-1 text-sm">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className={tier.popular ? 'bg-gradient-to-br from-emerald-50 to-white' : ''}>
                <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                <p className="text-slate-600 text-sm mb-4">{tier.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-slate-900">
                    ${billingCycle === "monthly" ? tier.monthlyPrice : Math.floor(tier.annualPrice / 12)}
                  </span>
                  <span className="text-slate-600">/month</span>
                </div>
                {billingCycle === "annual" && (
                  <p className="text-sm text-emerald-600 mt-2">
                    Billed annually at ${tier.annualPrice} (save ${tier.monthlyPrice * 12 - tier.annualPrice})
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    tier.popular 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-xl mb-16 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <Zap className="w-6 h-6 text-blue-600" />
              Add-On Features
            </CardTitle>
            <p className="text-slate-600 mt-2">
              Enhance your system with these optional features
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addOns.map((addon, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-blue-300 transition-colors">
                  <div className="text-3xl mb-3">{addon.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{addon.name}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">{addon.price}</p>
                  <p className="text-sm text-slate-600">{addon.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl mb-16">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardTitle className="text-2xl">Revenue Projection Model</CardTitle>
            <p className="text-purple-100 mt-2">Target: 100 restaurants in Year 1</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left">Revenue Stream</th>
                    <th className="p-3 text-right">Monthly</th>
                    <th className="p-3 text-right">Annual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">Subscriptions (50×$99 + 40×$299 + 10×$599)</td>
                    <td className="p-3 text-right font-semibold">$23,900</td>
                    <td className="p-3 text-right font-semibold">$286,800</td>
                  </tr>
                  <tr className="border-t bg-slate-50">
                    <td className="p-3">Transaction Fees (avg 1000 orders/mo @ $0.50)</td>
                    <td className="p-3 text-right font-semibold">$50,000</td>
                    <td className="p-3 text-right font-semibold">$600,000</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3">SMS Credits (100 restaurants @ $25/mo)</td>
                    <td className="p-3 text-right font-semibold">$2,500</td>
                    <td className="p-3 text-right font-semibold">$30,000</td>
                  </tr>
                  <tr className="border-t bg-slate-50">
                    <td className="p-3">Setup Fees (100 × $299)</td>
                    <td className="p-3 text-right font-semibold">-</td>
                    <td className="p-3 text-right font-semibold">$29,900</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-3">Add-ons (30% adoption @ avg $100/mo)</td>
                    <td className="p-3 text-right font-semibold">$3,000</td>
                    <td className="p-3 text-right font-semibold">$36,000</td>
                  </tr>
                  <tr className="border-t bg-slate-50">
                    <td className="p-3">Hardware Sales (50 bundles @ $899)</td>
                    <td className="p-3 text-right font-semibold">-</td>
                    <td className="p-3 text-right font-semibold">$44,950</td>
                  </tr>
                  <tr className="border-t bg-emerald-50">
                    <td className="p-3 font-bold text-lg">TOTAL</td>
                    <td className="p-3 text-right font-bold text-lg text-emerald-600">$79,400</td>
                    <td className="p-3 text-right font-bold text-lg text-emerald-600">$1,027,650</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-amber-600" />
              Launch Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border-2 border-amber-200">
                <h3 className="font-bold text-lg mb-3">Phase 1: Free Trial (First 30 Days)</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ Attract early adopters</li>
                  <li>✓ Gather testimonials and case studies</li>
                  <li>✓ Refine product based on feedback</li>
                  <li>✓ No credit card required</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
                <h3 className="font-bold text-lg mb-3">Phase 2: Freemium Model</h3>
                <div className="mb-3">
                  <p className="font-semibold text-sm mb-2">Free Forever Plan:</p>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>• 1 location</li>
                    <li>• Up to 50 orders/month</li>
                    <li>• Basic features only</li>
                    <li>• "Powered by Gastronomy" watermark</li>
                  </ul>
                </div>
                <p className="text-sm text-slate-600">
                  <strong>Upgrade Path:</strong> When they hit 50 orders or need SMS/Kiosk features
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-emerald-200">
                <h3 className="font-bold text-lg mb-3">Phase 3: Annual Discounts</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ Offer 20% discount for annual payment</li>
                  <li>✓ Example: Professional Plan = $299/mo or $2,868/year (save $720)</li>
                  <li>✓ Improves cash flow and reduces churn</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}