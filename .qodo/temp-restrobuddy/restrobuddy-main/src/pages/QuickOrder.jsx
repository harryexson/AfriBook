import React, { useState, useEffect } from "react";
import { MenuItem } from "@/entities/MenuItem";
import { Order } from "@/entities/Order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Phone, User, CheckCircle } from "lucide-react";

export default function QuickOrder() {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
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
  };

  const toggleItem = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const isSelected = (itemId) => {
    return selectedItems.some(i => i.id === itemId);
  };

  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0 || !customerName || !customerPhone) return;

    setIsProcessing(true);

    try {
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: selectedItems.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        })),
        total_amount: total,
        status: "confirmed",
        payment_status: "completed",
        order_type: "web",
        payment_transaction_id: "QUICK-" + Date.now()
      };

      await Order.create(orderData);
      setOrderComplete(true);
      
      setTimeout(() => {
        setSelectedItems([]);
        setCustomerName("");
        setCustomerPhone("");
        setOrderComplete(false);
      }, 3000);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to place order. Please try again.");
    }
    
    setIsProcessing(false);
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white text-center">
          <CardContent className="p-12">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Order Placed!</h2>
            <p className="text-slate-600 text-lg">
              Thank you! We'll text you when it's ready.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Quick Order</h1>
          <p className="text-xl text-slate-600">Select items and checkout fast</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Menu Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {menuItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected(item.id)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <Badge className="bg-emerald-600">${item.price.toFixed(2)}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{item.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-0 shadow-xl sticky top-4">
              <CardHeader>
                <CardTitle className="text-2xl">Your Order</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Selected Items:</h4>
                    {selectedItems.length === 0 ? (
                      <p className="text-slate-500 text-sm">No items selected</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {selectedItems.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name}</span>
                            <span className="font-semibold">${item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xl font-bold border-t pt-3">
                      <span>Total:</span>
                      <span className="text-emerald-600">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isProcessing || selectedItems.length === 0 || !customerName || !customerPhone}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg rounded-xl"
                  >
                    {isProcessing ? (
                      "Processing..."
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Place Order - ${total.toFixed(2)}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-500">
                    Demo mode - no payment required
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}