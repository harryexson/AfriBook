import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Tablet, 
  Smartphone,
  ChefHat,
  BarChart3,
  Users,
  Package,
  Star,
  Truck,
  Check,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEOHead from "@/components/seo/SEOHead";

export default function Features() {
  const coreFeatures = [
    {
      icon: MessageSquare,
      title: "SMS Keyword Ordering",
      description: "Customers text keywords like 'BURGER' or 'PIZZA' to instantly receive ordering links. No app downloads required.",
      benefits: [
        "Zero friction ordering experience",
        "Works on any phone (even flip phones)",
        "Instant response via text message",
        "Perfect for regular customers"
      ]
    },
    {
      icon: Tablet,
      title: "BYOD Kiosk Mode",
      description: "Transform any tablet into a self-service ordering kiosk. No expensive proprietary hardware needed.",
      benefits: [
        "Save $1,000+ on hardware costs",
        "Use iPads, Android tablets, or computers",
        "Full-screen touchscreen interface",
        "Automatic order routing to kitchen"
      ]
    },
    {
      icon: Smartphone,
      title: "Online Ordering",
      description: "Beautiful, mobile-optimized ordering website for your customers.",
      benefits: [
        "Custom branded ordering page",
        "Real-time menu updates",
        "Order status tracking",
        "Payment processing included"
      ]
    },
    {
      icon: ChefHat,
      title: "Kitchen Display System",
      description: "Real-time order management for your kitchen staff.",
      benefits: [
        "Color-coded order statuses",
        "Preparation time tracking",
        "One-tap status updates",
        "SMS customer notifications"
      ]
    }
  ];

  const advancedFeatures = [
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track stock levels, costs, and get low-stock alerts automatically."
    },
    {
      icon: Users,
      title: "Employee Management",
      description: "Time clock, shift scheduling, role permissions, and tip tracking."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Sales trends, best sellers, peak hours, and customer insights."
    },
    {
      icon: Star,
      title: "Loyalty Program",
      description: "Built-in rewards system to keep customers coming back."
    },
    {
      icon: Truck,
      title: "Delivery Integration",
      description: "Access 1M+ drivers through Aura Drive, DoorDash, and more."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SEOHead 
        title="RESTROBUDDY Features - SMS Ordering, Kiosk Mode & Kitchen Display"
        description="Powerful restaurant features: SMS keyword ordering, BYOD kiosk mode, online ordering, kitchen display system, inventory management, employee scheduling, delivery integration & analytics."
        keywords="sms ordering, kiosk mode, kitchen display system, restaurant features, online ordering, inventory management, employee scheduling, restaurant analytics"
      />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-amber-500 text-white mb-6 text-sm px-4 py-2">
            COMPLETE SOLUTION
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Everything Your Restaurant Needs
          </h1>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto mb-2">
            <strong>Your all-in-one solution for modern restaurant management</strong>
          </p>
          <p className="text-lg text-emerald-100 max-w-3xl mx-auto mb-8">
            From ordering to kitchen management to delivery - all in one powerful platform
          </p>
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8 py-6" asChild>
            <Link to={createPageUrl("Pricing")}>
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Core Features */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Core Features</h2>
            <p className="text-xl text-slate-600">The foundation of modern restaurant ordering</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {coreFeatures.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-6">{feature.description}</p>
                  <div className="space-y-3">
                    {feature.benefits.map((benefit, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Advanced Features */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Advanced Features</h2>
            <p className="text-xl text-slate-600">Scale your business with powerful tools</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Restaurant?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join 500+ restaurants already using RESTROBUDDY
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8 py-6" asChild>
              <Link to={createPageUrl("Pricing")}>
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-slate-100 rounded-full px-8 py-6 shadow-xl" asChild>
              <Link to={createPageUrl("KioskMode")}>
                Try Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            © 2024 RESTROBUDDY. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            by Bold Intelligent Solutions Partners Inc. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}