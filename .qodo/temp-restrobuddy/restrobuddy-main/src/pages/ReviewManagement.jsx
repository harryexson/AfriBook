import React, { useState, useEffect } from "react";
import { RestaurantReview } from "@/entities/RestaurantReview";
import { MenuItemReview } from "@/entities/MenuItemReview";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Star, TrendingUp, MessageCircle, Flag, Search, Eye, EyeOff, AlertCircle, Sparkles
} from "lucide-react";
import ReviewCard from "../components/reviews/ReviewCard";
import ReviewTrendsAnalytics from "../components/reviews/ReviewTrendsAnalytics";
import ReviewResponseModal from "../components/reviews/ReviewResponseModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ReviewManagement() {
  const [restaurantReviews, setRestaurantReviews] = useState([]);
  const [menuItemReviews, setMenuItemReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [activeTab, setActiveTab] = useState("restaurant");
  const [user, setUser] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [analyzingReviewId, setAnalyzingReviewId] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [restReviews, itemReviews] = await Promise.all([
        RestaurantReview.list("-created_date", 200),
        MenuItemReview.list("-created_date", 200)
      ]);

      setRestaurantReviews(restReviews);
      setMenuItemReviews(itemReviews);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
    setIsLoading(false);
  };

  const handleRespond = async (reviewId, responseText, type = "restaurant") => {
    setIsSubmittingResponse(true);
    try {
      const updateData = {
        response: responseText,
        response_date: new Date().toISOString(),
        response_by: user.full_name
      };

      if (type === "restaurant") {
        await RestaurantReview.update(reviewId, updateData);
        setRestaurantReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, ...updateData } : r
        ));
      } else {
        await MenuItemReview.update(reviewId, updateData);
        setMenuItemReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, ...updateData } : r
        ));
      }
      
      setIsResponseModalOpen(false);
      setSelectedReview(null);
      alert("Response submitted successfully!");
    } catch (error) {
      console.error("Error responding to review:", error);
      alert("Failed to submit response");
      throw error;
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleAnalyzeSentiment = async (review, type = "restaurant") => {
    setAnalyzingReviewId(review.id);
    try {
      const response = await base44.functions.invoke('analyzeReviewSentiment', {
        reviewId: review.id,
        reviewText: review.review_text,
        restaurantId: review.restaurant_id,
        type
      });

      if (type === "restaurant") {
        setRestaurantReviews(prev => prev.map(r => 
          r.id === review.id ? { ...r, ...response.analysis } : r
        ));
      } else {
        setMenuItemReviews(prev => prev.map(r => 
          r.id === review.id ? { ...r, ...response.analysis } : r
        ));
      }
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      alert("Failed to analyze sentiment");
    } finally {
      setAnalyzingReviewId(null);
    }
  };

  const handleChangeStatus = async (reviewId, newStatus, type = "restaurant") => {
    try {
      if (type === "restaurant") {
        await RestaurantReview.update(reviewId, { status: newStatus });
        setRestaurantReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, status: newStatus } : r
        ));
      } else {
        await MenuItemReview.update(reviewId, { status: newStatus });
        setMenuItemReviews(prev => prev.map(r => 
          r.id === reviewId ? { ...r, status: newStatus } : r
        ));
      }
    } catch (error) {
      console.error("Error updating review status:", error);
    }
  };

  const filterReviews = (reviews) => {
    return reviews.filter(review => {
      const matchesSearch = 
        review.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.review_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.menu_item_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === "all" || review.status === filterStatus;
      
      const matchesRating = filterRating === "all" || 
        (filterRating === "5" && review.rating === 5) ||
        (filterRating === "4" && review.rating === 4) ||
        (filterRating === "3" && review.rating === 3) ||
        (filterRating === "low" && review.rating <= 2);

      return matchesSearch && matchesStatus && matchesRating;
    });
  };

  const filteredRestaurantReviews = filterReviews(restaurantReviews);
  const filteredMenuItemReviews = filterReviews(menuItemReviews);

  // Calculate stats
  const totalRestaurantReviews = restaurantReviews.length;
  const avgRestaurantRating = totalRestaurantReviews > 0
    ? (restaurantReviews.reduce((sum, r) => sum + r.rating, 0) / totalRestaurantReviews).toFixed(1)
    : 0;
  const pendingRestaurantReviews = restaurantReviews.filter(r => !r.response).length;
  const flaggedRestaurantReviews = restaurantReviews.filter(r => r.status === 'flagged').length;

  const totalMenuItemReviews = menuItemReviews.length;
  const avgMenuItemRating = totalMenuItemReviews > 0
    ? (menuItemReviews.reduce((sum, r) => sum + r.rating, 0) / totalMenuItemReviews).toFixed(1)
    : 0;
  const pendingMenuItemReviews = menuItemReviews.filter(r => !r.response).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Review Management</h1>
          <p className="text-slate-600">Monitor and respond to customer feedback</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5" />
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{avgRestaurantRating}</p>
              <p className="text-sm text-amber-100 mt-2">{totalRestaurantReviews} restaurant reviews</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Pending Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{pendingRestaurantReviews + pendingMenuItemReviews}</p>
              <p className="text-sm text-blue-100 mt-2">Need attention</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Item Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalMenuItemReviews}</p>
              <p className="text-sm text-purple-100 mt-2">Avg: {avgMenuItemRating} stars</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Flagged
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{flaggedRestaurantReviews}</p>
              <p className="text-sm text-red-100 mt-2">Require review</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="low">2 Stars or Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Tab */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-2 rounded-xl shadow-md">
            <TabsTrigger 
              value="restaurant" 
              className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <Star className="w-4 h-4 mr-2" />
              Restaurant Reviews ({filteredRestaurantReviews.length})
            </TabsTrigger>
            <TabsTrigger 
              value="menu_items" 
              className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Menu Item Reviews ({filteredMenuItemReviews.length})
            </TabsTrigger>
            <TabsTrigger 
              value="trends" 
              className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Trends & Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="mt-6">
            <ReviewTrendsAnalytics reviews={restaurantReviews.filter(r => r.sentiment)} />
          </TabsContent>
        </Tabs>

        {/* Reviews Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-2 rounded-xl shadow-md">
            <TabsTrigger 
              value="restaurant" 
              className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <Star className="w-4 h-4 mr-2" />
              Restaurant Reviews ({filteredRestaurantReviews.length})
            </TabsTrigger>
            <TabsTrigger 
              value="menu_items" 
              className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Menu Item Reviews ({filteredMenuItemReviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurant" className="mt-6">
            {filteredRestaurantReviews.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-slate-900 mb-2">No reviews found</p>
                  <p className="text-slate-600">
                    {searchQuery || filterStatus !== "all" || filterRating !== "all"
                      ? "Try adjusting your filters"
                      : "Restaurant reviews will appear here"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredRestaurantReviews.map(review => (
                  <div key={review.id} className="relative">
                    <ReviewCard
                      review={review}
                      onRespond={(id, text) => {
                        setSelectedReview(review);
                        setIsResponseModalOpen(true);
                      }}
                      isStaff={true}
                      showActions={true}
                    />
                    <div className="flex gap-2 mt-2">
                      {!review.sentiment && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalyzeSentiment(review, "restaurant")}
                          disabled={analyzingReviewId === review.id}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {analyzingReviewId === review.id ? "Analyzing..." : "Analyze"}
                        </Button>
                      )}
                      {review.sentiment && (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          review.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                          review.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {review.sentiment}
                        </span>
                      )}
                      {review.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(review.id, "hidden", "restaurant")}
                        >
                          <EyeOff className="w-4 h-4 mr-2" />
                          Hide
                        </Button>
                      )}
                      {review.status === 'hidden' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(review.id, "active", "restaurant")}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Show
                        </Button>
                      )}
                      {review.status !== 'flagged' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(review.id, "flagged", "restaurant")}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Flag
                        </Button>
                      )}
                      {review.status === 'flagged' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(review.id, "active", "restaurant")}
                          className="text-green-600 hover:text-green-700"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Unflag
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="menu_items" className="mt-6">
            {filteredMenuItemReviews.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-slate-900 mb-2">No reviews found</p>
                  <p className="text-slate-600">
                    {searchQuery || filterStatus !== "all" || filterRating !== "all"
                      ? "Try adjusting your filters"
                      : "Menu item reviews will appear here"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredMenuItemReviews.map(review => (
                  <div key={review.id} className="relative">
                    <ReviewCard
                      review={review}
                      onRespond={(id, text) => {
                        setSelectedReview(review);
                        setIsResponseModalOpen(true);
                      }}
                      isStaff={true}
                      showActions={true}
                    />
                    <div className="flex gap-2 mt-2">
                      {!review.sentiment && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalyzeSentiment(review, "menu_item")}
                          disabled={analyzingReviewId === review.id}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {analyzingReviewId === review.id ? "Analyzing..." : "Analyze"}
                        </Button>
                      )}
                      {review.sentiment && (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          review.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                          review.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {review.sentiment}
                        </span>
                      )}
                      {review.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(review.id, "hidden", "menu_item")}
                        >
                          <EyeOff className="w-4 h-4 mr-2" />
                          Hide
                        </Button>
                      )}
                      {review.status === 'hidden' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(review.id, "active", "menu_item")}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Show
                        </Button>
                      )}
                      {review.status !== 'flagged' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(review.id, "flagged", "menu_item")}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          Flag
                        </Button>
                      )}
                      {review.status === 'flagged' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(review.id, "active", "menu_item")}
                          className="text-green-600 hover:text-green-700"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Unflag
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Response Modal */}
        <ReviewResponseModal
          isOpen={isResponseModalOpen}
          onClose={() => setIsResponseModalOpen(false)}
          review={selectedReview}
          onSubmit={async (responseText) => {
            const type = selectedReview.menu_item_id ? "menu_item" : "restaurant";
            await handleRespond(selectedReview.id, responseText, type);
          }}
          isSubmitting={isSubmittingResponse}
        />
      </div>
    </div>
  );
}