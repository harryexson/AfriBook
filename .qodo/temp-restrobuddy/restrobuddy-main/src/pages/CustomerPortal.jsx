import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CustomerProfile } from "@/entities/CustomerProfile";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { MarketplaceOrder } from "@/entities/MarketplaceOrder";
import { Order } from "@/entities/Order";
import { Reservation } from "@/entities/Reservation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User, ShoppingBag, Star, Calendar, Bell, Settings,
  Gift, Clock, ChefHat, Package, Store,
  Award, Trophy, Crown,
  ArrowRight, Smartphone, Download, QrCode, DollarSign, Plus
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

import PortalOrdersSection from "../components/portal/PortalOrdersSection";
import PortalLoyaltySection from "../components/portal/PortalLoyaltySection";
import PortalReservationsSection from "../components/portal/PortalReservationsSection";
import PortalProfileSection from "../components/portal/PortalProfileSection";
import NotificationPreferences from "../components/portal/NotificationPreferences";
import PaymentMethods from "../components/portal/PaymentMethods";

export default function CustomerPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loyaltyMember, setLoyaltyMember] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const tierInfo = {
    bronze: { name: "Bronze", color: "from-amber-700 to-amber-600", icon: Award },
    silver: { name: "Silver", color: "from-slate-400 to-slate-500", icon: Star },
    gold: { name: "Gold", color: "from-yellow-500 to-yellow-600", icon: Trophy },
    platinum: { name: "Platinum", color: "from-purple-500 to-purple-600", icon: Crown }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load or create customer profile
      let profiles = await CustomerProfile.filter({ user_email: currentUser.email });
      let customerProfile;
      
      if (profiles.length === 0) {
        customerProfile = await CustomerProfile.create({
          user_email: currentUser.email,
          full_name: currentUser.full_name,
          phone: currentUser.phone || "",
          customer_since: new Date().toISOString().split('T')[0]
        });
      } else {
        customerProfile = profiles[0];
      }
      setProfile(customerProfile);

      // Load loyalty member
      try {
        const members = await LoyaltyMember.filter({ email: currentUser.email });
        if (members.length > 0) {
          setLoyaltyMember(members[0]);
        }
      } catch (e) {
        console.log("No loyalty membership");
      }

      // Load orders
      const [marketplaceOrders, regularOrders] = await Promise.all([
        MarketplaceOrder.filter({ customer_email: currentUser.email }, "-created_date", 20),
        currentUser.phone 
          ? Order.filter({ customer_phone: currentUser.phone }, "-created_date", 20)
          : Promise.resolve([])
      ]);
      
      const allOrders = [...marketplaceOrders, ...regularOrders]
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setOrders(allOrders);

      // Load reservations
      try {
        const customerReservations = await Reservation.filter({
          customer_email: currentUser.email
        }, "-reservation_date", 10);
        setReservations(customerReservations);
      } catch (e) {
        console.log("No reservations");
      }

    } catch (error) {
      console.error("Error loading portal data:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  const currentTierInfo = loyaltyMember ? tierInfo[loyaltyMember.tier] : null;
  const TierIcon = currentTierInfo ? currentTierInfo.icon : Award;
  
  const activeOrders = orders.filter(o => 
    ["confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status)
  );
  
  const upcomingReservations = reservations.filter(r => 
    new Date(r.reservation_date) >= new Date() && 
    !["cancelled", "no_show", "completed"].includes(r.status)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Guest'}!
              </h1>
              <p className="text-emerald-100">
                Manage your orders, reservations, and rewards all in one place
              </p>
            </div>
            
            {loyaltyMember && currentTierInfo && (
              <Card className={`bg-gradient-to-br ${currentTierInfo.color} border-0 shadow-xl text-white min-w-[280px]`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TierIcon className="w-10 h-10" />
                    <div>
                      <p className="text-sm text-white/80">{currentTierInfo.name} Member</p>
                      <p className="text-2xl font-bold">{loyaltyMember.points_balance} pts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4 text-center">
              <ShoppingBag className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{activeOrders.length}</div>
              <p className="text-xs text-slate-600">Active Orders</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{upcomingReservations.length}</div>
              <p className="text-xs text-slate-600">Reservations</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">{loyaltyMember?.points_balance || 0}</div>
              <p className="text-xs text-slate-600">Loyalty Points</p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900">${(profile?.total_spent || 0).toFixed(0)}</div>
              <p className="text-xs text-slate-600">Total Spent</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-md mb-6 flex-wrap">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Store className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
              {activeOrders.length > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white text-xs">{activeOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Gift className="w-4 h-4 mr-2" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="reservations" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              Payment Methods
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Orders & Reservations */}
              <div className="lg:col-span-2 space-y-6">
                {/* Active Orders */}
                <Card className="border-0 shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-emerald-600" />
                      Active Orders
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")}>
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {activeOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 mb-4">No active orders</p>
                        <Button onClick={() => navigate(createPageUrl("Marketplace"))} className="bg-emerald-600">
                          Order Now
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeOrders.slice(0, 3).map(order => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                order.status === 'preparing' ? 'bg-purple-100' :
                                order.status === 'ready' ? 'bg-green-100' : 'bg-blue-100'
                              }`}>
                                {order.status === 'preparing' ? <ChefHat className="w-5 h-5 text-purple-600" /> :
                                 order.status === 'ready' ? <Package className="w-5 h-5 text-green-600" /> :
                                 <Clock className="w-5 h-5 text-blue-600" />}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">#{order.id.slice(-6)}</p>
                                <p className="text-xs text-slate-600">
                                  {order.restaurant_name || 'In-house order'} • {order.items?.length || 0} items
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={
                                order.status === 'ready' ? 'bg-green-500' :
                                order.status === 'preparing' ? 'bg-purple-500' : 'bg-blue-500'
                              }>
                                {order.status}
                              </Badge>
                              <p className="text-sm font-bold text-emerald-600 mt-1">
                                ${order.total_amount?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Reservations */}
                <Card className="border-0 shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Upcoming Reservations
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("reservations")}>
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {upcomingReservations.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 mb-4">No upcoming reservations</p>
                        <Button onClick={() => navigate(createPageUrl("Marketplace"))} variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Make a Reservation
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingReservations.slice(0, 3).map(res => (
                          <div key={res.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {format(new Date(res.reservation_date), 'MMM d')} at {res.reservation_time}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {res.party_size} guests • {res.confirmation_code}
                                </p>
                              </div>
                            </div>
                            <Badge className={
                              res.status === 'confirmed' ? 'bg-green-500' : 'bg-amber-500'
                            }>
                              {res.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Loyalty & Quick Actions */}
              <div className="space-y-6">
                {/* Loyalty Card */}
                {loyaltyMember ? (
                  <Card className={`border-0 shadow-xl bg-gradient-to-br ${currentTierInfo?.color || 'from-emerald-500 to-emerald-600'} text-white`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <TierIcon className="w-12 h-12" />
                        <div>
                          <p className="text-sm text-white/80">Loyalty Status</p>
                          <p className="text-xl font-bold">{currentTierInfo?.name} Member</p>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-white/80">Available Points</span>
                          <span className="text-3xl font-bold">{loyaltyMember.points_balance}</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setActiveTab("loyalty")}
                        className="w-full bg-white text-emerald-700 hover:bg-white/90"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        View Rewards
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-6 text-center">
                      <Star className="w-12 h-12 mx-auto mb-3" />
                      <h3 className="text-xl font-bold mb-2">Join Our Loyalty Program</h3>
                      <p className="text-emerald-100 text-sm mb-4">
                        Earn points on every order and unlock exclusive rewards
                      </p>
                      <Button className="bg-white text-emerald-700 hover:bg-white/90">
                        Join Now - It's Free
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      onClick={() => navigate(createPageUrl("Marketplace"))}
                      className="w-full justify-start bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Store className="w-4 h-4 mr-3" />
                      Order from Marketplace
                    </Button>
                    <Button 
                      onClick={() => navigate(createPageUrl("NotificationCenter"))}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Bell className="w-4 h-4 mr-3" />
                      View Notifications
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("profile")}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Account Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Download App CTA */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Smartphone className="w-10 h-10" />
                      <div>
                        <h3 className="font-bold">Get the App</h3>
                        <p className="text-sm text-slate-300">Order faster on mobile</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start border-white/30 text-white hover:bg-white/10">
                        <Download className="w-4 h-4 mr-3" />
                        Download for iOS
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-white/30 text-white hover:bg-white/10">
                        <Download className="w-4 h-4 mr-3" />
                        Download for Android
                      </Button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 text-center">
                      <p className="text-xs text-slate-400 mb-2">Or scan QR code</p>
                      <div className="w-24 h-24 bg-white rounded-lg mx-auto flex items-center justify-center">
                        <QrCode className="w-20 h-20 text-slate-900" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <PortalOrdersSection orders={orders} onRefresh={loadPortalData} />
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <PortalLoyaltySection 
              loyaltyMember={loyaltyMember} 
              tierInfo={tierInfo}
              onRefresh={loadPortalData}
            />
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <PortalReservationsSection 
              reservations={reservations} 
              user={user}
              onRefresh={loadPortalData}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <PortalProfileSection 
              profile={profile} 
              user={user}
              onRefresh={loadPortalData}
            />
          </TabsContent>

          {/* Notification Preferences Tab */}
          <TabsContent value="notifications">
            <NotificationPreferences user={user} />
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payments">
            <PaymentMethods user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}