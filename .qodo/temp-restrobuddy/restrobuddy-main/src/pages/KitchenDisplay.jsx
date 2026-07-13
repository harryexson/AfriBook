import React, { useState, useEffect, useRef } from "react";
import { Order } from "@/entities/Order";
import { Notification } from "@/entities/Notification";
import { StaffActivityLog } from "@/entities/StaffActivityLog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import OrderCard from "../components/kitchen/OrderCard";
import { AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw, Bell, Volume2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createPageUrl } from "@/utils";

const statusTabs = [
  { value: "all", label: "All Orders" },
  { value: "confirmed", label: "New" },
  { value: "preparing", label: "In Progress" },
  { value: "ready", label: "Ready" }
];

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const previousOrdersRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwgA');
    
    loadOrders();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadOrders, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadOrders = async () => {
    try {
      setError(null);
      const allOrders = await Order.list("-created_date", 100);
      
      const filtered = allOrders.filter(order => 
        ["confirmed", "preparing", "ready"].includes(order.status)
      );
      
      // Check for new orders
      if (previousOrdersRef.current.length > 0) {
        const newOrders = filtered.filter(order => 
          !previousOrdersRef.current.find(prevOrder => prevOrder.id === order.id)
        );
        
        if (newOrders.length > 0 && soundEnabled) {
          playNotificationSound();
          setNotification({
            type: 'info',
            message: `${newOrders.length} new order${newOrders.length > 1 ? 's' : ''} received!`
          });
        }

        // Check for orders that became ready
        const readyOrders = filtered.filter(order => 
          order.status === 'ready' && 
          previousOrdersRef.current.find(prevOrder => 
            prevOrder.id === order.id && prevOrder.status !== 'ready'
          )
        );

        if (readyOrders.length > 0 && soundEnabled) {
          playNotificationSound();
        }
      }
      
      previousOrdersRef.current = filtered;
      setOrders(filtered);
      
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      
      if (error.name !== 'CanceledError' && error.message !== 'Request aborted') {
        setError("Unable to load orders. Please check your connection.");
      }
      
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      await Order.update(orderId, { status: newStatus });

      // Log staff activity
      try {
        const user = await base44.auth.me();
        await StaffActivityLog.create({
          employee_id: user.id,
          employee_name: user.full_name || user.email,
          action_type: 'order_update',
          description: `Updated order #${orderId.slice(-6)} status to ${newStatus}`,
          related_order_id: orderId,
          before_value: order.status,
          after_value: newStatus
        });
      } catch (e) {
        console.log('Could not log activity');
      }
      
      setOrders(prev => {
        const updatedOrders = prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        );

        // Auto-notify for 'ready' or 'out_for_delivery' status
        if ((newStatus === 'ready' || newStatus === 'out_for_delivery') && order?.customer_phone) {
          setNotification({
            type: 'info',
            message: 'Sending notification to customer...'
          });
          setTimeout(() => handleAutoNotifyCustomer(order, newStatus), 500);
        }
        
        return updatedOrders;
      });
      
      setNotification({
        type: 'success',
        message: `Order updated to ${newStatus}`
      });

    } catch (error) {
      console.error("Error updating order:", error);
      setNotification({
        type: 'error',
        message: 'Failed to update order. Please try again.'
      });
    }
  };

  const handlePrintTicket = async (orderId) => {
    try {
      const response = await base44.functions.invoke('printKitchenTicket', {
        orderId
      });

      if (response?.data?.html) {
        const printWindow = window.open('', '', 'height=400,width=800');
        printWindow.document.write(response.data.html);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Print error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to print ticket'
      });
    }
  };

  const handleAutoNotifyCustomer = async (order, status) => {
    try {
      const estimatedTime = status === 'out_for_delivery' 
        ? order.estimated_delivery_time 
        : order.estimated_ready_time;

      let smsSent = false;
      const response = await base44.functions.invoke('sendAutomatedOrderUpdate', {
        orderId: order.id,
        status: status,
        orderedVia: 'web'
      });

      if (response?.data?.success && !response?.data?.demo) {
        smsSent = true;
      }

      // Create in-app notification
      const notificationMessages = {
        ready: `Your order #${order.id.slice(-6)} is ready for pickup!${estimatedTime ? ' Ready by ' + new Date(estimatedTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}`,
        out_for_delivery: `Your order #${order.id.slice(-6)} is out for delivery!${estimatedTime ? ' Expected by ' + new Date(estimatedTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}`
      };

      await Notification.create({
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        title: status === 'ready' ? '🎉 Order Ready!' : '🚚 Order On The Way!',
        message: notificationMessages[status],
        type: 'order_update',
        priority: 'high',
        status: 'unread',
        action_url: createPageUrl('MyOrders'),
        action_label: 'View Order',
        related_order_id: order.id,
        icon: 'shopping-bag',
        sms_sent: smsSent,
        sms_sent_at: smsSent ? new Date().toISOString() : null
      });

      if (response?.data?.success) {
        if (response.data.demo) {
          setNotification({
            type: 'info',
            message: '📱 In-app notification sent (SMS demo mode)'
          });
        } else {
          setNotification({
            type: 'success',
            message: `✓ Customer notified via app & SMS!`
          });
        }
      } else if (response?.data?.opted_out) {
        setNotification({
          type: 'success',
          message: '✓ In-app notification sent (customer opted out of SMS)'
        });
      } else {
        setNotification({
          type: 'success',
          message: '✓ In-app notification sent'
        });
      }
    } catch (error) {
      console.log('Auto-notification error:', error);
    }
  };

  const handleNotifyCustomer = async (order) => {
    try {
      setNotification({ type: 'info', message: 'Sending SMS notification...' });
      
      const response = await base44.functions.invoke('notifyCustomer', {
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        orderNumber: order.id.slice(-6)
      });

      if (response?.data?.success) {
        if (response.data.demo) {
          setNotification({
            type: 'info',
            message: '📱 Demo mode: SMS would be sent in production.'
          });
        } else {
          setNotification({
            type: 'success',
            message: `✓ Customer ${order.customer_name} notified successfully via SMS!`
          });
        }
      } else if (response?.data?.opted_out) {
        setNotification({
          type: 'error',
          message: '⚠ Customer has opted out of SMS notifications'
        });
      } else {
        const errorMsg = response?.data?.error || 'Unknown error';
        setNotification({
          type: 'error',
          message: `Failed to notify customer: ${errorMsg}`
        });
      }
    } catch (error) {
      console.error('Notification error:', error);
      if (error.name !== 'CanceledError') {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        setNotification({
          type: 'error',
          message: `Error sending notification: ${errorMessage}`
        });
      }
    }
  };

  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  const getStatusCount = (status) => {
    if (status === "all") return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allOrders = await Order.list("-created_date", 100);
      const filtered = allOrders.filter(order => 
        ["confirmed", "preparing", "ready"].includes(order.status)
      );
      setOrders(filtered);
      previousOrdersRef.current = filtered;
      setNotification({ type: 'success', message: 'Orders refreshed' });
    } catch (error) {
      console.error("Error refreshing:", error);
      if (error.name !== 'CanceledError') {
        setError("Failed to refresh orders");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Kitchen Display</h1>
            <p className="text-slate-600">Real-time order management system</p>
          </div>
          <div className="flex gap-4 items-start">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <Volume2 className="w-5 h-5 text-slate-700" />
                <Label htmlFor="sound" className="text-sm font-semibold">Sound Alerts</Label>
                <Switch
                  id="sound"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-slate-700" />
                <Label htmlFor="auto-refresh" className="text-sm font-semibold">Auto Refresh</Label>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 flex items-center justify-between">
              <span>{error}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                className="ml-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {notification && (
          <Alert 
            className={`mb-6 ${
              notification.type === 'success' ? 'bg-green-50 border-green-200' :
              notification.type === 'info' ? 'bg-blue-50 border-blue-200' :
              'bg-red-50 border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : notification.type === 'info' ? (
              <Bell className="h-4 w-4 text-blue-600 animate-pulse" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
            <AlertDescription className={
              notification.type === 'success' ? 'text-green-800' :
              notification.type === 'info' ? 'text-blue-800' :
              'text-red-800'
            }>
              {notification.message}
            </AlertDescription>
          </Alert>
        )}

        {autoRefresh && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-800 text-sm font-medium">
              Live updates enabled - refreshing every 5 seconds
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white border border-slate-200 p-2 rounded-full shadow-md inline-flex">
            {statusTabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-full px-6 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold relative"
              >
                {tab.label}
                <Badge className="ml-2 bg-amber-500 text-white">
                  {getStatusCount(tab.value)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredOrders.map(order => (
                <div key={order.id} className="space-y-2">
                  <OrderCard
                    order={order}
                    onUpdateStatus={handleUpdateStatus}
                    onNotifyCustomer={handleNotifyCustomer}
                  />
                  {(order.status === 'confirmed' || order.status === 'preparing') && (
                    <Button
                      onClick={() => handlePrintTicket(order.id)}
                      variant="outline"
                      className="w-full gap-2 text-sm"
                      size="sm"
                    >
                      <Printer className="w-4 h-4" />
                      Print Kitchen Ticket
                    </Button>
                  )}
                </div>
              ))}
            </AnimatePresence>
          </div>
          )}

        {!isLoading && !error && filteredOrders.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-xl">No orders in this category</p>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Orders
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}