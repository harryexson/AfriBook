import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChefHat,
  Tablet,
  MessageSquare,
  TrendingUp,
  Clock,
  Users,
  Zap,
  Shield,
  Check,
  ArrowRight,
  Star,
  Truck
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import SEOHead from "@/components/seo/SEOHead";
import StructuredData, { createOrganizationSchema, createSoftwareSchema, createFAQSchema } from "@/components/seo/StructuredData";

export default function Home() {
  const features = [
    {
      icon: MessageSquare,
      title: "SMS Keyword Ordering",
      description: "Customers text 'BURGER' to order instantly. No app download needed.",
      highlight: "UNIQUE"
    },
    {
      icon: Tablet,
      title: "BYOD Kiosk Mode",
      description: "Use any tablet you own. Save $1,000+ on proprietary hardware.",
      highlight: "SAVE MONEY"
    },
    {
      icon: Clock,
      title: "Setup in 1 Hour",
      description: "Live today, not next week. Menu to payments in under 60 minutes.",
      highlight: "FAST"
    },
    {
      icon: Truck,
      title: "Delivery Integration",
      description: "Seamlessly connect with our network of 1M+ drivers for local delivery.",
      highlight: "NEW"
    },
    {
      icon: TrendingUp,
      title: "Increase Revenue 20-30%",
      description: "Modern ordering channels bring more customers through your door.",
      highlight: "PROVEN"
    },
    {
      icon: Shield,
      title: "No Long-Term Contracts",
      description: "Cancel anytime. No penalties. No hidden fees. Month-to-month only.",
      highlight: "FLEXIBLE"
    }
  ];

  const stats = [
    { value: "20-30%", label: "Revenue Increase", sublabel: "Average for our customers" },
    { value: "$0", label: "Hardware Cost", sublabel: "Use devices you already own" },
    { value: "60 min", label: "Setup Time", sublabel: "Live in under an hour" },
    { value: "1M+", label: "Drivers", sublabel: "Through delivery network" }
  ];

  const testimonials = [
    {
      quote: "SMS ordering is genius! Our regulars love texting 'COFFEE' and picking up in 5 minutes.",
      author: "Maria Rodriguez",
      business: "Sunrise Cafe",
      location: "Austin, TX"
    },
    {
      quote: "Saved $1,800 on hardware. Used our existing iPads as kiosks. Setup took 45 minutes.",
      author: "James Chen",
      business: "Chen's Noodle House",
      location: "San Francisco, CA"
    },
    {
      quote: "Our orders increased 35% in the first month. The kiosk reduces wait times dramatically.",
      author: "Sarah Williams",
      business: "The Burger Joint",
      location: "Denver, CO"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="RESTROBUDDY - Modern Restaurant Management System | SMS Ordering & Kiosk Mode"
        description="Save money & increase revenue with RESTROBUDDY. Complete restaurant management with SMS ordering, BYOD kiosk mode, online ordering, kitchen display & delivery integration. 14-day free trial."
        keywords="restaurant management system, pos system, online ordering, kiosk mode, sms ordering, kitchen display system, restaurant software, delivery integration, restaurant pos, menu management, byod kiosk"
      />
      <StructuredData data={createOrganizationSchema()} />
      <StructuredData data={createSoftwareSchema()} />
      <StructuredData data={createFAQSchema()} />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJjMC0xLjEtLjktMi0yLTJ6bTAtNGgyYzAtMS4xLS45LTItMi0ydi0yaDJ2MmgydjJoLTJ2MnptMC04aDJ2LTJoLTJ2MnptMC00aDJ2LTJoLTJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-amber-500 text-white mb-6 text-sm px-4 py-2">
                🎉 Trusted by 500+ Restaurants Nationwide
              </Badge>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Restaurant Ordering,
                <span className="text-amber-400"> Simplified</span>
              </h1>

              <p className="text-xl md:text-2xl text-emerald-100 mb-4 leading-relaxed">
                <strong className="text-white">Your all-in-one solution for modern restaurant management.</strong>
              </p>
              
              <p className="text-lg md:text-xl text-emerald-100 mb-8 leading-relaxed">
                Save money. Increase revenue. Delight customers.
                <br />
                <strong className="text-white">RESTROBUDDY does the heavy lifting</strong> so you can focus on what you do best.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Button
                  size="lg"
                  className="bg-amber-500 hover:bg-amber-600 text-white text-lg px-8 py-6 rounded-full shadow-2xl"
                  asChild
                >
                  <Link to={createPageUrl("Pricing")}>
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-[#10b981] hover:bg-slate-100 text-lg px-8 py-6 rounded-full shadow-2xl"
                  asChild
                >
                  <Link to={createPageUrl("Features")}>
                    See Features
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-amber-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-amber-400" />
                  <span>Setup in 1 hour</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-amber-400" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop"
                  alt="Delicious burger at restaurant"
                  loading="lazy"
                  width="400"
                  height="300"
                  className="rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
                />
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop"
                  alt="Fresh pizza in restaurant"
                  loading="lazy"
                  width="400"
                  height="300"
                  className="rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300 mt-8"
                />
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop"
                  alt="Fresh salad healthy meal"
                  loading="lazy"
                  width="400"
                  height="300"
                  className="rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
                />
                <img
                  src="https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop"
                  alt="Delicious dessert"
                  loading="lazy"
                  width="400"
                  height="300"
                  className="rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300 mt-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-amber-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold mb-1">{stat.label}</div>
                <div className="text-sm text-slate-400">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-[#10b981] text-white mb-4 text-sm px-4 py-2">
              FEATURES THAT MATTER
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Built for modern restaurants. Designed to save you money and increase revenue.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-2xl flex items-center justify-center shadow-lg">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <Badge className="bg-amber-500 text-white text-xs">
                      {feature.highlight}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl text-slate-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 mb-4 text-sm px-4 py-2">
              SIMPLE PROCESS
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Live in 3 Easy Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up & Setup",
                description: "Choose your plan. Add your menu items. Connect Square payments. Done in 30 minutes.",
                icon: Users
              },
              {
                step: "2",
                title: "Go Live",
                description: "Share your ordering link. Set up tablets as kiosks. Train staff in 15 minutes.",
                icon: Zap
              },
              {
                step: "3",
                title: "Watch Sales Grow",
                description: "Accept orders online, via SMS, and at kiosks. We handle delivery integration.",
                icon: TrendingUp
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-full flex items-center justify-center mb-6 shadow-xl">
                    <span className="text-3xl font-bold text-white">{item.step}</span>
                  </div>
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                    <item.icon className="w-8 h-8 text-[#10b981]" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-emerald-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Integration Section */}
      <div className="py-20 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-[#10b981] text-white mb-6 text-sm px-4 py-2">
                DELIVERY MADE SIMPLE
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Seamless Delivery Integration
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Tap into our network of <strong className="text-white">1 million+ active drivers</strong> to fulfill every local delivery order.
                We integrate with DoorDash, Uber Eats, Grubhub, and our proprietary Ride-ly Delivery RideShare service.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Real-time order tracking for you and your customers",
                  "Automatic driver dispatch when orders are ready",
                  "Lower commission rates through our partnerships",
                  "Unified dashboard to manage all delivery platforms"
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-[#10b981] flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="bg-[#10b981] hover:bg-[#059669] text-white rounded-full px-8 py-6">
                Learn About Delivery
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&h=400&fit=crop"
                alt="Professional delivery driver with food order"
                loading="lazy"
                width="600"
                height="400"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
                <div className="text-4xl font-bold text-[#10b981] mb-2">1M+</div>
                <div className="text-sm font-semibold">Active Drivers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-700 mb-4 text-sm px-4 py-2">
              CUSTOMER STORIES
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Loved by Restaurant Owners
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-0 shadow-xl bg-white">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-lg mb-6 italic leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div className="border-t pt-4">
                    <div className="font-bold text-slate-900">{testimonial.author}</div>
                    <div className="text-[#10b981] font-semibold">{testimonial.business}</div>
                    <div className="text-sm text-slate-500">{testimonial.location}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Comparison */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-[#10b981] text-white mb-4 text-sm px-4 py-2">
              TRANSPARENT PRICING
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Save Thousands vs. Toast POS
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Same features. Better technology. <strong>Up to 60% lower cost.</strong>
            </p>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-emerald-50 rounded-3xl p-8 max-w-4xl mx-auto mb-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Toast POS</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Monthly Software:</span>
                    <span className="font-bold">$165/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Hardware (upfront):</span>
                    <span className="font-bold text-red-600">$1,800</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Contract:</span>
                    <span className="font-bold text-red-600">12 months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Setup Time:</span>
                    <span className="font-bold">2-3 days</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-xl">
                    <span className="font-bold">First Year Cost:</span>
                    <span className="font-bold text-red-600">$3,780</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#10b981] to-[#059669] text-white rounded-2xl p-6 relative">
                <Badge className="absolute -top-3 -right-3 bg-amber-500 text-white text-sm px-4 py-2">
                  BEST VALUE
                </Badge>
                <h3 className="text-2xl font-bold mb-4">Restaurant Buddy</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Monthly Software:</span>
                    <span className="font-bold">$299/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hardware (upfront):</span>
                    <span className="font-bold text-amber-400">$0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contract:</span>
                    <span className="font-bold text-amber-400">Month-to-month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Setup Time:</span>
                    <span className="font-bold text-amber-400">1 hour</span>
                  </div>
                  <div className="border-t border-white/20 pt-3 flex justify-between text-xl">
                    <span className="font-bold">First Year Cost:</span>
                    <span className="font-bold text-amber-400">$3,588</span>
                  </div>
                </div>
                <div className="mt-4 bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400 mb-1">Save $192</div>
                  <div className="text-sm">Plus no hardware lock-in!</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button size="lg" asChild className="bg-[#10b981] hover:bg-[#059669] text-white rounded-full px-12 py-6 text-lg shadow-2xl">
              <Link to={createPageUrl("Pricing")}>
                View All Plans & Pricing
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* User Types Section */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 mb-4 text-sm px-4 py-2">
              FOR EVERYONE
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Two Ways to Use RESTROBUDDY
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Customer Card */}
            <Card className="border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-2">For Customers</h3>
                <p className="text-blue-100">Order food from amazing local restaurants</p>
              </div>
              <CardContent className="p-8">
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Browse & order from local restaurants</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Create & join group orders with friends</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Earn loyalty rewards & points</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Track orders in real-time</span>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-1">FREE</div>
                  <div className="text-sm text-blue-700">Forever • No subscription</div>
                </div>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg">
                  <Link to={createPageUrl("Marketplace")}>
                    Browse Restaurants
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <p className="text-center text-sm text-slate-500 mt-4">
                  Available on iOS, Android & Web
                </p>
              </CardContent>
            </Card>

            {/* Restaurant Owner Card */}
            <Card className="border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-[#10b981] to-[#059669] text-white p-8">
                <Badge className="bg-amber-500 text-white mb-4">BUSINESS</Badge>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <ChefHat className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-2">For Restaurant Owners</h3>
                <p className="text-emerald-100">Complete restaurant management platform</p>
              </div>
              <CardContent className="p-8">
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>Accept online, kiosk & SMS orders</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>Kitchen display & inventory management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>Employee scheduling & payroll</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>Analytics & customer insights</span>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center mb-6">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">From $99/mo</div>
                  <div className="text-sm text-emerald-700">14-day free trial • Cancel anytime</div>
                </div>
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg">
                  <Link to={createPageUrl("Pricing")}>
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <p className="text-center text-sm text-slate-500 mt-4">
                  For owners, operators & managers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-[#10b981] to-[#047857] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Grow Your Restaurant?
          </h2>
          <p className="text-xl text-emerald-100 mb-4">
            <strong className="text-white">Your all-in-one solution for modern restaurant management.</strong>
          </p>
          <p className="text-lg text-emerald-100 mb-12">
            Join 500+ restaurants saving money and increasing revenue with RESTROBUDDY.
            <br />
            <strong className="text-white">No credit card required. Setup in 1 hour. Cancel anytime.</strong>
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-12 py-6 text-lg shadow-2xl" asChild>
              <Link to={createPageUrl("Pricing")}>
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" className="bg-white text-[#10b981] hover:bg-slate-100 rounded-full px-12 py-6 text-lg shadow-xl" asChild>
              <Link to={createPageUrl("Marketplace")}>
                Browse as Customer
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-amber-400" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-amber-400" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-amber-400" />
              <span>Setup in 60 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-amber-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Merged Footer with White Background */}
      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png"
                  alt="RESTROBUDDY Logo"
                  className="w-12 h-12"
                />
                <div>
                  <span className="font-bold text-xl text-slate-900">RESTROBUDDY</span>
                  <p className="text-xs text-slate-500">Modern Restaurant Management</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 max-w-xs">
                Your all-in-one solution for modern restaurant management.
                Save money, increase revenue, delight customers.
              </p>
              <Button
                onClick={() => base44.auth.redirectToLogin(createPageUrl("Marketplace"))}
                className="bg-[#10b981] hover:bg-[#059669] text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Sign In / Get Started
              </Button>
            </div>

            {/* Product Section */}
            <div>
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to={createPageUrl("Features")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("Pricing")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("RestaurantOnboarding")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    Demo
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("SmsOrderingGuide")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    SMS Ordering
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Section */}
            <div>
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to={createPageUrl("About")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("Contact")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("Careers")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("Blog")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Section */}
            <div>
              <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Support</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to={createPageUrl("HelpCenter")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("Documentation")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("Documentation")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl("Support")} className="text-slate-600 hover:text-[#10b981] transition-colors font-medium">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-6 mb-8 pb-8 border-b border-slate-200">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[#10b981] flex items-center justify-center transition-all group">
              <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[#10b981] flex items-center justify-center transition-all group">
              <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[#10b981] flex items-center justify-center transition-all group">
              <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
              </svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[#10b981] flex items-center justify-center transition-all group">
              <svg className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              © 2024 RESTROBUDDY. All rights reserved.
            </p>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              by Bold Intelligent Solutions Partners Inc. All Rights Reserved.
            </p>
            <div className="flex justify-center gap-6 mt-4 text-xs">
              <a href="#" className="text-slate-500 hover:text-[#10b981] transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-[#10b981] transition-colors">Terms of Service</a>
              <a href="#" className="text-slate-500 hover:text-[#10b981] transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}