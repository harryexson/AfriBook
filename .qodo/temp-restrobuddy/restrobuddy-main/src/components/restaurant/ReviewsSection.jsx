import React, { useState, useEffect } from "react";
import { RestaurantReview } from "@/entities/RestaurantReview";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";

export default function ReviewsSection({ restaurantId }) {
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [restaurantId, sortBy]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      let allReviews = await RestaurantReview.filter({ 
        restaurant_id: restaurantId,
        status: "active" 
      });

      // Sort reviews
      allReviews.sort((a, b) => {
        switch (sortBy) {
          case "recent":
            return new Date(b.created_date) - new Date(a.created_date);
          case "highest":
            return b.rating - a.rating;
          case "lowest":
            return a.rating - b.rating;
          case "helpful":
            return (b.helpful_count || 0) - (a.helpful_count || 0);
          default:
            return 0;
        }
      });

      setReviews(allReviews);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
    setIsLoading(false);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <Card className="border-0 shadow-xl p-6">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-600" />
              Customer Reviews
            </h3>
            <div className="flex items-center gap-3 mt-2">
              <div className="text-4xl font-bold">{avgRating}</div>
              {renderStars(parseFloat(avgRating))}
              <span className="text-slate-600">({reviews.length} reviews)</span>
            </div>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
              <SelectItem value="lowest">Lowest Rating</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rating breakdown */}
        <div className="space-y-2 mb-6">
          {[5, 4, 3, 2, 1].map(star => {
            const count = reviews.filter(r => r.rating === star).length;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm w-8">{star} ★</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-slate-600 w-12">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-10 h-10 bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {review.customer_name?.charAt(0) || "?"}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{review.customer_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        {review.verified_purchase && (
                          <Badge className="text-xs bg-green-100 text-green-700">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-slate-500">
                      {new Date(review.created_date).toLocaleDateString()}
                    </span>
                  </div>

                  {review.review_text && (
                    <p className="text-slate-700 mb-3">{review.review_text}</p>
                  )}

                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt=""
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    {review.food_rating && (
                      <span className="text-slate-600">Food: {review.food_rating}★</span>
                    )}
                    {review.service_rating && (
                      <span className="text-slate-600">Service: {review.service_rating}★</span>
                    )}
                    {review.value_rating && (
                      <span className="text-slate-600">Value: {review.value_rating}★</span>
                    )}
                  </div>

                  {review.response && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-semibold text-slate-900 mb-1">
                        Response from {review.response_by || "Restaurant"}
                      </p>
                      <p className="text-sm text-slate-700">{review.response}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(review.response_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <Button variant="ghost" size="sm" className="mt-2 text-slate-600">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Helpful ({review.helpful_count || 0})
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}