'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button-primitive';
import { Card, CardContent } from '@/components/ui/card-primitive';
import { Badge } from '@/components/ui/badge-primitive';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Car, Calendar, DollarSign, Star, Shield, Loader2, Clock, AlertCircle, Ban, Key, X } from 'lucide-react';
import {
  getVehiclesByHost,
  getHostBookings,
  deleteVehicle,
  formatVehiclePrice,
  getVehicleTypeLabel,
  type Vehicle,
  type VehicleBooking,
} from '@/lib/vehicle-rental';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { VehicleListingForm } from '@/components/vehicle-rental/VehicleListingForm';
import { ApiKeyManagement } from '@/components/vehicle-rental/ApiKeyManagement';

export default function HostVehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<VehicleBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'pending' | 'draft' | 'api'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [vehiclesData, bookingsData] = await Promise.all([getVehiclesByHost(user.id), getHostBookings(user.id)]);
      setVehicles(vehiclesData);
      setBookings(bookingsData);
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

  const filteredVehicles = vehicles.filter((v) => {
    if (activeTab === 'published') return v.status === 'published';
    if (activeTab === 'pending') return v.status === 'pending_review';
    if (activeTab === 'draft') return v.status === 'draft' || v.status === 'rejected';
    return true;
  });

  const stats = {
    total: vehicles.length,
    published: vehicles.filter((v) => v.status === 'published').length,
    pending: vehicles.filter((v) => v.status === 'pending_review').length,
    totalBookings: bookings.length,
    totalEarnings: bookings.filter((b) => b.status === 'completed').reduce((sum, b) => sum + b.subtotal, 0),
  };

  if (!user) return null;

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
            <DialogTrigger className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-y-auto">
              <VehicleListingForm hostId={user.id} onSuccess={handleCreateSuccess} />
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
                  <p className="text-sm text-muted-foreground">Published Listings</p>
                  <p className="text-3xl font-bold">{stats.published}</p>
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
                  <p className="text-3xl font-bold">{formatVehiclePrice(stats.totalEarnings, 'USD')}</p>
                </div>
                <DollarSign className="h-12 w-12 text-yellow-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="published">Published ({stats.published})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="api">
              <Key className="mr-2 h-4 w-4" />
              API & Integrations
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* API & Integrations Tab */}
        {activeTab === 'api' && <ApiKeyManagement hostId={user.id} />}

        {/* Vehicles List - only show when not on API tab */}
        {activeTab !== 'api' && (
          <>
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
                {filteredVehicles.map((vehicle) => (
                  <HostVehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onDelete={handleDelete}
                    isDeleting={deletingVehicleId === vehicle.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function HostVehicleCard({
  vehicle,
  onDelete,
  isDeleting,
}: {
  vehicle: Vehicle;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const primaryImageUrl = vehicle.coverImageUrl ?? vehicle.galleryImages?.[0];

  const statusConfig = {
    published: { label: 'Published', color: 'bg-green-100 text-green-700', icon: <Shield className="h-3 w-3" /> },
    pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <X className="h-3 w-3" /> },
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: <Edit className="h-3 w-3" /> },
    suspended: { label: 'Suspended', color: 'bg-gray-100 text-gray-700', icon: <Ban className="h-3 w-3" /> },
    archived: { label: 'Archived', color: 'bg-gray-100 text-gray-700', icon: <AlertCircle className="h-3 w-3" /> },
  };

  const config = statusConfig[vehicle.status] ?? statusConfig.draft;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        {primaryImageUrl ? (
          <Image
            src={primaryImageUrl}
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
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{vehicle.city}</p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            {vehicle.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            {formatVehiclePrice(vehicle.pricePerDay, vehicle.currencyCode)}/day
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Car className="h-3 w-3" />
            {getVehicleTypeLabel(vehicle.vehicleType)}
          </Badge>
          <Badge variant="outline">{vehicle.transmission}</Badge>
          <Badge variant="outline">{vehicle.fuelType.replace('_', ' ')}</Badge>
          <Badge variant="outline">{vehicle.seats} seats</Badge>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button variant="ghost" className="text-red-600 hover:text-red-700 w-full" onClick={() => onDelete(vehicle.id)} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
