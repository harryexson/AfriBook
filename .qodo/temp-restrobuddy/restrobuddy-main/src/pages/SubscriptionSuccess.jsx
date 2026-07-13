import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Subscription } from "@/entities/Subscription";
import { Restaurant } from "@/entities/Restaurant";

export default function SubscriptionSuccess() {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionUpdated, setSubscriptionUpdated] = useState(false);

  useEffect(() => {
    const updateSubscription = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) {
          setIsLoading(false);
          return;
        }

        const user = await base44.auth.me();
        
        // Find user's subscription and update it
        const subscriptions = await Subscription.filter({ owner_email: user.email });
        if (subscriptions.length > 0) {
          const sub = subscriptions[0];
          await Subscription.update(sub.id, {
            status: 'active',
            start_date: new Date().toISOString().split('T')[0],
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        }

        // Update restaurant status
        const restaurants = await Restaurant.filter({ owner_email: user.email });
        if (restaurants.length > 0) {
          await Restaurant.update(restaurants[0].id, { status: 'active' });
        }

        setSubscriptionUpdated(true);
      } catch (error) {
        console.error("Error updating subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    updateSubscription();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-0">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Welcome to RESTROBUDDY!
          </h1>
          
          <p className="text-lg text-slate-600 mb-8">
            Your subscription is now active. You have full access to all features to help grow your restaurant business.
          </p>

          <div className="space-y-4">
            <Link to={createPageUrl("AdminDashboard")}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            <Link to={createPageUrl("OnboardingWizard")}>
              <Button variant="outline" className="w-full py-6">
                Complete Setup Wizard
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-500 mt-8">
            Need help? <Link to={createPageUrl("Support")} className="text-emerald-600 hover:underline">Contact our support team</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}