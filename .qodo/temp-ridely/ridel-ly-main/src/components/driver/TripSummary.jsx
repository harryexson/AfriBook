import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin,
  Clock,
  DollarSign,
  Star,
  Navigation,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function TripSummary({ ride, isOpen, onClose }) {
  const [rider, setRider] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (ride && isOpen) {
      loadRider();
      setHasSubmitted(!!ride.driver_rating);
      if (ride.driver_rating) {
        setRating(ride.driver_rating);
      }
    }
  }, [ride, isOpen]);

  const loadRider = async () => {
    if (ride?.rider_id) {
      try {
        const riderData = await base44.entities.User.get(ride.rider_id);
        setRider(riderData);
      } catch (error) {
        console.error('Error loading rider:', error);
      }
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.Ride.update(ride.id, {
        driver_rating: rating,
        driver_feedback: feedback
      });

      // Update rider's average rating
      const riderRides = await base44.entities.Ride.filter({
        rider_id: ride.rider_id,
        driver_rating: { $exists: true }
      });

      const totalRating = riderRides.reduce((sum, r) => sum + (r.driver_rating || 0), 0);
      const avgRating = totalRating / riderRides.length;

      await base44.entities.User.update(ride.rider_id, {
        average_rating: avgRating
      });

      toast.success('Rating submitted successfully!');
      setHasSubmitted(true);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ride) return null;

  const earnings = (ride.fare?.total_fare || 0) + (ride.fare?.tip_amount || 0);
  const duration = ride.duration_minutes || 0;
  const distance = ride.distance_km || 0;
  const hasSurge = ride.fare?.surge_multiplier > 1.0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Trip Complete! 🎉</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Earnings Highlight */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white text-center"
          >
            <p className="text-green-100 text-sm mb-2">You Earned</p>
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-8 h-8" />
              <p className="text-5xl font-bold">{earnings.toFixed(2)}</p>
            </div>
            {ride.fare?.tip_amount > 0 && (
              <p className="text-green-100 text-sm mt-2">
                Includes ${ride.fare.tip_amount.toFixed(2)} tip 🙏
              </p>
            )}
          </motion.div>

          {/* Trip Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <span className="font-semibold">{Math.round(duration)} min</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Navigation className="w-4 h-4" />
                  <span className="text-sm">Distance</span>
                </div>
                <span className="font-semibold">{distance.toFixed(1)} km</span>
              </div>

              {hasSurge && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Surge Pricing</span>
                  </div>
                  <span className="font-semibold text-orange-600">
                    {ride.fare.surge_multiplier.toFixed(1)}x
                  </span>
                </div>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-green-500 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Pickup</p>
                    <p className="text-sm">{ride.pickup_location?.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-red-500 mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Dropoff</p>
                  <p className="text-sm">{ride.destination?.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Section */}
          {!hasSubmitted ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">Rate Your Rider</h3>
                <p className="text-sm text-gray-600">How was {rider?.full_name}?</p>
              </div>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Any feedback about this trip? (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="resize-none"
              />

              <Button
                onClick={handleSubmitRating}
                disabled={isSubmitting || rating === 0}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <Award className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-green-800">Rating Submitted!</p>
              <p className="text-sm text-gray-600 mt-1">Thank you for your feedback</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            {hasSubmitted && (
              <Button
                onClick={onClose}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}