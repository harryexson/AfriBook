import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MarketplaceOrder } from "@/entities/MarketplaceOrder";
import { Order } from "@/entities/Order";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Clock, ChefHat, Package, CheckCircle, 
  ArrowRight, Store, ShoppingBag
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function MyOrders() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [marketplaceOrders, setMarketplaceOrders] = useState([]);
  const [regularOrders, setRegularOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load marketplace orders
      const myMarketplaceOrders = await MarketplaceOrder.filter({ 
        customer_email: currentUser.email 
      }, "-created_date", 50);
      setMarketplaceOrders(myMarketplaceOrders || []);

      // Load regular orders (from their own restaurant if they have one)
      try {
        const myRegularOrders = await Order.filter({ 
          customer_phone: currentUser.phone 
        }, "-created_date", 50);
        setRegularOrders(myRegularOrders || []);
      } catch (err) {
        console.log("No regular orders found");
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
    setIsLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-500 text-white";
      case "preparing":
        return "bg-purple-500 text-white";
      case "ready":
        return "bg-green-500 text-white";
      case "completed":
        return "bg-slate-500 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-slate-300 text-slate-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <Clock className="w-4 h-4" />;
      case "preparing":
        return <ChefHat className="w-4 h-4" />;
      case "ready":
        return <Package className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const activeMarketplaceOrders = marketplaceOrders.filter(o => 
    ["confirmed", "preparing", "ready"].includes(o.status)
  );
  
  const completedMarketplaceOrders = marketplaceOrders.filter(o => 
    ["completed", "cancelled"].includes(o.status)
  );

  const activeRegularOrders = regularOrders.filter(o => 
    ["confirmed", "preparing", "ready"].includes(o.status)
  );
  
  const completedRegularOrders = regularOrders.filter(o => 
    ["completed", "cancelled"].includes(o.status)
  );

  const allActiveOrders = [...activeMarketplaceOrders, ...activeRegularOrders];
  const allCompletedOrders = [...completedMarketplaceOrders, ...completedRegularOrders];

  const OrderCard = ({ order, isMarketplace }) => {
    const estimatedTime = order.estimated_ready_time ? new Date(order.estimated_ready_time) : null;
    
    return (
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-bold text-slate-900">
                  #{order.id.slice(-6)}
                </span>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Store className="w-4 h-4" />
                <span className="font-semibold">
                  {isMarketplace ? order.restaurant_name : "In-House Order"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">
                {format(new Date(order.created_date), 'MMM d, h:mm a')}
              </p>
              {estimatedTime && order.status !== 'completed' && (
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  Ready: {format(estimatedTime, 'h:mm a')}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            {order.items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-semibold text-slate-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-xs text-slate-500">
                +{order.items.length - 3} more items
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${order.total_amount.toFixed(2)}
              </p>
            </div>
            <Button
              onClick={() => {
                if (isMarketplace) {
                  navigate(createPageUrl("MarketplaceOrderStatus"), {
                    state: { orderId: order.id }
                  });
                } else {
                  navigate(createPageUrl("OrderStatus"), {
                    state: { order }
                  });
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Track Order
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Order Status Progress */}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <div className={`flex items-center gap-1 ${
                  ["confirmed", "preparing", "ready"].includes(order.status) 
                    ? "text-blue-600 font-semibold" 
                    : "text-slate-400"
                }`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>Confirmed</span>
                </div>
                <div className="flex-1 h-0.5 mx-2 bg-slate-200">
                  <div className={`h-full transition-all duration-500 ${
                    ["preparing", "ready"].includes(order.status) 
                      ? "bg-purple-500 w-full" 
                      : "bg-slate-200 w-0"
                  }`} />
                </div>
                <div className={`flex items-center gap-1 ${
                  ["preparing", "ready"].includes(order.status) 
                    ? "text-purple-600 font-semibold" 
                    : "text-slate-400"
                }`}>
                  <ChefHat className="w-3 h-3" />
                  <span>Preparing</span>
                </div>
                <div className="flex-1 h-0.5 mx-2 bg-slate-200">
                  <div className={`h-full transition-all duration-500 ${
                    order.status === "ready" 
                      ? "bg-green-500 w-full" 
                      : "bg-slate-200 w-0"
                  }`} />
                </div>
                <div className={`flex items-center gap-1 ${
                  order.status === "ready" 
                    ? "text-green-600 font-semibold" 
                    : "text-slate-400"
                }`}>
                  <Package className="w-3 h-3" />
                  <span>Ready</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Orders</h1>
          <p className="text-slate-600">Track your orders and view order history</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{allActiveOrders.length}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-900">
                {marketplaceOrders.length + regularOrders.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                <Store className="w-4 h-4" />
                Restaurants Visited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">
                {new Set(marketplaceOrders.map(o => o.restaurant_id)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white border border-slate-200 p-2 rounded-full shadow-md inline-flex">
            <TabsTrigger
              value="active"
              className="rounded-full px-6 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold"
            >
              Active Orders
              {allActiveOrders.length > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white">
                  {allActiveOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-full px-6 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold"
            >
              Order History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {allActiveOrders.length === 0 ? (
              <Card className="border-0 shadow-xl text-center p-12">
                <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-slate-900 mb-2">No active orders</p>
                <p className="text-slate-600 mb-6">Start by browsing the marketplace</p>
                <Button
                  onClick={() => navigate(createPageUrl("Marketplace"))}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Store className="w-4 h-4 mr-2" />
                  Browse Restaurants
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {allActiveOrders
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                  .map(order => {
                    const isMarketplace = !!order.restaurant_id;
                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isMarketplace={isMarketplace}
                      />
                    );
                  })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {allCompletedOrders.length === 0 ? (
              <Card className="border-0 shadow-xl text-center p-12">
                <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-slate-900 mb-2">No order history yet</p>
                <p className="text-slate-600">Your completed orders will appear here</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {allCompletedOrders
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                  .map(order => {
                    const isMarketplace = !!order.restaurant_id;
                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isMarketplace={isMarketplace}
                      />
                    );
                  })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        {allActiveOrders.length === 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 text-center p-12">
            <Store className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Ready to order?
            </h2>
            <p className="text-slate-600 mb-6">
              Explore hundreds of restaurants powered by RESTROBUDDY
            </p>
            <Button
              onClick={() => navigate(createPageUrl("Marketplace"))}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-12 py-6 rounded-full"
            >
              <Store className="w-5 h-5 mr-2" />
              Browse Marketplace
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}