'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Car, Filter, X, ChevronLeft, ChevronRight, Heart, Star, MapPin as MapPinIcon } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { searchVehicles, getFeaturedVehicles, type Vehicle, type VehicleSearchFilters, type VehicleType } from '@/lib/vehicle-rental';
import { VehicleCard } from './VehicleCard';
import { DateRangePicker } from './DateRangePicker';
import { toast } from '@/components/ui/use-toast';

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'sedan', label: 'Sedan', icon: '🚗' },
  { value: 'suv', label: 'SUV', icon: '🚙' },
  { value: 'truck', label: 'Truck', icon: '🛻' },
  { value: 'van', label: 'Van', icon: '🚐' },
  { value: 'coupe', label: 'Coupe', icon: '🏎️' },
  { value: 'convertible', label: 'Convertible', icon: '🛞' },
  { value: 'electric', label: 'Electric', icon: '⚡' },
  { value: 'hybrid', label: 'Hybrid', icon: '🔋' },
  { value: 'luxury', label: 'Luxury', icon: '✨' },
  { value: 'pickup', label: 'Pickup', icon: '🛻' },
  { value: 'minivan', label: 'Minivan', icon: '🚌' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
];

const MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz', 'Audi',
  'Lexus', 'Tesla', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Volkswagen', 'Jeep',
  'Ram', 'GMC', 'Cadillac', 'Lincoln', 'Acura', 'Infiniti', 'Volvo', 'Porsche',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popularity', label: 'Most Popular' },
];

