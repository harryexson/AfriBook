import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutModal({ isOpen, onClose, cart, total, restaurant, onComplete }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    delivery_type: "pickup",
    delivery_address: {
      street: "",
      city: "",
      state: "",
      zip: ""
    },
    notes: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.delivery_type === "delivery" && !formData.delivery_address.street) {
      toast.error("Please enter a delivery address");
      return;
    }

    setIsSubmitting(true);
    await onComplete(formData);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  required
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Order Type</h3>
            <RadioGroup
              value={formData.delivery_type}
              onValueChange={(value) => setFormData({ ...formData, delivery_type: value })}
            >
              <div className="flex items-center space-x-2 border p-4 rounded-lg">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Pickup</div>
                  <div className="text-sm text-slate-600">
                    Pick up from {restaurant.business_name}
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border p-4 rounded-lg">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Delivery</div>
                  <div className="text-sm text-slate-600">
                    Deliver to your address
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Delivery Address */}
          {formData.delivery_type === "delivery" && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Delivery Address</h3>
              <div className="space-y-3">
                <div>
                  <Label>Street Address *</Label>
                  <Input
                    value={formData.delivery_address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      delivery_address: { ...formData.delivery_address, street: e.target.value }
                    })}
                    placeholder="123 Main St"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={formData.delivery_address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        delivery_address: { ...formData.delivery_address, city: e.target.value }
                      })}
                      placeholder="City"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input
                      value={formData.delivery_address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        delivery_address: { ...formData.delivery_address, state: e.target.value }
                      })}
                      placeholder="CA"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>ZIP *</Label>
                    <Input
                      value={formData.delivery_address.zip}
                      onChange={(e) => setFormData({
                        ...formData,
                        delivery_address: { ...formData.delivery_address, zip: e.target.value }
                      })}
                      placeholder="12345"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special Notes */}
          <div>
            <Label>Special Instructions</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requests or delivery instructions?"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${(total * 0.08).toFixed(2)}</span>
            </div>
            {formData.delivery_type === "delivery" && (
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>$5.00</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-emerald-600">
                ${(total * 1.08 + (formData.delivery_type === "delivery" ? 5 : 0)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}