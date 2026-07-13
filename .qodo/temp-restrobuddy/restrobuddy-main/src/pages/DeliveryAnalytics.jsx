import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { Order } from "@/entities/Order";
import { DeliveryBatch } from "@/entities/DeliveryBatch";
import { Restaurant } from "@/entities/Restaurant";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Clock, Truck, DollarSign, Package, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DeliveryAnalytics() {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week");
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const restaurants = await Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length > 0) {
        const rest = restaurants[0];
        setRestaurant(rest);

        // Calculate date range
        const now = new Date();
        const startDate = new Date();
        if (timeRange === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (timeRange === "month") {
          startDate.setMonth(now.getMonth() - 1);
        } else if (timeRange === "year") {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        // Load orders
        const allOrders = await Order.list();
        const filteredOrders = allOrders.filter(o => 
          new Date(o.created_date) >= startDate
        );
        setOrders(filteredOrders);

        // Load batches
        const allBatches = await DeliveryBatch.filter({ restaurant_id: rest.id });
        const filteredBatches = allBatches.filter(b =>
          new Date(b.created_date) >= startDate
        );
        setBatches(filteredBatches);

        // Calculate statistics
        calculateStats(filteredOrders, filteredBatches);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
    setIsLoading(false);
  };

  const calculateStats = (ordersList, batchesList) => {
    const totalOrders = ordersList.length;
    const deliveryOrders = ordersList.filter(o => o.delivery_type === 'delivery');
    const completedOrders = ordersList.filter(o => o.status === 'completed' || o.status === 'delivered');
    const totalRevenue = ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Peak hours analysis
    const hourCounts = {};
    ordersList.forEach(o => {
      const hour = new Date(o.created_date).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    // Delivery performance
    const completedDeliveries = deliveryOrders.filter(o => o.status === 'delivered');
    const avgDeliveryTime = completedDeliveries.reduce((sum, o) => {
      if (o.actual_delivery_time && o.created_date) {
        const diff = new Date(o.actual_delivery_time) - new Date(o.created_date);
        return sum + diff / (1000 * 60); // minutes
      }
      return sum;
    }, 0) / (completedDeliveries.length || 1);

    setStats({
      totalOrders,
      totalRevenue,
      avgOrderValue,
      deliveryOrders: deliveryOrders.length,
      completedOrders: completedOrders.length,
      peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
      avgDeliveryTime: Math.round(avgDeliveryTime),
      totalBatches: batchesList.length,
      avgBatchSize: batchesList.length > 0 ? 
        (batchesList.reduce((sum, b) => sum + (b.order_ids?.length || 0), 0) / batchesList.length).toFixed(1) : 0
    });
  };

  const getHourlyData = () => {
    const hourly = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, orders: 0 }));
    orders.forEach(o => {
      const hour = new Date(o.created_date).getHours();
      hourly[hour].orders++;
    });
    return hourly;
  };

  const getDailyData = () => {
    const daily = {};
    orders.forEach(o => {
      const date = new Date(o.created_date).toLocaleDateString();
      daily[date] = (daily[date] || 0) + 1;
    });
    return Object.entries(daily).map(([date, count]) => ({ date, orders: count }));
  };

  const getStatusDistribution = () => {
    const statusCounts = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({ 
      name: status, 
      value: count 
    }));
  };

  const getDeliveryTypeData = () => {
    const pickup = orders.filter(o => o.delivery_type === 'pickup').length;
    const delivery = orders.filter(o => o.delivery_type === 'delivery').length;
    return [
      { name: 'Pickup', value: pickup },
      { name: 'Delivery', value: delivery }
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SubscriptionGate feature="advanced_analytics">
      <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Delivery Analytics</h1>
          <p className="text-slate-600">Order volume, peak times, and delivery performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Orders</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalOrders}</p>
              </div>
              <Package className="w-12 h-12 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-600">${stats.totalRevenue?.toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Peak Hour</p>
                <p className="text-3xl font-bold text-slate-900">{stats.peakHour}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Delivery Time</p>
                <p className="text-3xl font-bold text-slate-900">{stats.avgDeliveryTime}m</p>
              </div>
              <Truck className="w-12 h-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="hourly" className="mb-8">
        <TabsList>
          <TabsTrigger value="hourly">Hourly Volume</TabsTrigger>
          <TabsTrigger value="daily">Daily Trends</TabsTrigger>
          <TabsTrigger value="status">Order Status</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Types</TabsTrigger>
        </TabsList>

        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Order Volume by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getHourlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Order Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getDailyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={getStatusDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getStatusDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Pickup vs Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={getDeliveryTypeData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getDeliveryTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[COLORS[0], COLORS[1]][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delivery Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Batching Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Total Batches</span>
              <span className="font-bold text-2xl">{stats.totalBatches}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Avg Orders per Batch</span>
              <span className="font-bold text-2xl">{stats.avgBatchSize}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Delivery Orders</span>
              <span className="font-bold text-2xl">{stats.deliveryOrders}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Completion Rate</span>
              <span className="font-bold text-2xl">
                {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Avg Order Value</span>
              <span className="font-bold text-2xl">${stats.avgOrderValue?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Completed Orders</span>
              <span className="font-bold text-2xl">{stats.completedOrders}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </SubscriptionGate>
  );
}