import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MarketplaceOrder } from "@/entities/MarketplaceOrder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Info, Tag } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import ApplyPromotion from "../components/promotions/ApplyPromotion";

export default function MarketplaceCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, restaurant, subtotal: initialSubtotal, commissionAmount: initialCommission, total: initialTotal } = location.state || {};
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [appliedPromotion, setAppliedPromotion] = useState(null);

  if (!cart || !restaurant) {
    navigate(createPageUrl("Marketplace"));
    return null;
  }

  // Recalculate totals with promotion
  const calculateTotals = () => {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;

    if (appliedPromotion) {
      switch (appliedPromotion.type) {
        case "percentage_off":
          discount = subtotal * (appliedPromotion.discount_value / 100);
          if (appliedPromotion.max_discount_amount) {
            discount = Math.min(discount, appliedPromotion.max_discount_amount);
          }
          break;
        
        case "fixed_amount_off":
          discount = Math.min(appliedPromotion.discount_value, subtotal);
          break;
        
        // free_delivery, bogo, free_item handled differently
      }
    }

    const discountedSubtotal = subtotal - discount;
    const commission = discountedSubtotal * restaurant.commission_rate;
    const restaurantPayout = discountedSubtotal - commission;

    return {
      subtotal,
      discount,
      discountedSubtotal,
      commission,
      restaurantPayout,
      total: discountedSubtotal
    };
  };

  const { subtotal, discount, discountedSubtotal, commission: commissionAmount, restaurantPayout, total } = calculateTotals();

  const estimatedReadyTime = new Date(Date.now() + restaurant.average_prep_time * 60000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const orderData = {
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.business_name,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        items: cart,
        subtotal: discountedSubtotal,
        commission_rate: restaurant.commission_rate,
        commission_amount: commissionAmount,
        restaurant_payout: restaurantPayout,
        total_amount: total,
        status: "pending",
        payment_status: "pending",
        order_source: "marketplace_web",
        estimated_ready_time: estimatedReadyTime.toISOString(),
        prep_time_minutes: restaurant.average_prep_time,
        special_requests: specialRequests,
        promotion_code: appliedPromotion?.code || null,
        promotion_discount: discount
      };

      const newOrder = await MarketplaceOrder.create(orderData);
      
      // Demo payment success
      const demoPaymentSuccess = true;
      
      if (demoPaymentSuccess) {
        await MarketplaceOrder.update(newOrder.id, {
          status: "confirmed",
          payment_status: "completed",
          payment_transaction_id: "DEMO-" + Date.now()
        });

        // Update promotion usage count if applied
        if (appliedPromotion) {
          const { Promotion } = await import("@/entities/Promotion");
          await Promotion.update(appliedPromotion.id, {
            usage_count: (appliedPromotion.usage_count || 0) + 1
          });
        }
        
        navigate(createPageUrl("MarketplaceOrderStatus"), { 
          state: { orderId: newOrder.id, restaurant },
          replace: true 
        });
      } else {
        setPaymentError("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Error creating marketplace order:", error);
      setPaymentError(`Failed to place order: ${error.message || 'Please try again'}`);
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-slate-100 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Checkout</CardTitle>
              <p className="text-slate-600">Ordering from {restaurant.business_name}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-base font-semibold">Your Name *</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="mt-2 h-12 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-base font-semibold">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    placeholder="+1 (555) 123-4567"
                    className="mt-2 h-12 rounded-xl"
                  />
                  <p className="text-xs text-slate-500 mt-1">We'll text you when your order is ready</p>
                </div>

                <div>
                  <Label htmlFor="email" className="text-base font-semibold">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-2 h-12 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="requests" className="text-base font-semibold">Special Requests</Label>
                  <Textarea
                    id="requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any allergies or special instructions..."
                    className="mt-2 rounded-xl"
                    rows={4}
                  />
                </div>

                {paymentError && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-800">
                      {paymentError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white text-lg py-6 rounded-xl shadow-lg"
                >
                  {isProcessing ? "Processing..." : `Place Order - $${total.toFixed(2)}`}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start p-4 bg-slate-50 rounded-xl">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-[#10b981]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t-2 border-slate-200">
                    {/* Promo Code */}
                    <div className="mb-4">
                      <ApplyPromotion
                        cart={cart}
                        subtotal={subtotal}
                        restaurantId={restaurant.id}
                        onPromotionApplied={(promo) => setAppliedPromotion(promo)}
                        appliedPromotion={appliedPromotion}
                        onRemovePromotion={() => setAppliedPromotion(null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-700">
                        <span>Subtotal</span>
                        <span className="font-semibold">${subtotal.toFixed(2)}</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Discount ({appliedPromotion?.code})
                          </span>
                          <span className="font-semibold">-${discount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-xl font-bold text-slate-900">Total</span>
                        <span className="text-3xl font-bold text-[#10b981]">
                          ${total.toFixed(2)}
                        </span>
                      </div>

                      {discount > 0 && (
                        <p className="text-sm text-emerald-600 text-center pt-2">
                          You saved ${discount.toFixed(2)}! 🎉
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-emerald-50 border-emerald-200">
              <Clock className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-900">
                <strong>Estimated Ready Time:</strong><br />
                {format(estimatedReadyTime, 'h:mm a')} ({restaurant.average_prep_time} minutes)
              </AlertDescription>
            </Alert>

            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <strong>Pickup Order:</strong> This is a pickup order. Please pick up your food at the restaurant.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}