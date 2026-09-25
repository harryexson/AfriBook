'use client';

import { useState, useEffect } from 'react';
import { Image } from 'next/image';
import Link from 'next/link';
import { Car, MapPin, Star, Heart, Shield, Calendar, Users, Settings, Fuel, Zap, CheckCircle, X, ChevronLeft, ChevronRight, Share2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DateRangePicker } from './DateRangePicker';
import { format, addDays, startOfDay, isBefore, isSameDay, eachDayOfInterval } from 'date-fns';
import { formatVehiclePrice, getVehicleSpecs, getVehicleTypeLabel, calculateVehiclePricing, type Vehicle, type VehicleBooking } from '@/lib/vehicle-rental';
import { createVehicleBooking, checkVehicleAvailability, getVehiclePricing } from '@/lib/vehicle-rental';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface VehicleDetailPageProps {
  vehicle: Vehicle;
}

export function VehicleDetailPage({ vehicle }: VehicleDetailPageProps) {
  const { user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [pricing, setPricing] = useState<ReturnType<typeof calculateVehiclePricing> | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  const exteriorImages = vehicle.images?.filter(img => 
    img.type.startsWith('exterior') || img.type === 'engine' || img.type === 'wheels' || img.type === 'trunk'
  ) || [];
  const interiorImages = vehicle.images?.filter(img => 
    img.type.startsWith('interior') || img.type === 'dashboard'
  ) || [];

  // Check availability when dates change
  useEffect(() => {
    if (dateRange?.from && dateRange?.to && !isSameDay(dateRange.from, dateRange.to)) {
      checkAvailability();
    } else {
      setPricing(null);
      setIsAvailable(true);
    }
  }, [dateRange]);

  const checkAvailability = async () => {
    if (!dateRange?.from || !dateRange?.to) return;
    setIsCheckingAvailability(true);
    try {
      const available = await checkVehicleAvailability(
        vehicle.id,
        format(dateRange.from, 'yyyy-MM-dd'),
        format(dateRange.to, 'yyyy-MM-dd')
      );
      setIsAvailable(available);
      
      if (available) {
        const pricingData = await getVehiclePricing(
          vehicle.id,
          format(dateRange.from, 'yyyy-MM-dd'),
          format(dateRange.to, 'yyyy-MM-dd')
        );
        // Calculate pricing using the daily rate and discounts
        const numberOfDays = Math.ceil(
          (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
        );
        const calculated = calculateVehiclePricing(
          vehicle.dailyRate,
          numberOfDays,
          vehicle.weeklyDiscountPercent,
          vehicle.monthlyDiscountPercent,
          vehicle.cleaningFee,
          vehicle.securityDeposit,
          0, // delivery fee - would calculate based on distance
          15 // platform fee percent - would get from host profile
        );
        setPricing(calculated);
      }
    } catch (error) {
      console.error('Availability check failed:', error);
      setIsAvailable(false);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleBook = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to book this vehicle', variant: 'destructive' });
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: 'Select dates', description: 'Please select your rental dates', variant: 'destructive' });
      return;
    }
    if (!isAvailable) {
      toast({ title: 'Not available', description: 'This vehicle is not available for the selected dates', variant: 'destructive' });
      return;
    }

    setIsBooking(true);
    try {
      const numberOfDays = Math.ceil(
        (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
      );

      const booking = await createVehicleBooking({
        vehicleId: vehicle.id,
        hostId: vehicle.hostId,
        renterId: user.id,
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
        startTime: '10:00',
        endTime: '10:00',
        dailyRate: vehicle.dailyRate,
        numberOfDays,
        subtotal: vehicle.dailyRate * numberOfDays,
        weeklyDiscount: numberOfDays >= 7 ? (vehicle.dailyRate * numberOfDays * vehicle.weeklyDiscountPercent / 100) : 0,
        monthlyDiscount: numberOfDays >= 28 ? (vehicle.dailyRate * numberOfDays * vehicle.monthlyDiscountPercent / 100) : 0,
        cleaningFee: vehicle.cleaningFee,
        securityDeposit: vehicle.securityDeposit,
        platformFeePercent: 15, // Would get from host profile
        platformFeeAmount: 0, // Would calculate
        hostEarnings: 0, // Would calculate
        totalAmount: pricing?.totalAmount || 0,
        currencyCode: 'USD',
        deliveryRequested: false,
        deliveryFee: 0,
      });

      toast({ title: 'Booking Request Sent!', description: 'The host will review and confirm your booking.' });
      setShowBookingDialog(false);
    } catch (error: any) {
      toast({ title: 'Booking Failed', description: error.message || 'Please try again', variant: 'destructive' });
    } finally {
      setIsBooking(false);
    }
  };

  const specs = getVehicleSpecs(vehicle);

  return (
    <div className="min-h-screen bg-background">
      {/* Image Gallery */}
      <div className="relative">
        <div className="aspect-video w-full overflow-hidden bg-muted">
          {exteriorImages[selectedImageIndex] ? (
            <Image
              src={exteriorImages[selectedImageIndex].url}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-8xl">🚗</span>
            </div>
          )}
        </div>

        {/* Image Thumbnails */}
        {(exteriorImages.length + interiorImages.length) > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {exteriorImages.map((img, idx) => (
              <button
                key={`ext-${idx}`}
                onClick={() => setSelectedImageIndex(idx)}
                className={cn(
                  'w-16 h-12 rounded overflow-hidden border-2 transition-all',
                  selectedImageIndex === idx && idx < exteriorImages.length
                    ? 'border-primary scale-105'
                    : 'border-transparent opacity-70 hover:opacity-100'
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
            {interiorImages.map((img, idx) => (
              <button
                key={`int-${idx}`}
                onClick={() => setSelectedImageIndex(exteriorImages.length + idx)}
                className={cn(
                  'w-16 h-12 rounded overflow-hidden border-2 transition-all',
                  selectedImageIndex === exteriorImages.length + idx
                    ? 'border-primary scale-105'
                    : 'border-transparent opacity-70 hover:opacity-100'
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {vehicle.isInstantBook && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              <Zap className="h-3 w-3" />
              Instant Book
            </Badge>
          )}
          {vehicle.hostProfiles?.isVerified && (
            <Badge variant="outline" className="gap-1 px-3 py-1 bg-background/90 backdrop-blur">
              <Shield className="h-3 w-3" />
              Verified Host
            </Badge>
          )}
        </div>

        {/* Favorite & Share */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button variant="default" size="icon" className="bg-white/90 backdrop-blur" onClick={() => setShowImageViewer(true)}>
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="default" size="icon" className="bg-white/90 backdrop-blur">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                <span>{vehicle.locationCity}, {vehicle.locationState}</span>
                <span>•</span>
                <span>{vehicle.hostProfiles?.companyName ? 'Company' : 'Individual'} Host</span>
                {vehicle.hostProfiles?.isVerified && (
                  <>
                    <span>•</span>
                    <Shield className="h-3.5 w-3.5 text-green-500" />
                  </>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              {vehicle.trim && <p className="text-lg text-muted-foreground">{vehicle.trim}</p>}
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-4">
              {vehicle.averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-bold">{vehicle.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({vehicle.reviewCount} reviews)</span>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">{vehicle.totalBookings} trips</span>
                <span className="flex items-center gap-1">Host: {vehicle.hostProfiles?.companyName || 'Individual'}</span>
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground whitespace-pre-wrap">{vehicle.description}</p>
              </CardContent>
            </Card>

            {/* Specs Tabs */}
            <Tabs defaultValue="specs" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="specs">Specifications</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="rules">House Rules</TabsTrigger>
              </TabsList>

              <TabsContent value="specs" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {specs.map(spec => (
                    <div key={spec.label} className="flex flex-col gap-1 p-4 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">{spec.label}</span>
                      <span className="font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="features" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {vehicle.features?.map(feature => (
                    <Badge key={feature} variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </Badge>
                  ))}
                </div>
                {(!vehicle.features || vehicle.features.length === 0) && (
                  <p className="text-muted-foreground">No features listed</p>
                )}
              </TabsContent>

              <TabsContent value="amenities" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {vehicle.amenities?.map(amenity => (
                    <Badge key={amenity} variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {amenity}
                    </Badge>
                  ))}
                </div>
                {(!vehicle.amenities || vehicle.amenities.length === 0) && (
                  <p className="text-muted-foreground">No amenities listed</p>
                )}
              </TabsContent>

              <TabsContent value="rules" className="mt-4">
                <div className="space-y-2">
                  {vehicle.rules?.map(rule => (
                    <div key={rule} className="flex items-center gap-2 text-sm">
                      <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
                {(!vehicle.rules || vehicle.rules.length === 0) && (
                  <p className="text-muted-foreground">No specific rules listed</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Host Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Host Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    {vehicle.hostProfiles?.companyName ? (
                      <span className="text-2xl font-bold text-primary">
                        {vehicle.hostProfiles.companyName.charAt(0)}
                      </span>
                    ) : (
                      <Users className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      {vehicle.hostProfiles?.companyName || 'Individual Host'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.hostProfiles?.hostType === 'individual' ? 'Individual Owner' : 
                       vehicle.hostProfiles?.hostType === 'company' ? 'Company' :
                       vehicle.hostProfiles?.hostType === 'dealership' ? 'Dealership' : 'Rental Company'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {vehicle.hostProfiles?.average_rating?.toFixed(1) || 'New'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {vehicle.hostProfiles?.total_vehicles || 1} vehicle(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {vehicle.hostProfiles?.total_bookings || 0} bookings
                      </span>
                    </div>
                  </div>
                </div>
                {vehicle.hostProfiles?.contactPersonName && (
                  <div className="mt-4 pt-4 border-t space-y-1">
                    <p className="text-sm font-medium">{vehicle.hostProfiles.contactPersonName}</p>
                    {vehicle.hostProfiles.contactPersonPhone && (
                      <p className="text-sm text-muted-foreground">{vehicle.hostProfiles.contactPersonPhone}</p>
                    )}
                    {vehicle.hostProfiles.contact_person_email && (
                      <p className="text-sm text-muted-foreground">{vehicle.hostProfiles.contact_person_email}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            {vehicle.reviewCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Reviews ({vehicle.reviewCount})</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Reviews would be loaded here */}
                    <p className="text-muted-foreground text-center py-8">Reviews will appear here after bookings are completed.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Booking Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Reserve this vehicle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* Date Picker */}
                <div>
                  <Label className="block mb-2">Trip Dates</Label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="Select dates"
                    minDate={new Date()}
                  />
                </div>

                {/* Pricing Breakdown */}
                {pricing && (
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>{pricing.numberOfDays} day(s) × {formatVehiclePrice(vehicle.dailyRate)}/day</span>
                      <span>{formatVehiclePrice(pricing.dailyRate * pricing.numberOfDays)}</span>
                    </div>
                    {pricing.weeklyDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Weekly discount ({vehicle.weeklyDiscountPercent}%)</span>
                        <span>-{formatVehiclePrice(pricing.weeklyDiscount)}</span>
                      </div>
                    )}
                    {pricing.monthlyDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Monthly discount ({vehicle.monthlyDiscountPercent}%)</span>
                        <span>-{formatVehiclePrice(pricing.monthlyDiscount)}</span>
                      </div>
                    )}
                    {pricing.cleaningFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Cleaning fee</span>
                        <span>{formatVehiclePrice(pricing.cleaningFee)}</span>
                      </div>
                    )}
                    {pricing.securityDeposit > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Security deposit (refundable)</span>
                        <span>{formatVehiclePrice(pricing.securityDeposit)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatVehiclePrice(pricing.totalAmount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Includes platform fee. Security deposit refunded after trip.
                    </p>
                  </div>
                )}

                {/* Availability Status */}
                {dateRange?.from && dateRange?.to && (
                  <div className={cn('p-3 rounded-lg text-center', isCheckingAvailability ? 'bg-muted' : isAvailable ? 'bg-green-50' : 'bg-red-50')}>
                    {isCheckingAvailability ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm">Checking availability...</span>
                      </div>
                    ) : isAvailable ? (
                      <div className="flex items-center justify-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Available for your dates</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-red-700">
                        <X className="h-5 w-5" />
                        <span className="text-sm font-medium">Not available for selected dates</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Book Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowBookingDialog(true)}
                  disabled={!dateRange?.from || !dateRange?.to || !isAvailable || isBooking || !user}
                >
                  {isBooking ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : user ? (
                    'Reserve Now'
                  ) : (
                    'Sign in to Book'
                  )}
                </Button>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
                  <div>
                    <Shield className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Insurance Included</p>
                  </div>
                  <div>
                    <Users className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">24/7 Support</p>
                  </div>
                  <div>
                    <Car className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Verified Vehicle</p>
                  </div>
                </div>

                {/* What's Included */}
                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-medium">What's included</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Basic insurance coverage</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> 24/7 roadside assistance</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Verified host & vehicle</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Secure payment processing</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <button
            onClick={() => setShowImageViewer(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative aspect-video">
            {exteriorImages[selectedImageIndex] && (
              <Image
                src={exteriorImages[selectedImageIndex].url}
                alt=""
                fill
                className="object-contain"
                priority
              />
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="icon" onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))} disabled={selectedImageIndex === 0}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex gap-1">
              {exteriorImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all',
                    selectedImageIndex === idx ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/50'
                  )}
                />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={() => setSelectedImageIndex(Math.min(exteriorImages.length - 1, selectedImageIndex + 1))} disabled={selectedImageIndex === exteriorImages.length - 1}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Confirmation Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {exteriorImages[0] && (
                <Image
                  src={exteriorImages[0].url}
                  alt=""
                  width={60}
                  height={45}
                  className="rounded object-cover"
                />
              )}
              <div>
                <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                <p className="text-sm text-muted-foreground">
                  {format(dateRange?.from!, 'MMM d')} - {format(dateRange?.to!, 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {pricing && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Vehicle rental ({pricing.numberOfDays} days)</span>
                  <span>{formatVehiclePrice(pricing.dailyRate * pricing.numberOfDays)}</span>
                </div>
                {pricing.weeklyDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Weekly discount</span>
                    <span>-{formatVehiclePrice(pricing.weeklyDiscount)}</span>
                  </div>
                )}
                {pricing.cleaningFee > 0 && (
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>{formatVehiclePrice(pricing.cleaningFee)}</span>
                  </div>
                )}
                {pricing.securityDeposit > 0 && (
                  <div className="flex justify-between">
                    <span>Security deposit (refundable)</span>
                    <span>{formatVehiclePrice(pricing.securityDeposit)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatVehiclePrice(pricing.totalAmount)}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              By confirming, you agree to the{' '}
              <Link href="/legal/vehicle-renter-agreement" className="underline hover:text-foreground">
                Vehicle Renter Agreement
              </Link>
              , including the security deposit and cancellation terms above.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowBookingDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleBook} disabled={isBooking}>
                {isBooking ? 'Confirming...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}