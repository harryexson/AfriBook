import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import {
  DollarSign, TrendingUp, ShoppingBag, ArrowUp, ArrowDown, Star
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PartnerSalesReports({ restaurant, orders, isOverview = false }) {
  const [dateRange, setDateRange] = useState("7days");

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today": return { start: startOfDay(now), end: endOfDay(now) };
      case "7days": return { start: subDays(now, 7), end: now };
      case "30days": return { start: subDays(now, 30), end: now };
      case "90days": return { start: subDays(now, 90), end: now };
      default: return { start: subDays(now, 7), end: now };
    }
  };

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange();
    return orders.filter(o => {
      const orderDate = new Date(o.created_date);
      return isWithinInterval(orderDate, { start, end }) && 
             !["cancelled"].includes(o.status);
    });
  }, [orders, dateRange]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const completedOrders = filteredOrders.filter(o => ["completed", "delivered"].includes(o.status)).length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Calculate previous period for comparison
    const { start, end } = getDateRange();
    const periodLength = end - start;
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = new Date(start.getTime() - 1);
    
    const prevOrders = orders.filter(o => {
      const orderDate = new Date(o.created_date);
      return isWithinInterval(orderDate, { start: prevStart, end: prevEnd }) && 
             !["cancelled"].includes(o.status);
    });
    const prevRevenue = prevOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return { totalRevenue, totalOrders, avgOrderValue, completionRate, revenueChange };
  }, [filteredOrders, orders, dateRange]);

  const dailyData = useMemo(() => {
    const { start, end } = getDateRange();
    const days = [];
    let current = new Date(start);
    
    while (current <= end) {
      const dayStart = startOfDay(current);
      const dayEnd = endOfDay(current);
      
      const dayOrders = filteredOrders.filter(o => {
        const orderDate = new Date(o.created_date);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
      });

      days.push({
        date: format(current, 'MMM d'),
        revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        orders: dayOrders.length
      });

      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
    }

    return days;
  }, [filteredOrders, dateRange]);

  const itemPopularity = useMemo(() => {
    const itemCounts = {};
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemCounts[item.name].quantity += item.quantity;
        itemCounts[item.name].revenue += item.price * item.quantity;
      });
    });
    return Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  const ordersByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0 }));
    filteredOrders.forEach(order => {
      const hour = new Date(order.created_date).getHours();
      hours[hour].orders++;
    });
    return hours.filter(h => h.orders > 0);
  }, [filteredOrders]);

  if (isOverview) {
    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Revenue (7 days)</p>
                  <p className="text-2xl font-bold text-emerald-600">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenueChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(stats.revenueChange).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Orders (7 days)</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-purple-600">${stats.avgOrderValue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">Completion Rate</p>
              <p className="text-2xl font-bold text-amber-600">{stats.completionRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {itemPopularity.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {itemPopularity.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">${item.revenue.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{item.quantity} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Sales Reports</h2>
        <Tabs value={dateRange} onValueChange={setDateRange}>
          <TabsList className="bg-white border">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="7days">7 Days</TabsTrigger>
            <TabsTrigger value="30days">30 Days</TabsTrigger>
            <TabsTrigger value="90days">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              <div>
                <p className="text-emerald-100 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-slate-600 text-sm">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-slate-600 text-sm">Avg Order Value</p>
                <p className="text-2xl font-bold">${stats.avgOrderValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-slate-600 text-sm">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Orders by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                  <YAxis />
                  <Tooltip labelFormatter={(h) => `${h}:00`} />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items & Category Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {itemPopularity.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No sales data</p>
            ) : (
              <div className="space-y-3">
                {itemPopularity.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                        {idx + 1}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">${item.revenue.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{item.quantity} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Revenue by Item</CardTitle>
          </CardHeader>
          <CardContent>
            {itemPopularity.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No sales data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={itemPopularity}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {itemPopularity.map((entry, idx) => (
                        <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}