import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Restaurant } from "@/entities/Restaurant";
import { MenuItem } from "@/entities/MenuItem";
import { MarketplaceOrder } from "@/entities/MarketplaceOrder";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Store, UtensilsCrossed, ShoppingBag, Settings, BarChart3,
  DollarSign, Clock, TrendingUp, Star, AlertCircle, Award, Tag
} from "lucide-react";
import { createPageUrl } from "@/utils";

import PartnerMenuManager from "../components/partner/PartnerMenuManager";
import PartnerOrdersView from "../components/partner/PartnerOrdersView";
import PartnerProfileSettings from "../components/partner/PartnerProfileSettings";
import PartnerSalesReports from "../components/partner/PartnerSalesReports";
import PartnerLoyaltyManager from "../components/partner/PartnerLoyaltyManager";
import PartnerPromotionManager from "../components/partner/PartnerPromotionManager";

export default function RestaurantPartnerPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalMenuItems: 0
  });

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Find restaurant owned by this user
      const restaurants = await Restaurant.filter({ owner_email: currentUser.email });
      
      if (restaurants.length === 0) {
        // No restaurant found - show setup prompt
        setIsLoading(false);
        return;
      }

      const myRestaurant = restaurants[0];
      setRestaurant(myRestaurant);

      // Load menu items
      const items = await MenuItem.filter({ restaurant_id: myRestaurant.id });
      setMenuItems(items);

      // Load orders
      const marketplaceOrders = await MarketplaceOrder.filter(
        { restaurant_id: myRestaurant.id },
        "-created_date",
        100
      );
      setOrders(marketplaceOrders);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = marketplaceOrders.filter(o => 
        o.created_date.startsWith(today)
      );
      const pendingOrders = marketplaceOrders.filter(o => 
        ["confirmed", "preparing"].includes(o.status)
      );

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        pendingOrders: pendingOrders.length,
        totalMenuItems: items.length
      });

    } catch (error) {
      console.error("Error loading portal data:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your restaurant portal...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <Store className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Restaurant Found</h2>
            <p className="text-slate-600 mb-6">
              You don't have a restaurant registered yet. Contact support to set up your restaurant account.
            </p>
            <Button onClick={() => navigate(createPageUrl("RestaurantOnboarding"))} className="bg-emerald-600">
              Register Your Restaurant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeOrders = orders.filter(o => 
    ["confirmed", "preparing", "ready"].includes(o.status)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {restaurant.logo_url ? (
                <img src={restaurant.logo_url} alt={restaurant.business_name} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <Store className="w-8 h-8" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{restaurant.business_name}</h1>
                <div className="flex items-center gap-3 text-emerald-100 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {restaurant.rating?.toFixed(1) || '0.0'} ({restaurant.total_reviews || 0} reviews)
                  </span>
                  <Badge className={restaurant.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}>
                    {restaurant.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => navigate(createPageUrl(`MarketplaceRestaurant?id=${restaurant.id}`))}
              >
                View Public Page
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.todayOrders}</p>
                  <p className="text-xs text-slate-600">Today's Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">${stats.todayRevenue.toFixed(0)}</p>
                  <p className="text-xs text-slate-600">Today's Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.pendingOrders}</p>
                  <p className="text-xs text-slate-600">Pending Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalMenuItems}</p>
                  <p className="text-xs text-slate-600">Menu Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Active Orders Alert */}
        {activeOrders.length > 0 && (
          <Card className="border-0 shadow-lg bg-amber-50 border-amber-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-900">
                      {activeOrders.length} Active Order{activeOrders.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-amber-700">
                      {orders.filter(o => o.status === 'confirmed').length} new, {' '}
                      {orders.filter(o => o.status === 'preparing').length} preparing
                    </p>
                  </div>
                </div>
                <Button onClick={() => setActiveTab("orders")} className="bg-amber-600 hover:bg-amber-700">
                  View Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-md mb-6">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
              {stats.pendingOrders > 0 && (
                <Badge className="ml-2 bg-red-500">{stats.pendingOrders}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="menu" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Award className="w-4 h-4 mr-2" />
              Loyalty
            </TabsTrigger>
            <TabsTrigger value="promotions" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Tag className="w-4 h-4 mr-2" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <PartnerSalesReports restaurant={restaurant} orders={orders} isOverview={true} />
          </TabsContent>

          <TabsContent value="orders">
            <PartnerOrdersView restaurant={restaurant} orders={orders} onRefresh={loadPortalData} />
          </TabsContent>

          <TabsContent value="menu">
            <PartnerMenuManager restaurant={restaurant} menuItems={menuItems} onRefresh={loadPortalData} />
          </TabsContent>

          <TabsContent value="loyalty">
            <PartnerLoyaltyManager restaurant={restaurant} />
          </TabsContent>

          <TabsContent value="promotions">
            <PartnerPromotionManager restaurant={restaurant} />
          </TabsContent>

          <TabsContent value="reports">
            <PartnerSalesReports restaurant={restaurant} orders={orders} />
          </TabsContent>

          <TabsContent value="settings">
            <PartnerProfileSettings restaurant={restaurant} onRefresh={loadPortalData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}