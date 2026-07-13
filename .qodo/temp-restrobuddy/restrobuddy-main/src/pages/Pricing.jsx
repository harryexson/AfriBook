import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Star, Loader2, Users, Store, Globe } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { createStripeCheckout } from "@/functions/createStripeCheckout";
import { getCurrencyPricing } from "@/functions/getCurrencyPricing";
import SEOHead from "@/components/seo/SEOHead";
import StructuredData, { createProductSchema } from "@/components/seo/StructuredData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [currency, setCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [pricing, setPricing] = useState(null);
  const [loadingCurrency, setLoadingCurrency] = useState(true);

  useEffect(() => {
    detectCurrency();
  }, []);

  const detectCurrency = async () => {
    try {
      // Try to detect user's location
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const country = data.country_code;

      // Get pricing for detected currency
      const pricingResponse = await getCurrencyPricing({ country });
      if (pricingResponse.data) {
        setCurrency(pricingResponse.data.currency);
        setCurrencySymbol(pricingResponse.data.symbol);
        setPricing(pricingResponse.data.pricing);
      }
    } catch (error) {
      console.error("Failed to detect currency:", error);
      // Default to USD
      loadPricingForCurrency('USD');
    } finally {
      setLoadingCurrency(false);
    }
  };

  const loadPricingForCurrency = async (curr) => {
    try {
      const response = await getCurrencyPricing({ currency: curr });
      if (response.data) {
        setCurrency(response.data.currency);
        setCurrencySymbol(response.data.symbol);
        setPricing(response.data.pricing);
      }
    } catch (error) {
      console.error("Failed to load pricing:", error);
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    loadPricingForCurrency(newCurrency);
  };

  const handleSubscribe = async (planName) => {
    setLoadingPlan(planName);
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) {
        base44.auth.redirectToLogin(createPageUrl("Pricing"));
        return;
      }

      const response = await createStripeCheckout({
        plan: planName.toLowerCase(),
        billingCycle: billingCycle,
        currency: currency
      });

      console.log("Checkout response:", response);

      if (response?.data?.url) {
        window.location.href = response.data.url;
      } else if (response?.data?.error) {
        alert(`Error: ${response.data.error}`);
      } else {
        alert("Failed to create checkout session. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  if (loadingCurrency || !pricing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const plans = [
    {
      name: "Starter",
      monthlyPrice: pricing.starter.monthly,
      annualPrice: pricing.starter.annual,
      description: "Perfect for single-location restaurants",
      features: [
        { text: "1 location", included: true },
        { text: "Up to 500 orders/month", included: true },
        { text: "Online ordering", included: true },
        { text: "Basic menu management", included: true },
        { text: "Email support", included: true },
        { text: "Kiosk mode", included: false },
        { text: "SMS ordering", included: false },
        { text: "Kitchen display", included: false }
      ]
    },
    {
      name: "Professional",
      monthlyPrice: pricing.professional.monthly,
      annualPrice: pricing.professional.annual,
      description: "Most popular for growing restaurants",
      popular: true,
      features: [
        { text: "Up to 3 locations", included: true },
        { text: "Unlimited orders", included: true },
        { text: "Online ordering", included: true },
        { text: "Full menu management", included: true },
        { text: "Kiosk mode (unlimited tablets)", included: true },
        { text: "SMS ordering (500 SMS/mo)", included: true },
        { text: "Kitchen display system", included: true },
        { text: "Priority support", included: true }
      ]
    },
    {
      name: "Enterprise",
      monthlyPrice: pricing.enterprise.monthly,
      annualPrice: pricing.enterprise.annual,
      description: "For multi-location restaurants",
      features: [
        { text: "Unlimited locations", included: true },
        { text: "Unlimited orders", included: true },
        { text: "Everything in Professional", included: true },
        { text: "SMS ordering (2000 SMS/mo)", included: true },
        { text: "Advanced analytics", included: true },
        { text: "White-label options", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "API access", included: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SEOHead 
        title="RESTROBUDDY Pricing - Restaurant Management Plans Starting at $99/mo"
        description="Affordable restaurant management pricing. Starter $99/mo, Professional $299/mo, Enterprise $599/mo. Save vs Toast POS. 14-day free trial. No credit card required. Cancel anytime."
        keywords="restaurant pos pricing, restaurant management cost, pos system price, online ordering pricing, kiosk software cost, restaurant software pricing"
      />
      <StructuredData data={createProductSchema('starter')} />
      <StructuredData data={createProductSchema('professional')} />
      <StructuredData data={createProductSchema('enterprise')} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-emerald-100 mb-2">
            <strong>Your all-in-one solution for modern restaurant management</strong>
          </p>
          <p className="text-lg text-emerald-100">
            Choose the plan that works for your restaurant. No hidden fees. Cancel anytime.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-8"> {/* Added p-4 sm:p-8 here to maintain spacing */}
        <div className="text-center mb-12">
          {/* Original H1 and P tags are removed as they are now part of the Hero Section */}

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <div className="bg-white rounded-full p-1 shadow-lg border-2 border-slate-200 inline-flex">
              <Button
                variant={billingCycle === "monthly" ? "default" : "ghost"}
                onClick={() => setBillingCycle("monthly")}
                className="rounded-full px-6"
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === "annual" ? "default" : "ghost"}
                onClick={() => setBillingCycle("annual")}
                className="rounded-full px-6"
              >
                Annual
                <Badge className="ml-2 bg-green-100 text-green-800">Save 20%</Badge>
              </Button>
            </div>

            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-[180px] bg-white border-2 border-slate-200">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">🇺🇸 USD ($)</SelectItem>
                <SelectItem value="CAD">🇨🇦 CAD (CA$)</SelectItem>
                <SelectItem value="EUR">🇪🇺 EUR (€)</SelectItem>
                <SelectItem value="GBP">🇬🇧 GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, idx) => (
            <Card key={idx} className={`border-0 shadow-xl ${plan.popular ? 'ring-2 ring-emerald-500' : ''}`}>
              {plan.popular && (
                <div className="bg-emerald-500 text-white text-center py-2 font-semibold rounded-t-xl">
                  <Star className="w-4 h-4 inline mr-1" />
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-slate-600">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-slate-900">
                    {currencySymbol}{billingCycle === "monthly" ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                  </span>
                  <span className="text-slate-600">/month</span>
                  {billingCycle === "annual" && (
                    <div className="text-sm text-green-600 mt-1">
                      {currencySymbol}{plan.annualPrice}/year - Save {currencySymbol}{(plan.monthlyPrice * 12) - plan.annualPrice}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full mb-6 bg-emerald-600 hover:bg-emerald-700" 
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
                <div className="space-y-3">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? "text-slate-700" : "text-slate-400"}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Customer vs Restaurant Owner distinction */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">For Customers</h3>
              <p className="text-slate-600 mb-4">
                Order food from your favorite restaurants, join group orders, earn loyalty rewards - completely FREE!
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                ✓ Free to download & use<br/>
                ✓ No subscription required<br/>
                ✓ Available on iOS & Android
              </p>
            </div>
            <div className="text-center border-t md:border-t-0 md:border-l border-blue-200 pt-6 md:pt-0 md:pl-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">For Restaurant Owners</h3>
              <p className="text-slate-600 mb-4">
                Manage your restaurant, accept orders, track inventory, and grow your business with our complete platform.
              </p>
              <p className="text-sm text-emerald-600 font-semibold">
                ✓ 14-day free trial<br/>
                ✓ Choose a plan below<br/>
                ✓ Cancel anytime
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Save vs. Toast POS: Up to $192/year + $1,800 hardware
          </h3>
          <p className="text-slate-700">
            No long-term contracts. No expensive hardware. Just great software at a fair price.
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-8 mt-16">
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              © 2024 RESTROBUDDY. All rights reserved.
            </p>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              by Bold Intelligent Solutions Partners Inc. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}