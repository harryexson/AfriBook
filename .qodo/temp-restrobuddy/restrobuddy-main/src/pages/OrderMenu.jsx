import React, { useState, useEffect } from "react";
import { MenuItem } from "@/entities/MenuItem";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Download, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import MenuItemCardEnhanced from "@/components/menu/MenuItemCardEnhanced";
import MenuImportDialog from "@/components/menu/MenuImportDialog";
import CartSidebar from "../components/menu/CartSidebar";
import QuickOrderEntry from "../components/staff/QuickOrderEntry";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";

const categories = [
  { value: "all", label: "All Items" },
  { value: "appetizers", label: "Appetizers" },
  { value: "entrees", label: "Entrées" },
  { value: "sides", label: "Sides" },
  { value: "desserts", label: "Desserts" },
  { value: "beverages", label: "Beverages" }
];

export default function OrderMenu() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStaff, setIsStaff] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadMenu = async () => {
      if (!mounted) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if user is staff - wrap in try/catch to handle aborted requests
        try {
          const user = await base44.auth.me();
          if (!mounted) return;
          if (user.role === 'admin') {
            setIsStaff(true);
          }
        } catch (e) {
          // Ignore auth errors, continue loading menu
          if (!mounted) return;
        }

        const items = await MenuItem.list();
        if (!mounted) return;
        setMenuItems(items);
      } catch (error) {
        if (!mounted) return;
        console.error("Error loading menu:", error);
        
        if (error.name !== 'CanceledError' && error.message !== 'Request aborted') {
          setError("Unable to load menu. Please try again.");
        }
        setMenuItems([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadMenu();

    return () => {
      mounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const items = await MenuItem.list();
      setMenuItems(items);
    } catch (error) {
      console.error("Error refreshing menu:", error);
      if (error.name !== 'CanceledError' && error.message !== 'Request aborted') {
        setError("Failed to refresh menu");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    navigate(createPageUrl("Checkout"), { state: { cart } });
  };

  const handleQuickOrderCreated = (order) => {
    alert(`Order #${order.id.slice(-6)} created successfully!`);
    navigate(createPageUrl("KitchenDisplay"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Our Menu</h1>
              <p className="text-slate-600">Handcrafted with care, served with passion</p>
            </div>
            <div className="flex gap-3">
              {isStaff && (
                <>
                  <Button
                    onClick={() => setImportDialogOpen(true)}
                    variant="outline"
                    className="rounded-full px-6 py-6"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Import Menu
                  </Button>
                  <Button
                    onClick={() => setQuickOrderOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Quick Order
                  </Button>
                </>
              )}
              <Button
                onClick={() => setCartOpen(true)}
                className="relative bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-full border-2 border-slate-200 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 flex items-center justify-between">
              <span>{error}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                className="ml-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="w-full justify-start bg-white border border-slate-200 p-2 rounded-full shadow-md overflow-x-auto flex-wrap h-auto">
            {categories.map(cat => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="rounded-full px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold transition-all duration-300"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <MenuItemCardEnhanced
                key={item.id}
                item={item}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No items found</p>
          </div>
        )}
      </div>

      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onRemoveItem={deleteFromCart}
        onCheckout={handleCheckout}
      />

      <QuickOrderEntry
        open={quickOrderOpen}
        onClose={() => setQuickOrderOpen(false)}
        onOrderCreated={handleQuickOrderCreated}
      />

      <MenuImportDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        restaurantId={restaurantId}
        onSuccess={(data) => {
          alert(`✅ Successfully imported ${data.imported} menu items!`);
          handleRefresh();
        }}
      />
    </div>
  );
}