import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Order } from "@/entities/Order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Clock, Truck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import 'leaflet/dist/leaflet.css';

// Sub-component that re-centers the map when driver moves
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

const restaurantIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const driverIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const deliveryIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function calcEtaMinutes(driverLoc, destLoc) {
  if (!driverLoc || !destLoc) return null;
  // Haversine rough estimate: avg 25 mph in city
  const R = 3958.8;
  const dLat = ((destLoc.lat - driverLoc.lat) * Math.PI) / 180;
  const dLng = ((destLoc.lng - driverLoc.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((driverLoc.lat * Math.PI) / 180) *
      Math.cos((destLoc.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const distMiles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round((distMiles / 25) * 60));
}

export default function LiveOrderMap({ order: initialOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [lastUpdate, setLastUpdate] = useState(null);
  const etaInterval = useRef(null);
  const [etaMinutes, setEtaMinutes] = useState(null);

  // Real-time subscription to order updates (driver location, status, ETA)
  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    if (!initialOrder?.id) return;

    const unsubscribe = Order.subscribe((event) => {
      if (event.id === initialOrder.id && (event.type === "update" || event.type === "create")) {
        setOrder(event.data);
        setLastUpdate(new Date());
      }
    });

    return () => unsubscribe();
  }, [initialOrder?.id]);

  // Recompute ETA every 30s from driver location
  useEffect(() => {
    const compute = () => {
      if (!order?.driver_location?.lat || !order?.delivery_address) return;
      const destLat = parseFloat(order.delivery_address?.lat);
      const destLng = parseFloat(order.delivery_address?.lng);
      if (!isNaN(destLat) && !isNaN(destLng)) {
        setEtaMinutes(calcEtaMinutes(order.driver_location, { lat: destLat, lng: destLng }));
      } else if (order.estimated_delivery_time) {
        const diff = new Date(order.estimated_delivery_time) - new Date();
        setEtaMinutes(diff > 0 ? Math.round(diff / 60000) : 0);
      }
    };
    compute();
    etaInterval.current = setInterval(compute, 30000);
    return () => clearInterval(etaInterval.current);
  }, [order?.driver_location, order?.delivery_address, order?.estimated_delivery_time]);

  if (!order?.delivery_type || order.delivery_type === 'pickup') {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 text-center text-slate-500">
          Pickup order — live tracking not available
        </CardContent>
      </Card>
    );
  }

  const isOutForDelivery = ["out_for_delivery", "delivered"].includes(order.status);
  const hasDriverLocation = order.driver_location?.lat && order.driver_location?.lng;

  if (!isOutForDelivery || !hasDriverLocation) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            Delivery Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Waiting for driver assignment...</p>
          <p className="text-sm text-slate-400 mt-1">Map will appear once your driver is on the way</p>
        </CardContent>
      </Card>
    );
  }

  const restaurantLocation = order.restaurant_location || { lat: 40.7128, lng: -74.0060 };
  const driverLocation = { lat: order.driver_location.lat, lng: order.driver_location.lng };
  const deliveryLat = parseFloat(order.delivery_address?.lat);
  const deliveryLng = parseFloat(order.delivery_address?.lng);
  const hasDeliveryCoords = !isNaN(deliveryLat) && !isNaN(deliveryLng);
  const deliveryLocation = hasDeliveryCoords
    ? { lat: deliveryLat, lng: deliveryLng }
    : { lat: driverLocation.lat + 0.01, lng: driverLocation.lng + 0.01 };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            Live Delivery Map
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {etaMinutes !== null && (
              <Badge className="bg-emerald-100 text-emerald-800 gap-1">
                <Clock className="w-3 h-3" />
                ~{etaMinutes} min away
              </Badge>
            )}
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {order.driver_name || 'Driver'} on the way
            </Badge>
          </div>
        </div>
        {lastUpdate && (
          <p className="text-xs text-slate-400 mt-1">
            Location updated {format(lastUpdate, 'h:mm:ss a')}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Map */}
        <div className="h-72 sm:h-96">
          <MapContainer
            center={[driverLocation.lat, driverLocation.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <MapUpdater center={[driverLocation.lat, driverLocation.lng]} />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Restaurant */}
            <Marker position={[restaurantLocation.lat, restaurantLocation.lng]} icon={restaurantIcon}>
              <Popup>
                <p className="font-bold text-sm">Restaurant</p>
                <p className="text-xs text-slate-500">Order origin</p>
              </Popup>
            </Marker>

            {/* Driver */}
            <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
              <Popup>
                <p className="font-bold text-sm">{order.driver_name || 'Your Driver'}</p>
                {order.driver_phone && <p className="text-xs text-slate-500">{order.driver_phone}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  Updated: {format(new Date(order.driver_location.last_updated || Date.now()), 'h:mm a')}
                </p>
              </Popup>
            </Marker>

            {/* Delivery destination */}
            <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={deliveryIcon}>
              <Popup>
                <p className="font-bold text-sm">Your Address</p>
                <p className="text-xs text-slate-500">{order.delivery_address?.street}</p>
              </Popup>
            </Marker>

            {/* Route line */}
            <Polyline
              positions={[
                [restaurantLocation.lat, restaurantLocation.lng],
                [driverLocation.lat, driverLocation.lng],
                [deliveryLocation.lat, deliveryLocation.lng]
              ]}
              color="#10b981"
              weight={3}
              opacity={0.7}
              dashArray="8,4"
            />
          </MapContainer>
        </div>

        {/* Driver Info Bar */}
        <div className="p-4 bg-slate-50 border-t flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{order.driver_name || 'Your Driver'}</p>
              {order.driver_phone && (
                <p className="text-sm text-slate-500">{order.driver_phone}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {etaMinutes !== null && (
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{etaMinutes}</p>
                <p className="text-xs text-slate-500">min away</p>
              </div>
            )}
            {order.driver_phone && (
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${order.driver_phone}`}>
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 pb-4 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-green-600" /> Restaurant</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-600" /> Driver</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" /> Your Address</span>
        </div>
      </CardContent>
    </Card>
  );
}