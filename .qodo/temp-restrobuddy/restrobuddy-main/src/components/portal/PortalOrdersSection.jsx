import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShoppingBag, Clock, ChefHat, Package, CheckCircle,
  Store, ArrowRight, Truck
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function PortalOrdersSection({ orders, onRefresh }) {
  const navigate = useNavigate();
  const [orderTab, setOrderTab] = useState("active");

  const activeOrders = orders.filter(o => 
    ["confirmed", "preparing", "ready", "out_for_delivery"].includes(o.status)
  );
  
  const completedOrders = orders.filter(o => 
    ["completed", "delivered", "cancelled"].includes(o.status)
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed": return <Clock className="w-4 h-4" />;
      case "preparing": return <ChefHat className="w-4 h-4" />;
      case "ready": return <Package className="w-4 h-4" />;
      case "out_for_delivery": return <Truck className="w-4 h-4" />;
      case "completed":
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "bg-blue-500";
      case "preparing": return "bg-purple-500";
      case "ready": return "bg-green-500";
      case "out_for_delivery": return "bg-amber-500";
      case "completed":
      case "delivered": return "bg-slate-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-slate-400";
    }
  };

  const OrderCard = ({ order }) => (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold text-slate-900">#{order.id.slice(-6)}</span>
              <Badge className={`${getStatusColor(order.status)} text-white`}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Store className="w-4 h-4" />
              <span>{order.restaurant_name || "In-House Order"}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {format(new Date(order.created_date), 'MMM d, yyyy • h:mm a')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-600">
              ${order.total_amount?.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500">{order.items?.length || 0} items</p>
          </div>
        </div>

        {/* Items Preview */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          {order.items?.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-1">
              <span className="text-slate-700">{item.quantity}x {item.name}</span>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {order.items?.length > 3 && (
            <p className="text-xs text-slate-500 pt-1">+{order.items.length - 3} more items</p>
          )}
        </div>

        {/* Status Progress for Active Orders */}
        {["confirmed", "preparing", "ready"].includes(order.status) && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={order.status === "confirmed" ? "text-blue-600 font-semibold" : "text-slate-400"}>
                Confirmed
              </span>
              <span className={order.status === "preparing" ? "text-purple-600 font-semibold" : "text-slate-400"}>
                Preparing
              </span>
              <span className={order.status === "ready" ? "text-green-600 font-semibold" : "text-slate-400"}>
                Ready
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  order.status === 'confirmed' ? 'w-1/3 bg-blue-500' :
                  order.status === 'preparing' ? 'w-2/3 bg-purple-500' :
                  'w-full bg-green-500'
                }`}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (order.restaurant_id) {
                navigate(createPageUrl(`MarketplaceOrderStatus?orderId=${order.id}`));
              } else {
                navigate(createPageUrl("OrderStatus"), { state: { order } });
              }
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {["completed", "delivered", "cancelled"].includes(order.status) ? 'View Details' : 'Track Order'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          {["completed", "delivered"].includes(order.status) && (
            <Button
              variant="outline"
              onClick={() => {
                if (order.restaurant_id) {
                  navigate(createPageUrl(`MarketplaceRestaurant?id=${order.restaurant_id}`));
                } else {
                  navigate(createPageUrl("OrderMenu"));
                }
              }}
            >
              Reorder
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">My Orders</h2>
        <Button onClick={() => navigate(createPageUrl("Marketplace"))} className="bg-emerald-600">
          <Store className="w-4 h-4 mr-2" />
          Order Now
        </Button>
      </div>

      <Tabs value={orderTab} onValueChange={setOrderTab}>
        <TabsList className="bg-white border border-slate-200 p-1 rounded-lg mb-6">
          <TabsTrigger value="active" className="rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Active ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Order History ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeOrders.length === 0 ? (
            <Card className="border-0 shadow-xl text-center p-12">
              <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No active orders</h3>
              <p className="text-slate-600 mb-6">Browse our marketplace to start ordering</p>
              <Button onClick={() => navigate(createPageUrl("Marketplace"))} className="bg-emerald-600">
                Browse Restaurants
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {activeOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {completedOrders.length === 0 ? (
            <Card className="border-0 shadow-xl text-center p-12">
              <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No order history</h3>
              <p className="text-slate-600">Your completed orders will appear here</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {completedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}