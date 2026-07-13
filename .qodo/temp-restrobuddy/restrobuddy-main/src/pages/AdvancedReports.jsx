import React, { useState, useEffect } from "react";
import { Order } from "@/entities/Order";
import { MenuItem } from "@/entities/MenuItem";
import { InventoryItem } from "@/entities/InventoryItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Clock, Star, Users, Package } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import ExportReportButton from "@/components/analytics/ExportReportButton";
import CustomerDemographics from "@/components/analytics/CustomerDemographics";
import InventoryTurnover from "@/components/analytics/InventoryTurnover";
import SubscriptionGate from "@/components/subscription/SubscriptionGate";

export default function AdvancedReports() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [timeRange, setTimeRange] = useState("7days");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allOrders, allItems, inventory] = await Promise.all([
        Order.list("-created_date", 500),
        MenuItem.list(),
        InventoryItem.list().catch(() => [])
      ]);
      setOrders(allOrders);
      setMenuItems(allItems);
      setInventoryItems(inventory);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const filterOrdersByRange = (orders) => {
    const now = new Date();
    const ranges = {
      "7days": 7,
      "30days": 30,
      "90days": 90,
      "1year": 365
    };
    
    const daysAgo = ranges[timeRange];
    const cutoff = new Date(now.setDate(now.getDate() - daysAgo));
    
    return orders.filter(order => new Date(order.created_date) >= cutoff);
  };

  const filteredOrders = filterOrdersByRange(orders);

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Previous period comparison
  const previousPeriodOrders = orders.filter(order => {
    const orderDate = new Date(order.created_date);
    const now = new Date();
    const ranges = { "7days": 7, "30days": 30, "90days": 90, "1year": 365 };
    const daysAgo = ranges[timeRange];
    const cutoff1 = new Date(now.setDate(now.getDate() - daysAgo));
    const cutoff2 = new Date(cutoff1);
    cutoff2.setDate(cutoff2.getDate() - daysAgo);
    return orderDate >= cutoff2 && orderDate < cutoff1;
  });

  const prevRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;

  // Sales trend data (daily aggregation)
  const salesByDay = {};
  filteredOrders.forEach(order => {
    const date = new Date(order.created_date).toLocaleDateString();
    if (!salesByDay[date]) {
      salesByDay[date] = { date, revenue: 0, orders: 0 };
    }
    salesByDay[date].revenue += order.total_amount;
    salesByDay[date].orders += 1;
  });
  const salesTrendData = Object.values(salesByDay).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Best selling items
  const itemSales = {};
  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      if (!itemSales[item.name]) {
        itemSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      itemSales[item.name].quantity += item.quantity;
      itemSales[item.name].revenue += item.price * item.quantity;
    });
  });
  const topItems = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Peak hours analysis
  const hourlyOrders = Array(24).fill(0).map((_, hour) => ({ hour: `${hour}:00`, orders: 0 }));
  filteredOrders.forEach(order => {
    const hour = new Date(order.created_date).getHours();
    hourlyOrders[hour].orders += 1;
  });

  // Order source breakdown
  const ordersByType = {};
  filteredOrders.forEach(order => {
    const type = order.order_type || "web";
    ordersByType[type] = (ordersByType[type] || 0) + 1;
  });
  const orderSourceData = Object.entries(ordersByType).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  // Prepare export data
  const exportData = filteredOrders.map(order => ({
    date: new Date(order.created_date).toLocaleDateString(),
    order_id: order.id,
    customer: order.customer_name,
    items_count: order.items?.length || 0,
    total: order.total_amount,
    status: order.status,
    payment_status: order.payment_status,
    order_type: order.order_type
  }));

  return (
    <SubscriptionGate feature="advanced_analytics">
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Advanced Analytics</h1>
            <p className="text-slate-600">Comprehensive insights for data-driven decisions</p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <ExportReportButton data={exportData} filename={`sales-report-${timeRange}`} />
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border shadow-sm p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sales Overview
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customer Insights
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory Turnover
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-2">
                {revenueGrowth >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+{revenueGrowth.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm">{revenueGrowth.toFixed(1)}%</span>
                  </>
                )}
                <span className="text-xs opacity-80 ml-1">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{totalOrders}</p>
              <p className="text-sm text-slate-500 mt-2">
                {(totalOrders / (timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90)).toFixed(1)} orders/day avg
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Avg Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">${avgOrderValue.toFixed(2)}</p>
              <p className="text-sm text-slate-500 mt-2">Per transaction</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Top Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-slate-900">
                {topItems[0]?.name || "N/A"}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                {topItems[0]?.quantity || 0} sold
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Trend Chart */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Sales Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue ($)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Top Selling Items */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-600" />
                Top Selling Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topItems.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {topItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">{item.quantity} sold</p>
                    </div>
                    <p className="font-bold text-emerald-600">${item.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Sources */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
                Order Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {orderSourceData.map((source, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <p className="font-semibold text-slate-900 capitalize">{source.name}</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{source.value}</p>
                    <p className="text-xs text-slate-600">orders</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Peak Hours */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-600" />
              Peak Hours Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyOrders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#8b5cf6" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <p className="text-sm text-purple-900">
                <strong>Peak Hour:</strong> {hourlyOrders.reduce((max, hour) => hour.orders > max.orders ? hour : max).hour} 
                {' '}with {Math.max(...hourlyOrders.map(h => h.orders))} orders
              </p>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Customer Insights Tab */}
          <TabsContent value="customers">
            <CustomerDemographics orders={filteredOrders} />
          </TabsContent>

          {/* Inventory Turnover Tab */}
          <TabsContent value="inventory">
            <InventoryTurnover inventoryItems={inventoryItems} orders={filteredOrders} />
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </SubscriptionGate>
  );
}