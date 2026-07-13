import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RestaurantReview } from "@/entities/RestaurantReview";
import { MenuItemReview } from "@/entities/MenuItemReview";
import { Restaurant } from "@/entities/Restaurant";
import { MenuItem } from "@/entities/MenuItem";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle, Star, ShoppingBag } from "lucide-react";
import { createPageUrl } from "@/utils";
import ReviewForm from "../components/reviews/ReviewForm";

export default function LeaveReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, orderType = "marketplace" } = location.state || {};
  
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("restaurant");
  const [submitted, setSubmitted] = useState(false);
  const [restaurantReviewSubmitted, setRestaurantReviewSubmitted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (!order) {
        navigate(createPageUrl("MyOrders"));
        return;
      }

      // Load restaurant info
      if (order.restaurant_id) {
        const restaurants = await Restaurant.filter({ id: order.restaurant_id });
        if (restaurants.length > 0) {
          setRestaurant(restaurants[0]);
        }
      }

      // Load menu item details
      if (order.items && order.items.length > 0) {
        const itemIds = order.items.map(item => item.menu_item_id).filter(Boolean);
        if (itemIds.length > 0) {
          const allMenuItems = await MenuItem.list();
          const orderMenuItems = allMenuItems.filter(item => itemIds.includes(item.id));
          setMenuItems(orderMenuItems);
        }
      }

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleRestaurantReviewSubmit = async (reviewData) => {
    try {
      await RestaurantReview.create({
        restaurant_id: order.restaurant_id,
        restaurant_name: order.restaurant_name || restaurant?.business_name,
        customer_email: user.email,
        customer_name: user.full_name,
        order_id: order.id,
        rating: reviewData.rating,
        food_rating: reviewData.food_rating,
        service_rating: reviewData.service_rating,
        value_rating: reviewData.value_rating,
        review_text: reviewData.review_text,
        images: reviewData.images,
        verified_purchase: true,
        status: "active"
      });

      setRestaurantReviewSubmitted(true);
      
      // If no items to review, mark as fully submitted
      if (menuItems.length === 0) {
        setSubmitted(true);
      } else {
        // Switch to items tab
        setActiveTab("items");
      }
    } catch (error) {
      console.error("Error submitting restaurant review:", error);
      throw error;
    }
  };

  const handleMenuItemReviewSubmit = async (menuItem, reviewData) => {
    try {
      await MenuItemReview.create({
        menu_item_id: menuItem.id,
        menu_item_name: menuItem.name,
        restaurant_id: order.restaurant_id,
        order_id: order.id,
        customer_email: user.email,
        customer_name: user.full_name,
        rating: reviewData.rating,
        review_text: reviewData.review_text,
        images: reviewData.images,
        verified_purchase: true,
        status: "active"
      });

      // Mark this item as reviewed
      setMenuItems(prev => prev.filter(item => item.id !== menuItem.id));
      
      // If no more items to review, mark as submitted
      if (menuItems.length === 1) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error submitting menu item review:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-900 mb-4">No order found</p>
          <Button onClick={() => navigate(createPageUrl("MyOrders"))}>
            View My Orders
          </Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-0 shadow-2xl">
          <CardContent className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Thank You for Your Review!
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Your feedback helps others make informed decisions and helps restaurants improve their service.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate(createPageUrl("MyOrders"))}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                View My Orders
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("Marketplace"))}
                variant="outline"
              >
                Browse Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Leave a Review</h1>
          <p className="text-slate-600">Share your experience with order #{order.id.slice(-6)}</p>
          {restaurant && (
            <p className="text-lg font-semibold text-emerald-600 mt-2">
              {restaurant.business_name}
            </p>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white border border-slate-200 p-2 rounded-xl shadow-md">
            <TabsTrigger 
              value="restaurant" 
              className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              disabled={restaurantReviewSubmitted}
            >
              <Star className="w-4 h-4 mr-2" />
              Restaurant
              {restaurantReviewSubmitted && (
                <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
              )}
            </TabsTrigger>
            {menuItems.length > 0 && (
              <TabsTrigger 
                value="items" 
                className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Menu Items ({menuItems.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="restaurant">
            {!restaurantReviewSubmitted ? (
              <ReviewForm
                type="restaurant"
                restaurantName={order.restaurant_name || restaurant?.business_name}
                orderId={order.id}
                onSubmit={handleRestaurantReviewSubmit}
              />
            ) : (
              <Card className="border-0 shadow-xl">
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <p className="text-xl font-bold text-slate-900 mb-2">Restaurant Review Submitted!</p>
                  <p className="text-slate-600">
                    {menuItems.length > 0 
                      ? "Would you like to review individual menu items?" 
                      : "Thank you for your feedback!"}
                  </p>
                  {menuItems.length > 0 && (
                    <Button
                      onClick={() => setActiveTab("items")}
                      className="mt-6 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Review Menu Items
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {menuItems.length > 0 && (
            <TabsContent value="items">
              <div className="space-y-6">
                {menuItems.map(item => (
                  <ReviewForm
                    key={item.id}
                    type="menu_item"
                    itemName={item.name}
                    restaurantName={order.restaurant_name || restaurant?.business_name}
                    orderId={order.id}
                    onSubmit={(reviewData) => handleMenuItemReviewSubmit(item, reviewData)}
                  />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}