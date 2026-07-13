import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { Subscription } from "@/entities/Subscription";
import { Restaurant } from "@/entities/Restaurant";
import { Lock, Crown, Zap } from "lucide-react";

const PLAN_FEATURES = {
  starter: {
    name: "Starter",
    maxOrdersPerMonth: 100,
    maxLocations: 1,
    features: ["pos_terminal", "basic_menu", "basic_orders", "basic_reports"],
    blockedFeatures: ["delivery_batching", "advanced_analytics", "subscription_plans", "loyalty_program", "multi_location"]
  },
  professional: {
    name: "Professional",
    maxOrdersPerMonth: 1000,
    maxLocations: 3,
    features: ["pos_terminal", "basic_menu", "basic_orders", "basic_reports", "delivery_batching", "advanced_analytics", "subscription_plans", "inventory"],
    blockedFeatures: ["multi_location", "custom_integrations", "white_label"]
  },
  enterprise: {
    name: "Enterprise",
    maxOrdersPerMonth: Infinity,
    maxLocations: Infinity,
    features: ["all"],
    blockedFeatures: []
  }
};

export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const user = await base44.auth.me();
      const restaurants = await Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
        const subs = await Subscription.filter({ owner_email: user.email });
        if (subs.length > 0) {
          setSubscription(subs[0]);
        }
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    }
    setIsLoading(false);
  };

  const hasFeature = (feature) => {
    if (!subscription) return false;
    const plan = PLAN_FEATURES[subscription.plan];
    if (!plan) return false;
    return plan.features.includes("all") || plan.features.includes(feature);
  };

  const isFeatureBlocked = (feature) => {
    if (!subscription) return true;
    const plan = PLAN_FEATURES[subscription.plan];
    if (!plan) return true;
    return plan.blockedFeatures.includes(feature);
  };

  const getPlanLimits = () => {
    if (!subscription) return null;
    return PLAN_FEATURES[subscription.plan];
  };

  return {
    subscription,
    restaurant,
    isLoading,
    hasFeature,
    isFeatureBlocked,
    getPlanLimits,
    plan: subscription?.plan,
    status: subscription?.status
  };
}

export default function SubscriptionGate({ feature, children, fallback }) {
  const navigate = useNavigate();
  const { isLoading, isFeatureBlocked, subscription } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!subscription || isFeatureBlocked(feature)) {
    if (fallback) return fallback;

    const requiredPlan = feature === "advanced_analytics" || feature === "delivery_batching" || feature === "subscription_plans" 
      ? "Professional" 
      : "Enterprise";

    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Premium Feature</h2>
          <p className="text-slate-600 mb-2">
            This feature requires the <Badge className="bg-emerald-600 text-white">{requiredPlan}</Badge> plan or higher
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Upgrade to unlock advanced features and grow your business
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Pricing"))}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return children;
}