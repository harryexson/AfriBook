import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionPlan } from "@/entities/SubscriptionPlan";
import { Restaurant } from "@/entities/Restaurant";
import { Calendar, Package, Truck, CheckCircle } from "lucide-react";

export default function BrowseSubscriptions() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [restaurants, setRestaurants] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const [planList, restaurantList] = await Promise.all([
        SubscriptionPlan.list(),
        Restaurant.list()
      ]);
      
      const activePlans = planList.filter(p => p.active);
      setPlans(activePlans);
      
      const restaurantMap = {};
      restaurantList.forEach(r => {
        restaurantMap[r.id] = r;
      });
      setRestaurants(restaurantMap);
    } catch (error) {
      console.error("Error loading plans:", error);
    }
    setIsLoading(false);
  };

  const handleSubscribe = (plan) => {
    navigate(createPageUrl("SubscribeCheckout") + `?plan_id=${plan.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Subscription Plans</h1>
          <p className="text-slate-600">Save time and money with recurring meal deliveries</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => {
            const restaurant = restaurants[plan.restaurant_id];
            return (
              <Card key={plan.id} className="hover:shadow-xl transition-shadow">
                {plan.image_url && (
                  <img src={plan.image_url} alt={plan.name} className="w-full h-48 object-cover" />
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <p className="text-sm text-slate-600">{restaurant?.business_name}</p>
                  <div className="text-4xl font-bold text-emerald-600 mt-2">
                    ${plan.price}
                    <span className="text-sm text-slate-600 font-normal">/{plan.billing_cycle}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">{plan.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span className="capitalize">{plan.delivery_frequency} delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>{plan.included_items?.length || 0} items included</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span className="capitalize">{plan.delivery_type}</span>
                    </div>
                    {plan.customizable && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Customizable</span>
                      </div>
                    )}
                  </div>

                  {plan.delivery_days && plan.delivery_days.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Delivery Days:</p>
                      <div className="flex gap-1 flex-wrap">
                        {plan.delivery_days.map(day => (
                          <Badge key={day} variant="outline" className="capitalize">
                            {day.slice(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleSubscribe(plan)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Subscribe Now
                  </Button>

                  {plan.max_subscribers && (
                    <p className="text-xs text-center text-slate-500">
                      {plan.active_subscribers || 0} of {plan.max_subscribers} spots filled
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {plans.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Plans Available</h3>
              <p className="text-slate-600">Check back soon for subscription options</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}