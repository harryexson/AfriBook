import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Restaurant } from "@/entities/Restaurant";
import { MenuItem } from "@/entities/MenuItem";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, Clock, Phone, ShoppingCart, 
  ArrowLeft, Info, MessageSquare, Users
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MenuItemCard from "../components/menu/MenuItemCard";
import CartSidebar from "../components/menu/CartSidebar";
import PromotionBanner from "../components/promotions/PromotionBanner";
import PhotoGallery from "../components/restaurant/PhotoGallery";
import ReviewsSection from "../components/restaurant/ReviewsSection";
import AboutSection from "../components/restaurant/AboutSection";

export default function MarketplaceRestaurant() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const restaurantId = searchParams.get('id');

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("menu");

  useEffect(() => {
    if (!restaurantId) return;
    loadRestaurantData();

    // Real-time sync for menu items
    const unsubscribeMenu = MenuItem.subscribe((event) => {
      if (event.data?.restaurant_id !== restaurantId) return;
      if (event.type === "create" && event.data?.available) {
        setMenuItems(prev => [...prev, event.data]);
      } else if (event.type === "update") {
        setMenuItems(prev => {
          const updated = prev.map(item => item.id === event.id ? { ...item, ...event.data } : item);
          return updated.filter(item => item.available);
        });
      } else if (event.type === "delete") {
        setMenuItems(prev => prev.filter(item => item.id !== event.id));
      }
    });

    // Real-time sync for restaurant info (hours, status, etc.)
    const unsubscribeRestaurant = Restaurant.subscribe((event) => {
      if (event.id === restaurantId && event.type === "update") {
        setRestaurant(prev => prev ? { ...prev, ...event.data } : prev);
      }
    });

    return () => {
      unsubscribeMenu();
      unsubscribeRestaurant();
    };
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    setIsLoading(true);
    try {
      const [restaurantData] = await Restaurant.filter({ id: restaurantId });
      if (restaurantData) {
        setRestaurant(restaurantData);
        
        // Load menu items for this restaurant
        const items = await MenuItem.filter({ restaurant_id: restaurantId, available: true });
        setMenuItems(items);
        
        // Load active promotions
        const { Promotion } = await import("@/entities/Promotion");
        const now = new Date();
        const allPromos = await Promotion.filter({ 
          restaurant_id: restaurantId,
          status: "active"
        });
        
        // Filter promotions by date/time
        const activePromos = allPromos.filter(promo => {
          // Check start/end dates
          if (promo.start_date && new Date(promo.start_date) > now) return false;
          if (promo.end_date && new Date(promo.end_date) < now) return false;
          
          // Check day of week
          if (promo.active_days && promo.active_days.length > 0) {
            const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            const today = dayNames[now.getDay()];
            if (!promo.active_days.includes(today)) return false;
          }
          
          // Check time of day
          if (promo.active_hours && promo.active_hours.start && promo.active_hours.end) {
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [startHour, startMin] = promo.active_hours.start.split(':').map(Number);
            const [endHour, endMin] = promo.active_hours.end.split(':').map(Number);
            const startTime = startHour * 60 + startMin;
            const endTime = endHour * 60 + endMin;
            if (currentTime < startTime || currentTime > endTime) return false;
          }
          
          // Check usage limit
          if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return false;
          
          return true;
        });
        
        // Show featured promotions first
        const sortedPromos = activePromos.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
        
        setPromotions(sortedPromos);
        
        // If no items found, try loading all items (for demo/development)
        if (items.length === 0) {
          console.warn(`No menu items found for restaurant ${restaurantId}`);
          const allItems = await MenuItem.list();
          console.log(`Total menu items in system: ${allItems.length}`);
          setMenuItems([]); // Keep empty to show proper message
        }
      }
    } catch (error) {
      console.error("Error loading restaurant:", error);
    }
    setIsLoading(false);
  };

  const categories = ["all", ...new Set(menuItems.map(item => item.category))];

  const filteredItems = menuItems.filter(item => 
    activeCategory === "all" || item.category === activeCategory
  );

  const addToCart = (menuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menu_item_id === menuItem.id);
      if (existing) {
        return prev.map(item =>
          item.menu_item_id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1
      }];
    });
  };

  const removeFromCart = (menuItemId) => {
    setCart(prev => {
      const existing = prev.find(item => item.menu_item_id === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.menu_item_id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.menu_item_id !== menuItemId);
    });
  };

  const deleteFromCart = (menuItemId) => {
    setCart(prev => prev.filter(item => item.menu_item_id !== menuItemId));
  };

  const getCartQuantity = (menuItemId) => {
    const item = cart.find(item => item.menu_item_id === menuItemId);
    return item ? item.quantity : 0;
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const commissionAmount = subtotal * (restaurant?.commission_rate || 0.125);
  const total = subtotal;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    navigate(createPageUrl("MarketplaceCheckout"), { 
      state: { 
        cart, 
        restaurant,
        subtotal,
        commissionAmount,
        total
      } 
    });
  };

  const estimatedReadyTime = new Date(Date.now() + (restaurant?.average_prep_time || 20) * 60000);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12">
          <p className="text-2xl font-bold text-slate-900 mb-4">Restaurant not found</p>
          <Button onClick={() => navigate(createPageUrl("Marketplace"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Restaurant Header */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-emerald-600 to-emerald-800">
        {restaurant.banner_url && (
          <img 
            src={restaurant.banner_url} 
            alt={restaurant.business_name}
            className="w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Marketplace"))}
          className="absolute top-4 left-4 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>

        <Button
          onClick={() => navigate(createPageUrl("CreateGroupOrder") + `?restaurantId=${restaurantId}`)}
          className="absolute top-4 right-4 bg-purple-600 hover:bg-purple-700 text-white shadow-lg gap-2"
        >
          <Users className="w-4 h-4" />
          Group Order
        </Button>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-7xl mx-auto flex items-end gap-3 sm:gap-6">
            {restaurant.logo_url && (
              <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-2xl border-4 border-white overflow-hidden flex-shrink-0">
                <img src={restaurant.logo_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-white pb-2">
              <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">{restaurant.business_name}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                  <span className="opacity-80">({restaurant.total_reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{restaurant.average_prep_time} min prep time</span>
                </div>
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:underline">
                    <Phone className="w-4 h-4" />
                    <span>{restaurant.phone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Pickup Order</strong> - Your order will be ready in approximately {restaurant.average_prep_time} minutes. 
            {restaurant.min_order_amount > 0 && ` Minimum order: $${restaurant.min_order_amount.toFixed(2)}`}
          </AlertDescription>
        </Alert>

        {/* SMS Ordering Info */}
        <Alert className="mb-6 bg-purple-50 border-purple-200">
          <MessageSquare className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <strong>Quick SMS Ordering:</strong> Text menu item keywords to order instantly! 
            Check menu items for SMS keywords.
          </AlertDescription>
        </Alert>

        {/* Active Promotions */}
        {promotions.length > 0 && (
          <PromotionBanner promotions={promotions} />
        )}

        {/* Main Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === "menu"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === "about"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === "photos"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === "reviews"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Reviews
            </button>
          </div>
        </div>

        {activeTab === "menu" && (
          <>
            {/* Menu Categories */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-200 -mx-4 px-4 py-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Menu</h2>
            {cart.length > 0 && (
              <Button
                onClick={() => setCartOpen(true)}
                className="relative bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart (${total.toFixed(2)})
                <span className="absolute -top-2 -right-2 bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {totalItems}
                </span>
              </Button>
            )}
          </div>

          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-full justify-start bg-slate-100 p-2 rounded-xl overflow-x-auto">
              {categories.map(cat => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold capitalize"
                >
                  {cat === "all" ? "All Items" : cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Menu Items */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              quantity={getCartQuantity(item.id)}
              onAdd={() => addToCart(item)}
              onRemove={() => removeFromCart(item.id)}
            />
          ))}
        </div>

        {filteredItems.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg mb-4">
              {menuItems.length === 0 
                ? "This restaurant hasn't added menu items yet" 
                : "No items in this category"}
            </p>
            {menuItems.length === 0 && (
              <p className="text-sm text-slate-400">
                Restaurant owners can add menu items in Restaurant Settings
              </p>
            )}
          </div>
        )}
          </>
        )}

        {activeTab === "about" && <AboutSection restaurant={restaurant} />}
        {activeTab === "photos" && <PhotoGallery restaurant={restaurant} menuItems={menuItems} />}
        {activeTab === "reviews" && <ReviewsSection restaurantId={restaurantId} />}
      </div>

      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onRemoveItem={deleteFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}