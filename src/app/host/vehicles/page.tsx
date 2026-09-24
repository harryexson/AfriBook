'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Image } from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, Car, Calendar, DollarSign, Star, Shield, Loader2, Filter, ChevronDown, ChevronUp, Clock, AlertCircle, Ban, MoreHorizontal } from 'lucide-react';
import { getVehiclesByHost, getHostProfile, deleteVehicle, type Vehicle, type HostProfile } from '@/lib/vehicle-rental';
import { useAuth } from '@/hooks/useAuth';
import { formatVehiclePrice, getVehicleTypeLabel, getVehicleBookingStatusLabel } from '@/lib/vehicle-rental';
import { toast } from '@/components/ui/use-toast';
import { VehicleListingForm } from '@/components/vehicle-rental/VehicleListingForm';

export function HostVehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'draft'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [profile, vehiclesData] = await Promise.all([
        getHostProfile(user.id),
        getVehiclesByHost(profile?.id || ''),
      ]);
      setHostProfile(profile);
      setVehicles(vehiclesData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load vehicles', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadData();
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowCreateForm(true);
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle listing?')) return;
    setDeletingVehicleId(vehicleId);
    try {
      await deleteVehicle(vehicleId);
      toast({ title: 'Deleted', description: 'Vehicle listing has been removed' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete vehicle', variant: 'destructive' });
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    if (activeTab === 'active') return v.isActive && v.verificationStatus === 'approved';
    if (activeTab === 'pending') return v.verificationStatus === 'pending' || v.verificationStatus === 'requires_update';
    if (activeTab === 'draft') return !v.isActive || v.verificationStatus === 'rejected';
    return true;
  });

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.isActive && v.verificationStatus === 'approved').length,
    pending: vehicles.filter(v => v.verificationStatus === 'pending' || v.verificationStatus === 'requires_update').length,
    totalBookings: vehicles.reduce((sum, v) => sum + v.totalBookings, 0),
    totalEarnings: vehicles.reduce((sum, v) => sum + v.totalEarnings, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Vehicles</h1>
            <p className="text-muted-foreground">Manage your vehicle listings and bookings</p>
          </div>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              <VehicleListingForm
                hostId={hostProfile?.id || ''}
                onSuccess={handleCreateSuccess}
                initialData={editingVehicle || undefined}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Vehicles</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Car className="h-12 w-12 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-3xl font-bold">{stats.active}</p>
                </div>
                <Shield className="h-12 w-12 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-3xl font-bold">{stats.totalBookings}</p>
                </div>
                <Calendar className="h-12 w-12 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-3xl font-bold">{formatVehiclePrice(stats.totalEarnings)}</p>
                </div>
                <DollarSign className="h-12 w-12 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Vehicles List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredVehicles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              {activeTab === 'all' ? (
                <>
                  <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No vehicles yet</h3>
                  <p className="text-muted-foreground mb-6">Get started by adding your first vehicle</p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Vehicle
                  </Button>
                </>
              ) : (
                <>
                  <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No {activeTab} vehicles</h3>
                  <p className="text-muted-foreground">Try a different tab or add a new vehicle</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map(vehicle => (
              <HostVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deletingVehicleId === vehicle.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HostVehicleCard({ 
  vehicle, 
  onEdit, 
  onDelete, 
  isDeleting 
}: { 
  vehicle: Vehicle; 
  onEdit: (v: Vehicle) => void; 
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const primaryImage = vehicle.images?.find(img => img.isPrimary && img.type.startsWith('exterior')) ||
    vehicle.images?.find(img => img.type.startsWith('exterior')) ||
    vehicle.images?.[0];

  const statusConfig = {
    approved: { label: 'Active', color: 'bg-green-100 text-green-700', icon: <Shield className="h-3 w-3" /> },
    pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <X className="h-3 w-3" /> },
    requires_update: { label: 'Needs Update', color: 'bg-orange-100 text-orange-700', icon: <AlertCircle className="h-3 w-3" /> },
    suspended: { label: 'Suspended', color: 'bg-gray-100 text-gray-700', icon: <Ban className="h-3 w-3" /> },
  };

  const config = statusConfig[vehicle.verificationStatus as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <span className="text-6xl">🚗</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={config.color} variant="default">
            <span className="flex items-center gap-1">
              {config.icon}
              {config.label}
            </span>
          </Badge>
        </div>

        {/* Instant Book Badge */}
        {vehicle.isInstantBook && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Instant Book
            </Badge>
          </div>
        )}

        {/* Verification Status */}
        {!vehicle.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Inactive
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {vehicle.locationCity}, {vehicle.locationState}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Listing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                Manage Calendar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DollarSign className="mr-2 h-4 w-4" />
                Pricing Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(vehicle.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            {vehicle.averageRating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {vehicle.totalBookings} bookings
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            {formatVehiclePrice(vehicle.totalEarnings)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Car className="h-3 w-3" />
            {getVehicleTypeLabel(vehicle.vehicleType as any)}
          </Badge>
          <Badge variant="outline">{vehicle.transmission}</Badge>
          <Badge variant="outline">{vehicle.fuelType.replace('_', ' ')}</Badge>
          <Badge variant="outline">{vehicle.seats} seats</Badge>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" className="flex-1" onClick={() => onEdit(vehicle)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => onDelete(vehicle.id)} disabled={isDeleting}>
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="aspect-video bg-muted" />
      <CardContent className="p-4 space-y-3">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
        <div className="h-4 w-1/4 bg-muted rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded-full" />
          <div className="h-6 w-16 bg-muted rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Import missing icons
