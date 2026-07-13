import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Utensils,
  Clock,
  MapPin,
  Star,
  Search,
  RefreshCw,
  ChefHat,
  Truck,
  CheckCircle2,
  Package,
  Phone,
  MessageCircle,
  RotateCcw,
  Receipt,
  User,
  Navigation
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { createPageUrl } from "@/utils";
import OrderTrackingCard from "../components/orders/OrderTrackingCard";

const statusColors = {
  pending_confirmation: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-purple-100 text-purple-800 border-purple-200",
  ready_for_pickup: "bg-indigo-100 text-indigo-800 border-indigo-200",
  picked_up: "bg-cyan-100 text-cyan-800 border-cyan-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

const statusIcons = {
  pending_confirmation: Clock,
  confirmed: CheckCircle2,
  preparing: ChefHat,
  ready_for_pickup: Package,
  picked_up: Truck,
  completed: CheckCircle2,
  cancelled: null
};

const statusLabels = {
  pending_confirmation: "Pending Confirmation",
  confirmed: "Confirmed",
  preparing: "Being Prepared",
  ready_for_pickup: "Ready for Pickup",
  picked_up: "On the Way",
  completed: "Delivered",
  cancelled: "Cancelled"
};

export default function MyOrders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState({});
  const [reordering, setReordering] = useState(null);

  const isMountedRef = useRef(true);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    loadInitialData();

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (activeTab === "active") {
      filtered = orders.filter(order =>
        ['pending_confirmation', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up'].includes(order.status)
      );
    } else if (activeTab === "completed") {
      filtered = orders.filter(order => order.status === 'completed');
    } else if (activeTab === "cancelled") {
      filtered = orders.filter(order => order.status === 'cancelled');
    }

    if (searchQuery) {
      filtered = filtered.filter(order => {
        const restaurant = restaurants[order.restaurant_id];
        return restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.order_items?.some(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));
      });
    }

    filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    setFilteredOrders(filtered);
  }, [orders, activeTab, searchQuery, restaurants]);

  const loadInitialData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!isMountedRef.current) return;
      setUser(currentUser);

      const userOrders = await base44.entities.Order.filter(
        { customer_id: currentUser.id },
        '-created_date',
        50
      );

      if (!isMountedRef.current) return;
      setOrders(userOrders || []);

      // Load restaurant details
      const restaurantIds = [...new Set(userOrders.map(o => o.restaurant_id).filter(Boolean))];
      const restaurantMap = {};
      
      for (const id of restaurantIds.slice(0, 10)) {
        try {
          const restaurant = await base44.entities.Restaurant.get(id);
          if (restaurant) {
            restaurantMap[id] = restaurant;
          }
        } catch (e) {
          // Skip failed restaurant loads
        }
      }
      
      if (isMountedRef.current) {
        setRestaurants(restaurantMap);
      }

      // Start polling for active orders
      const hasActiveOrders = userOrders.some(o => 
        ['pending_confirmation', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up'].includes(o.status)
      );

      if (hasActiveOrders) {
        pollIntervalRef.current = setInterval(() => {
          if (isMountedRef.current) {
            loadOrders(currentUser.id);
          }
        }, 10000);
      }

    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Could not load your orders");
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const loadOrders = async (userId) => {
    try {
      const userOrders = await base44.entities.Order.filter(
        { customer_id: userId },
        '-created_date',
        50
      );
      if (isMountedRef.current) {
        setOrders(userOrders || []);
      }
    } catch (e) {
      console.log("Poll error:", e.message);
    }
  };

  const handleReorder = async (order) => {
    setReordering(order.id);
    try {
      const newOrder = await base44.entities.Order.create({
        restaurant_id: order.restaurant_id,
        customer_id: user.id,
        order_items: order.order_items,
        order_total: order.order_total,
        customer_notes: order.customer_notes,
        status: 'pending_confirmation'
      });

      toast.success('Order placed successfully!');
      
      // Refresh orders
      loadOrders(user.id);
      
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Could not place reorder");
    } finally {
      setReordering(null);
    }
  };

  const activeOrdersCount = orders.filter(o => 
    ['pending_confirmation', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up'].includes(o.status)
  ).length;

  const totalSpent = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.order_total || 0), 0);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-orange-50 min-h-screen">
      <Toaster richColors />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-2">Track your food orders and reorder favorites</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => user && loadOrders(user.id)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => window.location.href = createPageUrl('FoodMenu')} 
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Order Food
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <Package className="w-7 h-7 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{activeOrdersCount}</div>
              <p className="text-xs text-gray-500">Active Orders</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-7 h-7 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'completed').length}
              </div>
              <p className="text-xs text-gray-500">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <Utensils className="w-7 h-7 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              <p className="text-xs text-gray-500">Total Orders</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4 text-center">
              <Receipt className="w-7 h-7 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(0)}</div>
              <p className="text-xs text-gray-500">Total Spent</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders Section */}
        {activeOrdersCount > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Active Orders
            </h2>
            <div className="space-y-4">
              {orders
                .filter(o => ['pending_confirmation', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up'].includes(o.status))
                .map(order => (
                  <OrderTrackingCard 
                    key={order.id} 
                    order={order} 
                    restaurant={restaurants[order.restaurant_id]}
                  />
                ))
              }
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by restaurant or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderCard 
                  key={order.id}
                  order={order}
                  restaurant={restaurants[order.restaurant_id]}
                  onReorder={handleReorder}
                  reordering={reordering}
                />
              ))
            ) : (
              <Card className="bg-white shadow-sm">
                <CardContent className="p-12 text-center">
                  <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === "all" ? "No orders yet" : `No ${activeTab} orders`}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {activeTab === "all"
                      ? "Order your first meal to get started"
                      : `You don't have any ${activeTab} orders`
                    }
                  </p>
                  <Button 
                    onClick={() => window.location.href = createPageUrl('FoodMenu')} 
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    Browse Restaurants
                  </Button>
                </CardContent>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, restaurant, onReorder, reordering }) {
  const StatusIcon = statusIcons[order.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {restaurant?.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-orange-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {restaurant?.name || 'Restaurant'}
                </h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(order.created_date), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <Badge className={`${statusColors[order.status]} font-medium`}>
              {statusLabels[order.status]}
            </Badge>
          </div>

          {/* Order Items */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              {order.order_items?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-900 font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              {order.order_items?.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{order.order_items.length - 3} more items
                </p>
              )}
            </div>
            <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">
                ${order.order_total?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>

          {/* Delivery Info */}
          {order.pickup_estimate_minutes && ['confirmed', 'preparing'].includes(order.status) && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Estimated ready in {order.pickup_estimate_minutes} minutes
                </p>
                <p className="text-xs text-blue-700">
                  {order.ready_at ? `Ready at ${format(new Date(order.ready_at), 'h:mm a')}` : 'Preparing your order'}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {['pending_confirmation', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up'].includes(order.status) && order.delivery_ride_id && (
              <Button 
                variant="outline"
                onClick={() => window.location.href = createPageUrl('TrackRide') + '?id=' + order.delivery_ride_id}
                className="flex-1"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Track Delivery
              </Button>
            )}
            
            {order.status === 'completed' && (
              <Button 
                variant="outline"
                onClick={() => onReorder(order)}
                disabled={reordering === order.id}
                className="flex-1 text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {reordering === order.id ? 'Ordering...' : 'Reorder'}
              </Button>
            )}

            {order.status === 'completed' && !order.rating && (
              <Button 
                variant="outline"
                className="flex-1"
              >
                <Star className="w-4 h-4 mr-2" />
                Rate Order
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}