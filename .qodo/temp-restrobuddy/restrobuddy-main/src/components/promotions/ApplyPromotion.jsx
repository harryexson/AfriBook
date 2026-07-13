import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, X, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

export default function ApplyPromotion({ 
  cart, 
  subtotal, 
  restaurantId,
  onPromotionApplied,
  appliedPromotion,
  onRemovePromotion 
}) {
  const [promoCode, setPromoCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);

  const validatePromotion = async () => {
    if (!promoCode.trim()) {
      setError("Please enter a promotion code");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Import dynamically to avoid circular deps
      const { Promotion } = await import("@/entities/Promotion");
      
      // Find promotion
      const promos = await Promotion.filter({
        restaurant_id: restaurantId,
        code: promoCode.toUpperCase(),
        status: "active"
      });

      if (promos.length === 0) {
        setError("Invalid promotion code");
        setIsValidating(false);
        return;
      }

      const promo = promos[0];
      
      // Validate timing
      const now = new Date();
      if (promo.start_date && new Date(promo.start_date) > now) {
        setError("This promotion hasn't started yet");
        setIsValidating(false);
        return;
      }

      if (promo.end_date && new Date(promo.end_date) < now) {
        setError("This promotion has expired");
        setIsValidating(false);
        return;
      }

      // Validate day of week
      if (promo.active_days && promo.active_days.length > 0) {
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const today = dayNames[now.getDay()];
        if (!promo.active_days.includes(today)) {
          setError("This promotion is not valid today");
          setIsValidating(false);
          return;
        }
      }

      // Validate time of day
      if (promo.active_hours && promo.active_hours.start && promo.active_hours.end) {
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHour, startMin] = promo.active_hours.start.split(':').map(Number);
        const [endHour, endMin] = promo.active_hours.end.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        if (currentTime < startTime || currentTime > endTime) {
          setError(`This promotion is only valid between ${promo.active_hours.start} and ${promo.active_hours.end}`);
          setIsValidating(false);
          return;
        }
      }

      // Validate minimum order
      if (promo.min_order_amount && subtotal < promo.min_order_amount) {
        setError(`Minimum order of $${promo.min_order_amount.toFixed(2)} required`);
        setIsValidating(false);
        return;
      }

      // Validate usage limit
      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
        setError("This promotion has reached its usage limit");
        setIsValidating(false);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      
      switch (promo.type) {
        case "percentage_off":
          discountAmount = subtotal * (promo.discount_value / 100);
          if (promo.max_discount_amount) {
            discountAmount = Math.min(discountAmount, promo.max_discount_amount);
          }
          break;
        
        case "fixed_amount_off":
          discountAmount = Math.min(promo.discount_value, subtotal);
          break;
        
        case "free_delivery":
          // Delivery fee would be calculated elsewhere
          discountAmount = 0; // Will be applied to delivery fee
          break;
        
        case "bogo":
        case "free_item":
          // Would need to check if required items are in cart
          // For now, just mark as valid
          discountAmount = 0;
          break;
      }

      onPromotionApplied({
        ...promo,
        discountAmount
      });
      
      setPromoCode("");
      setIsValidating(false);
    } catch (error) {
      console.error("Error validating promotion:", error);
      setError("Failed to validate promotion code");
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      {appliedPromotion ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <Alert className="bg-emerald-50 border-emerald-200">
            <Check className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-900">
                  {appliedPromotion.title}
                </span>
                {appliedPromotion.discountAmount > 0 && (
                  <span className="text-emerald-700 ml-2">
                    -${appliedPromotion.discountAmount.toFixed(2)}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemovePromotion}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Enter promo code"
                className="pl-10 font-mono"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    validatePromotion();
                  }
                }}
              />
            </div>
            <Button
              onClick={validatePromotion}
              disabled={isValidating || !promoCode.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isValidating ? "Checking..." : "Apply"}
            </Button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}