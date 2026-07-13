import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Check,
  X,
  TrendingUp,
  DollarSign,
  Users,
  ChefHat,
  AlertCircle,
  ArrowRight,
  Store,
  Percent,
  CreditCard,
  Clock,
  Shield,
  Zap,
  Target
} from "lucide-react";

export default function CompetitiveComparison() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const comparisonData = {
    commissions: {
      title: "Commission Rates & Fees",
      icon: Percent,
      data: [
        {
          platform: "UberEats",
          commission: "15-30%",
          deliveryFee: "$3-8",
          serviceFee: "15% + $2",
          monthlyFee: "$0",
          color: "red",
          total: "~30-50% per order"
        },
        {
          platform: "DoorDash",
          commission: "15-30%",
          deliveryFee: "$4-10",
          serviceFee: "10-20%",
          monthlyFee: "$0",
          color: "orange",
          total: "~25-50% per order"
        },
        {
          platform: "RESTROBUDDY",
          commission: "12.5%",
          deliveryFee: "$0-5",
          serviceFee: "$0",
          monthlyFee: "$99-599",
          color: "green",
          total: "12.5% + subscription",
          highlight: true
        }
      ]
    },
    ownership: {
      title: "Customer Data & Relationships",
      icon: Users,
      comparison: [
        {
          feature: "Own customer data",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "RestroBuddy: Full access to emails, phone numbers, order history"
        },
        {
          feature: "Direct marketing allowed",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "RestroBuddy: Email, SMS, loyalty programs directly to YOUR customers"
        },
        {
          feature: "Customer loyalty programs",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "Build brand loyalty with your own rewards program"
        },
        {
          feature: "Control your pricing",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "No price jacking - you set the prices, we don't add markups"
        }
      ]
    },
    features: {
      title: "Platform Features",
      icon: Zap,
      comparison: [
        {
          feature: "In-store POS system",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "Full point-of-sale for dine-in, takeout, and delivery"
        },
        {
          feature: "Kiosk self-ordering",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "Any tablet becomes a self-service kiosk - no expensive hardware"
        },
        {
          feature: "SMS ordering",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "Customers text keywords to order (e.g., 'PIZZA' → order)"
        },
        {
          feature: "Kitchen display system",
          ubereats: true,
          doordash: false,
          restrobuddy: true,
          details: "Real-time order management across all channels"
        },
        {
          feature: "Inventory management",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "Track stock, costs, spoilage, and reorder points"
        },
        {
          feature: "Employee scheduling",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "Shift scheduling, time tracking, and payroll integration"
        },
        {
          feature: "Payroll & EWA",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "Built-in payroll and earned wage access for staff"
        },
        {
          feature: "Table management",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "Manage reservations, waitlists, and table assignments"
        },
        {
          feature: "Group ordering",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "Perfect for corporate lunches and events"
        },
        {
          feature: "Subscription meal plans",
          ubereats: false,
          doordash: false,
          restrobuddy: true,
          details: "Offer recurring meal subscriptions to customers"
        },
        {
          feature: "Advanced analytics",
          ubereats: true,
          doordash: true,
          restrobuddy: true,
          details: "Sales trends, customer insights, inventory turnover"
        }
      ]
    },
    costs: {
      title: "Total Cost of Ownership",
      icon: DollarSign,
      scenarios: [
        {
          scenario: "Small Restaurant (100 orders/month, $30 avg)",
          ubereats: {
            commission: "$900 (30% × $3,000)",
            fees: "$150 (delivery/service)",
            monthly: "$0",
            total: "$1,050/month",
            annual: "$12,600/year"
          },
          doordash: {
            commission: "$750 (25% × $3,000)",
            fees: "$200 (delivery/service)",
            monthly: "$0",
            total: "$950/month",
            annual: "$11,400/year"
          },
          restrobuddy: {
            commission: "$375 (12.5% × $3,000)",
            fees: "$0",
            monthly: "$99 (Starter)",
            total: "$474/month",
            annual: "$5,688/year",
            savings: "$5,712-6,912/year"
          }
        },
        {
          scenario: "Medium Restaurant (500 orders/month, $35 avg)",
          ubereats: {
            commission: "$5,250 (30% × $17,500)",
            fees: "$750",
            monthly: "$0",
            total: "$6,000/month",
            annual: "$72,000/year"
          },
          doordash: {
            commission: "$4,375 (25% × $17,500)",
            fees: "$1,000",
            monthly: "$0",
            total: "$5,375/month",
            annual: "$64,500/year"
          },
          restrobuddy: {
            commission: "$2,188 (12.5% × $17,500)",
            fees: "$0",
            monthly: "$299 (Professional)",
            total: "$2,487/month",
            annual: "$29,844/year",
            savings: "$34,656-42,156/year"
          }
        },
        {
          scenario: "Large Restaurant (1,500 orders/month, $40 avg)",
          ubereats: {
            commission: "$18,000 (30% × $60,000)",
            fees: "$2,250",
            monthly: "$0",
            total: "$20,250/month",
            annual: "$243,000/year"
          },
          doordash: {
            commission: "$15,000 (25% × $60,000)",
            fees: "$3,000",
            monthly: "$0",
            total: "$18,000/month",
            annual: "$216,000/year"
          },
          restrobuddy: {
            commission: "$7,500 (12.5% × $60,000)",
            fees: "$0",
            monthly: "$599 (Enterprise)",
            total: "$8,099/month",
            annual: "$97,188/year",
            savings: "$118,812-145,812/year"
          }
        }
      ]
    }
  };

  const keyDifferentiators = [
    {
      icon: DollarSign,
      title: "Keep More Money",
      problem: "UberEats/DoorDash take 25-30% of every order",
      solution: "RestroBuddy charges only 12.5% - that's 50% less in fees!",
      example: "On $10,000 in sales: Save $1,250-1,750/month"
    },
    {
      icon: Users,
      title: "Own Your Customers",
      problem: "Third-party apps own the customer relationship and data",
      solution: "Your customers are YOUR customers - build direct relationships",
      example: "Email them promotions, text special offers, create loyalty programs"
    },
    {
      icon: Store,
      title: "All-in-One Platform",
      problem: "Need separate tools for POS, online ordering, inventory, staff",
      solution: "Everything in one place: POS, kiosk, SMS orders, inventory, payroll",
      example: "Replace 5+ tools with 1 platform - save $500-1,000/month in software costs"
    },
    {
      icon: Shield,
      title: "No Predatory Practices",
      problem: "UberEats promotes competitors on YOUR menu page",
      solution: "We NEVER promote competitors - your menu stays yours",
      example: "No 'Customers Also Ordered From...' showing your competitors"
    },
    {
      icon: CreditCard,
      title: "Transparent Pricing",
      problem: "Hidden fees, delivery charges, service fees add up",
      solution: "Simple flat monthly fee + 12.5% commission - no surprises",
      example: "Predictable costs, no mystery charges"
    },
    {
      icon: Zap,
      title: "Modern Features",
      problem: "Delivery-only apps don't help with in-store operations",
      solution: "Kiosk ordering, kitchen displays, table management, payroll",
      example: "Run your entire restaurant on one platform"
    }
  ];

  const whyRestaurantsLeave = [
    {
      platform: "UberEats",
      reasons: [
        "30% commission rate is unsustainable for profit margins",
        "They promote competitors directly on your restaurant page",
        "Customer data is locked - can't build loyalty",
        "Forced to increase menu prices to compensate",
        "Zero control over delivery quality or driver behavior",
        "Algorithm changes can tank your visibility overnight"
      ]
    },
    {
      platform: "DoorDash",
      reasons: [
        "25-30% commission eats into already thin margins",
        "DashPass prioritizes other restaurants in search results",
        "No access to customer contact information",
        "Delivery fees discourage customers from ordering",
        "Must use their drivers - no control over experience",
        "Hidden fees and charges reduce actual earnings"
      ]
    }
  ];

  const successMetrics = [
    { metric: "Average Savings", value: "$18,000/year", description: "Compared to UberEats/DoorDash" },
    { metric: "Commission Rate", value: "12.5%", description: "vs 25-30% on competitors" },
    { metric: "Customer Retention", value: "85%", description: "Own your customer relationships" },
    { metric: "Setup Time", value: "< 24 hours", description: "vs weeks for competitors" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-white/20 text-white px-4 py-2 text-sm">
            COMPETITIVE ANALYSIS
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Why Smart Restaurants Choose<br/>
            <span className="text-emerald-300">RESTROBUDDY</span> Over UberEats & DoorDash
          </h1>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto mb-8">
            Stop giving away 30% of your revenue. Own your customers. Grow your business on your terms.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-lg">
              <Link to={createPageUrl("Pricing")}>
                See Pricing <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
              <Link to={createPageUrl("Contact")}>
                Schedule Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Success Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {successMetrics.map((item, idx) => (
            <Card key={idx} className="border-0 shadow-xl text-center">
              <CardContent className="p-6">
                <p className="text-4xl font-bold text-emerald-600 mb-2">{item.value}</p>
                <p className="font-semibold text-slate-900 mb-1">{item.metric}</p>
                <p className="text-xs text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Differentiators */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            The RESTROBUDDY Advantage
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Built by restaurateurs, for restaurateurs. Not a marketplace that prioritizes delivery drivers and customers over your business.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {keyDifferentiators.map((diff, idx) => (
              <Card 
                key={idx} 
                className="border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <diff.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{diff.title}</CardTitle>
                      <div className="space-y-3">
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                          <p className="text-sm text-red-900">
                            <strong className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Problem:
                            </strong>
                            {diff.problem}
                          </p>
                        </div>
                        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded">
                          <p className="text-sm text-emerald-900">
                            <strong className="flex items-center gap-2">
                              <Check className="w-4 h-4" />
                              RESTROBUDDY Solution:
                            </strong>
                            {diff.solution}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-xs text-blue-900">
                            <strong>Example:</strong> {diff.example}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Commission Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Commission & Fee Breakdown
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {comparisonData.commissions.data.map((platform, idx) => (
              <Card 
                key={idx} 
                className={`border-0 shadow-xl ${platform.highlight ? 'ring-4 ring-emerald-500' : ''}`}
              >
                {platform.highlight && (
                  <div className="bg-emerald-500 text-white text-center py-2 font-semibold rounded-t-xl text-sm">
                    ⭐ BEST VALUE
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center justify-between">
                    {platform.platform}
                    {platform.highlight && <Badge className="bg-emerald-600">Recommended</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-slate-600">Commission Rate</span>
                      <span className="font-semibold">{platform.commission}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-slate-600">Delivery Fee</span>
                      <span className="font-semibold">{platform.deliveryFee}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-slate-600">Service Fee</span>
                      <span className="font-semibold">{platform.serviceFee}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-600">Monthly Subscription</span>
                      <span className="font-semibold">{platform.monthlyFee}</span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${
                    platform.highlight ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-slate-100'
                  }`}>
                    <p className="text-xs text-slate-600 mb-1">Effective Cost</p>
                    <p className={`text-2xl font-bold ${
                      platform.highlight ? 'text-emerald-700' : 'text-slate-900'
                    }`}>
                      {platform.total}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cost Scenarios */}
          <h3 className="text-2xl font-bold text-center text-slate-900 mb-8">
            Real-World Cost Comparison
          </h3>
          
          <div className="space-y-6">
            {comparisonData.costs.scenarios.map((scenario, idx) => (
              <Card key={idx} className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">{scenario.scenario}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                      <p className="font-semibold text-red-900 mb-3">UberEats</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Commission:</span>
                          <span className="text-red-900">{scenario.ubereats.commission}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Fees:</span>
                          <span className="text-red-900">{scenario.ubereats.fees}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-bold">
                          <span>Total Cost:</span>
                          <span className="text-red-900">{scenario.ubereats.total}</span>
                        </div>
                        <div className="text-xs text-red-700 pt-1">
                          Annual: {scenario.ubereats.annual}
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                      <p className="font-semibold text-orange-900 mb-3">DoorDash</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Commission:</span>
                          <span className="text-orange-900">{scenario.doordash.commission}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Fees:</span>
                          <span className="text-orange-900">{scenario.doordash.fees}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-bold">
                          <span>Total Cost:</span>
                          <span className="text-orange-900">{scenario.doordash.total}</span>
                        </div>
                        <div className="text-xs text-orange-700 pt-1">
                          Annual: {scenario.doordash.annual}
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-emerald-500 relative">
                      <Badge className="absolute -top-3 right-4 bg-emerald-600 text-white">
                        WINNER
                      </Badge>
                      <p className="font-semibold text-emerald-900 mb-3">RESTROBUDDY</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Commission:</span>
                          <span className="text-emerald-900">{scenario.restrobuddy.commission}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Subscription:</span>
                          <span className="text-emerald-900">{scenario.restrobuddy.monthly}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-bold">
                          <span>Total Cost:</span>
                          <span className="text-emerald-900">{scenario.restrobuddy.total}</span>
                        </div>
                        <div className="text-xs text-emerald-700 pt-1">
                          Annual: {scenario.restrobuddy.annual}
                        </div>
                        <div className="bg-green-100 rounded p-2 mt-3">
                          <p className="text-xs font-bold text-green-900">
                            💰 YOU SAVE: {scenario.restrobuddy.savings}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Feature-by-Feature Comparison
          </h2>
          
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-900">Feature</th>
                    <th className="text-center p-4 font-semibold text-slate-900">UberEats</th>
                    <th className="text-center p-4 font-semibold text-slate-900">DoorDash</th>
                    <th className="text-center p-4 font-semibold text-emerald-700 bg-emerald-50">
                      RESTROBUDDY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.features.comparison.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-slate-900">{row.feature}</p>
                          <p className="text-xs text-slate-600 mt-1">{row.details}</p>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        {row.ubereats ? (
                          <Check className="w-6 h-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="text-center p-4">
                        {row.doordash ? (
                          <Check className="w-6 h-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="text-center p-4 bg-emerald-50">
                        {row.restrobuddy ? (
                          <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-slate-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Why Restaurants Leave Competitors */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Why Restaurants Are Leaving UberEats & DoorDash
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {whyRestaurantsLeave.map((platform, idx) => (
              <Card key={idx} className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    Leaving {platform.platform}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {platform.reasons.map((reason, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Customer Data Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Own Your Customer Relationships
          </h2>
          
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-900">Customer Data Access</th>
                    <th className="text-center p-4 font-semibold text-slate-900">UberEats</th>
                    <th className="text-center p-4 font-semibold text-slate-900">DoorDash</th>
                    <th className="text-center p-4 font-semibold text-emerald-700 bg-emerald-50">
                      RESTROBUDDY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.ownership.comparison.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-slate-900">{row.feature}</p>
                          <p className="text-xs text-slate-600 mt-1">{row.details}</p>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        {row.ubereats ? (
                          <Check className="w-6 h-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="text-center p-4">
                        {row.doordash ? (
                          <Check className="w-6 h-6 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="text-center p-4 bg-emerald-50">
                        {row.restrobuddy ? (
                          <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-slate-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">With RESTROBUDDY:</h3>
            <p className="text-lg mb-6">
              Every customer who orders is YOUR customer forever. Build loyalty, send promotions, 
              create relationships - without asking permission from a marketplace.
            </p>
            <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50">
              <Link to={createPageUrl("Pricing")}>
                Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Bottom CTA */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Take Control?</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of restaurants saving thousands per year while building stronger customer relationships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 px-8 py-6 text-lg">
                <Link to={createPageUrl("Pricing")}>
                  Start Free 14-Day Trial
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                <Link to={createPageUrl("Contact")}>
                  Schedule Demo Call
                </Link>
              </Button>
            </div>
            <p className="text-sm text-slate-400 mt-6">
              No credit card required • Cancel anytime • Setup in 24 hours
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}