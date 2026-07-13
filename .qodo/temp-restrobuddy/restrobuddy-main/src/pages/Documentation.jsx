import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Rocket, 
  Settings, 
  Smartphone, 
  ChefHat, 
  CreditCard,
  Users,
  BarChart,
  MessageSquare,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Documentation() {
  const sections = [
    {
      icon: Rocket,
      title: "Getting Started",
      description: "Quick start guide to set up your restaurant",
      articles: [
        "Creating your account",
        "Adding your restaurant details",
        "Setting up your menu",
        "Connecting payments",
        "Going live checklist"
      ]
    },
    {
      icon: Smartphone,
      title: "Online Ordering",
      description: "Web and mobile ordering setup",
      articles: [
        "Customizing your order page",
        "Managing menu availability",
        "Setting operating hours",
        "Order notifications",
        "Customer order tracking"
      ]
    },
    {
      icon: ChefHat,
      title: "Kitchen Display System",
      description: "Kitchen operations and displays",
      articles: [
        "KDS setup guide",
        "Order flow management",
        "Status updates",
        "Printer integration",
        "Multiple station setup"
      ]
    },
    {
      icon: MessageSquare,
      title: "SMS Ordering",
      description: "Text-to-order features",
      articles: [
        "Setting up SMS keywords",
        "Customer text flows",
        "Automated responses",
        "SMS notifications",
        "Best practices"
      ]
    },
    {
      icon: CreditCard,
      title: "Payments",
      description: "Payment processing setup",
      articles: [
        "Square integration",
        "Processing refunds",
        "Payment reports",
        "Tips and gratuity",
        "Multi-location billing"
      ]
    },
    {
      icon: Users,
      title: "Staff Management",
      description: "Team and scheduling",
      articles: [
        "Adding employees",
        "Role permissions",
        "Time clock setup",
        "Shift scheduling",
        "Payroll basics"
      ]
    },
    {
      icon: BarChart,
      title: "Reports & Analytics",
      description: "Business insights",
      articles: [
        "Sales reports",
        "Menu analytics",
        "Customer insights",
        "Peak hour analysis",
        "Exporting data"
      ]
    },
    {
      icon: Settings,
      title: "Advanced Settings",
      description: "Customization options",
      articles: [
        "Branding settings",
        "Notification preferences",
        "Integration options",
        "API access",
        "Security settings"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="bg-amber-500 text-white mb-6 text-sm px-4 py-2">
            <BookOpen className="w-4 h-4 inline mr-1" /> DOCUMENTATION
          </Badge>
          <h1 className="text-5xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-emerald-100">
            Everything you need to know about using RESTROBUDDY
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Quick Start */}
        <Card className="border-0 shadow-xl mb-12 bg-gradient-to-r from-emerald-50 to-blue-50">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">New to RESTROBUDDY?</h2>
                <p className="text-slate-600">Start with our quick setup guide and be live in under an hour.</p>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Quick Start Guide <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Sections */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {sections.map((section, idx) => (
            <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
                    <p className="text-sm text-slate-600">{section.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {section.articles.map((article, aIdx) => (
                    <li key={aIdx} className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 cursor-pointer transition-colors">
                      <ArrowRight className="w-4 h-4" />
                      {article}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Section */}
        <Card className="border-0 shadow-xl mb-12">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <Badge className="bg-purple-100 text-purple-700 mb-3">DEVELOPERS</Badge>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">API Reference</h2>
                <p className="text-slate-600 mb-4">
                  Build custom integrations with our REST API. Available for Enterprise plans.
                </p>
                <Button variant="outline">
                  View API Docs <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="w-full md:w-1/3 bg-slate-900 rounded-xl p-4 font-mono text-sm text-green-400">
                <p className="text-slate-500"># Example API call</p>
                <p>curl -X GET \</p>
                <p className="pl-2">api.restrobuddy.app/v1/orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Need Help */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Our support team is ready to help
          </p>
          <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-full px-8">
            <Link to={createPageUrl("Support")}>
              Contact Support <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">© 2024 RESTROBUDDY. All rights reserved.</p>
          <p className="text-slate-500 text-sm font-semibold mt-1">by Bold Intelligent Solutions Partners Inc. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}