import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Order } from "@/entities/Order";
import { DeliveryDriver } from "@/entities/DeliveryDriver";
import { DeliveryBatch } from "@/entities/DeliveryBatch";
import { Users, MapPin, Clock, Truck, Package } from "lucide-react";
import { toast } from "sonner";

export default function BatchManager({ restaurant }) {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeBatches, setActiveBatches] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (restaurant) {
      loadData();
    }
  }, [restaurant]);

  const loadData = async () => {
    try {
      // Load pending delivery orders
      const orders = await Order.list();
      const pending = orders.filter(o => 
        o.delivery_type === 'delivery' && 
        ['confirmed', 'ready'].includes(o.status)
      );
      setPendingOrders(pending);

      // Load available drivers
      const driverList = await DeliveryDriver.filter({ 
        restaurant_id: restaurant.id,
        active: true
      });
      setDrivers(driverList.filter(d => d.status !== 'on_delivery'));

      // Load active batches
      const batches = await DeliveryBatch.filter({ restaurant_id: restaurant.id });
      setActiveBatches(batches.filter(b => !['completed', 'cancelled'].includes(b.status)));
    } catch (error) {
      console.error("Failed to load batch data:", error);
    }
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleCreateBatch = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Select at least one order");
      return;
    }
    if (!selectedDriver) {
      toast.error("Select a driver");
      return;
    }

    setIsCreating(true);
    try {
      const response = await base44.functions.invoke('createDeliveryBatch', {
        restaurant_id: restaurant.id,
        driver_id: selectedDriver,
        order_ids: selectedOrders
      });

      if (response?.data?.success) {
        toast.success(`Batch created with ${response.data.total_orders} orders`);
        setSelectedOrders([]);
        setSelectedDriver("");
        await loadData();
      }
    } catch (error) {
      console.error("Batch creation error:", error);
      toast.error("Failed to create batch");
    }
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Batch Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Create Delivery Batch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Driver</label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} - {driver.vehicle_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Orders ({selectedOrders.length} selected)
            </label>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pendingOrders.map(order => (
                <div
                  key={order.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedOrders.includes(order.id) ? 'bg-emerald-50 border-emerald-500' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => toggleOrderSelection(order.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-slate-600">
                        {order.delivery_address?.street}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">${order.total_amount?.toFixed(2)}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">{order.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {pendingOrders.length === 0 && (
                <p className="text-center text-slate-500 py-8">No pending delivery orders</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleCreateBatch}
            disabled={isCreating || selectedOrders.length === 0 || !selectedDriver}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isCreating ? "Creating..." : `Create Batch (${selectedOrders.length} orders)`}
          </Button>
        </CardContent>
      </Card>

      {/* Active Batches */}
      <div>
        <h3 className="text-xl font-bold mb-4">Active Batches</h3>
        <div className="space-y-3">
          {activeBatches.map(batch => (
            <Card key={batch.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold">{batch.driver_name}</p>
                      <p className="text-sm text-slate-600">
                        {batch.order_ids?.length} orders
                      </p>
                    </div>
                  </div>
                  <Badge className={
                    batch.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    batch.status === 'picked_up' ? 'bg-purple-100 text-purple-800' :
                    batch.status === 'in_transit' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-800'
                  }>
                    {batch.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {batch.total_distance && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{batch.total_distance.toFixed(1)} mi</span>
                    </div>
                  )}
                  {batch.estimated_duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{batch.estimated_duration} min</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {activeBatches.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No active delivery batches</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}