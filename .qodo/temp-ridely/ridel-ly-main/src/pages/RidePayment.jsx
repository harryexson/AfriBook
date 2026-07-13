import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  MapPin, 
  Clock,
  DollarSign,
  CheckCircle,
  Car,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

export default function RidePayment() {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadRideData = React.useCallback(async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const currentRide = await base44.entities.Ride.get(rideId);
      
      if (currentRide) {
        setRide(currentRide);
        
        // Check if payment already exists
        const existingPayments = await base44.entities.Payment.filter({ ride_id: rideId });
        if (existingPayments.length > 0 || currentRide.fare?.paid) {
          setPaymentComplete(true);
        }
      }
    } catch (error) {
      console.error('Error loading ride data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    loadRideData();
  }, [loadRideData]); // Depend on the memoized function

  const processPayment = async () => {
    setIsProcessing(true);
    try {
      const result = await base44.functions.invoke('createStripeCheckout', {
        rideId: ride.id
      });

      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ride Not Found</h2>
            <p className="text-gray-600">The requested ride could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your ride has been paid for successfully. Thank you for using RideShare!
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Paid</span>
                <span className="font-bold text-xl text-gray-900">
                  ${ride.fare.total_fare.toFixed(2)}
                </span>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              View Ride History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">Review your ride details and complete payment</p>
        </div>

        {/* Ride Summary */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Ride Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-green-100 text-green-800 capitalize">
                {ride.status}
              </Badge>
              <span className="text-sm text-gray-500 capitalize">
                {ride.ride_type} ride
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pickup</p>
                  <p className="text-gray-900">{ride.pickup_location?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Destination</p>
                  <p className="text-gray-900">{ride.destination?.address}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              {ride.distance_km && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{ride.distance_km.toFixed(1)} km</span>
                </div>
              )}
              {ride.duration_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{Math.round(ride.duration_minutes)} min</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Base Fare</span>
                <span>${ride.fare.base_fare?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Distance ({ride.distance_km?.toFixed(1)} km)</span>
                <span>${ride.fare.distance_fare?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Time ({Math.round(ride.duration_minutes || 0)} min)</span>
                <span>${ride.fare.time_fare?.toFixed(2) || '0.00'}</span>
              </div>
              {ride.fare.surge_multiplier > 1 && (
                <div className="flex justify-between text-orange-600">
                  <span>Surge ({ride.fare.surge_multiplier}x)</span>
                  <span>Applied</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${ride.fare.total_fare.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-gray-400" />
              <div>
                <p className="font-medium">Credit Card ****1234</p>
                <p className="text-sm text-gray-500">Expires 12/26</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Button
          onClick={processPayment}
          disabled={isProcessing}
          className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Redirecting to checkout...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay ${ride.fare.total_fare.toFixed(2)}
            </>
          )}
        </Button>

        <div className="text-center text-sm text-gray-500">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>
      </div>
    </div>
  );
}