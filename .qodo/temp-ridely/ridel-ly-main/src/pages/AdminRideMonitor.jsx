import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Car,
  Search,
  Filter,
  MapPin,
  Clock,
  User,
  DollarSign,
  AlertTriangle,
  Eye,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Phone,
  Mail,
  Flag,
  MessageSquare
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  requested: { color: 'bg-yellow-100 text-yellow-800', label: 'Requested' },
  accepted: { color: 'bg-blue-100 text-blue-800', label: 'Accepted' },
  arriving: { color: 'bg-purple-100 text-purple-800', label: 'Arriving' },
  in_progress: { color: 'bg-green-100 text-green-800', label: 'In Progress' },
  completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
  scheduled: { color: 'bg-indigo-100 text-indigo-800', label: 'Scheduled' }
};

export default function AdminRideMonitor() {
  const [rides, setRides] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRide, setSelectedRide] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeForm, setDisputeForm] = useState({ reason: '', action: '', notes: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let filter = {};
      
      if (activeTab === 'active') {
        filter.status = { $in: ['requested', 'accepted', 'arriving', 'in_progress'] };
      } else if (activeTab === 'completed') {
        filter.status = 'completed';
      } else if (activeTab === 'cancelled') {
        filter.status = 'cancelled';
      } else if (activeTab === 'scheduled') {
        filter.status = 'scheduled';
      }

      const rideData = await base44.entities.Ride.filter(filter, '-created_date', 200);
      setRides(rideData);

      // Load user data
      const userIds = new Set();
      rideData.forEach(ride => {
        if (ride.rider_id) userIds.add(ride.rider_id);
        if (ride.driver_id) userIds.add(ride.driver_id);
      });

      const userData = {};
      for (const userId of userIds) {
        try {
          userData[userId] = await base44.entities.User.get(userId);
        } catch (e) {
          console.error(`Failed to load user ${userId}`);
        }
      }
      setUsers(userData);
    } catch (error) {
      console.error('Error loading rides:', error);
      toast.error('Failed to load rides');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRide = async (ride) => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;
    
    setIsProcessing(true);
    try {
      await base44.entities.Ride.update(ride.id, {
        status: 'cancelled',
        notes: (ride.notes || '') + '\n[Admin cancelled]'
      });
      toast.success('Ride cancelled');
      loadData();
    } catch (error) {
      toast.error('Failed to cancel ride');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!disputeForm.action) {
      toast.error('Please select an action');
      return;
    }

    setIsProcessing(true);
    try {
      let updateData = {
        notes: (selectedRide.notes || '') + `\n[Dispute: ${disputeForm.reason}]\n[Action: ${disputeForm.action}]\n[Notes: ${disputeForm.notes}]`
      };

      if (disputeForm.action === 'refund_rider') {
        // In production, this would trigger a refund
        updateData.notes += '\n[Refund processed]';
      } else if (disputeForm.action === 'compensate_driver') {
        updateData.notes += '\n[Driver compensated]';
      }

      await base44.entities.Ride.update(selectedRide.id, updateData);

      // Send notification emails
      const rider = users[selectedRide.rider_id];
      const driver = users[selectedRide.driver_id];

      if (rider) {
        await base44.integrations.Core.SendEmail({
          to: rider.email,
          subject: `Update on your ride dispute`,
          body: `Hi ${rider.full_name},\n\nYour dispute has been reviewed. Action taken: ${disputeForm.action.replace('_', ' ')}.\n\n${disputeForm.notes}\n\nThank you for your patience.\n\nRide-ly Team`
        });
      }

      toast.success('Dispute resolved');
      setShowDisputeDialog(false);
      setDisputeForm({ reason: '', action: '', notes: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to resolve dispute');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRides = rides.filter(ride => {
    const rider = users[ride.rider_id];
    const driver = users[ride.driver_id];
    
    const matchesSearch = !searchQuery ||
      rider?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.pickup_location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.destination?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    active: rides.filter(r => ['requested', 'accepted', 'arriving', 'in_progress'].includes(r.status)).length,
    completed: rides.filter(r => r.status === 'completed').length,
    cancelled: rides.filter(r => r.status === 'cancelled').length,
    totalRevenue: rides.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.fare?.total_fare || 0), 0)
  };

  return (
    <div className="p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <Toaster richColors />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ride Monitor</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all rides</p>
          </div>
          <Button onClick={loadData} variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Rides</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <Car className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed Today</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Cancelled</p>
                  <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <XCircle className="w-12 h-12 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-3xl font-bold text-purple-600">${stats.totalRevenue.toFixed(0)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by rider, driver, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rides List */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : filteredRides.length > 0 ? (
              <div className="space-y-4">
                {filteredRides.map((ride) => {
                  const rider = users[ride.rider_id];
                  const driver = users[ride.driver_id];

                  return (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              {/* Status & Type */}
                              <div className="flex items-center gap-2">
                                <Badge className={STATUS_CONFIG[ride.status]?.color}>
                                  {STATUS_CONFIG[ride.status]?.label}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {ride.ride_type}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(ride.created_date), { addSuffix: true })}
                                </span>
                              </div>

                              {/* Users */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-blue-500" />
                                  <div>
                                    <p className="text-sm font-medium">{rider?.full_name || 'Loading...'}</p>
                                    <p className="text-xs text-gray-500">Rider</p>
                                  </div>
                                </div>
                                {driver && (
                                  <div className="flex items-center gap-2">
                                    <Car className="w-4 h-4 text-green-500" />
                                    <div>
                                      <p className="text-sm font-medium">{driver?.full_name}</p>
                                      <p className="text-xs text-gray-500">Driver</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Route */}
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-gray-900 truncate">{ride.pickup_location?.address}</p>
                                  <p className="text-gray-500 truncate">→ {ride.destination?.address}</p>
                                </div>
                              </div>

                              {/* Fare */}
                              {ride.fare?.total_fare && (
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">${ride.fare.total_fare.toFixed(2)}</span>
                                  {ride.fare.surge_multiplier > 1 && (
                                    <Badge className="bg-orange-100 text-orange-700 text-xs">
                                      {ride.fare.surge_multiplier}x surge
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRide(ride);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Details
                              </Button>
                              {['requested', 'accepted', 'arriving', 'in_progress'].includes(ride.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleCancelRide(ride)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              )}
                              {ride.status === 'completed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 hover:bg-orange-50"
                                  onClick={() => {
                                    setSelectedRide(ride);
                                    setShowDisputeDialog(true);
                                  }}
                                >
                                  <Flag className="w-4 h-4 mr-1" />
                                  Dispute
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rides found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ride Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ride Details</DialogTitle>
          </DialogHeader>
          
          {selectedRide && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Rider</p>
                    <p className="font-medium">{users[selectedRide.rider_id]?.full_name}</p>
                    <p className="text-sm text-gray-600">{users[selectedRide.rider_id]?.email}</p>
                  </CardContent>
                </Card>
                {selectedRide.driver_id && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500 mb-1">Driver</p>
                      <p className="font-medium">{users[selectedRide.driver_id]?.full_name}</p>
                      <p className="text-sm text-gray-600">{users[selectedRide.driver_id]?.email}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <p className="text-sm">{selectedRide.pickup_location?.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <p className="text-sm">{selectedRide.destination?.address}</p>
                  </div>
                </CardContent>
              </Card>

              {selectedRide.fare && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-2">Fare Breakdown</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Base Fare</span>
                        <span>${selectedRide.fare.base_fare?.toFixed(2) || '0.00'}</span>
                      </div>
                      {selectedRide.fare.distance_fare && (
                        <div className="flex justify-between">
                          <span>Distance</span>
                          <span>${selectedRide.fare.distance_fare.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedRide.fare.platform_fee && (
                        <div className="flex justify-between text-gray-500">
                          <span>Platform Fee</span>
                          <span>${selectedRide.fare.platform_fee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>${selectedRide.fare.total_fare?.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge className={STATUS_CONFIG[selectedRide.status]?.color}>
                    {STATUS_CONFIG[selectedRide.status]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="font-medium">{selectedRide.distance_km?.toFixed(1) || '-'} km</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-medium">{selectedRide.duration_minutes?.toFixed(0) || '-'} min</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Handle Dispute</DialogTitle>
            <DialogDescription>Review and resolve a ride dispute</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Dispute Reason</Label>
              <Select 
                value={disputeForm.reason} 
                onValueChange={(v) => setDisputeForm({ ...disputeForm, reason: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overcharge">Overcharge</SelectItem>
                  <SelectItem value="route_issue">Route Issue</SelectItem>
                  <SelectItem value="driver_behavior">Driver Behavior</SelectItem>
                  <SelectItem value="rider_behavior">Rider Behavior</SelectItem>
                  <SelectItem value="cancellation">Unfair Cancellation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Action</Label>
              <Select 
                value={disputeForm.action} 
                onValueChange={(v) => setDisputeForm({ ...disputeForm, action: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_action">No Action Needed</SelectItem>
                  <SelectItem value="refund_rider">Full Refund to Rider</SelectItem>
                  <SelectItem value="partial_refund">Partial Refund</SelectItem>
                  <SelectItem value="compensate_driver">Compensate Driver</SelectItem>
                  <SelectItem value="warning_driver">Warning to Driver</SelectItem>
                  <SelectItem value="warning_rider">Warning to Rider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Resolution Notes</Label>
              <Textarea
                placeholder="Explain the resolution..."
                value={disputeForm.notes}
                onChange={(e) => setDisputeForm({ ...disputeForm, notes: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>Cancel</Button>
            <Button onClick={handleResolveDispute} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Resolve Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}