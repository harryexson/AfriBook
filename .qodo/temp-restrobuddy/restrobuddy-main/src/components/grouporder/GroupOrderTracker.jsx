import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  Truck,
  Package,
  ChefHat,
  MapPin,
  Phone
} from "lucide-react";

export default function GroupOrderTracker({ groupOrder }) {
  const getStatusIcon = (status) => {
    const icons = {
      'submitted': Package,
      'confirmed': CheckCircle2,
      'preparing': ChefHat,
      'ready': CheckCircle2,
      'out_for_delivery': Truck,
      'delivered': CheckCircle2,
      'completed': CheckCircle2
    };
    return icons[status] || Package;
  };

  const getStatusColor = (status) => {
    const colors = {
      'submitted': 'text-blue-600',
      'confirmed': 'text-green-600',
      'preparing': 'text-amber-600',
      'ready': 'text-green-600',
      'out_for_delivery': 'text-purple-600',
      'delivered': 'text-green-600',
      'completed': 'text-green-600',
      'cancelled': 'text-red-600'
    };
    return colors[status] || 'text-slate-600';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'collecting': 'Collecting Orders',
      'closed': 'Closed for Orders',
      'submitted': 'Order Submitted',
      'confirmed': 'Confirmed by Restaurant',
      'preparing': 'Being Prepared',
      'ready': 'Ready for Pickup',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return labels[status] || status;
  };

  // Define order tracking steps
  const trackingSteps = groupOrder.delivery_type === 'delivery' 
    ? ['submitted', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
    : ['submitted', 'confirmed', 'preparing', 'ready', 'completed'];

  const currentStepIndex = trackingSteps.indexOf(groupOrder.status);

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          Order Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-3 ${getStatusColor(groupOrder.status)}`}>
            {React.createElement(getStatusIcon(groupOrder.status), { className: "w-8 h-8" })}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            {getStatusLabel(groupOrder.status)}
          </h3>
          {groupOrder.order_status && groupOrder.order_status !== groupOrder.status && (
            <p className="text-sm text-slate-600">
              Order Status: {groupOrder.order_status}
            </p>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {trackingSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const StatusIcon = getStatusIcon(step);
            
            return (
              <div key={step} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StatusIcon className="w-5 h-5" />
                    )}
                  </div>
                  {idx < trackingSteps.length - 1 && (
                    <div className={`w-0.5 h-12 ${
                      isCompleted ? 'bg-green-600' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className={`font-semibold ${
                    isCurrent ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                  }`}>
                    {getStatusLabel(step)}
                  </p>
                  {groupOrder.status_history && groupOrder.status_history.find(h => h.status === step) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(groupOrder.status_history.find(h => h.status === step).timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimated Times */}
        {(groupOrder.estimated_ready_time || groupOrder.estimated_delivery_time) && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            {groupOrder.estimated_ready_time && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Estimated Ready:</span>
                <span className="text-blue-700">
                  {new Date(groupOrder.estimated_ready_time).toLocaleString()}
                </span>
              </div>
            )}
            {groupOrder.estimated_delivery_time && (
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Estimated Delivery:</span>
                <span className="text-blue-700">
                  {new Date(groupOrder.estimated_delivery_time).toLocaleString()}
                </span>
              </div>
            )}
            {groupOrder.actual_delivery_time && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">Delivered At:</span>
                <span className="text-green-700">
                  {new Date(groupOrder.actual_delivery_time).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Driver Info */}
        {groupOrder.driver_info && (
          <div className="bg-purple-50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-purple-900 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Delivery Driver
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-purple-700">
                <span className="font-medium">Name:</span> {groupOrder.driver_info.name}
              </p>
              {groupOrder.driver_info.phone && (
                <p className="text-purple-700 flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {groupOrder.driver_info.phone}
                </p>
              )}
              {groupOrder.driver_info.location && (
                <p className="text-xs text-purple-600">
                  Last updated: {new Date(groupOrder.driver_info.location.last_updated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Delivery Address */}
        {groupOrder.delivery_type === 'delivery' && groupOrder.delivery_address && (
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </p>
            <p className="text-sm text-slate-700">
              {groupOrder.delivery_address.street}<br />
              {groupOrder.delivery_address.city}, {groupOrder.delivery_address.state} {groupOrder.delivery_address.zip}
            </p>
            {groupOrder.delivery_address.instructions && (
              <p className="text-xs text-slate-600 mt-2 italic">
                Instructions: {groupOrder.delivery_address.instructions}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}