import React, { useState, useEffect } from "react";
import { MenuItem } from "@/entities/MenuItem";
import { Order } from "@/entities/Order";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Plus, Minus, Home, User, LogOut, History, Star, Printer, Mail, MessageSquare, ArrowRight, Phone, CreditCard, Smartphone, QrCode, Users, DollarSign, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ReceiptPreview from "../components/receipts/ReceiptPreview";
import StripePaymentElement from "../components/payments/StripePaymentElement";
import QRCodePayment from "../components/payments/QRCodePayment";
import SplitPaymentDialog from "../components/payments/SplitPaymentDialog";

const categories = [
  { value: "all", label: "All Items" },
  { value: "appetizers", label: "Appetizers" },
  { value: "entrees", label: "Entrées" },
  { value: "sides", label: "Sides" },
  { value: "desserts", label: "Desserts" },
  { value: "beverages", label: "Beverages" }
];

export default function KioskMode() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loggedInCustomer, setLoggedInCustomer] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("counter"); // counter, card, mobile, qr, split
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginMethod, setLoginMethod] = useState("phone"); // phone or email
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState(null);
  // New state variables for receipt handling
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [receiptEmail, setReceiptEmail] = useState("");
  const [sendingReceipt, setSendingReceipt] = useState(false);
  // Payment state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [showSplitPayment, setShowSplitPayment] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        resetKiosk();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  useEffect(() => {
    if (loggedInCustomer) {
      loadOrderHistory();
    }
  }, [loggedInCustomer]);

  const loadMenu = async () => {
    setIsLoading(true);
    try {
      const items = await MenuItem.filter({ available: true });
      setMenuItems(items);
    } catch (error) {
      console.error("Error loading menu:", error);
      try {
        const items = await MenuItem.list();
        setMenuItems(items.filter(item => item.available !== false));
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
      }
    }
    setIsLoading(false);
  };

  const loadOrderHistory = async () => {
    if (!loggedInCustomer) return;
    try {
      const orders = await Order.filter(
        { customer_phone: loggedInCustomer.phone },
        "-created_date",
        10
      );
      setOrderHistory(orders);
    } catch (error) {
      console.error("Error loading order history:", error);
    }
  };

  // Auto-lookup customer when phone/email changes
  useEffect(() => {
    const lookupCustomer = async () => {
      const searchValue = loginMethod === "phone" ? customerPhone : customerEmail;
      if (!searchValue || searchValue.length < 5) {
        setFoundCustomer(null);
        return;
      }

      setIsLookingUp(true);
      try {
        let members = [];
        if (loginMethod === "phone") {
          members = await LoyaltyMember.filter({ phone: searchValue });
        } else {
          members = await LoyaltyMember.filter({ email: searchValue });
        }

        if (members.length > 0) {
          setFoundCustomer(members[0]);
          setCustomerName(members[0].customer_name);
        } else {
          setFoundCustomer(null);
        }
      } catch (error) {
        console.error("Error looking up customer:", error);
        setFoundCustomer(null);
      }
      setIsLookingUp(false);
    };

    const debounceTimer = setTimeout(lookupCustomer, 500);
    return () => clearTimeout(debounceTimer);
  }, [customerPhone, customerEmail, loginMethod]);

  const handleCustomerLogin = async () => {
    const searchValue = loginMethod === "phone" ? customerPhone : customerEmail;
    if (!searchValue) return;
    
    try {
      if (foundCustomer) {
        // Existing customer found
        setLoggedInCustomer(foundCustomer);
        setCustomerName(foundCustomer.customer_name);
        setCustomerPhone(foundCustomer.phone || customerPhone);
        if (foundCustomer.email) setReceiptEmail(foundCustomer.email);
        setShowCustomerLogin(false);
        setFoundCustomer(null);
      } else {
        // Create new loyalty member
        const newMemberData = {
          customer_name: customerName || "Guest",
          phone: loginMethod === "phone" ? customerPhone : "",
          email: loginMethod === "email" ? customerEmail : "",
          points_balance: 0,
          tier: "bronze",
          lifetime_spend: 0,
          visit_count: 0
        };

        const newMember = await LoyaltyMember.create(newMemberData);
        setLoggedInCustomer(newMember);
        if (loginMethod === "email") {
          setReceiptEmail(customerEmail);
        }
        setShowCustomerLogin(false);
      }
    } catch (error) {
      console.error("Error with customer login:", error);
      alert("Error accessing account. You can continue as guest.");
      setShowCustomerLogin(false);
    }
  };

  const handleReorder = (previousOrder) => {
    // Reload cart with previous order items (with current prices)
    const updatedCart = previousOrder.items.map(item => {
      const currentMenuItem = menuItems.find(m => m.id === item.menu_item_id);
      return {
        menu_item_id: item.menu_item_id,
        name: item.name,
        price: currentMenuItem ? currentMenuItem.price : item.price, // Use current price
        quantity: item.quantity
      };
    });
    setCart(updatedCart);
    setShowOrderHistory(false);
  };

  const resetKiosk = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setLoggedInCustomer(null);
    setOrderHistory([]);
    setShowCheckout(false);
    setShowSuccess(false);
    setActiveCategory("all");
    setPaymentMethod("counter");
    setCompletedOrder(null);
    setShowReceiptOptions(false);
    setReceiptEmail("");
    setFoundCustomer(null);
    setLoginMethod("phone");
  };

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

  const getCartQuantity = (menuItemId) => {
    const item = cart.find(item => item.menu_item_id === menuItemId);
    return item ? item.quantity : 0;
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (!customerName || !customerPhone) return;

    // For card/mobile/QR payments, show payment dialog first
    if (['card', 'mobile', 'qr'].includes(paymentMethod)) {
      setShowCheckout(false);
      
      if (paymentMethod === 'qr') {
        // Create order first for QR code
        const orderData = {
          customer_name: customerName,
          customer_phone: customerPhone,
          items: cart,
          total_amount: total,
          status: "pending",
          payment_status: "pending",
          order_type: "kiosk",
        };
        const newOrder = await Order.create(orderData);
        setCompletedOrder(newOrder);
        setShowPaymentDialog(true);
      } else {
        // Generate payment intent for card/mobile
        setIsProcessing(true);
        try {
          const response = await base44.functions.invoke('createPaymentIntent', {
            amount: total,
            customerEmail: receiptEmail || customerEmail,
            customerName,
            orderId: Date.now().toString(),
          });
          
          if (response.data?.clientSecret) {
            setClientSecret(response.data.clientSecret);
            setShowPaymentDialog(true);
          }
        } catch (error) {
          console.error('Payment intent error:', error);
          alert('Failed to initialize payment. Please try again.');
        }
        setIsProcessing(false);
      }
      return;
    }

    // For split payment
    if (paymentMethod === 'split') {
      setShowCheckout(false);
      setShowSplitPayment(true);
      return;
    }

    // For counter payment (original flow)
    setIsProcessing(true);

    try {
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: cart,
        total_amount: total,
        status: "confirmed",
        payment_status: "pending",
        order_type: "kiosk",
      };

      const newOrder = await Order.create(orderData);

      // Update loyalty member if logged in
      if (loggedInCustomer) {
        const pointsEarned = Math.floor(total);
        await LoyaltyMember.update(loggedInCustomer.id, {
          points_balance: loggedInCustomer.points_balance + pointsEarned,
          lifetime_spend: (loggedInCustomer.lifetime_spend || 0) + total,
          visit_count: (loggedInCustomer.visit_count || 0) + 1,
          last_visit_date: new Date().toISOString().split('T')[0]
        });
      }
      
      setCompletedOrder(newOrder);
      setShowCheckout(false);
      setShowReceiptOptions(true);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to place order. Please contact staff for assistance.");
    }
    
    setIsProcessing(false);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    // Create order after successful payment
    const orderData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      items: cart,
      total_amount: total,
      status: "confirmed",
      payment_status: "completed",
      order_type: "kiosk",
      payment_transaction_id: paymentIntent.id,
    };

    const newOrder = await Order.create(orderData);

    // Update loyalty
    if (loggedInCustomer) {
      const pointsEarned = Math.floor(total);
      await LoyaltyMember.update(loggedInCustomer.id, {
        points_balance: loggedInCustomer.points_balance + pointsEarned,
        lifetime_spend: (loggedInCustomer.lifetime_spend || 0) + total,
        visit_count: (loggedInCustomer.visit_count || 0) + 1,
        last_visit_date: new Date().toISOString().split('T')[0]
      });
    }

    setCompletedOrder(newOrder);
    setShowPaymentDialog(false);
    setShowReceiptOptions(true);
  };

  const handleSplitPaymentComplete = async (payments) => {
    // Create order after split payment
    const orderData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      items: cart,
      total_amount: total,
      status: "confirmed",
      payment_status: "completed",
      order_type: "kiosk",
      payment_transaction_id: payments.map(p => `${p.method}-${p.amount}`).join(', '),
    };

    const newOrder = await Order.create(orderData);

    if (loggedInCustomer) {
      const pointsEarned = Math.floor(total);
      await LoyaltyMember.update(loggedInCustomer.id, {
        points_balance: loggedInCustomer.points_balance + pointsEarned,
        lifetime_spend: (loggedInCustomer.lifetime_spend || 0) + total,
        visit_count: (loggedInCustomer.visit_count || 0) + 1,
        last_visit_date: new Date().toISOString().split('T')[0]
      });
    }

    setCompletedOrder(newOrder);
    setShowSplitPayment(false);
    setShowReceiptOptions(true);
  };

  const handlePrintReceipt = async () => {
    if (!completedOrder) return;

    try {
      // Assuming 'base44' is globally available or imported if using a specific framework/library
      // For a basic browser print, you can use window.print().
      // For actual POS printer integration, this would involve a backend service call.
      const response = await base44.functions.invoke('printReceipt', {
        order: completedOrder,
        printerType: 'pos'
      });

      if (response?.data?.success) {
        alert('Receipt sent to printer! (Demo mode - configure printer in production)');
        // For demonstration, we can trigger browser print:
        window.print();
      } else {
        alert('Failed to send print request. Please try again or ask staff for assistance.');
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Print error. Please try again or ask staff for assistance.');
    }
  };

  const handleEmailReceipt = async () => {
    if (!completedOrder || !receiptEmail) return;

    setSendingReceipt(true);

    try {
      const response = await base44.functions.invoke('sendReceiptEmail', {
        order: completedOrder,
        customerEmail: receiptEmail
      });

      if (response?.data?.success) {
        alert(`Receipt sent to ${receiptEmail}!`);
        setReceiptEmail(""); // Clear email after sending
      } else {
        alert('Failed to send email receipt. Please try again.');
      }
    } catch (error) {
      console.error('Email error:', error);
      alert('Failed to send email receipt. Please try again.');
    }

    setSendingReceipt(false);
  };

  const handleSmsReceipt = async () => {
    if (!completedOrder || !completedOrder.customer_phone) return;

    try {
      const response = await base44.functions.invoke('sendSms', {
        to: completedOrder.customer_phone,
        message: `Your Gastronomy receipt:\nOrder #${completedOrder.id.slice(-6)}\nTotal: $${(completedOrder.total_amount * 1.08).toFixed(2)}\nThank you!` // Example tax calculation
      });

      if (response?.data?.success) {
        alert('Receipt sent via SMS!');
      } else {
        alert('Failed to send SMS receipt. Please try again.');
      }
    } catch (error) {
      console.error('SMS error:', error);
      alert('Failed to send SMS receipt. Please try again.');
    }
  };

  const handleFinishOrder = () => {
    setShowReceiptOptions(false);
    setShowSuccess(true); // Now proceed to the success screen
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-[#047857] text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e0344f6fce6eca73088ca1/51cbc3e9d_file_0000000081ac61f596211266b0c51fb41.png"
              alt="RESTROBUDDY"
              className="w-16 h-16 rounded-2xl shadow-xl"
            />
            <div>
              <h1 className="text-3xl font-bold">RESTROBUDDY Kiosk</h1>
              <p className="text-emerald-300">Touch to order</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loggedInCustomer ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowOrderHistory(true)}
                  className="border-2 border-white/20 text-white hover:bg-white/10 px-6 py-6 rounded-2xl"
                >
                  <History className="w-5 h-5 mr-2" />
                  Order History
                </Button>
                <div className="bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6" />
                    <div>
                      <p className="font-semibold">{loggedInCustomer.customer_name}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-300">{loggedInCustomer.points_balance} points</span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={resetKiosk}
                      className="ml-2"
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Button
                onClick={() => setShowCustomerLogin(true)}
                className="bg-white text-slate-900 hover:bg-slate-100 px-6 py-6 rounded-2xl shadow-xl font-semibold"
              >
                <User className="w-5 h-5 mr-2" />
                Sign In / Sign Up
              </Button>
            )}

            {cart.length > 0 && (
              <Button
                onClick={() => setShowCheckout(true)}
                className="relative bg-[#10b981] hover:bg-[#059669] text-white text-xl px-10 py-8 rounded-2xl shadow-2xl"
              >
                <ShoppingCart className="w-7 h-7 mr-3" />
                Checkout (${total.toFixed(2)})
                <span className="absolute -top-3 -right-3 bg-amber-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                  {totalItems}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full bg-black/30 backdrop-blur-xl p-3 rounded-3xl border border-white/10 grid grid-cols-6 gap-3 h-auto">
            {categories.map(cat => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="rounded-2xl px-6 py-4 text-lg font-semibold data-[state=active]:bg-[#10b981] data-[state=active]:text-white transition-all duration-300"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-white/10 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white text-2xl mb-4">No items available</p>
            <p className="text-emerald-300">Please contact staff for assistance</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {filteredItems.map(item => {
              const quantity = getCartQuantity(item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:bg-white/20 transition-all duration-300 overflow-hidden h-full">
                    <div className="relative h-48">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center">
                          <span className="text-7xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                      <p className="text-emerald-200 text-sm mb-4 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-emerald-400">
                          ${item.price.toFixed(2)}
                        </span>
                        
                        {quantity > 0 ? (
                          <div className="flex items-center gap-3 bg-[#10b981]/20 rounded-full px-3 py-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
                            >
                              <Minus className="w-6 h-6" />
                            </Button>
                            <span className="font-bold text-2xl text-white w-12 text-center">
                              {quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => addToCart(item)}
                              className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
                            >
                              <Plus className="w-6 h-6" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addToCart(item)}
                            className="bg-[#10b981] hover:bg-[#059669] text-white text-lg px-8 py-6 rounded-full shadow-lg"
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Login Dialog */}
      <Dialog open={showCustomerLogin} onOpenChange={setShowCustomerLogin}>
        <DialogContent className="max-w-lg bg-slate-900 text-white border-emerald-500/50">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center">Welcome Back!</DialogTitle>
            <p className="text-center text-emerald-300 mt-2">Sign in to earn rewards and track orders</p>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Login Method Toggle */}
            <div className="grid grid-cols-2 gap-3 bg-white/10 p-2 rounded-2xl">
              <Button
                onClick={() => setLoginMethod("phone")}
                className={`py-6 rounded-xl text-lg ${loginMethod === "phone" ? "bg-emerald-600" : "bg-transparent hover:bg-white/10"}`}
              >
                <Phone className="w-5 h-5 mr-2" />
                Phone
              </Button>
              <Button
                onClick={() => setLoginMethod("email")}
                className={`py-6 rounded-xl text-lg ${loginMethod === "email" ? "bg-emerald-600" : "bg-transparent hover:bg-white/10"}`}
              >
                <Mail className="w-5 h-5 mr-2" />
                Email
              </Button>
            </div>

            {loginMethod === "phone" ? (
              <div>
                <Label className="text-lg mb-2 block">Phone Number</Label>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="h-16 text-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <Label className="text-lg mb-2 block">Email Address</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="h-16 text-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                  autoFocus
                />
              </div>
            )}

            {(customerPhone || customerEmail) && !isLookingUp && !foundCustomer && (
              <div>
                <Label className="text-lg mb-2 block">Your Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-16 text-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                />
              </div>
            )}

            {isLookingUp && (
              <div className="flex items-center justify-center py-4">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-white/70">Looking up your account...</span>
              </div>
            )}

            {foundCustomer && (
              <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{foundCustomer.customer_name}</p>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300">{foundCustomer.points_balance} points</span>
                      <Badge className="bg-amber-500/30 text-amber-200 capitalize ml-2">{foundCustomer.tier}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleCustomerLogin}
              disabled={isLookingUp || (loginMethod === "phone" ? !customerPhone : !customerEmail)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xl py-8 rounded-xl"
            >
              {foundCustomer ? "Continue as " + foundCustomer.customer_name : "Sign In / Create Account"}
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCustomerLogin(false);
                  setFoundCustomer(null);
                  setCustomerEmail("");
                }}
                className="text-white/70 text-lg"
              >
                Continue as Guest
              </Button>
            </div>

            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Star className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-200">Earn Rewards!</p>
                  <p className="text-sm text-amber-200/80">Sign in to earn 1 point per $1 spent. Redeem points for free items!</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order History Dialog */}
      <Dialog open={showOrderHistory} onOpenChange={setShowOrderHistory}>
        <DialogContent className="max-w-3xl bg-slate-900 text-white border-emerald-500/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Your Order History</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {orderHistory.length === 0 ? (
              <p className="text-center text-white/70 py-8">No previous orders found</p>
            ) : (
              orderHistory.map(order => (
                <Card key={order.id} className="bg-white/10 border-white/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-lg">
                          {new Date(order.created_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-white/70">
                          {order.items.length} items - ${order.total_amount.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleReorder(order)}
                        className="bg-[#10b981] hover:bg-[#059669]"
                      >
                        Reorder
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-white/80">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-4xl bg-slate-900 text-white border-emerald-500/50">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">Complete Your Order</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-8 mt-6">
            <div>
              <h3 className="text-xl font-bold mb-4">Your Order</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
                    <div>
                      <p className="font-semibold text-lg">{item.name}</p>
                      <p className="text-emerald-300">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-xl text-emerald-400">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">Total</span>
                  <span className="text-4xl font-bold text-emerald-400">
                    ${total.toFixed(2)}
                  </span>
                </div>
                {loggedInCustomer && (
                  <div className="mt-4 bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
                    <p className="text-amber-200 text-sm">
                      <Star className="w-4 h-4 inline mr-1" />
                      You'll earn <strong>{Math.floor(total)} points</strong> with this order!
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Customer Information</h3>
              <div className="space-y-6">
                {!loggedInCustomer && (
                  <>
                    <div>
                      <Label className="text-lg mb-2 block">Name</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        className="h-14 text-lg bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-lg mb-2 block">Phone Number</Label>
                      <Input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="h-14 text-lg bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label className="text-lg mb-4 block">Payment Method</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={paymentMethod === "counter" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("counter")}
                      className="h-20 text-base flex flex-col gap-1"
                    >
                      <DollarSign className="w-6 h-6" />
                      Counter
                    </Button>
                    <Button
                      variant={paymentMethod === "card" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("card")}
                      className="h-20 text-base flex flex-col gap-1"
                    >
                      <CreditCard className="w-6 h-6" />
                      Card
                    </Button>
                    <Button
                      variant={paymentMethod === "mobile" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("mobile")}
                      className="h-20 text-base flex flex-col gap-1"
                    >
                      <Smartphone className="w-6 h-6" />
                      Mobile Pay
                    </Button>
                    <Button
                      variant={paymentMethod === "qr" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("qr")}
                      className="h-20 text-base flex flex-col gap-1"
                    >
                      <QrCode className="w-6 h-6" />
                      QR Code
                    </Button>
                    <Button
                      variant={paymentMethod === "split" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("split")}
                      className="h-20 text-base flex flex-col gap-1 col-span-2"
                    >
                      <Users className="w-6 h-6" />
                      Split Payment
                    </Button>
                  </div>
                  {paymentMethod === "mobile" && (
                    <p className="text-sm text-white/70 mt-2">Supports Apple Pay, Google Pay</p>
                  )}
                  {paymentMethod === "split" && (
                    <p className="text-sm text-white/70 mt-2">Pay with multiple methods</p>
                  )}
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing || (!loggedInCustomer && (!customerName || !customerPhone))}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white text-xl py-8 rounded-2xl"
                >
                  {isProcessing ? "Processing..." : 
                   paymentMethod === "counter" ? "Place Order - Pay at Counter" :
                   paymentMethod === "split" ? "Continue to Split Payment" :
                   `Pay $${total.toFixed(2)} Now`}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Options Dialog */}
      <Dialog open={showReceiptOptions} onOpenChange={setShowReceiptOptions}>
        <DialogContent className="max-w-4xl bg-slate-900 text-white border-emerald-500/50">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">Order Placed Successfully!</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Receipt Preview */}
            <div>
              <h3 className="text-xl font-bold mb-4">Your Receipt</h3>
              <div className="bg-white rounded-xl overflow-hidden">
                {completedOrder && <ReceiptPreview order={completedOrder} />}
              </div>
            </div>

            {/* Receipt Options */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4">Get Your Receipt</h3>
                <p className="text-white/70 mb-6">
                  Choose how you'd like to receive your receipt:
                </p>
              </div>

              {/* Print Physical Receipt */}
              <Button
                onClick={handlePrintReceipt}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white text-lg py-6 rounded-xl flex items-center justify-center gap-3"
              >
                <Printer className="w-6 h-6" />
                Print Physical Receipt
              </Button>

              {/* Email Receipt */}
              <div className="space-y-3">
                <Label htmlFor="receipt-email-input" className="text-lg">Email Receipt</Label>
                <div className="flex gap-3">
                  <Input
                    id="receipt-email-input"
                    type="email"
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 h-14 text-lg bg-white/10 border-white/20 text-white"
                  />
                  <Button
                    onClick={handleEmailReceipt}
                    disabled={!receiptEmail || sendingReceipt}
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                  >
                    {sendingReceipt ? <span className="animate-spin">🌀</span> : <Mail className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              {/* SMS Receipt */}
              {completedOrder?.customer_phone && (
                <Button
                  onClick={handleSmsReceipt}
                  variant="outline"
                  className="w-full border-2 border-white/20 text-white hover:bg-white/10 py-6 rounded-xl flex items-center justify-center gap-3"
                >
                  <MessageSquare className="w-5 h-5" />
                  Send to {completedOrder.customer_phone}
                </Button>
              )}

              {/* All Options */}
              <div className="bg-white/10 rounded-xl p-4">
                <Button
                  onClick={async () => {
                    await handlePrintReceipt();
                    if (receiptEmail) await handleEmailReceipt();
                    if (completedOrder?.customer_phone) await handleSmsReceipt();
                  }}
                  variant="outline"
                  className="w-full border-2 border-amber-500 text-amber-400 hover:bg-amber-500/10"
                >
                  Send All Ways
                </Button>
              </div>

              {/* Continue */}
              <Button
                onClick={handleFinishOrder}
                className="w-full bg-white text-slate-900 hover:bg-slate-100 text-lg py-6 rounded-xl mt-6"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl bg-slate-900 text-white border-emerald-500/50">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">
              {paymentMethod === 'qr' ? 'Scan to Pay' : 'Complete Payment'}
            </DialogTitle>
          </DialogHeader>

          {paymentMethod === 'qr' && completedOrder ? (
            <QRCodePayment
              amount={total}
              orderId={completedOrder.id}
              customerName={customerName}
              onSuccess={() => {
                setShowPaymentDialog(false);
                setShowReceiptOptions(true);
              }}
              onError={(error) => alert(error)}
            />
          ) : clientSecret ? (
            <StripePaymentElement
              clientSecret={clientSecret}
              amount={total}
              onSuccess={handlePaymentSuccess}
              onError={(error) => alert(error)}
            />
          ) : (
            <div className="flex justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Split Payment Dialog */}
      <SplitPaymentDialog
        open={showSplitPayment}
        onClose={() => setShowSplitPayment(false)}
        totalAmount={total}
        onComplete={handleSplitPaymentComplete}
      />

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0">
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full mb-8"
            >
              <span className="text-7xl">✓</span>
            </motion.div>
            <h2 className="text-4xl font-bold mb-4">Order Placed!</h2>
            <p className="text-2xl text-emerald-100 mb-8">
              Thank you, {customerName}!
            </p>
            <p className="text-xl text-emerald-200 mb-4">
              {completedOrder?.payment_status === "pending" ? 
                "Please proceed to the counter to complete payment" :
                "We'll text you when your order is ready"}
            </p>
            {loggedInCustomer && completedOrder && (
              <div className="bg-white/20 rounded-xl p-4 mb-4 inline-block">
                <p className="text-lg">
                  <Star className="w-5 h-5 inline mr-2 text-amber-400" />
                  You earned <strong>{Math.floor(completedOrder.total_amount)} points!</strong>
                </p>
              </div>
            )}
            <p className="text-lg text-emerald-300">
              Returning to menu in 5 seconds...
            </p>
            <Button
              onClick={resetKiosk}
              className="mt-8 bg-white text-emerald-700 hover:bg-emerald-50 text-xl px-12 py-6 rounded-full"
            >
              <Home className="w-6 h-6 mr-3" />
              Return to Menu Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}