import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ReviewForm({ 
  type = "restaurant", // "restaurant" or "menu_item"
  onSubmit, 
  onCancel,
  itemName,
  restaurantName,
  orderId
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (images.length >= 5) break;
      
      try {
        // Upload to storage
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setImages(prev => [...prev, file_url]);
      } catch (error) {
        console.error("Failed to upload image:", error);
        alert("Failed to upload one or more images");
      }
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    if (!reviewText.trim()) {
      alert("Please write a review");
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        rating,
        review_text: reviewText,
        images,
        order_id: orderId
      };

      if (type === "restaurant") {
        reviewData.food_rating = foodRating || rating;
        reviewData.service_rating = serviceRating || rating;
        reviewData.value_rating = valueRating || rating;
      }

      await onSubmit(reviewData);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
    setIsSubmitting(false);
  };

  const renderStarInput = (currentRating, setRatingFunc, label) => {
    return (
      <div className="space-y-2">
        {label && <Label className="text-sm font-semibold">{label}</Label>}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRatingFunc(star)}
              onMouseEnter={() => label === undefined && setHoverRating(star)}
              onMouseLeave={() => label === undefined && setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (label === undefined ? (hoverRating || currentRating) : currentRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
          {currentRating > 0 && (
            <span className="text-sm font-semibold text-slate-700 ml-2">
              {currentRating} {currentRating === 1 ? 'star' : 'stars'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">
          Write a Review
        </CardTitle>
        {itemName && (
          <p className="text-sm text-slate-600 mt-2">
            For: <span className="font-semibold">{itemName}</span>
          </p>
        )}
        {restaurantName && (
          <p className="text-sm text-slate-600">
            At: <span className="font-semibold">{restaurantName}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Rating */}
          <div>
            <Label className="text-base font-bold mb-3 block">Overall Rating *</Label>
            {renderStarInput(rating, setRating)}
          </div>

          {/* Detailed Ratings for Restaurant Reviews */}
          {type === "restaurant" && (
            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
              <div>{renderStarInput(foodRating, setFoodRating, "Food Quality")}</div>
              <div>{renderStarInput(serviceRating, setServiceRating, "Service")}</div>
              <div>{renderStarInput(valueRating, setValueRating, "Value")}</div>
            </div>
          )}

          {/* Review Text */}
          <div>
            <Label htmlFor="review_text" className="text-base font-bold mb-2 block">
              Your Review *
            </Label>
            <Textarea
              id="review_text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with others..."
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              {reviewText.length}/500 characters
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="text-base font-bold mb-2 block">
              Add Photos (Optional)
            </Label>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    className="h-24 w-24 object-cover rounded-lg border-2 border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
               <label className={`h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                 isUploadingImages 
                   ? 'border-slate-300 bg-slate-50 opacity-50' 
                   : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50'
               }`}>
                 <input
                   type="file"
                   accept="image/*"
                   multiple
                   onChange={handleImageUpload}
                   className="hidden"
                   disabled={isUploadingImages}
                 />
                 {isUploadingImages ? (
                   <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                 ) : (
                   <ImageIcon className="w-8 h-8 text-slate-400" />
                 )}
               </label>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Upload up to 5 photos
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingImages || rating === 0 || !reviewText.trim()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="px-8"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}