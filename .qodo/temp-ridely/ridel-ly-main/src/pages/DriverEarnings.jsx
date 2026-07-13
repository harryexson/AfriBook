import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Clock, 
  TrendingUp,
  Zap,
  CreditCard,
  ArrowUpRight,
  Calendar,
  Download,
  Wallet,
  PieChart as PieChartIcon,
  BarChart3,
  Loader2,
  Target,
  Award,
  Trophy,
  TrendingDown,
  Activity,
  Star,
  Flame,
  Gift,
  Info
} from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth, parseISO, differenceInHours } from "date-fns";
import { motion } from "framer-motion";
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
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import EarningsOverview from "../components/earnings/EarningsOverview";
import PayoutMethods from "../components/earnings/PayoutMethods";
import InstantPayoutDialog from "../components/earnings/InstantPayoutDialog";
import EWADialog from "../components/earnings/EWADialog";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const TIME_PERIODS = [
  { id: 'today', label: 'Today', days: 0 },
  { id: 'week', label: 'This Week', days: 7 },
  { id: 'month', label: 'This Month', days: 30 },
  { id: 'all', label: 'All Time', days: 365 }
];

const PERFORMANCE_TIERS = [
  { 
    name: 'Bronze', 
    minRides: 0, 
    bonus: 0, 
    color: 'from-amber-700 to-amber-900',
    icon: '🥉',
    benefits: ['Basic support', 'Standard earnings']
  },
  { 
    name: 'Silver', 
    minRides: 50, 
    bonus: 50, 
    color: 'from-gray-400 to-gray-600',
    icon: '🥈',
    benefits: ['Priority support', '+5% bonus on surge rides', '$50 monthly bonus']
  },
  { 
    name: 'Gold', 
    minRides: 100, 
    bonus: 100, 
    color: 'from-yellow-400 to-yellow-600',
    icon: '🥇',
    benefits: ['Premium support', '+10% bonus on all rides', '$100 monthly bonus', 'Trip insurance']
  },
  { 
    name: 'Platinum', 
    minRides: 200, 
    bonus: 200, 
    color: 'from-blue-400 to-purple-600',
    icon: '💎',
    benefits: ['VIP support', '+15% bonus on all rides', '$200 monthly bonus', 'Full insurance', 'Exclusive events']
  }
];

