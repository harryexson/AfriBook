import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield, DollarSign, Users, HeadphonesIcon, TrendingUp, Settings,
  AlertCircle, CheckCircle, Clock, Target, BarChart3, UserPlus,
  CreditCard, MessageSquare, Rocket, Sliders, Code // New imports
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Subscription } from "@/entities/Subscription";
import { Transaction } from "@/entities/Transaction";
import { SupportTicket } from "@/entities/SupportTicket";
import { Restaurant } from "@/entities/Restaurant";

export default function DeveloperBackoffice() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    mrr: 0,
    activeSubscriptions: 0,
    trialAccounts: 0,
    totalRestaurants: 0,
    openTickets: 0,
    churnRate: 0,
    avgCustomerValue: 0
  });

  const sections = [
    {
      title: "Operations Management",
      icon: Settings,
      items: [
        {
          name: "All Restaurants",
          description: "View and manage all restaurants on the platform",
          icon: Target,
          url: createPageUrl("BackofficeRestaurants"),
          color: "from-emerald-500 to-emerald-600"
        },
        {
          name: "Subscriptions",
          description: "Manage restaurant subscriptions, billing, trials, and cancellations",
          icon: CreditCard,
          url: createPageUrl("BackofficeSubscriptions"),
          color: "from-blue-500 to-blue-600"
        },
        {
          name: "Customer Support",
          description: "Handle support tickets, customer issues, and refunds",
          icon: MessageSquare,
          url: createPageUrl("BackofficeCustomerSupport"),
          color: "from-green-500 to-green-600"
        },
        {
          name: "Staff Management",
          description: "Manage admin users, roles, permissions, and invitations",
          icon: Users,
          url: createPageUrl("BackofficeStaff"),
          color: "from-purple-500 to-purple-600"
        },
        {
          name: "Accounting",
          description: "Track transactions, revenue, commissions, and payouts",
          icon: DollarSign,
          url: createPageUrl("BackofficeAccounting"),
          color: "from-amber-500 to-amber-600"
        },
      ]
    },
    {
      title: "Strategy & Growth",
      icon: TrendingUp,
      items: [
        {
          name: "Competitive Analysis",
          description: "Track competitors, pricing, features, and market positioning",
          icon: Target,
          url: createPageUrl("BackofficeCompetitive"),
          color: "from-amber-500 to-amber-600"
        },
        {
          name: "Strategic Positioning",
          description: "Equipment partnerships, customer acquisition, growth strategies",
          icon: Rocket,
          url: createPageUrl("StrategicPositioning"),
          color: "from-indigo-500 to-purple-600"
        },
        {
          name: "Analytics Dashboard",
          description: "Business metrics, KPIs, growth charts, and insights",
          icon: BarChart3,
          url: createPageUrl("AnalyticsDashboard"),
          color: "from-pink-500 to-rose-600"
        }
      ]
    },
    {
      title: "Platform Configuration",
      icon: Sliders,
      items: [
        {
          name: "System Settings",
          description: "Configure platform settings, feature flags, and system parameters",
          icon: Settings,
          url: createPageUrl("BackofficeSettings"),
          color: "from-slate-500 to-slate-600"
        },
        {
          name: "API Management",
          description: "Manage API keys, webhooks, rate limits, and integrations",
          icon: Code,
          url: createPageUrl("APIManagement"),
          color: "from-cyan-500 to-cyan-600"
        }
      ]
    }
  ];

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if user is super admin (you can customize this logic)
      const isDeveloper = currentUser.role === "admin" ||
                          currentUser.email === "developer@restrobuddy.com" ||
                          currentUser.email.endsWith("@restrobuddy.com");

      if (isDeveloper) {
        setIsAuthorized(true);
        await loadDashboardStats();
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error("Error checking access:", error);
      setIsAuthorized(false);
    }
    setIsLoading(false);
  };

  const loadDashboardStats = async () => {
    try {
      const [subscriptions, transactions, tickets, restaurants] = await Promise.all([
        Subscription.list(),
        Transaction.list(),
        SupportTicket.list(),
        Restaurant.list()
      ]);

      const activeSubs = subscriptions.filter(s => s.status === "active");
      const trialSubs = subscriptions.filter(s => s.status === "trial");
      const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress");

      const mrr = activeSubs.reduce((sum, sub) => sum + (sub.mrr || 0), 0);
      const totalRevenue = transactions
        .filter(t => t.status === "completed" && t.type !== "refund")
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalRevenue,
        mrr,
        activeSubscriptions: activeSubs.length,
        trialAccounts: trialSubs.length,
        totalRestaurants: restaurants.length,
        openTickets: openTickets.length,
        churnRate: 2.3, // Calculate based on cancellations
        avgCustomerValue: activeSubs.length > 0 ? totalRevenue / activeSubs.length : 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading backoffice...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-500">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
            <p className="text-slate-600 mb-6">
              You don't have permission to access the Developer Backoffice.
            </p>
            <p className="text-sm text-slate-500">
              This area is restricted to RESTROBUDDY administrators only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 border-b border-emerald-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Shield className="w-8 h-8" />
                Developer Backoffice
              </h1>
              <p className="text-emerald-100 mt-1">RESTROBUDDY Administration Portal</p>
            </div>
            <Badge className="bg-white text-emerald-700 font-bold px-4 py-2">
              {user?.email}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
              <p className="text-sm text-emerald-100 mt-1">All-time</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${stats.mrr.toFixed(0)}</p>
              <p className="text-sm text-blue-100 mt-1">Monthly Recurring Revenue</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Active Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
              <p className="text-sm text-purple-100 mt-1">+{stats.trialAccounts} in trial</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <HeadphonesIcon className="w-4 h-4" />
                Open Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.openTickets}</p>
              <p className="text-sm text-amber-100 mt-1">Support requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Churn Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.churnRate}%</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Avg Customer Value</p>
                  <p className="text-2xl font-bold text-slate-900">${stats.avgCustomerValue.toFixed(0)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Restaurants</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalRestaurants}</p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Trial Conversion</p>
                  <p className="text-2xl font-bold text-slate-900">68%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Sections */}
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <section.icon className="w-6 h-6 text-emerald-300" />
              {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.items.map((item, itemIndex) => {
                const baseColor = item.color.split('-')[1]; // e.g., 'blue', 'green'
                const BadgeComponent = () => {
                  if (item.badge) {
                    return <Badge className={`bg-${baseColor}-100 text-${baseColor}-800`}>{item.badge}</Badge>;
                  }
                  if (item.name === "Subscriptions") {
                    return <Badge className={`bg-${baseColor}-100 text-${baseColor}-800`}>{stats.activeSubscriptions}</Badge>;
                  }
                  if (item.name === "Customer Support") {
                    return <Badge className={`bg-${baseColor}-100 text-${baseColor}-800`}>{stats.openTickets}</Badge>;
                  }
                  if (item.name === "Staff Management") {
                    return <Badge className={`bg-${baseColor}-100 text-${baseColor}-800`}>5</Badge>; // Hardcoded for now
                  }
                  if (item.name === "Accounting") {
                    return <Badge className={`bg-${baseColor}-100 text-${baseColor}-800`}>Live</Badge>; // Hardcoded for now
                  }
                  return null;
                };

                return (
                  <Link key={itemIndex} to={item.url}>
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group">
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl transition-colors bg-${baseColor}-100 group-hover:bg-${baseColor}-200`}>
                            <item.icon className={`w-8 h-8 text-${baseColor}-600`} />
                          </div>
                          <BadgeComponent />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{item.name}</h3>
                        <p className="text-sm text-slate-600">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        <Card className="border-0 shadow-xl mt-8 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader>
            <CardTitle className="text-2xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 bg-emerald-600 hover:bg-emerald-700" asChild>
                <Link to={createPageUrl("BackofficeStaff")}>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Invite Staff
                </Link>
              </Button>
              <Button className="h-20 bg-blue-600 hover:bg-blue-700" variant="default" asChild>
                <Link to={createPageUrl("BackofficeSubscriptions")}>
                  <DollarSign className="w-5 h-5 mr-2" />
                  Process Refund
                </Link>
              </Button>
              <Button className="h-20 bg-purple-600 hover:bg-purple-700" variant="default" asChild>
                <Link to={createPageUrl("BackofficeCustomerSupport")}>
                  <Clock className="w-5 h-5 mr-2" />
                  View Tickets
                </Link>
              </Button>
              <Button className="h-20 bg-amber-600 hover:bg-amber-700" variant="default" asChild>
                <Link to={createPageUrl("AnalyticsDashboard")}>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Run Report
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}