import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MarketplaceOrder } from "@/entities/MarketplaceOrder";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, RefreshCw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import OrderTracker from "../components/tracking/OrderTracker";
import OrderMessaging from "../components/orders/OrderMessaging";

export default function MarketplaceOrderStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, restaurant } = location.state || {};
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
      // Auto-refresh every 10 seconds for real-time updates
      const interval = setInterval(loadOrder, 10000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const orders = await MarketplaceOrder.filter({ id: orderId });
      if (orders && orders.length > 0) {
        setOrder(orders[0]);
        setError(null);
      } else {
        setError("Order not found");
      }
    } catch (error) {
      console.error("Error loading order:", error);
      setError("Failed to load order");
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrder();
  };

  const handleLeaveReview = () => {
    navigate(createPageUrl("LeaveReview"), {
      state: { order, orderType: "marketplace" }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <p className="text-2xl font-bold text-slate-900 mb-4">{error}</p>
          <Button onClick={() => navigate(createPageUrl("Marketplace"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Marketplace"))}
            className="hover:bg-slate-100 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>

          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing}
            className="rounded-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card className="border-0 shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Order #{order.id.slice(-6)}
                </h1>
                <p className="text-emerald-100 text-lg mb-1">{order.restaurant_name}</p>
                <p className="text-emerald-200 text-sm">Thank you, {order.customer_name}!</p>
                <p className="text-emerald-200 text-sm mt-1">
                  {order.delivery_type === 'delivery' ? 'Delivery Order' : 'Pickup Order'}
                </p>
              </div>
              {order.status === 'completed' && (
                <Button
                  onClick={handleLeaveReview}
                  variant="secondary"
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white border-0"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Leave Review
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Real-time Order Tracker */}
        <OrderTracker order={order} showMap={true} />

        {/* Order Messaging */}
        <div className="mt-8">
          <OrderMessaging order={order} isRestaurant={false} />
        </div>

        {/* Order Details */}
        <Card className="border-0 shadow-xl mt-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Order Details</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                    {item.special_instructions && (
                      <p className="text-xs text-amber-600 mt-1">
                        Note: {item.special_instructions}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-emerald-600">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {order.special_requests && (
              <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <p className="text-sm font-semibold text-amber-900 mb-1">Special Requests:</p>
                <p className="text-sm text-amber-800">{order.special_requests}</p>
              </div>
            )}

            <div className="border-t-2 border-slate-200 mt-6 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-slate-900">Total</span>
                <span className="text-3xl font-bold text-emerald-600">
                  ${order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button
            onClick={() => navigate(createPageUrl("Marketplace"))}
            variant="outline"
            size="lg"
            className="rounded-full"
          >
            Browse More Restaurants
          </Button>
        </div>
      </div>
    </div>
  );
}