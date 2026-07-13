import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp, ThumbsDown, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const categories = [
  { key: 'driver_behavior', label: 'Driver Behavior', icon: '👤' },
  { key: 'vehicle_cleanliness', label: 'Vehicle Cleanliness', icon: '✨' },
  { key: 'ride_comfort', label: 'Ride Comfort', icon: '🪑' },
  { key: 'driving_quality', label: 'Driving Quality', icon: '🚗' },
  { key: 'route_efficiency', label: 'Route Efficiency', icon: '🗺️' }
];

const preferenceQuestions = [
  { key: 'music', label: 'Music preference followed?' },
  { key: 'temperature', label: 'Temperature was comfortable?' },
  { key: 'conversation', label: 'Conversation level respected?' }
];

export default function RideFeedbackDialog({ ride, driver, isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    overall_rating: 0,
    category_ratings: {},
    feedback_text: '',
    preferences_followed: {},
    would_recommend: null,
    tip_amount: 0
  });

  const handleStarClick = (category, rating) => {
    if (category === 'overall') {
      setFeedback(prev => ({ ...prev, overall_rating: rating }));
    } else {
      setFeedback(prev => ({
        ...prev,
        category_ratings: {
          ...prev.category_ratings,
          [category]: rating
        }
      }));
    }
  };

  const handlePreferenceToggle = (key, value) => {
    setFeedback(prev => ({
      ...prev,
      preferences_followed: {
        ...prev.preferences_followed,
        [key]: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (feedback.overall_rating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create feedback with AI analysis
      const result = await base44.functions.invoke('analyzeFeedback', {
        rideId: ride.id,
        driverId: driver.id,
        feedbackData: feedback
      });

      if (result.data?.success) {
        toast.success('Thank you for your feedback!');
        onClose();
      } else {
        toast.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ category, currentRating, size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-10 h-10'
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleStarClick(category, star)}
            className={`${sizeClasses[size]} transition-all hover:scale-110`}
          >
            <Star
              className={`w-full h-full ${
                star <= currentRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Rate Your Ride
          </DialogTitle>
          <DialogDescription>
            Help us improve by sharing your experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Overall Rating */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Driver Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {driver?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{driver?.full_name}</h3>
                    <p className="text-sm text-gray-600">
                      {driver?.driver_info?.vehicle_make} {driver?.driver_info?.vehicle_model}
                    </p>
                  </div>
                </div>

                {/* Overall Rating */}
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-semibold">How was your ride?</h3>
                  <div className="flex justify-center">
                    <StarRating
                      category="overall"
                      currentRating={feedback.overall_rating}
                      size="lg"
                    />
                  </div>
                  {feedback.overall_rating > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-gray-600"
                    >
                      {feedback.overall_rating === 5 && "Excellent! We're glad you had a great ride! ⭐"}
                      {feedback.overall_rating === 4 && "Great! Thanks for the positive feedback! 😊"}
                      {feedback.overall_rating === 3 && "Good! Let us know how we can improve. 👍"}
                      {feedback.overall_rating === 2 && "We're sorry to hear that. Please share more below. 😔"}
                      {feedback.overall_rating === 1 && "We apologize for the poor experience. Your feedback helps us improve. 🙏"}
                    </motion.p>
                  )}
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={feedback.overall_rating === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Step 2: Detailed Ratings */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="font-semibold text-lg">Rate specific aspects</h3>
                
                {categories.map((category) => (
                  <div key={category.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-medium">{category.label}</span>
                    </div>
                    <StarRating
                      category={category.key}
                      currentRating={feedback.category_ratings[category.key] || 0}
                      size="sm"
                    />
                  </div>
                ))}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Preferences & Written Feedback */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Preferences Check */}
                {ride?.ride_preferences && Object.keys(ride.ride_preferences).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Were your preferences followed?</h3>
                    {preferenceQuestions.map((pref) => (
                      <div key={pref.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">{pref.label}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreferenceToggle(pref.key, true)}
                            className={`p-2 rounded-lg transition-all ${
                              feedback.preferences_followed[pref.key] === true
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            <ThumbsUp className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handlePreferenceToggle(pref.key, false)}
                            className={`p-2 rounded-lg transition-all ${
                              feedback.preferences_followed[pref.key] === false
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            <ThumbsDown className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Written Feedback */}
                <div className="space-y-2">
                  <Label>Share more details (optional)</Label>
                  <Textarea
                    placeholder="What did you like? What could be improved?"
                    value={feedback.feedback_text}
                    onChange={(e) => setFeedback(prev => ({ ...prev, feedback_text: e.target.value }))}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">
                    {feedback.feedback_text.length}/500 characters
                  </p>
                </div>

                {/* Would Recommend */}
                <div className="space-y-2">
                  <Label>Would you recommend Ride-ly to friends?</Label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFeedback(prev => ({ ...prev, would_recommend: true }))}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        feedback.would_recommend === true
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <ThumbsUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <p className="text-sm font-medium">Yes</p>
                    </button>
                    <button
                      onClick={() => setFeedback(prev => ({ ...prev, would_recommend: false }))}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        feedback.would_recommend === false
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <ThumbsDown className="w-6 h-6 mx-auto mb-2 text-red-600" />
                      <p className="text-sm font-medium">No</p>
                    </button>
                  </div>
                </div>

                {/* Tip */}
                <div className="space-y-2">
                  <Label>Add a tip for your driver (optional)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 5, 10, 15].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setFeedback(prev => ({ ...prev, tip_amount: amount }))}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          feedback.tip_amount === amount
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <p className="text-lg font-bold">${amount}</p>
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    placeholder="Custom amount"
                    value={feedback.tip_amount || ''}
                    onChange={(e) => setFeedback(prev => ({ ...prev, tip_amount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.5"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    {isSubmitting ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}