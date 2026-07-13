import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Order } from "@/entities/Order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Printer, RefreshCw, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderDuplicator from "@/components/orders/OrderDuplicator";
import ItemEditModal from "@/components/orders/ItemEditModal";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import ReceiptPreview from "../components/receipts/ReceiptPreview";
import OrderTracker from "../components/tracking/OrderTracker";
import LiveOrderMap from "../components/tracking/LiveOrderMap";
import OrderMessaging from "../components/orders/OrderMessaging";
import OrderPointsBanner from "../components/loyalty/OrderPointsBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OrderStatus() {
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve order ID from state OR URL query param (?id=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const urlOrderId = urlParams.get("id");
  
  const passedOrder = location.state?.order;
  const passedOrderId = location.state?.orderId || urlOrderId;
  
  const [order, setOrder] = useState(passedOrder || null);
  const [isLoading, setIsLoading] = useState(!passedOrder);
  const [error, setError] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const orderIdToFetch = passedOrder?.id || passedOrderId;

  const loadOrder = useCallback(async () => {
    if (!orderIdToFetch) {
      setIsLoading(false);
      setError("No order information provided");
      return;
    }
    
    try {
      const recentOrders = await Order.list("-created_date", 100);
      const foundOrder = recentOrders.find(o => o.id === orderIdToFetch);
      if (foundOrder) {
        setOrder(foundOrder);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      console.error("Error loading order:", err);
      setError("Failed to load order. Please try again.");
    }
    setIsLoading(false);
  }, [orderIdToFetch]);

  useEffect(() => {
    if (!orderIdToFetch) {
      setIsLoading(false);
      setError("No order information provided");
      return;
    }

    if (!passedOrder) loadOrder();
    else setIsLoading(false);

    // Real-time subscription — instant updates when restaurant changes status
    const unsubscribe = Order.subscribe((event) => {
      if (event.data?.id === orderIdToFetch && (event.type === "update" || event.type === "create")) {
        setOrder(event.data);
        setLastUpdated(new Date());
      }
    });

    // Fallback polling every 15s
    const interval = setInterval(loadOrder, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [orderIdToFetch, passedOrder, loadOrder]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrder();
    setIsRefreshing(false);
  };

  // Status step definitions for the live tracker
  const STATUS_STEPS = [
    { key: "pending",          label: "Order Received",      emoji: "📋" },
    { key: "confirmed",        label: "Confirmed",           emoji: "✅" },
    { key: "preparing",        label: "Preparing",           emoji: "🍳" },
    { key: "ready",            label: "Ready for Pickup",    emoji: "🎉" },
    { key: "out_for_delivery", label: "Out for Delivery",    emoji: "🚗" },
    { key: "delivered",        label: "Delivered",           emoji: "📦" },
    { key: "completed",        label: "Completed",           emoji: "⭐" },
  ];

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order?.status);

  const handlePrintReceipt = async () => {
    if (!order) return;
    
    setIsPrinting(true);
    try {
      const response = await base44.functions.invoke('printReceipt', {
        order: order,
        printerType: 'pos'
      });

      if (response?.data?.success || response?.data?.demo) {
        window.print();
      } else {
        alert('Failed to send to printer. Using browser print instead.');
        window.print();
      }
    } catch (error) {
      console.error('Print error:', error);
      window.print();
    }
    setIsPrinting(false);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
  };

  const handleSaveItem = async (updatedItem) => {
    if (!updatedItem) {
      // Delete item
      const newItems = order.items.filter(i => i.menu_item_id !== editingItem.menu_item_id);
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newOrder = { ...order, items: newItems, total_amount: newTotal };
      setOrder(newOrder);
    } else {
      // Update item
      const newItems = order.items.map(i => i.menu_item_id === updatedItem.menu_item_id ? updatedItem : i);
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newOrder = { ...order, items: newItems, total_amount: newTotal };
      setOrder(newOrder);
    }
    setEditingItem(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {error || "Order not found"}
            </h2>
            <p className="text-slate-600 mb-6">
              We couldn't find the order you're looking for. Please check your recent orders or place a new order.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                onClick={() => navigate(createPageUrl("OrderMenu"))}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Order Now
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Home"))}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
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
            onClick={() => navigate(createPageUrl("OrderMenu"))}
            className="hover:bg-slate-100 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
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
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-1">
                  Order #{order.id.slice(-6)}
                </CardTitle>
                <p className="text-emerald-100">Thank you, {order.customer_name}!</p>
                <p className="text-emerald-200 text-sm mt-1">
                  {order.delivery_type === 'delivery' ? '🚗 Delivery Order' : '🏪 Pickup Order'}
                </p>
                {lastUpdated && (
                  <p className="text-emerald-300 text-xs mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowReceipt(true)}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  View Receipt
                </Button>
                <Button
                  onClick={handlePrintReceipt}
                  disabled={isPrinting}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {isPrinting ? 'Printing...' : 'Print'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Loyalty Points Banner — shows after order completes */}
        <OrderPointsBanner order={order} />

        {/* Live Status Timeline */}
        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-600 animate-pulse" />
              Live Order Status
            </h2>
            <div className="relative">
              {/* connector line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-6">
                {STATUS_STEPS.filter(s => !["out_for_delivery","delivered"].includes(s.key) || order.delivery_type === "delivery").map((step, idx) => {
                  const isDone    = currentStepIndex > idx;
                  const isCurrent = currentStepIndex === idx;
                  return (
                    <div key={step.key} className="flex items-center gap-4 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 z-10 border-2 transition-all
                        ${isDone    ? 'bg-emerald-500 border-emerald-500 text-white' :
                          isCurrent ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-100 scale-110' :
                                      'bg-white border-slate-200 text-slate-300'}`}
                      >
                        {isDone ? '✓' : step.emoji}
                      </div>
                      <div>
                        <p className={`font-semibold ${isCurrent ? 'text-emerald-700' : isDone ? 'text-slate-500' : 'text-slate-400'}`}>
                          {step.label}
                          {isCurrent && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">Now</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Tracker (status steps + driver info) */}
        <OrderTracker order={order} showMap={false} />

        {/* Live Delivery Map — real-time Leaflet map with driver location */}
        {order.delivery_type === 'delivery' && (
          <div className="mt-8">
            <LiveOrderMap order={order} />
          </div>
        )}

        {/* Order Messaging */}
        <div className="mt-8">
          <OrderMessaging order={order} isRestaurant={false} />
        </div>

        {/* Order Details */}
        <Card className="border-0 shadow-xl mt-8">
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Order Details</CardTitle>
            {!isEditing && order.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Order
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items && order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                    {item.special_instructions && (
                      <p className="text-xs text-amber-600 mt-1">
                        Note: {item.special_instructions}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-emerald-600">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditItem(item)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
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

        <div className="flex gap-4 justify-center mt-8 flex-wrap">
          {isEditing && (
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              Done Editing
            </Button>
          )}
          {order.items && !isEditing && (
            <OrderDuplicator
              order={order}
              onDuplicate={(items) => {
                navigate(createPageUrl("Checkout"), { state: { cart: items.map(item => ({
                  menu_item_id: item.menu_item_id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  customizations: item.customizations
                })) } });
              }}
            />
          )}
          <Button
            onClick={() => navigate(createPageUrl("OrderMenu"))}
            variant="outline"
            size="lg"
            className="rounded-full"
          >
            Place Another Order
          </Button>
        </div>
      </div>

      {/* Item Edit Modal */}
      {editingItem && (
        <ItemEditModal
          isOpen={!!editingItem}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
        />
      )}

      {/* Receipt Preview Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Receipt</DialogTitle>
          </DialogHeader>
          <div className="max-h-[600px] overflow-y-auto">
            <ReceiptPreview order={order} />
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowReceipt(false)}
            >
              Close
            </Button>
            <Button
              onClick={handlePrintReceipt}
              disabled={isPrinting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              {isPrinting ? 'Printing...' : 'Print Receipt'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}