import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Utensils, DollarSign, Zap, FileText, TrendingUp, Clock, AlertTriangle, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import AdminStatsCard from '../components/admin/AdminStatsCard';
import RecentActivityFeed from '../components/admin/RecentActivityFeed';
import AdminQuickActions from '../components/admin/AdminQuickActions';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function AdminDashboard() {
    const [recentActivity, setRecentActivity] = useState([]);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['adminStats'],
        queryFn: async () => {
            const [users, rides, orders, documents, payoutRequests] = await Promise.all([
                base44.entities.User.list(null, 1000),
                base44.entities.Ride.list('-created_date', 1000),
                base44.entities.Order.list(null, 500),
                base44.entities.DriverDocument.filter({ status: 'pending', is_current_version: true }),
                base44.entities.PayoutRequest.filter({ status: 'pending' })
            ]);
            
            const totalRevenue = rides.reduce((acc, ride) => acc + (ride.fare?.total_fare || 0), 0)
                + orders.reduce((acc, order) => acc + (order.order_total || 0), 0);

            const today = new Date();
            const todayStart = startOfDay(today);
            const yesterdayStart = startOfDay(subDays(today, 1));

            const todayRides = rides.filter(r => new Date(r.created_date) >= todayStart);
            const yesterdayRides = rides.filter(r => {
                const d = new Date(r.created_date);
                return d >= yesterdayStart && d < todayStart;
            });

            const todayRevenue = todayRides.reduce((acc, r) => acc + (r.fare?.total_fare || 0), 0);
            const yesterdayRevenue = yesterdayRides.reduce((acc, r) => acc + (r.fare?.total_fare || 0), 0);

            const activeRides = rides.filter(r => ['requested', 'accepted', 'arriving', 'in_progress'].includes(r.status));
            const drivers = users.filter(u => u.user_type === 'driver' || u.user_type === 'both');
            const onlineDrivers = drivers.filter(d => d.driver_info?.is_available);

            // Chart data - last 7 days
            const chartData = [];
            for (let i = 6; i >= 0; i--) {
                const date = subDays(today, i);
                const dayStart = startOfDay(date);
                const dayEnd = endOfDay(date);
                const dayRides = rides.filter(r => {
                    const d = new Date(r.created_date);
                    return d >= dayStart && d <= dayEnd && r.status === 'completed';
                });
                chartData.push({
                    date: format(date, 'EEE'),
                    rides: dayRides.length,
                    revenue: dayRides.reduce((acc, r) => acc + (r.fare?.total_fare || 0), 0)
                });
            }

            // Build recent activity
            const activities = rides.slice(0, 5).map(ride => ({
                id: ride.id,
                type: ride.status === 'completed' ? 'ride_completed' : ride.status === 'cancelled' ? 'ride_cancelled' : 'ride_completed',
                title: `Ride ${ride.status}`,
                description: `${ride.ride_type} ride - $${ride.fare?.total_fare?.toFixed(2) || '0.00'}`,
                timestamp: ride.created_date
            }));

            return {
                totalUsers: users.length,
                totalRides: rides.length,
                totalOrders: orders.length,
                totalRevenue: totalRevenue.toFixed(2),
                todayRevenue,
                yesterdayRevenue,
                todayRides: todayRides.length,
                yesterdayRides: yesterdayRides.length,
                activeRides: activeRides.length,
                pendingDocuments: documents.length,
                pendingPayouts: payoutRequests.length,
                onlineDrivers: onlineDrivers.length,
                totalDrivers: drivers.length,
                chartData,
                activities
            };
        }
    });

    const handleGenerateForecasts = async () => {
        try {
            toast.info('Generating demand forecasts...');
            const result = await base44.functions.invoke('generateDemandForecasts', { daysAhead: 7 });
            
            if (result.data?.success) {
                toast.success(`Generated ${result.data.forecasts_generated} forecasts, ${result.data.notifications_sent} notifications sent`);
            } else {
                toast.error(result.data?.message || 'Failed to generate forecasts');
            }
        } catch (error) {
            console.error('Error generating forecasts:', error);
            toast.error('Failed to generate forecasts');
        }
    };

    const handleCheckDocumentExpiry = async () => {
        try {
          toast.info('Checking document expiry dates...');
          const result = await base44.functions.invoke('checkDocumentExpiry', {});
          
          if (result.data?.success) {
            toast.success(`Checked ${result.data.checked} documents, sent ${result.data.notifications_sent} notifications`);
          } else {
            toast.error('Failed to check documents');
          }
        } catch (error) {
          console.error('Error checking documents:', error);
          toast.error('Failed to check documents');
        }
      };

    const revenueTrend = stats?.todayRevenue > stats?.yesterdayRevenue ? 'up' : 
                         stats?.todayRevenue < stats?.yesterdayRevenue ? 'down' : 'neutral';
    const rideTrend = stats?.todayRides > stats?.yesterdayRides ? 'up' : 
                      stats?.todayRides < stats?.yesterdayRides ? 'down' : 'neutral';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
            <Toaster richColors />
            
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-1">Platform overview and management</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-green-100 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm text-green-700 font-medium">
                                {stats?.onlineDrivers || 0} drivers online
                            </span>
                        </div>
                    </div>
                </div>

                {/* Alert Cards */}
                {(stats?.pendingDocuments > 0 || stats?.pendingPayouts > 0 || stats?.activeRides > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats?.activeRides > 0 && (
                            <Card className="border-green-200 bg-green-50">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <Activity className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="font-bold text-green-900">{stats.activeRides} Active Rides</p>
                                        <p className="text-sm text-green-700">Currently in progress</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {stats?.pendingDocuments > 0 && (
                            <Card className="border-yellow-200 bg-yellow-50">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <FileText className="w-8 h-8 text-yellow-600" />
                                    <div>
                                        <p className="font-bold text-yellow-900">{stats.pendingDocuments} Documents</p>
                                        <p className="text-sm text-yellow-700">Pending review</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {stats?.pendingPayouts > 0 && (
                            <Card className="border-purple-200 bg-purple-50">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <DollarSign className="w-8 h-8 text-purple-600" />
                                    <div>
                                        <p className="font-bold text-purple-900">{stats.pendingPayouts} Payouts</p>
                                        <p className="text-sm text-purple-700">Pending processing</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Main Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <AdminStatsCard 
                        title="Today's Revenue" 
                        value={`$${stats?.todayRevenue?.toFixed(0) || 0}`} 
                        icon={DollarSign}
                        trend={revenueTrend}
                        trendValue={`${Math.abs(((stats?.todayRevenue - stats?.yesterdayRevenue) / (stats?.yesterdayRevenue || 1)) * 100).toFixed(0)}% vs yesterday`}
                        iconColor="bg-green-100 text-green-600"
                    />
                    <AdminStatsCard 
                        title="Today's Rides" 
                        value={stats?.todayRides || 0} 
                        icon={Car}
                        trend={rideTrend}
                        trendValue={`${stats?.yesterdayRides || 0} yesterday`}
                        iconColor="bg-blue-100 text-blue-600"
                    />
                    <AdminStatsCard 
                        title="Total Users" 
                        value={stats?.totalUsers || 0} 
                        icon={Users}
                        description={`${stats?.totalDrivers || 0} drivers`}
                        iconColor="bg-purple-100 text-purple-600"
                    />
                    <AdminStatsCard 
                        title="All-time Revenue" 
                        value={`$${stats?.totalRevenue || 0}`} 
                        icon={TrendingUp}
                        description={`${stats?.totalRides || 0} total rides`}
                        iconColor="bg-orange-100 text-orange-600"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue (Last 7 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.chartData || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" stroke="#888" fontSize={12} />
                                        <YAxis stroke="#888" fontSize={12} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                                            formatter={(value) => [`$${value.toFixed(0)}`, 'Revenue']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#8b5cf6" 
                                            fill="#c4b5fd" 
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Rides (Last 7 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.chartData || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" stroke="#888" fontSize={12} />
                                        <YAxis stroke="#888" fontSize={12} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                                        />
                                        <Bar dataKey="rides" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AdminQuickActions />
                    <RecentActivityFeed activities={stats?.activities || []} />
                </div>

                {/* Admin Tools */}
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                                <Button 
                                    onClick={handleGenerateForecasts}
                                    className="bg-purple-600 hover:bg-purple-700 w-full mb-2"
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Generate Demand Forecasts
                                </Button>
                                <p className="text-sm text-gray-600">
                                    Generate 7-day forecasts and notify drivers
                                </p>
                            </div>

                            <div className="p-4 border rounded-lg">
                                <Button 
                                    onClick={handleCheckDocumentExpiry}
                                    className="bg-orange-600 hover:bg-orange-700 w-full mb-2"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Check Document Expiry
                                </Button>
                                <p className="text-sm text-gray-600">
                                    Check documents and send expiry notifications
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}