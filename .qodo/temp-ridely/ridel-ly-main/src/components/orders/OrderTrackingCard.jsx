import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Package, 
  Truck, 
  Utensils,
  Phone,
  MessageCircle,
  MapPin,
  User,
  Navigation
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';

const trackingSteps = [
  { key: 'pending_confirmation', label: 'Order Placed', icon: CheckCircle2 },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready_for_pickup', label: 'Ready', icon: Package },
  { key: 'picked_up', label: 'On the Way', icon: Truck },
  { key: 'completed', label: 'Delivered', icon: CheckCircle2 }
];

export default function OrderTrackingCard({ order, restaurant }) {
  const [driver, setDriver] = useState(null);
  const [deliveryRide, setDeliveryRide] = useState(null);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    if (order.delivery_ride_id) {
      loadDeliveryInfo();
    }
  }, [order.delivery_ride_id]);

  const loadDeliveryInfo = async () => {
    try {
      const ride = await base44.entities.Ride.get(order.delivery_ride_id);
      setDeliveryRide(ride);

      if (ride?.driver_id) {
        const driverData = await base44.entities.User.get(ride.driver_id);
        setDriver(driverData);
      }

      // Calculate ETA
      if (ride?.duration_minutes) {
        setEta(ride.duration_minutes);
      }
    } catch (e) {
      console.log('Could not load delivery info');
    }
  };

  const currentStepIndex = trackingSteps.findIndex(s => s.key === order.status);
  
  const getEstimatedTime = () => {
    if (order.status === 'picked_up' && eta) {
      return `Arriving in ~${eta} min`;
    }
    if (order.pickup_estimate_minutes && ['confirmed', 'preparing'].includes(order.status)) {
      return `Ready in ~${order.pickup_estimate_minutes} min`;
    }
    if (order.status === 'ready_for_pickup') {
      return 'Waiting for driver pickup';
    }
    return null;
  };

  const estimatedTime = getEstimatedTime();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-gradient-to-br from-white to-orange-50 border-orange-200 shadow-lg overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <motion.div 
            className="h-full bg-gradient-to-r from-orange-500 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIndex + 1) / trackingSteps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {restaurant?.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name}
                  className="w-14 h-14 rounded-xl object-cover shadow-md"
                />
              ) : (
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center shadow-md">
                  <Utensils className="w-7 h-7 text-orange-600" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {restaurant?.name || 'Your Order'}
                </h3>
                <p className="text-sm text-gray-500">
                  Order #{order.id?.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>
            {estimatedTime && (
              <Badge className="bg-orange-100 text-orange-800 px-3 py-1.5">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {estimatedTime}
              </Badge>
            )}
          </div>

          {/* Tracking Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between relative">
              {/* Connection Line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
              <motion.div 
                className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-green-500 -z-10"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStepIndex / (trackingSteps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />

              {trackingSteps.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center z-10">
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-gradient-to-br from-orange-500 to-green-500 text-white' 
                          : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-orange-200' : ''}`}
                      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                    <span className={`text-xs mt-2 text-center max-w-[60px] ${
                      isCompleted ? 'text-gray-900 font-medium' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Status Message */}
          <div className="mb-6 p-4 bg-white rounded-xl border border-orange-100">
            <div className="flex items-center gap-3">
              {order.status === 'preparing' && (
                <>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-purple-600 animate-bounce" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Your food is being prepared</p>
                    <p className="text-sm text-gray-500">The kitchen is working on your order</p>
                  </div>
                </>
              )}
              {order.status === 'ready_for_pickup' && (
                <>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Order is ready!</p>
                    <p className="text-sm text-gray-500">Waiting for driver to pick up</p>
                  </div>
                </>
              )}
              {order.status === 'picked_up' && driver && (
                <>
                  <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">On the way to you!</p>
                    <p className="text-sm text-gray-500">{driver.full_name} is delivering your order</p>
                  </div>
                </>
              )}
              {order.status === 'confirmed' && (
                <>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Order confirmed!</p>
                    <p className="text-sm text-gray-500">Restaurant is preparing to cook</p>
                  </div>
                </>
              )}
              {order.status === 'pending_confirmation' && (
                <>
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Waiting for confirmation</p>
                    <p className="text-sm text-gray-500">Restaurant is reviewing your order</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Driver Info */}
          {driver && ['picked_up', 'ready_for_pickup'].includes(order.status) && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {driver.full_name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{driver.full_name}</p>
                    {driver.driver_info && (
                      <p className="text-sm text-gray-600">
                        {driver.driver_info.vehicle_color} {driver.driver_info.vehicle_make}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Order Items Preview */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Order Items:</p>
            <div className="flex flex-wrap gap-2">
              {order.order_items?.slice(0, 4).map((item, idx) => (
                <Badge key={idx} variant="outline" className="bg-white">
                  {item.quantity}x {item.name}
                </Badge>
              ))}
              {order.order_items?.length > 4 && (
                <Badge variant="outline" className="bg-gray-100">
                  +{order.order_items.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {order.delivery_ride_id && ['picked_up'].includes(order.status) && (
              <Button 
                onClick={() => window.location.href = createPageUrl('TrackRide') + '?id=' + order.delivery_ride_id}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Track on Map
              </Button>
            )}
            <Button variant="outline" className="flex-1">
              <MapPin className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}