import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { Restaurant } from "@/entities/Restaurant";
import BatchManager from "@/components/delivery/BatchManager";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";

export default function DeliveryBatching() {
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const user = await base44.auth.me();
      const restaurants = await Restaurant.filter({ owner_email: user.email });
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0]);
      }
    } catch (error) {
      console.error("Error loading restaurant:", error);
    }
    setIsLoading(false);
  };

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
    <SubscriptionGate feature="delivery_batching">
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Delivery Batching</h1>
            <p className="text-slate-600">Optimize deliveries by grouping orders for drivers</p>
          </div>
          <BatchManager restaurant={restaurant} />
        </div>
      </div>
    </SubscriptionGate>
  );
}