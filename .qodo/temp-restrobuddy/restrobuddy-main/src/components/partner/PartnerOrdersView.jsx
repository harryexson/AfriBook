import React, { useState } from "react";
import { MarketplaceOrder } from "@/entities/MarketplaceOrder";
import { Notification } from "@/entities/Notification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Clock, ChefHat, Package, CheckCircle, XCircle, Phone,
  MapPin, User, ShoppingBag, Truck
} from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

export default function PartnerOrdersView({ restaurant, orders, onRefresh }) {
  const [orderTab, setOrderTab] = useState("active");
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const activeOrders = orders.filter(o => 
    ["confirmed", "preparing", "ready"].includes(o.status)
  );
  const completedOrders = orders.filter(o => 
    ["completed", "delivered", "cancelled"].includes(o.status)
  );

  const handleUpdateStatus = async (order, newStatus) => {
    setUpdatingOrder(order.id);
    try {
      await MarketplaceOrder.update(order.id, { status: newStatus });

      // Send notification to customer
      const statusMessages = {
        preparing: "Your order is being prepared!",
        ready: "Your order is ready for pickup!",
        out_for_delivery: "Your order is out for delivery!",
        completed: "Your order has been completed. Thank you!",
        cancelled: "Your order has been cancelled."
      };

      if (statusMessages[newStatus]) {
        await Notification.create({
          customer_email: order.customer_email,
          title: newStatus === 'ready' ? '🎉 Order Ready!' : 
                 newStatus === 'preparing' ? '👨‍🍳 Preparing Your Order' :
                 newStatus === 'completed' ? '✅ Order Complete' : 'Order Update',
          message: statusMessages[newStatus],
          type: 'order_update',
          priority: 'high',
          status: 'unread',
          action_url: createPageUrl('MyOrders'),
          action_label: 'View Order',
          related_order_id: order.id
        });
      }

      onRefresh();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status");
    }
    setUpdatingOrder(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: "bg-blue-500",
      preparing: "bg-purple-500",
      ready: "bg-green-500",
      out_for_delivery: "bg-amber-500",
      completed: "bg-slate-500",
      delivered: "bg-emerald-500",
      cancelled: "bg-red-500"
    };
    return colors[status] || "bg-slate-400";
  };

  const getStatusIcon = (status) => {
    const icons = {
      confirmed: Clock,
      preparing: ChefHat,
      ready: Package,
      out_for_delivery: Truck,
      completed: CheckCircle,
      delivered: CheckCircle,
      cancelled: XCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const OrderCard = ({ order }) => (
    <Card className={`border-2 ${order.status === 'confirmed' ? 'border-blue-300 bg-blue-50' : ''}`}>
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
            <p className="text-sm text-slate-600">
              {format(new Date(order.created_date), 'MMM d, h:mm a')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-600">${order.total_amount?.toFixed(2)}</p>
            <p className="text-xs text-slate-500">{order.items?.length || 0} items</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-slate-600" />
            <span className="font-medium">{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-3 h-3" />
              <span>{order.customer_phone}</span>
            </div>
          )}
          {order.delivery_type === 'delivery' && order.delivery_address && (
            <div className="flex items-start gap-2 text-sm text-slate-600 mt-1">
              <MapPin className="w-3 h-3 mt-0.5" />
              <span>
                {order.delivery_address.street}, {order.delivery_address.city}
              </span>
            </div>
          )}
          <Badge variant="outline" className="mt-2 text-xs">
            {order.delivery_type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
          </Badge>
        </div>

        {/* Order Items */}
        <div className="space-y-2 mb-4">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-slate-700">
                <span className="font-medium">{item.quantity}x</span> {item.name}
              </span>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {order.special_requests && (
            <div className="pt-2 border-t">
              <p className="text-xs text-amber-600 font-medium">Special Request:</p>
              <p className="text-sm text-slate-600 italic">"{order.special_requests}"</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!["completed", "delivered", "cancelled"].includes(order.status) && (
          <div className="flex gap-2 pt-3 border-t">
            {order.status === "confirmed" && (
              <Button
                onClick={() => handleUpdateStatus(order, "preparing")}
                disabled={updatingOrder === order.id}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                Start Preparing
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                onClick={() => handleUpdateStatus(order, "ready")}
                disabled={updatingOrder === order.id}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Package className="w-4 h-4 mr-2" />
                Mark Ready
              </Button>
            )}
            {order.status === "ready" && (
              <>
                {order.delivery_type === 'delivery' ? (
                  <Button
                    onClick={() => handleUpdateStatus(order, "out_for_delivery")}
                    disabled={updatingOrder === order.id}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Out for Delivery
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpdateStatus(order, "completed")}
                    disabled={updatingOrder === order.id}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Order
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outline"
              onClick={() => handleUpdateStatus(order, "cancelled")}
              disabled={updatingOrder === order.id}
              className="text-red-600"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
          <p className="text-slate-600">
            {activeOrders.length} active, {completedOrders.length} completed
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs value={orderTab} onValueChange={setOrderTab}>
        <TabsList className="bg-white border border-slate-200 p-1 mb-6">
          <TabsTrigger value="active" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Active ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Completed ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeOrders.length === 0 ? (
            <Card className="border-0 shadow-xl text-center p-12">
              <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No active orders</h3>
              <p className="text-slate-600">New orders will appear here</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {activeOrders
                .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                .map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedOrders.length === 0 ? (
            <Card className="border-0 shadow-xl text-center p-12">
              <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No completed orders</h3>
              <p className="text-slate-600">Completed orders will appear here</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {completedOrders
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                .slice(0, 20)
                .map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}