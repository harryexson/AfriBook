import React, { useState, useEffect } from "react";
import { MenuItem } from "@/entities/MenuItem";
import { Order } from "@/entities/Order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Minus, X, ShoppingBag, Zap, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuickOrderEntry({ open, onClose, onOrderCreated }) {
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Items, 2: Customer Info

  useEffect(() => {
    if (open) {
      loadMenuItems();
      // Reset form
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setSpecialRequests("");
      setSearchQuery("");
      setStep(1);
    }
  }, [open]);

  const loadMenuItems = async () => {
    try {
      const items = await MenuItem.list();
      setMenuItems(items.filter(item => item.available));
    } catch (error) {
      console.error("Error loading menu:", error);
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.keyword?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.menu_item_id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.menu_item_id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1
      }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(item => item.menu_item_id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.menu_item_id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.menu_item_id !== itemId);
    });
  };

  const deleteFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.menu_item_id !== itemId));
  };

  const getItemQuantity = (itemId) => {
    const item = cart.find(cartItem => cartItem.menu_item_id === itemId);
    return item ? item.quantity : 0;
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: cart,
        total_amount: totalAmount,
        status: "confirmed",
        payment_status: "pending",
        order_type: "web",
        special_requests: specialRequests
      };

      const newOrder = await Order.create(orderData);
      
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }

      onClose();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-600" />
            Quick Order Entry
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 1 ? (
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Menu Items */}
              <div className="col-span-2 flex flex-col">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Search menu items or type keyword (e.g., BURGER)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg"
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pr-2">
                  {filteredItems.map(item => {
                    const quantity = getItemQuantity(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          quantity > 0
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-emerald-300'
                        }`}
                        onClick={() => addToCart(item)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900">{item.name}</h3>
                            {item.keyword && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {item.keyword}
                              </Badge>
                            )}
                          </div>
                          <span className="text-lg font-bold text-emerald-600 ml-2">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        
                        {quantity > 0 && (
                          <div className="flex items-center justify-between mt-3 bg-white rounded-lg p-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromCart(item.id);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-bold text-lg">{quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(item);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Cart */}
              <div className="flex flex-col bg-slate-50 rounded-xl p-4">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Items ({cart.length})
                </h3>

                <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                  <AnimatePresence>
                    {cart.map(item => (
                      <motion.div
                        key={item.menu_item_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-3 rounded-lg flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-slate-600">
                            {item.quantity} x ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-600">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteFromCart(item.menu_item_id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    disabled={cart.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                  >
                    Continue to Customer Info
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customer-name">Customer Name *</Label>
                    <Input
                      id="customer-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-2"
                      autoFocus
                    />
                  </div>

                  <div>
                    <Label htmlFor="customer-phone">Phone Number (optional)</Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="special-requests">Special Requests (optional)</Label>
                    <Textarea
                      id="special-requests"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special instructions..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {cart.map(item => (
                      <div key={item.menu_item_id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-emerald-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Items
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !customerName.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    'Creating Order...'
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}