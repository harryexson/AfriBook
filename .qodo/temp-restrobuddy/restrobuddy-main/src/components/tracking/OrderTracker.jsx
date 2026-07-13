import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  ChefHat,
  Package,
  Truck,
  MapPin,
  Phone,
  Navigation
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const statusSteps = {
  pickup: [
    { status: "confirmed", label: "Order Confirmed", icon: CheckCircle, description: "Your order has been received" },
    { status: "preparing", label: "Being Prepared", icon: ChefHat, description: "Our kitchen is working on your order" },
    { status: "ready", label: "Ready for Pickup", icon: Package, description: "Your order is ready!" },
    { status: "completed", label: "Completed", icon: CheckCircle, description: "Order picked up" }
  ],
  delivery: [
    { status: "confirmed", label: "Order Confirmed", icon: CheckCircle, description: "Your order has been received" },
    { status: "preparing", label: "Being Prepared", icon: ChefHat, description: "Our kitchen is working on your order" },
    { status: "ready", label: "Ready", icon: Package, description: "Order is ready for delivery" },
    { status: "out_for_delivery", label: "Out for Delivery", icon: Truck, description: "Driver is on the way" },
    { status: "delivered", label: "Delivered", icon: CheckCircle, description: "Order delivered!" }
  ]
};

const statusColors = {
  confirmed: "bg-blue-500",
  preparing: "bg-purple-500",
  ready: "bg-green-500",
  out_for_delivery: "bg-orange-500",
  delivered: "bg-green-600",
  completed: "bg-slate-500"
};

export default function OrderTracker({ order, showMap = false }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const isDelivery = order.delivery_type === "delivery";
  const steps = isDelivery ? statusSteps.delivery : statusSteps.pickup;
  
  const currentStepIndex = steps.findIndex(step => step.status === order.status);
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (!order.estimated_delivery_time && !order.estimated_ready_time) return;

    const updateTime = () => {
      const targetTime = isDelivery ? order.estimated_delivery_time : order.estimated_ready_time;
      if (!targetTime) return;

      const now = new Date();
      const target = new Date(targetTime);
      const diff = target - now;

      if (diff > 0) {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining({ minutes, seconds });
      } else {
        setTimeRemaining(null);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [order.estimated_delivery_time, order.estimated_ready_time, isDelivery]);

  return (
    <div className="space-y-6">
      {/* Status Progress */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className={`h-2 ${statusColors[order.status]} transition-all`} />
        <CardContent className="p-6">
          {/* Current Status Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {React.createElement(currentStep.icon, {
                className: "w-8 h-8 text-emerald-600"
              })}
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {currentStep.label}
                </h3>
                <p className="text-slate-600">{currentStep.description}</p>
              </div>
            </div>
            <Badge className={`${statusColors[order.status]} text-white text-sm px-4 py-2`}>
              {order.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Estimated Time */}
          {timeRemaining && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-slate-900">
                    {isDelivery ? "Estimated Delivery" : "Estimated Ready Time"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">
                    {timeRemaining.minutes}:{timeRemaining.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-slate-600">
                    {format(new Date(isDelivery ? order.estimated_delivery_time : order.estimated_ready_time), 'h:mm a')}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Progress Steps */}
          <div className="relative">
            <div className="flex justify-between mb-4">
              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.status} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isCurrent ? 1.1 : 1,
                          backgroundColor: isActive ? "#10b981" : "#e2e8f0"
                        }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-lg ${
                          isCurrent ? "ring-4 ring-emerald-200" : ""
                        }`}
                      >
                        <StepIcon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      </motion.div>
                      <p className={`text-xs text-center font-semibold ${
                        isActive ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {step.label.split(' ').map((word, i) => (
                          <React.Fragment key={i}>
                            {word}
                            {i < step.label.split(' ').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </p>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="absolute top-6 left-1/2 w-full h-1 -z-10">
                        <motion.div
                          initial={false}
                          animate={{
                            width: idx < currentStepIndex ? "100%" : "0%"
                          }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-emerald-500"
                        />
                        <div className="absolute top-0 left-0 w-full h-full bg-slate-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status History */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Order Timeline
              </h4>
              <div className="space-y-2">
                {order.status_history.slice().reverse().map((history, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-medium capitalize">{history.status.replace('_', ' ')}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-600">
                      {format(new Date(history.timestamp), 'MMM d, h:mm a')}
                    </span>
                    {history.notes && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-600">{history.notes}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Information (for delivery orders) */}
      {isDelivery && order.driver_name && (
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Delivery Driver
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{order.driver_name}</p>
                {order.driver_phone && (
                  <p className="text-sm text-slate-600">{order.driver_phone}</p>
                )}
              </div>
              {order.driver_phone && (
                <Button asChild variant="outline">
                  <a href={`tel:${order.driver_phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call Driver
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map View (if driver location available) */}
      {showMap && isDelivery && order.driver_location && (
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Track Delivery
            </h4>
            <div className="bg-slate-100 rounded-xl overflow-hidden" style={{ height: "300px" }}>
              {/* Map placeholder - would integrate with Google Maps or Mapbox */}
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <MapPin className="w-12 h-12 mb-2" />
                <p className="font-semibold">Driver Location</p>
                <p className="text-sm">
                  Last updated: {order.driver_location.last_updated 
                    ? format(new Date(order.driver_location.last_updated), 'h:mm a')
                    : 'Just now'}
                </p>
                <p className="text-xs mt-2">
                  Lat: {order.driver_location.lat?.toFixed(6)}, 
                  Lng: {order.driver_location.lng?.toFixed(6)}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Map integration ready - connects with Google Maps or Mapbox
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delivery Address (for delivery orders) */}
      {isDelivery && order.delivery_address && (
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Delivery Address
            </h4>
            <div className="text-slate-700">
              <p>{order.delivery_address.street}</p>
              <p>
                {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip}
              </p>
              {order.delivery_address.instructions && (
                <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg">
                  <strong>Instructions:</strong> {order.delivery_address.instructions}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}