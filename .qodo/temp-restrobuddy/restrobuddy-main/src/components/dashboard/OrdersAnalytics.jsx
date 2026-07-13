import React, { useState, useEffect } from "react";
import { Order } from "@/entities/Order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, DollarSign, ShoppingBag } from "lucide-react";

export default function OrdersAnalytics() {
  const [analytics, setAnalytics] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    peakHour: "12 PM",
    avgOrderValue: 0,
    hourlyData: []
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const orders = await Order.list("-created_date", 500);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_date);
        return orderDate >= today;
      });

      const todayRevenue = todayOrders.reduce((sum, order) => 
        sum + (order.total_amount || 0), 0
      );

      // Calculate hourly distribution
      const hourlyCount = new Array(24).fill(0);
      orders.forEach(order => {
        const hour = new Date(order.created_date).getHours();
        hourlyCount[hour]++;
      });

      const peakHourIndex = hourlyCount.indexOf(Math.max(...hourlyCount));
      const peakHour = `${peakHourIndex % 12 || 12} ${peakHourIndex >= 12 ? 'PM' : 'AM'}`;

      const avgOrderValue = todayOrders.length > 0 
        ? todayRevenue / todayOrders.length 
        : 0;

      setAnalytics({
        todayOrders: todayOrders.length,
        todayRevenue,
        peakHour,
        avgOrderValue,
        hourlyData: hourlyCount
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Today's Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${analytics.todayRevenue.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Today's Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{analytics.todayOrders}</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Peak Hour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{analytics.peakHour}</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Avg Order Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${analytics.avgOrderValue.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
}