export default function DriverEarnings() {
  const [user, setUser] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [rides, setRides] = useState([]);
  const [payments, setPayments] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInstantPayout, setShowInstantPayout] = useState(false);
  const [showEWA, setShowEWA] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [dailyGoal, setDailyGoal] = useState(150);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadEarningsData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadEarningsData = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!isMountedRef.current) return;
      
      setUser(currentUser);

      // Load or create driver earnings
      let driverEarnings = await base44.entities.DriverEarnings.filter({ driver_id: currentUser.id });
      if (driverEarnings.length === 0) {
        const newEarnings = await base44.entities.DriverEarnings.create({ driver_id: currentUser.id });
        driverEarnings = [newEarnings];
      }
      if (isMountedRef.current) {
        setEarnings(driverEarnings[0]);
      }

      // Load completed rides
      const completedRides = await base44.entities.Ride.filter(
        { driver_id: currentUser.id, status: 'completed' },
        '-completion_time',
        300
      );
      if (isMountedRef.current) {
        setRides(completedRides);
      }

      // Load payments
      const driverPayments = await base44.entities.Payment.filter(
        { payee_id: currentUser.id }, 
        '-created_date', 
        100
      );
      if (isMountedRef.current) {
        setPayments(driverPayments);
      }

      // Load payout requests
      const requests = await base44.entities.PayoutRequest.filter(
        { driver_id: currentUser.id }, 
        '-created_date', 
        50
      );
      if (isMountedRef.current) {
        setPayoutRequests(requests);
      }

    } catch (error) {
      console.error('Error loading earnings data:', error);
      if (isMountedRef.current) {
        toast.error('Failed to load earnings data');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleInstantPayout = async (amount) => {
    try {
      const fee = earnings.instant_payout_fee;
      const netAmount = amount - fee;

      await base44.entities.PayoutRequest.create({
        driver_id: user.id,
        amount: amount,
        payout_type: "instant",
        fee_amount: fee,
        net_amount: netAmount,
        estimated_arrival: "Within 30 minutes",
        payout_method: earnings.payout_method || { type: "debit_card", account_details: "****1234" }
      });

      await base44.entities.DriverEarnings.update(earnings.id, {
        available_balance: earnings.available_balance - amount,
        instant_payout_balance: Math.max(0, earnings.instant_payout_balance - amount)
      });

      toast.success('Instant payout requested successfully!');
      setShowInstantPayout(false);
      loadEarningsData();
    } catch (error) {
      console.error('Error processing instant payout:', error);
      toast.error('Failed to process payout');
    }
  };

  const handleEWARequest = async (amount, reason) => {
    try {
      const fee = 2.99;
      const netAmount = amount - fee;

      await base44.entities.PayoutRequest.create({
        driver_id: user.id,
        amount: amount,
        payout_type: "earned_wage_access",
        fee_amount: fee,
        net_amount: netAmount,
        estimated_arrival: "Within 1 hour",
        reason: reason,
        payout_method: earnings.payout_method || { type: "debit_card", account_details: "****1234" }
      });

      toast.success('EWA request submitted successfully!');
      setShowEWA(false);
      loadEarningsData();
    } catch (error) {
      console.error('Error processing EWA request:', error);
      toast.error('Failed to process request');
    }
  };

  // Filter rides by selected period
  const getFilteredRides = () => {
    const period = TIME_PERIODS.find(p => p.id === selectedPeriod);
    if (!period) return rides;

    if (period.id === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return rides.filter(r => new Date(r.completion_time) >= today);
    } else if (period.id === 'week') {
      const weekStart = startOfWeek(new Date());
      return rides.filter(r => new Date(r.completion_time) >= weekStart);
    } else if (period.id === 'month') {
      const monthStart = startOfMonth(new Date());
      return rides.filter(r => new Date(r.completion_time) >= monthStart);
    }
    
    return rides;
  };

  const filteredRides = getFilteredRides();

  // Calculate period earnings
  const calculatePeriodStats = () => {
    const totalEarnings = filteredRides.reduce((sum, r) => 
      sum + (r.fare?.total_fare || 0) + (r.fare?.tip_amount || 0), 0
    );

    const totalTips = filteredRides.reduce((sum, r) => 
      sum + (r.fare?.tip_amount || 0), 0
    );

    const surgeEarnings = filteredRides
      .filter(r => r.fare?.surge_multiplier > 1.0)
      .reduce((sum, r) => {
        const base = r.fare.total_fare / r.fare.surge_multiplier;
        return sum + (r.fare.total_fare - base);
      }, 0);

    const avgPerRide = filteredRides.length > 0 ? totalEarnings / filteredRides.length : 0;

    const totalHours = filteredRides.reduce((sum, r) => sum + (r.duration_minutes || 0), 0) / 60;
    const earningsPerHour = totalHours > 0 ? totalEarnings / totalHours : 0;

    return {
      totalEarnings,
      totalTips,
      surgeEarnings,
      avgPerRide,
      rideCount: filteredRides.length,
      totalHours,
      earningsPerHour
    };
  };

  const stats = calculatePeriodStats();

  // Calculate current performance tier
  const getCurrentTier = () => {
    const totalRides = rides.length;
    let currentTier = PERFORMANCE_TIERS[0];
    
    for (const tier of PERFORMANCE_TIERS) {
      if (totalRides >= tier.minRides) {
        currentTier = tier;
      }
    }
    
    return currentTier;
  };

  const currentTier = getCurrentTier();
  const nextTier = PERFORMANCE_TIERS[PERFORMANCE_TIERS.indexOf(currentTier) + 1];

  // Calculate projected earnings
  const calculateProjections = () => {
    const last7DaysRides = rides.filter(r => {
      const rideDate = new Date(r.completion_time);
      return rideDate >= subDays(new Date(), 7);
    });

    const avgEarningsPerDay = last7DaysRides.reduce((sum, r) => 
      sum + (r.fare?.total_fare || 0) + (r.fare?.tip_amount || 0), 0
    ) / 7;

    const avgRidesPerDay = last7DaysRides.length / 7;

    return {
      daily: avgEarningsPerDay,
      weekly: avgEarningsPerDay * 7,
      monthly: avgEarningsPerDay * 30,
      avgRidesPerDay
    };
  };

  const projections = calculateProjections();

  // Today's progress
  const todayRides = rides.filter(r => {
    const rideDate = new Date(r.completion_time);
    const today = new Date();
    return rideDate.toDateString() === today.toDateString();
  });

  const todayEarnings = todayRides.reduce((sum, r) => 
    sum + (r.fare?.total_fare || 0) + (r.fare?.tip_amount || 0), 0
  );

  const dailyGoalProgress = (todayEarnings / dailyGoal) * 100;

  // Earnings by ride type
  const earningsByType = Object.entries(
    filteredRides.reduce((acc, ride) => {
      const type = ride.ride_type || 'standard';
      const earnings = (ride.fare?.total_fare || 0) + (ride.fare?.tip_amount || 0);
      acc[type] = (acc[type] || 0) + earnings;
      return acc;
    }, {})
  ).map(([type, amount]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: parseFloat(amount.toFixed(2))
  }));

  // Daily earnings trend (last 7 days)
  const dailyEarningsTrend = [...Array(7)].map((_, idx) => {
    const date = subDays(new Date(), 6 - idx);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayRides = rides.filter(r => {
      const rideDate = new Date(r.completion_time);
      return rideDate >= date && rideDate < nextDay;
    });

    const earnings = dayRides.reduce((sum, r) => 
      sum + (r.fare?.total_fare || 0) + (r.fare?.tip_amount || 0), 0
    );

    return {
      date: format(date, 'EEE'),
      earnings: parseFloat(earnings.toFixed(2)),
      rides: dayRides.length,
      goal: dailyGoal
    };
  });

  // Hourly earnings pattern
  const hourlyPattern = [...Array(24)].map((_, hour) => {
    const hourRides = rides.filter(r => {
      const rideHour = new Date(r.completion_time).getHours();
      return rideHour === hour;
    });

    const earnings = hourRides.reduce((sum, r) => 
      sum + (r.fare?.total_fare || 0) + (r.fare?.tip_amount || 0), 0
    );

    return {
      hour: hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`,
      earnings: parseFloat(earnings.toFixed(2)),
      rides: hourRides.length
    };
  }).filter(h => h.rides > 0);

  // Earnings breakdown
  const earningsBreakdown = [
    { 
      name: 'Base Fares', 
      value: filteredRides.reduce((sum, r) => sum + (r.fare?.base_fare || 0), 0)
    },
    { 
      name: 'Surge Bonuses', 
      value: stats.surgeEarnings
    },
    { 
      name: 'Tips', 
      value: stats.totalTips
    },
    { 
      name: 'Distance/Time', 
      value: filteredRides.reduce((sum, r) => 
        sum + (r.fare?.distance_fare || 0) + (r.fare?.time_fare || 0), 0
      )
    }
  ].map(item => ({ ...item, value: parseFloat(item.value.toFixed(2)) }));

  const canRequestPayout = earnings?.rides_since_last_payout >= 5 || earnings?.available_balance >= 25;
  const canUseInstantPayout = earnings?.instant_payout_enabled && earnings?.available_balance > 0;
  const canUseEWA = earnings?.pending_balance > 0;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-green-50 min-h-screen">
      <Toaster richColors />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Earnings Dashboard</h1>
            <p className="text-gray-600 mt-2">Track income, goals, and performance bonuses</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40 border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canUseEWA && (
              <Button 
                variant="outline"
                onClick={() => setShowEWA(true)}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Zap className="w-4 h-4 mr-2" />
                Earned Wages Access
              </Button>
            )}
            {canUseInstantPayout && (
              <Button 
                variant="outline"
                onClick={() => setShowInstantPayout(true)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Instant Payout
              </Button>
            )}
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={!canRequestPayout}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Request Payout
            </Button>
          </div>
        </div>

        {/* Daily Goal Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8" />
                  <div>
                    <h3 className="text-lg font-bold">Today's Goal</h3>
                    <p className="text-sm opacity-90">
                      ${todayEarnings.toFixed(2)} of ${dailyGoal.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{Math.min(100, dailyGoalProgress).toFixed(0)}%</p>
                  <p className="text-xs opacity-90">{todayRides.length} rides today</p>
                </div>
              </div>
              <Progress value={dailyGoalProgress} className="h-3 bg-white/20" />
              {dailyGoalProgress >= 100 && (
                <div className="mt-3 flex items-center gap-2 text-yellow-300">
                  <Trophy className="w-5 h-5" />
                  <p className="text-sm font-medium">Goal achieved! Amazing work! 🎉</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Tier Card */}
        <Card className={`bg-gradient-to-r ${currentTier.color} text-white border-0 shadow-xl`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{currentTier.icon}</div>
                <div>
                  <Badge className="bg-white/20 text-white mb-2">Performance Tier</Badge>
                  <h3 className="text-2xl font-bold mb-1">{currentTier.name} Driver</h3>
                  <p className="text-sm opacity-90 mb-3">
                    {rides.length} total rides • {currentTier.bonus > 0 ? `$${currentTier.bonus} monthly bonus` : 'Entry tier'}
                  </p>
                  <div className="space-y-1">
                    {currentTier.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm opacity-90">
                        <Award className="w-4 h-4" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {nextTier && (
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1">Next: {nextTier.name}</p>
                  <p className="text-2xl font-bold">{nextTier.minRides - rides.length}</p>
                  <p className="text-xs opacity-80">rides away</p>
                  <Progress 
                    value={(rides.length / nextTier.minRides) * 100} 
                    className="mt-2 h-2 bg-white/20" 
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Earnings Overview Cards */}
        <EarningsOverview 
          earnings={earnings} 
          canRequestPayout={canRequestPayout}
        />

        {/* Period Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-blue-900">Total Earnings</p>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">
                ${stats.totalEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {filteredRides.length} rides
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-green-900">Tips Earned</p>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                ${stats.totalTips.toFixed(2)}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {((stats.totalTips / stats.totalEarnings) * 100 || 0).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-orange-900">Per Hour</p>
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-900">
                ${stats.earningsPerHour.toFixed(2)}
              </p>
              <p className="text-xs text-orange-700 mt-1">
                {stats.totalHours.toFixed(1)} hours
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-purple-900">Avg Per Ride</p>
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">
                ${stats.avgPerRide.toFixed(2)}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                Including tips
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projected Earnings */}
        <Card className="shadow-lg border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Projected Earnings (Based on Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Weekly</p>
                <p className="text-3xl font-bold text-blue-900">${projections.weekly.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ~{(projections.avgRidesPerDay * 7).toFixed(0)} rides/week
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Monthly</p>
                <p className="text-3xl font-bold text-green-900">${projections.monthly.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ~{(projections.avgRidesPerDay * 30).toFixed(0)} rides/month
                </p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Daily Average</p>
                <p className="text-3xl font-bold text-purple-900">${projections.daily.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ~{projections.avgRidesPerDay.toFixed(1)} rides/day
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                Projections are based on your performance over the last 7 days. 
                Actual earnings may vary based on demand, surge pricing, and hours worked.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Trend with Goal Line */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Daily Earnings (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyEarningsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'earnings') return [`$${value}`, 'Earnings'];
                      if (name === 'goal') return [`$${value}`, 'Daily Goal'];
                      return [value, 'Rides'];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="earnings" fill="#3b82f6" name="Earnings" />
                  <Line type="monotone" dataKey="goal" stroke="#f59e0b" strokeWidth={2} name="Goal" dot={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly Earnings Pattern */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Best Hours to Drive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyPattern.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Area type="monotone" dataKey="earnings" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-center text-gray-500 mt-2">
                Peak earning hours based on your historical data
              </p>
            </CardContent>
          </Card>

          {/* Earnings by Ride Type */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-green-600" />
                Earnings by Ride Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={earningsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {earningsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Earnings Breakdown */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-600" />
                Earnings Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={earningsBreakdown} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">
              Transactions ({payments.length})
            </TabsTrigger>
            <TabsTrigger value="payouts">
              Payout Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Performance Metrics */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Performance Summary - {TIME_PERIODS.find(p => p.id === selectedPeriod)?.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Income */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Income Sources
                    </h4>
                    {earningsBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                        <span className="text-sm text-gray-700">{item.name}</span>
                        <span className="font-bold text-lg">${item.value.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-green-100 border-2 border-green-300 rounded-lg">
                      <span className="font-semibold text-green-900">Total</span>
                      <span className="font-bold text-2xl text-green-900">
                        ${stats.totalEarnings.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column - Metrics */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Performance Metrics
                    </h4>
                    
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border">
                      <p className="text-sm text-gray-600 mb-1">Earnings per Hour</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${stats.earningsPerHour.toFixed(2)}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border">
                      <p className="text-sm text-gray-600 mb-1">Earnings per KM</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${((stats.totalEarnings / filteredRides.reduce((sum, r) => sum + (r.distance_km || 0), 0)) || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border">
                      <p className="text-sm text-gray-600 mb-1">Tip Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {((stats.totalTips / stats.totalEarnings) * 100 || 0).toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border">
                      <p className="text-sm text-gray-600 mb-1">Rides with Tips</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredRides.filter(r => r.fare?.tip_amount > 0).length} / {filteredRides.length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bonuses & Incentives */}
            <Card className="shadow-lg border-2 border-yellow-200">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-yellow-600" />
                  Bonuses & Incentives
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-green-900">Surge Bonuses Earned</h4>
                      <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-900">${stats.surgeEarnings.toFixed(2)}</p>
                    <p className="text-sm text-green-700 mt-1">
                      From {filteredRides.filter(r => r.fare?.surge_multiplier > 1.0).length} surge rides
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-purple-900">Performance Tier Bonus</h4>
                      <Trophy className="w-6 h-6 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-bold text-purple-900">
                      ${currentTier.bonus > 0 ? `${currentTier.bonus.toFixed(2)}/month` : '0.00'}
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      {currentTier.name} tier • {nextTier ? `${nextTier.minRides - rides.length} rides to ${nextTier.name}` : 'Max tier achieved!'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            {/* Transaction History */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transaction History</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-full ${
                            payment.payment_type === 'ride_payment' ? 'bg-green-100' : 
                            payment.payment_type.includes('payout') ? 'bg-blue-100' :
                            'bg-red-100'
                          }`}>
                            {payment.payment_type === 'ride_payment' ? (
                              <ArrowUpRight className="w-5 h-5 text-green-600" />
                            ) : payment.payment_type.includes('payout') ? (
                              <DollarSign className="w-5 h-5 text-blue-600" />
                            ) : (
                              <CreditCard className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {payment.payment_type === 'ride_payment' ? 'Ride Earnings' : 
                               payment.payment_type === 'driver_payout' ? 'Weekly Payout' :
                               payment.payment_type === 'instant_payout' ? 'Instant Payout' :
                               'Platform Fee'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(payment.created_date), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${
                            payment.payment_type === 'ride_payment' ? 'text-green-600' : 
                            payment.payment_type.includes('payout') ? 'text-blue-600' :
                            'text-red-600'
                          }`}>
                            {payment.payment_type === 'ride_payment' ? '+' : '-'}${payment.amount.toFixed(2)}
                          </p>
                          <Badge className={`text-xs mt-1 ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No transactions yet</p>
                    <p className="text-gray-400 text-sm mt-2">Complete rides to start earning</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <PayoutMethods 
              earnings={earnings} 
              payoutRequests={payoutRequests}
              onUpdate={loadEarningsData}
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <InstantPayoutDialog
          open={showInstantPayout}
          onClose={() => setShowInstantPayout(false)}
          earnings={earnings}
          onPayout={handleInstantPayout}
        />

        <EWADialog
          open={showEWA}
          onClose={() => setShowEWA(false)}
          earnings={earnings}
          onRequest={handleEWARequest}
        />
      </div>
    </div>
  );
}