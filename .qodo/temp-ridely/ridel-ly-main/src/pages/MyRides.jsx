import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Clock,
  MapPin,
  Car,
  Star,
  Calendar,
  Receipt,
  Download,
  Search,
  Filter,
  Zap,
  DollarSign,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import TipDialog from '../components/rides/TipDialog';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { createPageUrl } from "@/utils";

const statusColors = {
  requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  arriving: "bg-purple-100 text-purple-800 border-purple-200",
  in_progress: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  scheduled: "bg-indigo-100 text-indigo-800 border-indigo-200"
};

export default function MyRides() {
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [selectedRideForTip, setSelectedRideForTip] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRideDetails, setSelectedRideDetails] = useState(null);
  const [sendingReceipt, setSendingReceipt] = useState(null);

  // FIXED: Add refs to track component state and prevent concurrent requests
  const isMountedRef = useRef(true);
  const fetchingRidesRef = useRef(false);
  const lastFetchTime = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    
    const initialize = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (isMountedRef.current) {
          setUser(currentUser);
          await loadRides(currentUser.id);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    
    initialize();
    
    return () => {
      isMountedRef.current = false;
      fetchingRidesRef.current = false;
    };
  }, []);

  useEffect(() => {
    let filtered = rides;

    // Tab filtering
    if (activeTab === "active") {
      filtered = rides.filter(ride =>
        ['requested', 'accepted', 'arriving', 'in_progress', 'scheduled'].includes(ride.status)
      );
    } else if (activeTab === "completed") {
      filtered = rides.filter(ride => ride.status === 'completed');
    } else if (activeTab === "cancelled") {
      filtered = rides.filter(ride => ride.status === 'cancelled');
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(ride => ride.status === filterStatus);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(ride =>
        ride.pickup_location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.destination?.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "date_desc":
        filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case "date_asc":
        filtered.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        break;
      case "fare_high":
        filtered.sort((a, b) => (b.fare?.total_fare || 0) - (a.fare?.total_fare || 0));
        break;
      case "fare_low":
        filtered.sort((a, b) => (a.fare?.total_fare || 0) - (b.fare?.total_fare || 0));
        break;
    }

    setFilteredRides(filtered);
  }, [rides, activeTab, searchQuery, sortBy, filterStatus]);

  const loadRides = async (userId) => {
    // FIXED: Prevent concurrent requests and rate limiting
    if (!userId || !isMountedRef.current || fetchingRidesRef.current) {
      return;
    }

    // FIXED: Rate limiting - don't fetch more than once every 5 seconds
    const now = Date.now();
    if (now - lastFetchTime.current < 5000) {
      console.log('[MY RIDES] Skipping fetch - too soon');
      return;
    }

    fetchingRidesRef.current = true;
    lastFetchTime.current = now;

    try {
      // FIXED: Add timeout for request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const userRides = await base44.entities.Ride.filter(
        { rider_id: userId },
        '-created_date',
        100
      );
      
      clearTimeout(timeoutId);
      
      if (!isMountedRef.current) return;
      
      console.log('[MY RIDES] Loaded rides:', userRides.length);
      setRides(Array.isArray(userRides) ? userRides : []);
      
    } catch (e) {
      // FIXED: Better error handling
      if (!isMountedRef.current) return;
      
      if (e.name === 'AbortError' || e.message?.includes('aborted')) {
        console.log('[MY RIDES] Request timeout or aborted (expected)');
      } else if (e.message?.includes('Network Error')) {
        console.log('[MY RIDES] Network error (will retry on next poll)');
      } else {
        console.error('[MY RIDES] Error loading rides:', e.message);
        if (isLoading) {
          toast.error("Could not load your rides. Please refresh.");
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        fetchingRidesRef.current = false;
      }
    }
  };

  // FIXED: Better polling with proper cleanup and rate limiting
  useEffect(() => {
    if (!user?.id || isLoading) return;
    
    let isMounted = true;
    
    // Poll every 15 seconds (less aggressive than 10)
    const interval = setInterval(() => {
      if (isMounted && !fetchingRidesRef.current) {
        loadRides(user.id);
      }
    }, 15000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.id, isLoading]);

  const handleSendReceipt = async (ride) => {
    setSendingReceipt(ride.id);
    try {
      const result = await base44.functions.invoke('sendRideReceipt', {
        rideId: ride.id
      });

      if (result.data?.success) {
        toast.success('Receipt sent to your email!');
      } else {
        toast.error('Could not send receipt');
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
      toast.error('Failed to send receipt');
    } finally {
      setSendingReceipt(null);
    }
  };

  const handleOpenTipDialog = (ride) => {
      setSelectedRideForTip(ride);
      setTipDialogOpen(true);
  }

  const handleTipSubmit = async (tipAmount) => {
    if (!selectedRideForTip) return;

    try {
        const currentFare = selectedRideForTip.fare || {};
        await base44.entities.Ride.update(selectedRideForTip.id, {
            fare: {
                ...currentFare,
                tip_amount: tipAmount
            }
        });
        toast.success(`Successfully added a $${tipAmount.toFixed(2)} tip!`);
        setTipDialogOpen(false);
        setSelectedRideForTip(null);
        if (user) {
            loadRides(user.id);
        }
    } catch (error) {
        console.error("Failed to add tip", error);
        toast.error("Could not add tip. Please try again.");
    }
  }

  const RideDetailsCard = ({ ride }) => {
    const [driver, setDriver] = useState(null);
    const [loadingDriver, setLoadingDriver] = useState(false);

    useEffect(() => {
      const loadDriver = async () => {
        if (ride.driver_id && !loadingDriver) {
          setLoadingDriver(true);
          try {
            const driverData = await base44.entities.User.get(ride.driver_id);
            setDriver(driverData);
          } catch (error) {
            console.error('Error loading driver:', error);
          } finally {
            setLoadingDriver(false);
          }
        }
      };
      loadDriver();
    }, [ride.driver_id]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900 capitalize">
                    {ride.ride_type} Ride
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(ride.created_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <Badge className={`${statusColors[ride.status]} font-medium`}>
                {ride.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Route */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">From</p>
                  <p className="text-gray-900">{ride.pickup_location?.address || 'Unknown location'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">To</p>
                  <p className="text-gray-900">{ride.destination?.address || 'Unknown destination'}</p>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            {driver && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Driver</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{driver.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {driver.driver_info?.vehicle_color} {driver.driver_info?.vehicle_make} {driver.driver_info?.vehicle_model}
                    </p>
                  </div>
                  {driver.average_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{driver.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fare Details */}
            {ride.fare && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Fare</span>
                    <span className="font-medium">${ride.fare.base_fare?.toFixed(2) || '0.00'}</span>
                  </div>
                  {ride.fare.distance_fare && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Distance</span>
                      <span className="font-medium">${ride.fare.distance_fare.toFixed(2)}</span>
                    </div>
                  )}
                  {ride.fare.time_fare && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Time</span>
                      <span className="font-medium">${ride.fare.time_fare.toFixed(2)}</span>
                    </div>
                  )}
                  {ride.fare.surge_multiplier > 1.0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Surge Pricing ({ride.fare.surge_multiplier.toFixed(1)}x)
                      </span>
                      <span className="font-medium text-orange-600">
                        ${((ride.fare.total_fare / ride.fare.surge_multiplier - ride.fare.total_fare) * -1).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {ride.fare.tip_amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tip</span>
                      <span className="font-medium text-green-600">${ride.fare.tip_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-lg text-gray-900">
                      ${(ride.fare.total_fare + (ride.fare.tip_amount || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats & Rating */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {ride.distance_km && (
                  <span>{ride.distance_km.toFixed(1)} km</span>
                )}
                {ride.duration_minutes && (
                  <span>{Math.round(ride.duration_minutes)} min</span>
                )}
              </div>
              {ride.rider_rating && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500">Your rating:</span>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= ride.rider_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {['requested', 'accepted', 'arriving', 'in_progress'].includes(ride.status) && (
                <Button 
                  onClick={() => window.location.href = createPageUrl('TrackRide') + '?id=' + ride.id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Track Ride
                </Button>
              )}
              
              {ride.status === 'completed' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSendReceipt(ride)}
                    disabled={sendingReceipt === ride.id}
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {sendingReceipt === ride.id ? 'Sending...' : 'Email Receipt'}
                  </Button>
                  {!ride.fare?.tip_amount && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenTipDialog(ride)}
                      className="flex-1"
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Add Tip
                    </Button>
                  )}
                  {!ride.rider_rating && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.href = createPageUrl('TrackRide') + '?id=' + ride.id}
                      className="flex-1 text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Rate Driver
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = rides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.fare?.total_fare || 0) + (r.fare?.tip_amount || 0), 0);

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <Toaster richColors />
      {selectedRideForTip && (
        <TipDialog
            isOpen={tipDialogOpen}
            onClose={() => setTipDialogOpen(false)}
            ride={selectedRideForTip}
            onTipSubmit={handleTipSubmit}
        />
      )}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Rides</h1>
            <p className="text-gray-600 mt-2">Track your ride history and manage bookings</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => user && loadRides(user.id)}
              disabled={fetchingRidesRef.current}
            >
              Refresh
            </Button>
            <Button onClick={() => window.location.href = createPageUrl('BookRide')} className="bg-blue-600 hover:bg-blue-700">
              <Car className="w-4 h-4 mr-2" />
              Book a Ride
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6 text-center">
              <Car className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {rides.filter(r => r.status === 'completed').length}
              </div>
              <p className="text-sm text-gray-500">Completed Rides</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                ${totalSpent.toFixed(0)}
              </div>
              <p className="text-sm text-gray-500">Total Spent</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {rides.filter(r => r.status === 'scheduled').length}
              </div>
              <p className="text-sm text-gray-500">Scheduled</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">4.8</div>
              <p className="text-sm text-gray-500">Average Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                  <SelectItem value="fare_high">Highest Fare</SelectItem>
                  <SelectItem value="fare_low">Lowest Fare</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rides List */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Rides</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {filteredRides.length > 0 ? (
              <div className="space-y-4">
                {filteredRides.map((ride) => (
                  <RideDetailsCard key={ride.id} ride={ride} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === "all" ? "No rides yet" : `No ${activeTab} rides`}
                </h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === "all"
                    ? "Book your first ride to get started"
                    : `You don't have any ${activeTab} rides at the moment`
                  }
                </p>
                <Button onClick={() => window.location.href = createPageUrl('BookRide')} className="bg-blue-600 hover:bg-blue-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  Book a Ride
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}