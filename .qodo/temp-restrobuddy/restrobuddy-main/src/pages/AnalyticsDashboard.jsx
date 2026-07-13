import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { base44 } from "@/api/base44Client";
import { CalendarIcon, TrendingUp, Users, DollarSign, CheckCircle, XCircle, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

export default function AnalyticsDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  const [metrics, setMetrics] = useState({
    mrr: 0,
    totalCustomers: 0,
    activeSubscriptions: 0,
    paymentSuccessRate: 0,
    churnRate: 0,
    avgCustomerValue: 0,
    totalRevenue: 0,
    newCustomers: 0
  });

  const [chartData, setChartData] = useState({
    mrrTrend: [],
    subscriptionTrend: [],
    revenueTrend: [],
    paymentStatus: [],
    planDistribution: []
  });

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.email !== "harryxson@hotmail.com" && currentUser.email !== "harryexson@hotmail.com") {
        window.location.href = "/";
        return;
      }
      setUser(currentUser);
    } catch (error) {
      window.location.href = "/";
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [subscriptions, transactions] = await Promise.all([
        base44.entities.Subscription.list(),
        base44.entities.Transaction.list()
      ]);

      // Filter by date range
      const filteredTransactions = transactions.filter(t => {
        const date = new Date(t.created_date);
        return date >= dateRange.from && date <= dateRange.to;
      });

      // Calculate metrics
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trial');
      const mrr = activeSubscriptions.reduce((sum, s) => sum + (s.mrr || 0), 0);
      const totalRevenue = filteredTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const successfulPayments = filteredTransactions.filter(t => t.status === 'completed').length;
      const totalPayments = filteredTransactions.length;
      const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

      const uniqueCustomers = new Set(subscriptions.map(s => s.owner_email)).size;
      const avgCustomerValue = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

      const cancelledSubs = subscriptions.filter(s => s.status === 'cancelled').length;
      const churnRate = subscriptions.length > 0 ? (cancelledSubs / subscriptions.length) * 100 : 0;

      // New customers in date range
      const newCustomers = subscriptions.filter(s => {
        const startDate = new Date(s.start_date);
        return startDate >= dateRange.from && startDate <= dateRange.to;
      }).length;

      setMetrics({
        mrr: mrr / 100,
        totalCustomers: uniqueCustomers,
        activeSubscriptions: activeSubscriptions.length,
        paymentSuccessRate,
        churnRate,
        avgCustomerValue: avgCustomerValue / 100,
        totalRevenue: totalRevenue / 100,
        newCustomers
      });

      // Generate chart data
      generateChartData(subscriptions, filteredTransactions);

    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (subscriptions, transactions) => {
    // MRR Trend (by month)
    const months = eachMonthOfInterval({
      start: dateRange.from,
      end: dateRange.to
    });

    const mrrTrend = months.map(month => {
      const monthEnd = endOfMonth(month);
      const activeSubs = subscriptions.filter(s => {
        const startDate = new Date(s.start_date);
        const cancelDate = s.cancellation_date ? new Date(s.cancellation_date) : null;
        return startDate <= monthEnd && (!cancelDate || cancelDate > monthEnd);
      });
      const mrr = activeSubs.reduce((sum, s) => sum + (s.mrr || 0), 0);
      return {
        month: format(month, 'MMM yyyy'),
        mrr: mrr / 100
      };
    });

    // Subscription Trend (by day)
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const subscriptionTrend = days.map(day => {
      const activeSubs = subscriptions.filter(s => {
        const startDate = new Date(s.start_date);
        const cancelDate = s.cancellation_date ? new Date(s.cancellation_date) : null;
        return startDate <= day && (!cancelDate || cancelDate > day);
      }).length;
      return {
        date: format(day, 'MMM dd'),
        count: activeSubs
      };
    }).filter((_, i) => i % Math.ceil(days.length / 20) === 0); // Sample for performance

    // Revenue Trend
    const revenueTrend = days.map(day => {
      const dayRevenue = transactions
        .filter(t => {
          const tDate = new Date(t.created_date);
          return format(tDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && t.status === 'completed';
        })
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        date: format(day, 'MMM dd'),
        revenue: dayRevenue / 100
      };
    }).filter((_, i) => i % Math.ceil(days.length / 20) === 0);

    // Payment Status Distribution
    const paymentStatus = [
      { name: 'Successful', value: transactions.filter(t => t.status === 'completed').length, color: '#10b981' },
      { name: 'Failed', value: transactions.filter(t => t.status === 'failed').length, color: '#ef4444' },
      { name: 'Pending', value: transactions.filter(t => t.status === 'pending').length, color: '#f59e0b' }
    ].filter(item => item.value > 0);

    // Plan Distribution
    const planCounts = subscriptions.reduce((acc, s) => {
      acc[s.plan] = (acc[s.plan] || 0) + 1;
      return acc;
    }, {});

    const planDistribution = Object.entries(planCounts).map(([plan, count]) => ({
      name: plan.charAt(0).toUpperCase() + plan.slice(1),
      value: count,
      color: plan === 'starter' ? '#3b82f6' : plan === 'professional' ? '#8b5cf6' : '#ec4899'
    }));

    setChartData({
      mrrTrend,
      subscriptionTrend,
      revenueTrend,
      paymentStatus,
      planDistribution
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600">Track your platform performance and growth</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              {dateRange.from && dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                </>
              ) : (
                "Select date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 space-y-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
              >
                Last 30 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
              >
                Last 90 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setDateRange({ from: startOfMonth(new Date()), to: new Date() })}
              >
                This month
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.mrr.toLocaleString()}</div>
            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              Active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-600 mt-1">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Subscriptions</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscriptions}</div>
            <p className="text-xs text-slate-600 mt-1">{metrics.totalCustomers} total customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Payment Success Rate</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.paymentSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-600 mt-1">Transaction success</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">New Customers</CardTitle>
            <ArrowUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newCustomers}</div>
            <p className="text-xs text-slate-600 mt-1">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Customer Value</CardTitle>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.avgCustomerValue.toFixed(0)}</div>
            <p className="text-xs text-slate-600 mt-1">Per customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Churn Rate</CardTitle>
            <ArrowDown className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.churnRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-600 mt-1">Cancelled subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>MRR Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.mrrTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Area type="monotone" dataKey="mrr" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.subscriptionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.paymentStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.paymentStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}