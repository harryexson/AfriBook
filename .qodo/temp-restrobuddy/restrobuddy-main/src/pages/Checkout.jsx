import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, MapPin, Store, ShoppingBag, CreditCard, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AiUpsellSuggestions from "@/components/checkout/AiUpsellSuggestions";

export default function Checkout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [upsellItems, setUpsellItems] = useState([]);
  const [orderType, setOrderType] = useState("pickup");
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    delivery_address: { street: "", city: "", state: "", zip: "" },
    special_instructions: "",
    payment_method: "card"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load cart from sessionStorage
      const storedCart = sessionStorage.getItem("checkoutCart");
      if (!storedCart) {
        navigate(createPageUrl("Marketplace"));
        return;
      }

      const parsed = JSON.parse(storedCart);
      setCartData(parsed);
      setUpsellItems(parsed.items || []);
      
      // Pre-fill user data
      setFormData(prev => ({
        ...prev,
        customer_name: currentUser.full_name || "",
        customer_email: currentUser.email || ""
      }));
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpsellItem = (item) => {
    setCartData(prev => {
      const existing = prev.items.find(i => i.id === item.id);
      const items = existing
        ? prev.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev.items, { ...item, quantity: 1 }];
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
      return { ...prev, items, total };
    });
    setUpsellItems(prev => [...prev, item]);
  };

  const handlePlaceOrder = async () => {
    if (!formData.customer_name || !formData.customer_phone || !formData.customer_email) {
      alert("Please fill in all required fields");
      return;
    }

    if (orderType === "delivery" && !formData.delivery_address.street) {
      alert("Please enter a delivery address");
      return;
    }

    setProcessing(true);

    try {
      // Create order
      const orderData = {
        restaurant_id: cartData.restaurant.id,
        restaurant_name: cartData.restaurant.name,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        items: cartData.items.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total_amount: cartData.total,
        delivery_type: orderType,
        delivery_address: orderType === "delivery" ? formData.delivery_address : null,
        special_requests: formData.special_instructions,
        status: "pending",
        payment_status: "completed", // Simulated payment
        order_type: "web"
      };

      const order = await base44.entities.Order.create(orderData);

      // Clear cart
      sessionStorage.removeItem("checkoutCart");

      // Navigate to order confirmation
      navigate(createPageUrl("OrderStatus") + `?id=${order.id}`);
    } catch (error) {
      console.error("Failed to place order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!cartData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No items in cart</p>
        </div>
      </div>
    );
  }

  const currency = cartData.restaurant.currency || "$";

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Checkout</h1>
          <p className="text-slate-600">Complete your order from {cartData.restaurant.name}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Type */}
            <Card>
              <CardHeader>
                <CardTitle>Order Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={orderType} onValueChange={setOrderType}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold">Pickup</p>
                          <p className="text-sm text-slate-600">Pick up from restaurant</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="font-semibold">Delivery</p>
                          <p className="text-sm text-slate-600">Deliver to your address</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {orderType === "delivery" && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label>Street Address *</Label>
                      <Input
                        value={formData.delivery_address.street}
                        onChange={(e) => setFormData({
                          ...formData,
                          delivery_address: {...formData.delivery_address, street: e.target.value}
                        })}
                      />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <Label>City *</Label>
                        <Input
                          value={formData.delivery_address.city}
                          onChange={(e) => setFormData({
                            ...formData,
                            delivery_address: {...formData.delivery_address, city: e.target.value}
                          })}
                        />
                      </div>
                      <div>
                        <Label>State *</Label>
                        <Input
                          value={formData.delivery_address.state}
                          onChange={(e) => setFormData({
                            ...formData,
                            delivery_address: {...formData.delivery_address, state: e.target.value}
                          })}
                        />
                      </div>
                      <div>
                        <Label>ZIP *</Label>
                        <Input
                          value={formData.delivery_address.zip}
                          onChange={(e) => setFormData({
                            ...formData,
                            delivery_address: {...formData.delivery_address, zip: e.target.value}
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Label>Special Instructions (Optional)</Label>
                  <Textarea
                    placeholder="Add any special instructions for your order..."
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Upsell Suggestions */}
            {cartData && (
              <AiUpsellSuggestions
                cartItems={upsellItems}
                restaurantId={cartData.restaurant.id}
                restaurantName={cartData.restaurant.name}
                onAddItem={handleAddUpsellItem}
              />
            )}

            {/* Payment (Simulated) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Demo Mode: Payment processing is simulated for demonstration
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  In production, secure payment would be processed here via Stripe or your selected payment processor.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartData.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-semibold">
                        {currency}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-emerald-600">{currency}{cartData.total.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-6"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}