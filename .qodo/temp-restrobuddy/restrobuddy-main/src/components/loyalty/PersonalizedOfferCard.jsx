import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, Clock, Check } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function PersonalizedOfferCard({ offer, onRedeem }) {
  const getOfferIcon = () => {
    switch (offer.offer_type) {
      case "discount": return Gift;
      case "bonus_points": return Sparkles;
      case "free_item": return Gift;
      default: return Gift;
    }
  };

  const getOfferText = () => {
    switch (offer.offer_type) {
      case "discount":
        if (offer.discount_type === "percentage") {
          return `${offer.discount_value}% OFF`;
        }
        return `$${offer.discount_value} OFF`;
      case "bonus_points":
        return `${offer.bonus_points_amount} BONUS POINTS`;
      case "free_item":
        return "FREE ITEM";
      default:
        return "SPECIAL OFFER";
    }
  };

  const getTriggerBadge = () => {
    const badges = {
      birthday: { text: "Birthday Gift 🎂", color: "bg-pink-500" },
      anniversary: { text: "Anniversary 🎉", color: "bg-purple-500" },
      win_back: { text: "We Miss You 💙", color: "bg-blue-500" },
      high_value: { text: "VIP Offer 👑", color: "bg-amber-500" },
      milestone: { text: "Milestone 🏆", color: "bg-green-500" },
      custom: { text: "Just For You ✨", color: "bg-indigo-500" }
    };

    return badges[offer.trigger_reason] || badges.custom;
  };

  const Icon = getOfferIcon();
  const triggerBadge = getTriggerBadge();
  const daysUntilExpiry = offer.valid_until 
    ? Math.ceil((new Date(offer.valid_until) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <Badge className={`${triggerBadge.color} text-white`}>
              {triggerBadge.text}
            </Badge>
            {daysUntilExpiry && daysUntilExpiry <= 7 && (
              <Badge variant="outline" className="text-red-600 border-red-600">
                <Clock className="w-3 h-3 mr-1" />
                {daysUntilExpiry} days left
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-1">
                {offer.title}
              </h3>
              <div className="text-3xl font-bold text-emerald-600">
                {getOfferText()}
              </div>
            </div>
          </div>

          {offer.description && (
            <p className="text-slate-700 mb-4">{offer.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4 text-xs text-slate-600">
            {offer.min_order_amount > 0 && (
              <span className="bg-white px-2 py-1 rounded">
                Min. order: ${offer.min_order_amount}
              </span>
            )}
            {offer.valid_until && (
              <span className="bg-white px-2 py-1 rounded">
                Valid until {format(new Date(offer.valid_until), 'MMM d, yyyy')}
              </span>
            )}
            {offer.usage_limit > 1 && (
              <span className="bg-white px-2 py-1 rounded">
                Can use {offer.usage_limit - offer.usage_count} more times
              </span>
            )}
          </div>

          {offer.status === "active" ? (
            <Button 
              onClick={onRedeem}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6"
            >
              Redeem Offer
            </Button>
          ) : (
            <Button disabled className="w-full" variant="outline">
              <Check className="w-5 h-5 mr-2" />
              {offer.status === "redeemed" ? "Already Redeemed" : "Expired"}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}