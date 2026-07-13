import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  Download, 
  Mail, 
  MapPin, 
  Clock, 
  Car,
  DollarSign,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function RideReceiptCard({ ride, driver }) {
  const [sending, setSending] = React.useState(false);

  const handleEmailReceipt = async () => {
    setSending(true);
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
      toast.error('Failed to send receipt');
    } finally {
      setSending(false);
    }
  };

  if (!ride) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Ride Receipt
          </CardTitle>
          <Badge variant="outline" className="bg-white/10 text-white border-white/30">
            {ride.status === 'completed' ? 'PAID' : ride.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Date & Time */}
        <div className="flex items-center gap-3 text-gray-600">
          <Calendar className="w-5 h-5" />
          <div>
            <p className="font-medium text-gray-900">
              {format(new Date(ride.created_date), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm">
              {format(new Date(ride.created_date), 'h:mm a')}
              {ride.completion_time && ` - ${format(new Date(ride.completion_time), 'h:mm a')}`}
            </p>
          </div>
        </div>

        {/* Route */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5" />
            <div>
              <p className="text-xs text-gray-500">PICKUP</p>
              <p className="text-gray-900">{ride.pickup_location?.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5" />
            <div>
              <p className="text-xs text-gray-500">DROPOFF</p>
              <p className="text-gray-900">{ride.destination?.address}</p>
            </div>
          </div>
        </div>

        {/* Trip Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500">DISTANCE</p>
            <p className="font-bold text-gray-900">{ride.distance_km?.toFixed(1) || '-'} km</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-xs text-gray-500">DURATION</p>
            <p className="font-bold text-gray-900">{ride.duration_minutes?.toFixed(0) || '-'} min</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">RIDE TYPE</p>
            <p className="font-bold text-gray-900 capitalize">{ride.ride_type}</p>
          </div>
        </div>

        {/* Driver Info */}
        {driver && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {driver.full_name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{driver.full_name}</p>
              <p className="text-sm text-gray-600">
                {driver.driver_info?.vehicle_make} {driver.driver_info?.vehicle_model} • {driver.driver_info?.license_plate}
              </p>
            </div>
          </div>
        )}

        {/* Fare Breakdown */}
        {ride.fare && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base fare</span>
              <span>${ride.fare.base_fare?.toFixed(2) || '0.00'}</span>
            </div>
            {ride.fare.distance_fare > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Distance</span>
                <span>${ride.fare.distance_fare.toFixed(2)}</span>
              </div>
            )}
            {ride.fare.time_fare > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Time</span>
                <span>${ride.fare.time_fare.toFixed(2)}</span>
              </div>
            )}
            {ride.fare.surge_multiplier > 1 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Surge ({ride.fare.surge_multiplier}x)</span>
                <span>+${((ride.fare.total_fare / ride.fare.surge_multiplier) * (ride.fare.surge_multiplier - 1)).toFixed(2)}</span>
              </div>
            )}
            {ride.fare.platform_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service fee</span>
                <span>${ride.fare.platform_fee.toFixed(2)}</span>
              </div>
            )}
            {ride.fare.tip_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Tip</span>
                <span>+${ride.fare.tip_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t font-bold text-lg">
              <span>Total</span>
              <span>${((ride.fare.total_fare || 0) + (ride.fare.tip_amount || 0)).toFixed(2)}</span>
            </div>
            {ride.fare.payment_method && (
              <p className="text-xs text-gray-500 text-right">
                Paid via {ride.fare.payment_method}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleEmailReceipt}
            disabled={sending}
            className="flex-1"
          >
            <Mail className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Email Receipt'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}