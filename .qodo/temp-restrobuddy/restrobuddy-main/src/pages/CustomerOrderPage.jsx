import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Loader2, MapPin, Clock, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MenuItemCard from "@/components/menu/MenuItemCard";
import CartSidebar from "@/components/menu/CartSidebar";

export default function CustomerOrderPage() {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurant');
  
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantData();
    }
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      const restaurantData = await base44.entities.Restaurant.filter({ id: restaurantId });
      if (restaurantData.length > 0) {
        setRestaurant(restaurantData[0]);
        const items = await base44.entities.MenuItem.filter({ 
          restaurant_id: restaurantId,
          available: true 
        });
        setMenuItems(items);
      }
    } catch (error) {
      console.error("Failed to load restaurant:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
      setCart(cart.map(i => 
        i.id === item.id ? {...i, quantity: i.quantity + 1} : i
      ));
    } else {
      setCart([...cart, {...item, quantity: 1}]);
    }
    setCartOpen(true);
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity === 0) {
      setCart(cart.filter(i => i.id !== itemId));
    } else {
      setCart(cart.map(i => i.id === itemId ? {...i, quantity} : i));
    }
  };

  const categories = ["all", ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Restaurant Not Found</h2>
        <p className="text-slate-600">The restaurant you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Restaurant Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-start gap-4">
            {restaurant.logo_url && (
              <img 
                src={restaurant.logo_url} 
                alt={restaurant.business_name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{restaurant.business_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                {restaurant.cuisine_type?.length > 0 && (
                  <span>{restaurant.cuisine_type.join(', ')}</span>
                )}
                {restaurant.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{restaurant.rating.toFixed(1)}</span>
                  </div>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {restaurant.average_prep_time} min
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {restaurant.address?.city}
                </span>
              </div>
            </div>
            <Button 
              onClick={() => setCartOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 relative"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cartItemCount > 0 && (
                <Badge className="ml-2 bg-white text-emerald-600">{cartItemCount}</Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat === "all" ? "All Items" : cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-slate-600">No items available in this category</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map(item => (
              <MenuItemCard 
                key={item.id}
                item={item}
                onAddToCart={() => addToCart(item)}
                currency={restaurant.currency}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        restaurant={restaurant}
        total={cartTotal}
      />

      {/* Mobile Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 right-4 sm:hidden">
          <Button 
            onClick={() => setCartOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg rounded-full w-16 h-16"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 p-0 flex items-center justify-center text-xs">
                {cartItemCount}
              </Badge>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}