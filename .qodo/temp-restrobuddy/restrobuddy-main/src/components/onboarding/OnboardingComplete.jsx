import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ArrowRight,
  Store,
  Utensils,
  Users,
  BarChart,
  Rocket
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";


export default function OnboardingComplete({ restaurant, formData }) {
  const navigate = useNavigate();


  const quickLinks = [
    {
      title: "View Dashboard",
      description: "See your restaurant analytics and overview",
      icon: BarChart,
      url: createPageUrl("AdminDashboard"),
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Manage Menu",
      description: "Add, edit, or remove menu items",
      icon: Utensils,
      url: createPageUrl("OrderMenu"),
      color: "bg-orange-100 text-orange-600"
    },
    {
      title: "Staff Management",
      description: "Manage your team and schedules",
      icon: Users,
      url: createPageUrl("StaffManagement"),
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "View Marketplace",
      description: "See how your restaurant appears to customers",
      icon: Store,
      url: createPageUrl("Marketplace"),
      color: "bg-green-100 text-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12 px-4">

      <div className="max-w-3xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-14 h-14 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            🎉 Congratulations!
          </h1>
          <p className="text-xl text-slate-600">
            <strong>{formData.business_name}</strong> is now set up on RESTROBUDDY
          </p>
        </div>

        {/* Summary Card */}
        <Card className="border-0 shadow-2xl mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Rocket className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-slate-900">You're All Set!</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {formData.menuItems.length}
                </div>
                <div className="text-sm text-slate-600">Menu Items</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {formData.teamMembers.length}
                </div>
                <div className="text-sm text-slate-600">Team Members</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {[
                    formData.marketplace_enabled,
                    formData.enable_loyalty,
                    formData.enable_reservations,
                    formData.enable_delivery
                  ].filter(Boolean).length}
                </div>
                <div className="text-sm text-slate-600">Features Enabled</div>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => navigate(createPageUrl("AdminDashboard"))}
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="text-left">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center">
            What would you like to do next?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {quickLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <Card
                  key={idx}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-emerald-300"
                  onClick={() => navigate(link.url)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${link.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{link.title}</div>
                      <div className="text-sm text-slate-500">{link.description}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-slate-500">
          Need help? Visit our <a href="#" className="text-emerald-600 hover:underline">Help Center</a> or contact support.
        </p>
      </div>
    </div>
  );
}