export function VehicleSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<VehicleType[]>([]);
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popularity'>('newest');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [location, setLocation] = useState('');

  const loadVehicles = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    const filters: VehicleSearchFilters = {
      location: location || undefined,
      startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      vehicleTypes: selectedVehicleTypes.length > 0 ? selectedVehicleTypes : undefined,
      makes: selectedMakes.length > 0 ? selectedMakes : undefined,
      priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
      priceMax: priceRange[1] < 500 ? priceRange[1] : undefined,
      sortBy,
    };

    try {
      const result = await searchVehicles(filters, pageNum, 12);
      if (append) {
        setVehicles(prev => [...prev, ...result.vehicles]);
      } else {
        setVehicles(result.vehicles);
      }
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      setPage(result.page);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load vehicles', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [location, dateRange, selectedVehicleTypes, selectedMakes, priceRange, sortBy]);

  const loadFeatured = useCallback(async () => {
    try {
      const featured = await getFeaturedVehicles(8);
      setFeaturedVehicles(featured);
    } catch (error) {
      console.error('Failed to load featured vehicles');
    }
  }, []);

  useEffect(() => {
    loadVehicles(1, false);
    loadFeatured();
  }, [loadVehicles, loadFeatured]);

  const handleSearch = () => {
    setPage(1);
    loadVehicles(1, false);
  };

  const handleLoadMore = () => {
    loadVehicles(page + 1, true);
  };

  const clearFilters = () => {
    setSelectedVehicleTypes([]);
    setSelectedMakes([]);
    setPriceRange([0, 500]);
    setSortBy('newest');
    setLocation('');
    handleSearch();
  };

  const hasActiveFilters = selectedVehicleTypes.length > 0 || selectedMakes.length > 0 || 
    priceRange[0] > 0 || priceRange[1] < 500 || location;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 via-background to-background py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Find Your Perfect <span className="text-primary">Ride</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Rent vehicles from trusted local hosts. Cars, SUVs, trucks, and more — all with insurance included.
            </p>
            
            {/* Quick Search */}
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-4 items-end">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="City or address"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="dates">Dates</Label>
                    <DateRangePicker
                      value={dateRange}
                      onChange={setDateRange}
                      placeholder="Select dates"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Select value={selectedVehicleTypes[0] || ''} onValueChange={v => setSelectedVehicleTypes(v ? [v as VehicleType] : [])}>
                      <SelectTrigger id="vehicleType">
                        <SelectValue placeholder="Any type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        {VEHICLE_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button onClick={handleSearch} className="w-full h-11 bg-primary text-primary-foreground">
                      <Car className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Filters Sidebar + Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className={`w-72 lg:w-80 flex-shrink-0 transition-all duration-300 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-1 h-3 w-3" />
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Vehicle Types */}
                  <div>
                    <Label className="block mb-2 font-medium">Vehicle Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {VEHICLE_TYPES.map(type => (
                        <label
                          key={type.value}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${
                            selectedVehicleTypes.includes(type.value)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-muted border-input'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedVehicleTypes.includes(type.value)}
                            onChange={e => setSelectedVehicleTypes(
                              e.target.checked
                                ? [...selectedVehicleTypes, type.value]
                                : selectedVehicleTypes.filter(t => t !== type.value)
                            )}
                            className="sr-only"
                          />
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Makes */}
                  <div>
                    <Label className="block mb-2 font-medium">Make</Label>
                    <Select
                      value={selectedMakes[0] || ''}
                      onValueChange={v => setSelectedMakes(v ? [v] : [])}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All makes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Makes</SelectItem>
                        {MAKES.map(make => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="block mb-2 font-medium">
                      Daily Price: ${priceRange[0]} - ${priceRange[1] === 500 ? '500+' : priceRange[1]}
                    </Label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="10"
                        value={priceRange[0]}
                        onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - 10), priceRange[1]])}
                        className="w-full"
                      />
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="10"
                        value={priceRange[1]}
                        onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 10)])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$0</span>
                        <span>$500+</span>
                      </div>
                    </div>
                  </div>

                  {/* Sort */}
                  <div>
                    <Label className="block mb-2 font-medium">Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quick Filters */}
                  <div>
                    <Label className="block mb-2 font-medium">More Filters</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-input" />
                        <span className="text-sm">Instant Book</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-input" />
                        <span className="text-sm">Delivery Available</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-input" />
                        <span className="text-sm">Pet Friendly</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-input" />
                        <span className="text-sm">Unlimited Mileage</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{totalCount} {totalCount === 1 ? 'Vehicle' : 'Vehicles'} Found</h2>
                  <p className="text-muted-foreground">Showing {vehicles.length} of {totalCount} results</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>

              {/* Featured Vehicles (when no search) */}
              {!location && !dateRange?.from && !hasActiveFilters && featuredVehicles.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4">Featured Vehicles</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {featuredVehicles.map(vehicle => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))}
                  </div>
                </div>
              )}

              {/* Results Grid */}
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <VehicleCardSkeleton key={i} />
                  ))}
                </div>
              ) : vehicles.length === 0 ? (
                <div className="text-center py-16">
                  <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No vehicles found</h3>
                  <p className="text-muted-foreground mb-6">Try adjusting your filters or search in a different area</p>
                  <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {vehicles.map(vehicle => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="text-center mt-8">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="w-full sm:w-auto"
                      >
                        {isLoadingMore ? (
                          <>
                            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Loading...
                          </>
                        ) : (
                          'Load More Vehicles'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Filters Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button 
          size="lg" 
          className="shadow-xl rounded-full px-6"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters {hasActiveFilters && <Badge variant="secondary" className="ml-1">{selectedVehicleTypes.length + selectedMakes.length}</Badge>}
        </Button>
      </div>

      {/* Mobile Filters Sheet */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Same filter content as sidebar */}
              <div>
                <Label className="block mb-2 font-medium">Vehicle Type</Label>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_TYPES.map(type => (
                    <label
                      key={type.value}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer ${
                        selectedVehicleTypes.includes(type.value)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-input'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedVehicleTypes.includes(type.value)}
                        onChange={e => setSelectedVehicleTypes(
                          e.target.checked
                            ? [...selectedVehicleTypes, type.value]
                            : selectedVehicleTypes.filter(t => t !== type.value)
                        )}
                        className="sr-only"
                      />
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="block mb-2 font-medium">Price Range</Label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={priceRange[0]}
                    onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - 10), priceRange[1]])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1] === 500 ? '500+' : priceRange[1]}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full" onClick={() => { handleSearch(); setShowFilters(false); }}>
                  Show {totalCount} Results
                </Button>
                {hasActiveFilters && (
                  <Button variant="outline" className="w-full mt-2" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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