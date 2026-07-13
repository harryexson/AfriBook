
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Added
import { TrendingUp, TrendingDown, Activity, Zap, MapPin, RefreshCw } from 'lucide-react'; // Added RefreshCw
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'; // Added AreaChart, Area
import { toast } from 'sonner'; // Added toast

export default function AdminAnalytics() {
    const { data: analytics, isLoading, refetch } = useQuery({ // Added refetch
        queryKey: ['analytics'],
        queryFn: async () => {
            const [rides, heatMaps, surgeZones] = await Promise.all([
                base44.entities.RideAnalytics.list('-created_date', 100),
                base44.entities.DemandHeatMap.list('-created_date', 50),
                base44.entities.SurgePricingZone.filter({ 
                    active_until: { $gte: new Date().toISOString() } 
                })
            ]);
            
            return { rides, heatMaps, surgeZones };
        },
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    // Added triggerHeatMapUpdate function
    const triggerHeatMapUpdate = async () => {
        toast.info('Updating heat map data...');
        try {
            await base44.functions.invoke('updateDemandHeatMap', {});
            await refetch();
            toast.success('Heat map data updated');
        } catch (error) {
            toast.error('Failed to update heat map');
            console.error('Failed to update heat map:', error);
        }
    };

    if (isLoading) {
        return <div className="p-8">Loading analytics...</div>; // Updated loading div
    }

    // Calculate metrics
    const filteredAccuracyRides = analytics.rides.filter(r => r.accuracy_score !== null);
    const avgAccuracy = filteredAccuracyRides.length > 0
        ? filteredAccuracyRides.reduce((sum, r) => sum + r.accuracy_score, 0) / filteredAccuracyRides.length
        : 0;

    const filteredAcceptanceTimeRides = analytics.rides.filter(r => r.driver_acceptance_time_seconds !== null);
    const avgAcceptanceTime = filteredAcceptanceTimeRides.length > 0
        ? filteredAcceptanceTimeRides.reduce((sum, r) => sum + r.driver_acceptance_time_seconds, 0) / filteredAcceptanceTimeRides.length
        : 0;

    // Group by time of day
    const demandByTime = analytics.rides.reduce((acc, ride) => {
        acc[ride.time_of_day] = (acc[ride.time_of_day] || 0) + 1;
        return acc;
    }, {});

    const timeChartData = Object.entries(demandByTime).map(([time, count]) => ({
        time,
        rides: count
    }));

    // Surge zones summary
    const activeSurgeZones = analytics.surgeZones.length;
    const avgSurge = activeSurgeZones > 0
        ? analytics.surgeZones.reduce((sum, z) => sum + z.surge_multiplier, 0) / activeSurgeZones
        : 1.0;

    // Surge timeline (last 24 hours) - Added
    const surgeTimeline = analytics.heatMaps
        .sort((a, b) => new Date(a.time_window_start).getTime() - new Date(b.time_window_start).getTime())
        .slice(-24)
        .map(h => ({
            time: new Date(h.time_window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            surge: h.suggested_surge,
            demand: h.request_count,
            supply: h.available_drivers
        }));

    return (
        <div className="space-y-6">
            {/* Updated Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">ML-Powered Analytics</h1>
                    <p className="text-gray-600 mt-1">Real-time insights and surge pricing analytics</p>
                </div>
                <Button onClick={triggerHeatMapUpdate} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update Heat Map
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">ETA Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(avgAccuracy * 100).toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            ML predictions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Avg Acceptance Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgAcceptanceTime.toFixed(1)}s</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            H3 dispatch
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Active Surge Zones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSurgeZones}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            Avg {avgSurge.toFixed(1)}x multiplier
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Heat Map Coverage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.heatMaps.length}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Active hexagons
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="demand">
                <TabsList>
                    <TabsTrigger value="demand">Demand Patterns</TabsTrigger>
                    <TabsTrigger value="surge">Surge Pricing</TabsTrigger>
                    <TabsTrigger value="timeline">Surge Timeline</TabsTrigger> {/* Added */}
                    <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
                </TabsList>

                <TabsContent value="demand" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rides by Time of Day</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={timeChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="rides" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="surge">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Surge Zones ({activeSurgeZones})</CardTitle> {/* Updated title */}
                        </CardHeader>
                        <CardContent>
                            {analytics.surgeZones.length > 0 ? (
                                <div className="space-y-3">
                                    {analytics.surgeZones.map(zone => (
                                        <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"> {/* Added hover class */}
                                            <div className="flex-1">
                                                <p className="font-medium">H3: {zone.h3_index.slice(0, 10)}...</p>
                                                <p className="text-sm text-muted-foreground capitalize">{zone.reason.replace('_', ' ')}</p>
                                                <p className="text-xs text-gray-500 mt-1"> {/* Added active until */}
                                                    Active until {new Date(zone.active_until).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={zone.surge_multiplier >= 2 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                                                    {zone.surge_multiplier.toFixed(1)}x
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {zone.request_count_last_15min} requests / {zone.available_drivers_count} drivers
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No active surge zones</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* New TabsContent for Surge Timeline */}
                <TabsContent value="timeline">
                    <Card>
                        <CardHeader>
                            <CardTitle>Surge Pricing Timeline (Last 24h)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <AreaChart data={surgeTimeline}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis yAxisId="left" label={{ value: 'Surge Multiplier', angle: -90, position: 'insideLeft' }} />
                                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Count', angle: 90, position: 'insideRight' }} />
                                    <Tooltip />
                                    <Legend />
                                    <Area yAxisId="left" type="monotone" dataKey="surge" stroke="#f59e0b" fill="#fef3c7" name="Surge Multiplier" />
                                    <Bar yAxisId="right" dataKey="demand" fill="#3b82f6" name="Ride Requests" />
                                    <Bar yAxisId="right" dataKey="supply" fill="#10b981" name="Available Drivers" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="heatmap">
                    <Card>
                        <CardHeader>
                            <CardTitle>Demand Heat Map (Last 15 min)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {analytics.heatMaps.slice(0, 10).map(heatMap => (
                                    <div key={heatMap.id} className="p-4 border rounded-lg space-y-2">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-mono">{heatMap.h3_index.slice(0, 10)}...</p>
                                            <Badge>{heatMap.time_of_day}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Requests</p>
                                                <p className="font-bold">{heatMap.request_count}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Drivers</p>
                                                <p className="font-bold">{heatMap.available_drivers}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Ratio</p>
                                                <p className="font-bold">{heatMap.supply_demand_ratio.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Suggested Surge</p> {/* Added */}
                                                <Badge className={heatMap.suggested_surge > 1.5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                                    {heatMap.suggested_surge.toFixed(1)}x
                                                </Badge>
                                            </div>
                                        </div>
                                        {heatMap.average_wait_time_seconds > 0 && ( // Conditional render
                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-muted-foreground">Avg Wait Time</p> {/* Updated label */}
                                                <p className="font-bold">{Math.round(heatMap.average_wait_time_seconds / 60)} min</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
