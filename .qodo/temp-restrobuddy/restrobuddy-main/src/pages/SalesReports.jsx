import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  Calendar,
  Download,
  Printer,
  CreditCard,
  Banknote,
  BarChart3,
  PieChart,
  Receipt,
  RefreshCw
} from "lucide-react";
import { Order } from "@/entities/Order";
import { MarketplaceOrder } from "@/entities/MarketplaceOrder";
import { MenuItem } from "@/entities/MenuItem";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function SalesReports() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case "week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last30":
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, marketplaceData, menuData] = await Promise.all([
        Order.list("-created_date", 500),
        MarketplaceOrder.list("-created_date", 500),
        MenuItem.list()
      ]);

      const { start, end } = getDateRange();
      
      const filteredOrders = [...ordersData, ...marketplaceData].filter(order => {
        const orderDate = new Date(order.created_date);
        return orderDate >= start && orderDate <= end;
      });

      setOrders(filteredOrders);
      setMenuItems(menuData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  // Calculate metrics
  const completedOrders = orders.filter(o => o.status === "completed" || o.payment_status === "completed");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const totalOrders = orders.length;

  // Sales by hour
  const salesByHour = Array(24).fill(0).map((_, hour) => {
    const hourOrders = completedOrders.filter(o => {
      const orderHour = new Date(o.created_date).getHours();
      return orderHour === hour;
    });
    return {
      hour: `${hour}:00`,
      sales: hourOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      orders: hourOrders.length
    };
  });

  // Sales by order type
  const salesByType = [
    { name: "Kiosk", value: completedOrders.filter(o => o.order_type === "kiosk").reduce((sum, o) => sum + (o.total_amount || 0), 0) },
    { name: "Web", value: completedOrders.filter(o => o.order_type === "web").reduce((sum, o) => sum + (o.total_amount || 0), 0) },
    { name: "SMS", value: completedOrders.filter(o => o.order_type === "sms").reduce((sum, o) => sum + (o.total_amount || 0), 0) },
    { name: "Marketplace", value: completedOrders.filter(o => o.order_source).reduce((sum, o) => sum + (o.total_amount || 0), 0) }
  ].filter(t => t.value > 0);

  // Payment methods
  const paymentMethods = {
    card: completedOrders.filter(o => o.payment_transaction_id && !o.payment_transaction_id.startsWith("CASH")).length,
    cash: completedOrders.filter(o => o.payment_transaction_id?.startsWith("CASH")).length,
    other: completedOrders.filter(o => !o.payment_transaction_id).length
  };

  // Top selling items
  const itemSales = {};
  completedOrders.forEach(order => {
    (order.items || []).forEach(item => {
      if (!itemSales[item.name]) {
        itemSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      itemSales[item.name].quantity += item.quantity;
      itemSales[item.name].revenue += item.price * item.quantity;
    });
  });
  const topItems = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Category breakdown
  const categoryRevenue = {};
  completedOrders.forEach(order => {
    (order.items || []).forEach(item => {
      const menuItem = menuItems.find(m => m.id === item.menu_item_id);
      const category = menuItem?.category || "Other";
      if (!categoryRevenue[category]) categoryRevenue[category] = 0;
      categoryRevenue[category] += item.price * item.quantity;
    });
  });
  const categoryData = Object.entries(categoryRevenue).map(([name, value]) => ({ name, value }));

  const printReport = () => {
    window.print();
  };

  const exportCSV = () => {
    const headers = ["Order ID", "Date", "Customer", "Items", "Total", "Status", "Payment"];
    const rows = completedOrders.map(o => [
      o.id,
      format(new Date(o.created_date), "yyyy-MM-dd HH:mm"),
      o.customer_name,
      (o.items || []).map(i => `${i.name} x${i.quantity}`).join("; "),
      o.total_amount?.toFixed(2),
      o.status,
      o.payment_status
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${dateRange}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Sales Reports</h1>
            <p className="text-slate-600">Track revenue, orders, and performance metrics</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={printReport}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-12 h-12 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold">{totalOrders}</p>
                </div>
                <ShoppingBag className="w-12 h-12 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Avg Order Value</p>
                  <p className="text-3xl font-bold">${averageOrderValue.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-12 h-12 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Completed</p>
                  <p className="text-3xl font-bold">{completedOrders.length}</p>
                </div>
                <Receipt className="w-12 h-12 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Top Items
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="eod" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              End of Day
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Sales by Hour */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    Sales by Hour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesByHour.filter(h => h.sales > 0 || h.orders > 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales by Order Type */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    Sales by Channel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={salesByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                      >
                        {salesByType.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="items">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Selling Items */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-emerald-600 w-8 h-8 flex items-center justify-center rounded-full">
                            {idx + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-slate-500">{item.quantity} sold</p>
                          </div>
                        </div>
                        <p className="font-bold text-emerald-600">${item.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-xl p-6 text-center">
                    <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-blue-900">{paymentMethods.card}</p>
                    <p className="text-blue-600">Card Payments</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6 text-center">
                    <Banknote className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-green-900">{paymentMethods.cash}</p>
                    <p className="text-green-600">Cash Payments</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6 text-center">
                    <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                    <p className="text-3xl font-bold text-purple-900">{paymentMethods.other}</p>
                    <p className="text-purple-600">Other</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eod">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-slate-800 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  End of Day Summary - {format(new Date(), "MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Sales Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Gross Sales</span>
                        <span className="font-bold">${totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Number of Transactions</span>
                        <span>{completedOrders.length}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Average Transaction</span>
                        <span>${averageOrderValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">Payment Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Card Payments ({paymentMethods.card})</span>
                        <span className="font-bold">
                          ${completedOrders
                            .filter(o => o.payment_transaction_id && !o.payment_transaction_id.startsWith("CASH"))
                            .reduce((sum, o) => sum + (o.total_amount || 0), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cash Payments ({paymentMethods.cash})</span>
                        <span className="font-bold">
                          ${completedOrders
                            .filter(o => o.payment_transaction_id?.startsWith("CASH"))
                            .reduce((sum, o) => sum + (o.total_amount || 0), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button onClick={printReport} className="bg-slate-800">
                    <Printer className="w-4 h-4 mr-2" />
                    Print EOD Report
                  </Button>
                  <Button variant="outline" onClick={exportCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Detailed Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}