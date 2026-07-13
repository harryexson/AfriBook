import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Car,
  DollarSign,
  Star,
  MapPin,
  Clock,
  User,
  Calendar as CalendarIcon,
  Search,
  Download,
  Filter,
  TrendingUp,
  Award,
  Navigation,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const statusColors = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

const dateRangePresets = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last 7 Days', value: 'last7' },
  { label: 'Last 30 Days', value: 'last30' },
  { label: 'Custom', value: 'custom' }
];

export default function DriverRideHistory() {
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [riders, setRiders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ from: null, to: null });
  const [expandedRideId, setExpandedRideId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const initialize = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!isMountedRef.current) return;

        if (!currentUser || (currentUser.user_type !== 'driver' && currentUser.user_type !== 'both')) {
          toast.error('Access denied. Driver account required.');
          setIsLoading(false);
          return;
        }

        setUser(currentUser);
        await loadRides(currentUser.id);
      } catch (error) {
        console.error('Error initializing:', error);
        if (isMountedRef.current) {
          toast.error('Failed to load trip history');
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [rides, searchQuery, statusFilter, sortBy, dateRangePreset, customDateRange]);

  const loadRides = async (driverId) => {
    if (!driverId || !isMountedRef.current || fetchingRef.current) return;

    fetchingRef.current = true;

    try {
      const driverRides = await base44.entities.Ride.filter(
        {
          driver_id: driverId,
          status: { $in: ['completed', 'cancelled'] }
        },
        '-created_date',
        200
      );

      if (!isMountedRef.current) return;

      setRides(Array.isArray(driverRides) ? driverRides : []);

      // Load rider information for all rides
      const uniqueRiderIds = [...new Set(driverRides.map(r => r.rider_id).filter(Boolean))];
      const riderPromises = uniqueRiderIds.map(id =>
        base44.entities.User.get(id).catch(() => null)
      );

      const riderResults = await Promise.all(riderPromises);
      const ridersMap = {};
      riderResults.forEach((rider, index) => {
        if (rider) {
          ridersMap[uniqueRiderIds[index]] = rider;
        }
      });

      if (isMountedRef.current) {
        setRiders(ridersMap);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
      if (isMountedRef.current) {
        toast.error('Failed to load trip history');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...rides];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Date range filter
    if (dateRangePreset !== 'all') {
      const now = new Date();
      let startDate, endDate;

      switch (dateRangePreset) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'yesterday':
          startDate = subDays(new Date(now.setHours(0, 0, 0, 0)), 1);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'last7':
          startDate = subDays(now, 7);
          endDate = now;
          break;
        case 'last30':
          startDate = subDays(now, 30);
          endDate = now;
          break;
        case 'custom':
          if (customDateRange.from && customDateRange.to) {
            startDate = customDateRange.from;
            endDate = customDateRange.to;
          }
          break;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(r => {
          const rideDate = new Date(r.created_date);
          return rideDate >= startDate && rideDate <= endDate;
        });
      }
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(r => {
        const rider = riders[r.rider_id];
        return (
          r.pickup_location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.destination?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rider?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort
    switch (sortBy) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        break;
      case 'earnings_high':
        filtered.sort((a, b) => ((b.fare?.total_fare || 0) + (b.fare?.tip_amount || 0)) - ((a.fare?.total_fare || 0) + (a.fare?.tip_amount || 0)));
        break;
      case 'earnings_low':
        filtered.sort((a, b) => ((a.fare?.total_fare || 0) + (a.fare?.tip_amount || 0)) - ((b.fare?.total_fare || 0) + (b.fare?.tip_amount || 0)));
        break;
      case 'rating_high':
        filtered.sort((a, b) => (b.driver_rating || 0) - (a.driver_rating || 0));
        break;
      case 'rating_low':
        filtered.sort((a, b) => (a.driver_rating || 0) - (b.driver_rating || 0));
        break;
    }

    setFilteredRides(filtered);
  };

  const calculateStats = () => {
    const completed = rides.filter(r => r.status === 'completed');
    const cancelled = rides.filter(r => r.status === 'cancelled');

    const totalEarnings = completed.reduce((sum, r) => 
      sum + (r.fare?.total_fare || 0) + (r.fare?.tip_amount || 0), 0
    );

    const totalTips = completed.reduce((sum, r) => 
      sum + (r.fare?.tip_amount || 0), 0
    );

    const ratingsReceived = completed.filter(r => r.driver_rating > 0);
    const averageRating = ratingsReceived.length > 0
      ? ratingsReceived.reduce((sum, r) => sum + r.driver_rating, 0) / ratingsReceived.length
      : 0;

    const totalDistance = completed.reduce((sum, r) => sum + (r.distance_km || 0), 0);

    return {
      totalTrips: rides.length,
      completedTrips: completed.length,
      cancelledTrips: cancelled.length,
      totalEarnings,
      totalTips,
      averageRating,
      totalDistance,
      acceptanceRate: rides.length > 0 ? (completed.length / rides.length) * 100 : 0
    };
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Create CSV content
      const headers = ['Date', 'Time', 'Rider', 'From', 'To', 'Distance (mi)', 'Duration (min)', 'Earnings', 'Tip', 'Total', 'Rating', 'Status'];
      const rows = filteredRides.map(ride => {
        const rider = riders[ride.rider_id];
        return [
          format(new Date(ride.created_date), 'MM/dd/yyyy'),
          format(new Date(ride.created_date), 'hh:mm a'),
          rider?.full_name || 'Unknown',
          ride.pickup_location?.address || '',
          ride.destination?.address || '',
          ride.distance_km?.toFixed(1) || '0',
          ride.duration_minutes?.toFixed(0) || '0',
          `$${(ride.fare?.total_fare || 0).toFixed(2)}`,
          `$${(ride.fare?.tip_amount || 0).toFixed(2)}`,
          `$${((ride.fare?.total_fare || 0) + (ride.fare?.tip_amount || 0)).toFixed(2)}`,
          ride.driver_rating || 'N/A',
          ride.status
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trip-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Trip history exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export trip history');
    } finally {
      setIsExporting(false);
    }
  };

  const TripCard = ({ ride }) => {
    const rider = riders[ride.rider_id];
    const isExpanded = expandedRideId === ride.id;
    const earnings = (ride.fare?.total_fare || 0) + (ride.fare?.tip_amount || 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer",
          ride.status === 'completed' ? 'border-green-200' : 'border-red-200'
        )}>
          <CardContent className="p-6">
            {/* Header */}
            <div 
              className="flex items-start justify-between mb-4"
              onClick={() => setExpandedRideId(isExpanded ? null : ride.id)}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  ride.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                )}>
                  <Car className={cn(
                    "w-6 h-6",
                    ride.status === 'completed' ? 'text-green-600' : 'text-red-600'
                  )} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">
                      {format(new Date(ride.created_date), 'MMM d, yyyy')}
                    </h3>
                    <Badge className={statusColors[ride.status]}>
                      {ride.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {format(new Date(ride.created_date), 'h:mm a')} • {ride.ride_type}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  ${earnings.toFixed(2)}
                </p>
                {ride.fare?.tip_amount > 0 && (
                  <p className="text-xs text-gray-500">
                    +${ride.fare.tip_amount.toFixed(2)} tip
                  </p>
                )}
                {ride.driver_rating > 0 && (
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{ride.driver_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Route Preview */}
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {ride.pickup_location?.address || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                    {ride.destination?.address || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
              <div className="flex items-center gap-4">
                {ride.distance_km && (
                  <span className="flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    {ride.distance_km.toFixed(1)} mi
                  </span>
                )}
                {ride.duration_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.round(ride.duration_minutes)} min
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedRideId(isExpanded ? null : ride.id);
                }}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    More
                  </>
                )}
              </button>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t space-y-4"
                >
                  {/* Rider Info */}
                  {rider && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Rider Information</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {rider.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{rider.full_name}</p>
                            {rider.average_rating && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {rider.average_rating.toFixed(1)} rider rating
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fare Breakdown */}
                  {ride.fare && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Fare Breakdown</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Fare</span>
                          <span className="font-medium">${ride.fare.base_fare?.toFixed(2) || '0.00'}</span>
                        </div>
                        {ride.fare.distance_fare > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Distance</span>
                            <span className="font-medium">${ride.fare.distance_fare.toFixed(2)}</span>
                          </div>
                        )}
                        {ride.fare.time_fare > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time</span>
                            <span className="font-medium">${ride.fare.time_fare.toFixed(2)}</span>
                          </div>
                        )}
                        {ride.fare.surge_multiplier > 1.0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>Surge ({ride.fare.surge_multiplier.toFixed(1)}x)</span>
                            <span className="font-medium">
                              +${((ride.fare.total_fare / ride.fare.surge_multiplier) * (ride.fare.surge_multiplier - 1)).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {ride.fare.tip_amount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Tip</span>
                            <span className="font-medium">${ride.fare.tip_amount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-blue-200 font-bold text-base">
                          <span>Total Earnings</span>
                          <span className="text-green-600">${earnings.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Distance</p>
                      <p className="text-lg font-bold">{ride.distance_km?.toFixed(1) || '0'} mi</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <p className="text-lg font-bold">{ride.duration_minutes?.toFixed(0) || '0'} min</p>
                    </div>
                  </div>

                  {/* Ratings */}
                  {ride.driver_rating > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Rider's Rating</p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={cn(
                              "w-6 h-6",
                              star <= ride.driver_rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                        <span className="ml-2 font-bold text-lg">{ride.driver_rating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {ride.notes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{ride.notes}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip history...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.user_type !== 'driver' && user.user_type !== 'both')) {
    return (
      <div className="p-4 lg:p-8 min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">This page is only accessible to drivers.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <Toaster richColors />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trip History</h1>
              <p className="text-gray-600 mt-1">
                View and manage all your completed and cancelled trips
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => user && loadRides(user.id)}
                disabled={fetchingRef.current}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting || filteredRides.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isExporting ? (
                  <>
                    <Download className="w-4 h-4 mr-2 animate-bounce" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4 text-center">
                <Car className="w-6 h-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">{stats.totalTrips}</div>
                <p className="text-xs opacity-90">Total Trips</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-6 h-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(0)}</div>
                <p className="text-xs opacity-90">Total Earnings</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-4 text-center">
                <Star className="w-6 h-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <p className="text-xs opacity-90">Avg Rating</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4 text-center">
                <Award className="w-6 h-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">${stats.totalTips.toFixed(0)}</div>
                <p className="text-xs opacity-90">Tips Earned</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <CardContent className="p-4 text-center">
                <Navigation className="w-6 h-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">{stats.totalDistance.toFixed(0)}</div>
                <p className="text-xs opacity-90">Miles Driven</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">{stats.acceptanceRate.toFixed(0)}%</div>
                <p className="text-xs opacity-90">Completion Rate</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search rider, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                  <SelectItem value="earnings_high">Highest Earnings</SelectItem>
                  <SelectItem value="earnings_low">Lowest Earnings</SelectItem>
                  <SelectItem value="rating_high">Highest Rating</SelectItem>
                  <SelectItem value="rating_low">Lowest Rating</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Select value={dateRangePreset} onValueChange={setDateRangePreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  {dateRangePresets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range Picker */}
            {dateRangePreset === 'custom' && (
              <div className="mt-4 flex gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.from ? format(customDateRange.from, 'PPP') : 'From date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateRange.from}
                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.to ? format(customDateRange.to, 'PPP') : 'To date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateRange.to}
                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredRides.length}</span> of{' '}
            <span className="font-medium">{rides.length}</span> trips
          </p>
          {(searchQuery || statusFilter !== 'all' || dateRangePreset !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateRangePreset('all');
                setCustomDateRange({ from: null, to: null });
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Trips List */}
        {filteredRides.length > 0 ? (
          <div className="space-y-4">
            {filteredRides.map(ride => (
              <TripCard key={ride.id} ride={ride} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' || dateRangePreset !== 'all'
                  ? 'No trips match your filters'
                  : 'No trips yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || statusFilter !== 'all' || dateRangePreset !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'Complete your first trip to see it here'}
              </p>
              {(searchQuery || statusFilter !== 'all' || dateRangePreset !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setDateRangePreset('all');
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}