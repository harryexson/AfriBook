import React, { useState } from "react";
import { Order } from "@/entities/Order";
import { Notification } from "@/entities/Notification";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, Clock, ChefHat, Package, Truck, 
  CheckCheck, XCircle, AlertCircle, Info 
} from "lucide-react";
import { createPageUrl } from "@/utils";

const STATUS_STAGES = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-slate-500" },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle, color: "bg-blue-500" },
  { value: "preparing", label: "Preparing", icon: ChefHat, color: "bg-amber-500" },
  { value: "ready", label: "Ready", icon: Package, color: "bg-green-500" },
  { value: "out_for_delivery", label: "Out for Delivery", icon: Truck, color: "bg-purple-500" },
  { value: "delivered", label: "Delivered", icon: CheckCheck, color: "bg-emerald-500" },
  { value: "completed", label: "Completed", icon: CheckCheck, color: "bg-emerald-600" },
];

export default function OrderStatusManager({ order, onStatusUpdate, isRestaurant = true }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState(null);

  const getCurrentStageIndex = () => {
    return STATUS_STAGES.findIndex(s => s.value === order.status);
  };

  const getNextStages = () => {
    const currentIndex = getCurrentStageIndex();
    if (order.delivery_type === 'pickup') {
      // Skip delivery stages for pickup
      return STATUS_STAGES.filter(s => 
        s.value !== 'out_for_delivery' && s.value !== 'delivered'
      ).slice(currentIndex + 1);
    }
    return STATUS_STAGES.slice(currentIndex + 1);
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    setNotification(null);

    try {
      // Update order status
      const statusHistory = order.status_history || [];
      statusHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        notes: `Status changed by ${isRestaurant ? 'restaurant' : 'customer'}`
      });

      await Order.update(order.id, { 
        status: newStatus,
        status_history: statusHistory
      });

      // Send notification to customer
      if (order.customer_email) {
        const notificationMessages = {
          confirmed: '✅ Your order has been confirmed!',
          preparing: '👨‍🍳 Your order is being prepared',
          ready: '🎉 Your order is ready for pickup!',
          out_for_delivery: '🚚 Your order is on the way!',
          delivered: '✓ Your order has been delivered',
          completed: '✓ Order completed - Thank you!'
        };

        // Create in-app notification
        try {
          await base44.asServiceRole.entities.Notification.create({
            customer_email: order.customer_email,
            customer_phone: order.customer_phone,
            title: `Order #${order.id.slice(-6)} Update`,
            message: notificationMessages[newStatus] || `Status updated to ${newStatus}`,
            type: 'order_update',
            priority: 'high',
            status: 'unread',
            action_url: createPageUrl('OrderStatus') + `?id=${order.id}`,
            action_label: 'View Order',
            related_order_id: order.id,
            icon: 'package'
          });
        } catch (error) {
          console.log('In-app notification failed:', error);
        }

        // Send email + SMS notifications via backend
        try {
          await base44.asServiceRole.functions.invoke('notifyOrderStatus', {
            orderId: order.id,
            newStatus: newStatus,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone,
            customerName: order.customer_name || 'Customer',
            restaurantName: order.restaurant_name || 'Restaurant',
            orderDetails: {
              delivery_type: order.delivery_type,
              items: order.items
            }
          });
        } catch (error) {
          console.log('Backend notification failed:', error);
        }
      }

      setNotification({
        type: 'success',
        message: `Order status updated to ${newStatus}`
      });

      if (onStatusUpdate) {
        onStatusUpdate(newStatus);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setNotification({
        type: 'error',
        message: 'Failed to update status. Please try again.'
      });
    }
    setIsUpdating(false);
  };

  const currentStage = STATUS_STAGES.find(s => s.value === order.status);
  const CurrentIcon = currentStage?.icon || Clock;
  const nextStages = getNextStages();

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CurrentIcon className="w-5 h-5" />
          Order Status Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notification && (
          <Alert className={notification.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={notification.type === 'success' ? 'text-green-900' : 'text-red-900'}>
              {notification.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Status */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border-2 border-slate-200">
          <p className="text-sm text-slate-600 mb-2">Current Status</p>
          <div className="flex items-center gap-3">
            <div className={`${currentStage?.color} w-12 h-12 rounded-full flex items-center justify-center`}>
              <CurrentIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{currentStage?.label}</p>
              <p className="text-sm text-slate-600">
                Updated {new Date(order.updated_date).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 mb-3">Status Timeline</p>
          {STATUS_STAGES.filter(stage => {
            if (order.delivery_type === 'pickup') {
              return stage.value !== 'out_for_delivery' && stage.value !== 'delivered';
            }
            return true;
          }).map((stage, index) => {
            const isCompleted = getCurrentStageIndex() >= STATUS_STAGES.findIndex(s => s.value === stage.value);
            const isCurrent = stage.value === order.status;
            const StageIcon = stage.icon;

            return (
              <div key={stage.value} className={`flex items-center gap-3 p-3 rounded-lg ${isCurrent ? 'bg-blue-50 border-2 border-blue-200' : 'bg-slate-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? stage.color : 'bg-slate-300'}`}>
                  <StageIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                    {stage.label}
                  </p>
                  {isCompleted && order.status_history && (
                    <p className="text-xs text-slate-600">
                      {(() => {
                        const historyItem = order.status_history.find(h => h.status === stage.value);
                        return historyItem 
                          ? new Date(historyItem.timestamp).toLocaleString()
                          : 'Completed';
                      })()}
                    </p>
                  )}
                </div>
                {isCurrent && (
                  <Badge className="bg-blue-600">Current</Badge>
                )}
                {isCompleted && !isCurrent && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Next Actions */}
        {isRestaurant && nextStages.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Update Status To:</p>
            <div className="grid grid-cols-1 gap-2">
              {nextStages.map(stage => {
                const StageIcon = stage.icon;
                return (
                  <Button
                    key={stage.value}
                    onClick={() => handleStatusChange(stage.value)}
                    disabled={isUpdating}
                    variant="outline"
                    className="justify-start h-auto py-3 hover:bg-slate-50"
                  >
                    <div className={`${stage.color} w-10 h-10 rounded-full flex items-center justify-center mr-3`}>
                      <StageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{stage.label}</p>
                      <p className="text-xs text-slate-600">
                        {stage.value === 'confirmed' && 'Accept and start processing'}
                        {stage.value === 'preparing' && 'Mark as being prepared'}
                        {stage.value === 'ready' && 'Order ready for pickup/delivery'}
                        {stage.value === 'out_for_delivery' && 'Driver dispatched'}
                        {stage.value === 'delivered' && 'Order delivered to customer'}
                        {stage.value === 'completed' && 'Finalize order'}
                      </p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {order.status === 'cancelled' && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              This order has been cancelled.
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Customers receive automatic notifications when you update the order status.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}