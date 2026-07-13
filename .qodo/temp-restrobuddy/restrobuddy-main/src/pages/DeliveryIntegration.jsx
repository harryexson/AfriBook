import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Truck, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  Settings,
  TrendingUp,
  Users,
  Zap,
  Shield,
  ArrowRight
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function DeliveryIntegration() {
  const [activeTab, setActiveTab] = useState("overview");
  const [deliverySettings, setDeliverySettings] = useState({
    enabled: true,
    radius: 5,
    baseFee: 2.99,
    freeDeliveryMinimum: 25,
    estimatedDeliveryTime: 30
  });

  const platforms = [
    {
      name: "Ride-ly Delivery RideShare",
      logo: "🚗",
      description: "Our proprietary delivery network with 1M+ active drivers",
      commission: "15%",
      features: ["Real-time tracking", "Instant dispatch", "24/7 support", "Best rates"],
      status: "recommended"
    },
    {
      name: "DoorDash Drive",
      logo: "🚪",
      description: "Connect to DoorDash's massive delivery fleet",
      commission: "20-30%",
      features: ["Large driver network", "Peak hour coverage", "Insurance included"],
      status: "available"
    },
    {
      name: "Uber Direct",
      logo: "🚕",
      description: "Leverage Uber's delivery infrastructure",
      commission: "18-25%",
      features: ["Quick pickup", "Reliable service", "Wide coverage"],
      status: "available"
    },
    {
      name: "Grubhub Delivery",
      logo: "🍔",
      description: "Partner with Grubhub for delivery services",
      commission: "20-30%",
      features: ["Integrated platform", "Marketing support", "Analytics"],
      status: "available"
    }
  ];

  const benefits = [
    {
      icon: Users,
      title: "1M+ Active Drivers",
      description: "Access our massive network through Ride-ly Delivery and partner platforms"
    },
    {
      icon: Clock,
      title: "Fast Delivery Times",
      description: "Average 30-minute delivery with real-time ETA updates"
    },
    {
      icon: DollarSign,
      title: "Competitive Rates",
      description: "Lowest commission rates starting at 15% with Ride-ly Delivery"
    },
    {
      icon: MapPin,
      title: "Wide Coverage",
      description: "Deliver anywhere within your service radius"
    },
    {
      icon: Shield,
      title: "Full Insurance",
      description: "All deliveries covered with comprehensive insurance"
    },
    {
      icon: Zap,
      title: "Instant Dispatch",
      description: "Orders automatically assigned to nearest available driver"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Badge className="bg-emerald-600 text-white mb-4">
            <Truck className="w-4 h-4 mr-2" />
            DELIVERY INTEGRATION
          </Badge>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Delivery Management
          </h1>
          <p className="text-lg text-slate-600">
            Connect with 1M+ drivers through Ride-ly Delivery and our partner platforms
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, idx) => (
                <Card key={idx} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold mb-2">1M+</div>
                  <div className="text-emerald-100">Active Drivers</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold mb-2">30 min</div>
                  <div className="text-blue-100">Avg Delivery Time</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold mb-2">98%</div>
                  <div className="text-purple-100">Success Rate</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold mb-2">15%</div>
                  <div className="text-amber-100">Starting Commission</div>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Ready to Start Delivering?
                </h2>
                <p className="text-slate-600 mb-6">
                  Connect with Ride-ly Delivery RideShare service and start offering delivery to your customers today
                </p>
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Enable Delivery
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {platforms.map((platform, idx) => (
                <Card key={idx} className={`border-0 shadow-xl ${
                  platform.status === 'recommended' ? 'ring-2 ring-emerald-500' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{platform.logo}</div>
                        <div>
                          <CardTitle className="text-xl">{platform.name}</CardTitle>
                          {platform.status === 'recommended' && (
                            <Badge className="bg-emerald-600 text-white mt-2">
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600">
                          {platform.commission}
                        </div>
                        <div className="text-xs text-slate-500">Commission</div>
                      </div>
                    </div>
                    <p className="text-slate-600">{platform.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-6">
                      {platform.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      className={`w-full ${
                        platform.status === 'recommended' 
                          ? 'bg-emerald-600 hover:bg-emerald-700' 
                          : 'bg-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      {platform.status === 'recommended' ? 'Connect Now' : 'Learn More'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">Why Choose Ride-ly Delivery?</h3>
                    <p className="text-slate-700 mb-4">
                      Our proprietary Ride-ly Delivery RideShare service offers the best rates, fastest delivery times, 
                      and seamless integration with RESTROBUDDY. Plus, you get priority support and advanced analytics.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>15% commission vs 20-30% from competitors</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>Real-time GPS tracking included</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>No setup fees or monthly minimums</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span>Dedicated account manager</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Delivery Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Delivery Radius (miles)</Label>
                    <Input
                      type="number"
                      value={deliverySettings.radius}
                      onChange={(e) => setDeliverySettings({
                        ...deliverySettings,
                        radius: parseFloat(e.target.value)
                      })}
                      className="mt-2"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Maximum distance for deliveries from your location
                    </p>
                  </div>

                  <div>
                    <Label>Base Delivery Fee ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={deliverySettings.baseFee}
                      onChange={(e) => setDeliverySettings({
                        ...deliverySettings,
                        baseFee: parseFloat(e.target.value)
                      })}
                      className="mt-2"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Base fee charged to customers
                    </p>
                  </div>

                  <div>
                    <Label>Free Delivery Minimum ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={deliverySettings.freeDeliveryMinimum}
                      onChange={(e) => setDeliverySettings({
                        ...deliverySettings,
                        freeDeliveryMinimum: parseFloat(e.target.value)
                      })}
                      className="mt-2"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Orders above this amount get free delivery
                    </p>
                  </div>

                  <div>
                    <Label>Estimated Delivery Time (minutes)</Label>
                    <Input
                      type="number"
                      value={deliverySettings.estimatedDeliveryTime}
                      onChange={(e) => setDeliverySettings({
                        ...deliverySettings,
                        estimatedDeliveryTime: parseInt(e.target.value)
                      })}
                      className="mt-2"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Average delivery time shown to customers
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Delivery Instructions</Label>
                  <Textarea
                    placeholder="Add any special instructions for drivers (e.g., entrance location, parking info)"
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-slate-900">Enable Delivery</h4>
                    <p className="text-sm text-slate-600">Accept delivery orders from customers</p>
                  </div>
                  <Button
                    variant={deliverySettings.enabled ? "default" : "outline"}
                    onClick={() => setDeliverySettings({
                      ...deliverySettings,
                      enabled: !deliverySettings.enabled
                    })}
                    className={deliverySettings.enabled ? "bg-emerald-600" : ""}
                  >
                    {deliverySettings.enabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button variant="outline">Cancel</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Preview */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Delivery Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl">
                    <div className="text-3xl font-bold text-emerald-600 mb-2">142</div>
                    <div className="text-sm text-slate-600">Deliveries This Month</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600 mb-2">28 min</div>
                    <div className="text-sm text-slate-600">Avg Delivery Time</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                    <div className="text-3xl font-bold text-amber-600 mb-2">4.8★</div>
                    <div className="text-sm text-slate-600">Customer Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}