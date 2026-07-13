import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MenuItem } from "@/entities/MenuItem";
import { Restaurant } from "@/entities/Restaurant";
import { Order } from "@/entities/Order";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Plus, Clock, Search, Check } from "lucide-react";
import { toast } from "sonner";
import CartDrawer from "@/components/ordering/CartDrawer";
import ItemCustomizationModal from "@/components/ordering/ItemCustomizationModal";
import CheckoutModal from "@/components/ordering/CheckoutModal";
import { Input } from "@/components/ui/input";

const categories = [
  { value: "all", label: "All Items" },
  { value: "appetizers", label: "Appetizers" },
  { value: "entrees", label: "Entrées" },
  { value: "sides", label: "Sides" },
  { value: "desserts", label: "Desserts" },
  { value: "beverages", label: "Beverages" }
];

export default function PublicOrder() {
  const location = useLocation();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [customizingItem, setCustomizingItem] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get restaurant from URL params or slug
      const params = new URLSearchParams(location.search);
      const restaurantId = params.get('restaurant_id');
      const slug = params.get('slug');

      let rest;
      if (restaurantId) {
        const restaurants = await Restaurant.filter({ id: restaurantId });
        rest = restaurants[0];
      } else if (slug) {
        const restaurants = await Restaurant.filter({ slug });
        rest = restaurants[0];
      }

      if (rest) {
        setRestaurant(rest);
        const items = await MenuItem.filter({ restaurant_id: rest.id });
        const availableItems = items.filter(item => item.available);
        setMenuItems(availableItems.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const addToCart = (item, customizations = {}) => {
    const cartItem = {
      id: Date.now().toString(),
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      quantity: 1,
      customizations,
      modifiers: customizations.modifiers || [],
      special_instructions: customizations.special_instructions || ""
    };

    // Calculate price with modifiers
    const modifierTotal = cartItem.modifiers.reduce((sum, mod) => sum + (mod.price_adjustment || 0), 0);
    cartItem.total_price = (item.price + modifierTotal);

    setCart([...cart, cartItem]);
    toast.success("Added to cart");
    setCustomizingItem(null);
  };

  const updateCartItem = (itemId, updates) => {
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
    toast.success("Removed from cart");
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.total_price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setShowCheckout(true);
  };

  const handleOrderComplete = async (orderDetails) => {
    try {
      const order = await Order.create({
        customer_name: orderDetails.name,
        customer_phone: orderDetails.phone,
        customer_email: orderDetails.email,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          special_instructions: item.special_instructions,
          modifiers: item.modifiers
        })),
        total_amount: getCartTotal(),
        status: 'pending',
        payment_status: 'pending',
        order_type: 'web',
        delivery_type: orderDetails.delivery_type,
        delivery_address: orderDetails.delivery_address,
        special_requests: orderDetails.notes
      });

      setCart([]);
      setShowCheckout(false);
      toast.success("Order placed successfully!");
      
      // Show order confirmation
      setTimeout(() => {
        window.location.href = `/order-status?order_id=${order.id}`;
      }, 1500);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    }
  };

  const filteredItems = menuItems
    .filter(item => selectedCategory === "all" || item.category === selectedCategory)
    .filter(item => 
      searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">Restaurant not found. Please check the URL.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              {restaurant.logo_url && (
                <img src={restaurant.logo_url} alt={restaurant.business_name} className="h-12 w-auto mb-2" />
              )}
              <h1 className="text-3xl font-bold text-slate-900">{restaurant.business_name}</h1>
              <p className="text-slate-600">{restaurant.description}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {restaurant.cuisine_type?.map(cuisine => (
                  <Badge key={cuisine} variant="outline">{cuisine}</Badge>
                ))}
                <Badge variant="outline">{restaurant.price_range}</Badge>
              </div>
            </div>
            <Button
              onClick={() => setShowCart(true)}
              className="bg-emerald-600 hover:bg-emerald-700 relative"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {getCartItemCount()}
                </span>
              )}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="bg-white border-b sticky top-[180px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="bg-transparent border-0 w-full justify-start overflow-x-auto">
              {categories.map(cat => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} className="hover:shadow-xl transition-all overflow-hidden group">
              {item.image_url && (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {item.tags && item.tags.length > 0 && (
                    <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                      {item.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} className="bg-white/90 text-slate-900 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-bold text-lg text-slate-900 mb-1">{item.name}</h3>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.description}</p>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-emerald-600">${item.price.toFixed(2)}</span>
                  {item.preparation_time && (
                    <div className="flex items-center text-sm text-slate-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {item.preparation_time} min
                    </div>
                  )}
                </div>

                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-xs text-slate-500 mb-3">
                    {item.modifiers.length} customization{item.modifiers.length !== 1 ? 's' : ''} available
                  </p>
                )}

                <Button
                  onClick={() => setCustomizingItem(item)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No items found</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button (Mobile) */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-6 right-6 lg:hidden z-50">
          <Button
            onClick={() => setShowCart(true)}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-2xl rounded-full w-16 h-16 p-0 relative"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {getCartItemCount()}
            </span>
          </Button>
        </div>
      )}

      {/* Modals */}
      {customizingItem && (
        <ItemCustomizationModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={addToCart}
        />
      )}

      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        onUpdateItem={updateCartItem}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
        total={getCartTotal()}
      />

      {showCheckout && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          cart={cart}
          total={getCartTotal()}
          restaurant={restaurant}
          onComplete={handleOrderComplete}
        />
      )}
    </div>
  );
}