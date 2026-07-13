import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, DollarSign, Clock, ArrowRight, Search, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const ITEMS_PER_PAGE = 10;

const statusColors = {
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  scheduled: "bg-blue-100 text-blue-800"
};

export default function RideHistory() {
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('rider'); // 'rider' or 'driver'

  useEffect(() => {
    loadData();
  }, [viewMode]);

  useEffect(() => {
    applyFilters();
  }, [rides, searchQuery, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const query = viewMode === 'driver' 
        ? { driver_id: currentUser.id, status: { $in: ['completed', 'cancelled'] } }
        : { rider_id: currentUser.id, status: { $in: ['completed', 'cancelled'] } };

      const allRides = await base44.entities.Ride.filter(query, '-created_date', 500);
      setRides(allRides);
    } catch (error) {
      console.error('Error loading rides:', error);
      toast.error('Failed to load ride history');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rides];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ride => ride.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(ride => 
        ride.pickup_location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.destination?.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRides(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredRides.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRides = filteredRides.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const totalEarnings = rides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (viewMode === 'driver' ? (r.fare?.total_fare || 0) : 0), 0);

  const totalSpent = rides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (viewMode === 'rider' ? (r.fare?.total_fare || 0) : 0), 0);

  const isBothUserType = user?.user_type === 'both';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster richColors />
      
      {/* Header */}
      <div className="bg-black text-white px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Ride History</h1>
            <p className="text-gray-400 text-sm">
              {filteredRides.length} {filteredRides.length === 1 ? 'trip' : 'trips'}
            </p>
          </div>
          {isBothUserType && (
            <Button
              onClick={() => setViewMode(viewMode === 'rider' ? 'driver' : 'rider')}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              {viewMode === 'rider' ? 'View as Driver' : 'View as Rider'}
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-gray-400 text-xs mb-1">Total Trips</p>
            <p className="text-2xl font-bold">{rides.filter(r => r.status === 'completed').length}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-gray-400 text-xs mb-1">
              {viewMode === 'driver' ? 'Total Earned' : 'Total Spent'}
            </p>
            <p className="text-2xl font-bold">
              ${(viewMode === 'driver' ? totalEarnings : totalSpent).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-8">
        {/* Filters */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Rides List */}
        {paginatedRides.length === 0 ? (
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No rides found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginatedRides.map((ride, index) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white shadow-sm border-0 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[ride.status]}>
                          {ride.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(ride.created_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ${ride.fare?.total_fare?.toFixed(2) || '0.00'}
                        </p>
                        {viewMode === 'driver' && ride.fare?.platform_contribution && (
                          <p className="text-xs text-green-600">
                            +${ride.fare.platform_contribution.toFixed(2)} bonus
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="w-0.5 h-6 bg-gray-300 my-1"></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Pickup</p>
                          <p className="text-sm font-medium truncate">
                            {ride.pickup_location?.address || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Drop-off</p>
                          <p className="text-sm font-medium truncate">
                            {ride.destination?.address || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t">
                      {ride.distance_km && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ride.distance_km.toFixed(1)} km
                        </div>
                      )}
                      {ride.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ride.duration_minutes} min
                        </div>
                      )}
                      <div className="flex items-center gap-1 capitalize">
                        {ride.ride_type?.replace('_', ' ')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}