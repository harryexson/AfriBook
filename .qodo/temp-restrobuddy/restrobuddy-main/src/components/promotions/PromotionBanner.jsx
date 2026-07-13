import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Gift, Percent, DollarSign, Package, Clock, Zap, Layers, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function PromotionBanner({ promotions }) {
  if (!promotions || promotions.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case "percentage_off": return Percent;
      case "fixed_amount_off": return DollarSign;
      case "free_delivery": return Package;
      case "bogo": case "free_item": return Gift;
      case "tiered_discount": return Layers;
      case "flash_sale": return Zap;
      default: return Tag;
    }
  };

  const getPromotionText = (promo) => {
    switch (promo.type) {
      case "percentage_off":
        return `${promo.discount_value}% OFF`;
      case "fixed_amount_off":
        return `$${promo.discount_value} OFF`;
      case "free_delivery":
        return "FREE DELIVERY";
      case "bogo":
        return `BUY ${promo.bogo_buy_quantity || 1} GET ${promo.bogo_get_quantity || 1} FREE`;
      case "free_item":
        return "FREE ITEM";
      case "tiered_discount":
        const maxTier = promo.tiered_discounts?.reduce((max, t) => t.discount_value > max ? t.discount_value : max, 0);
        return `UP TO ${maxTier}% OFF`;
      case "flash_sale":
        return `⚡ ${promo.flash_sale_discount}% OFF`;
      default:
        return "SPECIAL OFFER";
    }
  };

  const getPromoColor = (promo) => {
    if (promo.type === "flash_sale") return "border-red-500 bg-gradient-to-r from-red-50 to-orange-50";
    if (promo.promotion_category === "happy_hour") return "border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50";
    if (promo.type === "tiered_discount") return "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50";
    if (promo.type === "bogo") return "border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50";
    return "border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50";
  };

  const getIconBgColor = (promo) => {
    if (promo.type === "flash_sale") return "bg-red-600";
    if (promo.promotion_category === "happy_hour") return "bg-purple-600";
    if (promo.type === "tiered_discount") return "bg-blue-600";
    if (promo.type === "bogo") return "bg-amber-600";
    return "bg-emerald-600";
  };

  const getTextColor = (promo) => {
    if (promo.type === "flash_sale") return "text-red-600";
    if (promo.promotion_category === "happy_hour") return "text-purple-600";
    if (promo.type === "tiered_discount") return "text-blue-600";
    if (promo.type === "bogo") return "text-amber-600";
    return "text-emerald-600";
  };

  return (
    <div className="space-y-4 mb-6">
      {promotions.map((promo, idx) => {
        const Icon = getIcon(promo.type);
        const now = new Date();
        const endDate = promo.end_date ? new Date(promo.end_date) : null;
        const isExpiringSoon = endDate && (endDate - now) < 24 * 60 * 60 * 1000;
        const isFlashSale = promo.type === "flash_sale";

        return (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`border-2 overflow-hidden ${getPromoColor(promo)} ${isFlashSale ? 'animate-pulse' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBgColor(promo)}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-lg text-slate-900">
                            {promo.title}
                          </h3>
                          {promo.promotion_category === "happy_hour" && (
                            <Badge className="bg-purple-600 text-white text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Happy Hour
                            </Badge>
                          )}
                          {promo.promotion_category === "daily_special" && (
                            <Badge className="bg-orange-500 text-white text-xs">
                              Daily Special
                            </Badge>
                          )}
                          {isFlashSale && (
                            <Badge className="bg-red-600 text-white text-xs animate-bounce">
                              <Zap className="w-3 h-3 mr-1" />
                              Flash Sale!
                            </Badge>
                          )}
                          {promo.auto_apply ? (
                            <Badge className="bg-blue-600 text-white text-xs">
                              Auto-applied
                            </Badge>
                          ) : promo.code && (
                            <Badge variant="outline" className="text-xs font-mono">
                              {promo.code}
                            </Badge>
                          )}
                        </div>
                        
                        {promo.description && (
                          <p className="text-sm text-slate-600">{promo.description}</p>
                        )}

                        {/* Tiered Discount Details */}
                        {promo.type === "tiered_discount" && promo.tiered_discounts && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {promo.tiered_discounts.map((tier, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-white">
                                Spend ${tier.min_spend}+ → {tier.discount_value}{tier.discount_type === "percentage" ? "%" : "$"} off
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Flash Sale Timer */}
                        {isFlashSale && promo.flash_sale_duration_minutes && (
                          <div className="mt-2 flex items-center gap-2 text-red-600">
                            <Timer className="w-4 h-4" />
                            <span className="text-sm font-bold">
                              {promo.flash_sale_duration_minutes} minutes only!
                            </span>
                          </div>
                        )}

                        {/* Happy Hour Time */}
                        {promo.active_hours?.start && promo.active_hours?.end && (
                          <div className="mt-2 flex items-center gap-2 text-purple-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {promo.active_hours.start} - {promo.active_hours.end}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getTextColor(promo)}`}>
                          {getPromotionText(promo)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      {promo.min_order_amount > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Min. order: ${promo.min_order_amount.toFixed(2)}
                        </span>
                      )}
                      
                      {endDate && (
                        <span className={`flex items-center gap-1 ${isExpiringSoon ? 'text-red-600 font-semibold' : ''}`}>
                          <Clock className="w-3 h-3" />
                          {isExpiringSoon ? "Expires soon! " : "Valid until "}
                          {format(endDate, 'MMM d, yyyy')}
                        </span>
                      )}

                      {promo.active_days?.length > 0 && promo.active_days.length < 7 && (
                        <span className="capitalize">
                          {promo.active_days.map(d => d.slice(0, 3)).join(", ")} only
                        </span>
                      )}

                      {promo.usage_limit && (
                        <span className={promo.usage_limit - (promo.usage_count || 0) < 10 ? "text-red-600 font-semibold" : ""}>
                          {promo.usage_limit - (promo.usage_count || 0)} uses remaining
                        </span>
                      )}

                      {promo.first_order_only && (
                        <Badge variant="outline" className="text-xs">
                          First order only
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}