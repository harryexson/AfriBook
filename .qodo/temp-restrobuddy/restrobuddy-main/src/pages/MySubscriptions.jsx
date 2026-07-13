import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { CustomerSubscription } from "@/entities/CustomerSubscription";
import { SubscriptionPlan } from "@/entities/SubscriptionPlan";
import { Calendar, Package, Pause, Play, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function MySubscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const [subList, planList] = await Promise.all([
        CustomerSubscription.filter({ customer_email: user.email }),
        SubscriptionPlan.list()
      ]);
      
      setSubscriptions(subList);
      
      const planMap = {};
      planList.forEach(p => {
        planMap[p.id] = p;
      });
      setPlans(planMap);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    }
    setIsLoading(false);
  };

  const handlePause = async (sub) => {
    try {
      await CustomerSubscription.update(sub.id, { status: 'paused' });
      await loadSubscriptions();
      toast.success("Subscription paused");
    } catch (error) {
      toast.error("Failed to pause subscription");
    }
  };

  const handleResume = async (sub) => {
    try {
      await CustomerSubscription.update(sub.id, { status: 'active' });
      await loadSubscriptions();
      toast.success("Subscription resumed");
    } catch (error) {
      toast.error("Failed to resume subscription");
    }
  };

  const handleCancel = async (sub) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;
    
    try {
      await CustomerSubscription.update(sub.id, { status: 'cancelled' });
      await loadSubscriptions();
      toast.success("Subscription cancelled");
    } catch (error) {
      toast.error("Failed to cancel subscription");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Subscriptions</h1>
          <p className="text-slate-600">Manage your recurring meal plans</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {subscriptions.map(sub => {
            const plan = plans[sub.plan_id];
            return (
              <Card key={sub.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan?.name || "Subscription"}</CardTitle>
                      <p className="text-2xl font-bold text-emerald-600 mt-2">
                        ${sub.price}
                        <span className="text-sm text-slate-600 font-normal">/month</span>
                      </p>
                    </div>
                    <Badge className={getStatusColor(sub.status)}>
                      {sub.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Next Delivery:</span>
                      <span className="font-medium">
                        {new Date(sub.next_delivery_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Total Orders:</span>
                      <span className="font-medium">{sub.total_orders || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Started:</span>
                      <span className="font-medium">
                        {new Date(sub.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold mb-1">Delivery Address:</p>
                    <p className="text-sm text-slate-600">
                      {sub.delivery_address?.street}<br />
                      {sub.delivery_address?.city}, {sub.delivery_address?.state} {sub.delivery_address?.zip}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {sub.status === 'active' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePause(sub)}
                          className="flex-1"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(sub)}
                          className="flex-1 text-red-600"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {sub.status === 'paused' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleResume(sub)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(sub)}
                          className="flex-1 text-red-600"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {subscriptions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Subscriptions</h3>
              <p className="text-slate-600 mb-6">Browse available plans to get started</p>
              <Button 
                onClick={() => navigate(createPageUrl("BrowseSubscriptions"))}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Browse Plans
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}