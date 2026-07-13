import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, Flag, MessageCircle, User, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function ReviewCard({ review, onRespond, onFlag, onMarkHelpful, showActions = false, isStaff = false }) {
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) return;
    
    setIsSaving(true);
    try {
      await onRespond(review.id, responseText);
      setIsResponding(false);
      setResponseText("");
    } catch (error) {
      console.error("Error submitting response:", error);
    }
    setIsSaving(false);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const statusColor = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    hidden: "bg-slate-100 text-slate-800",
    flagged: "bg-red-100 text-red-800"
  };

  return (
    <Card className={`border-2 ${review.status === 'flagged' ? 'border-red-300' : ''}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
              {review.customer_name?.charAt(0) || <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">{review.customer_name}</p>
                {review.verified_purchase && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {renderStars(review.rating)}
                <span className="text-sm text-slate-500">
                  {format(new Date(review.created_date), 'MMM d, yyyy')}
                </span>
              </div>
              
              {/* Additional Ratings */}
              {(review.food_rating || review.service_rating || review.value_rating) && (
                <div className="flex gap-4 mt-2 text-xs">
                  {review.food_rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-600">Food:</span>
                      {renderStars(review.food_rating)}
                    </div>
                  )}
                  {review.service_rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-600">Service:</span>
                      {renderStars(review.service_rating)}
                    </div>
                  )}
                  {review.value_rating && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-600">Value:</span>
                      {renderStars(review.value_rating)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {isStaff && (
            <Badge className={statusColor[review.status]}>
              {review.status}
            </Badge>
          )}
        </div>

        {/* Review Text */}
        <div className="mb-4">
          <p className="text-slate-700 leading-relaxed">{review.review_text}</p>
          
          {/* Menu Item Name if available */}
          {review.menu_item_name && (
            <p className="text-sm text-emerald-600 font-semibold mt-2">
              About: {review.menu_item_name}
            </p>
          )}
          
          {review.restaurant_name && (
            <p className="text-sm text-slate-600 mt-1">
              {review.restaurant_name}
            </p>
          )}
        </div>

        {/* Review Images */}
        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {review.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Review image ${idx + 1}`}
                className="h-32 w-32 object-cover rounded-lg border-2 border-slate-200"
              />
            ))}
          </div>
        )}

        {/* Restaurant Response */}
        {review.response && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900">Restaurant Response</span>
              {review.response_date && (
                <span className="text-xs text-blue-700">
                  • {format(new Date(review.response_date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            <p className="text-slate-700">{review.response}</p>
            {review.response_by && (
              <p className="text-xs text-slate-600 mt-2">- {review.response_by}</p>
            )}
          </div>
        )}

        {/* Response Form */}
        {isStaff && isResponding && !review.response && (
          <div className="bg-slate-50 p-4 rounded-lg mb-4">
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              Your Response
            </label>
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Thank the customer and address their feedback..."
              className="mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitResponse}
                disabled={isSaving || !responseText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? 'Posting...' : 'Post Response'}
              </Button>
              <Button
                onClick={() => {
                  setIsResponding(false);
                  setResponseText("");
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
          {showActions && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkHelpful && onMarkHelpful(review.id)}
                className="text-slate-600 hover:text-emerald-600"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Helpful ({review.helpful_count || 0})
              </Button>

              {!isStaff && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onFlag && onFlag(review.id)}
                  className="text-slate-600 hover:text-red-600"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </Button>
              )}
            </>
          )}

          {isStaff && !review.response && !isResponding && (
            <Button
              size="sm"
              onClick={() => setIsResponding(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Respond
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}