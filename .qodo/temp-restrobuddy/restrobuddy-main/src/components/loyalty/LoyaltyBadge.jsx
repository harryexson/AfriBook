import React from "react";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Trophy, Crown } from "lucide-react";

const tierIcons = {
  bronze: Award,
  silver: Star,
  gold: Trophy,
  platinum: Crown
};

const tierColors = {
  bronze: "bg-amber-700 text-white",
  silver: "bg-slate-400 text-white",
  gold: "bg-yellow-500 text-white",
  platinum: "bg-purple-500 text-white"
};

export default function LoyaltyBadge({ tier, points, size = "md" }) {
  const TierIcon = tierIcons[tier?.toLowerCase()] || Award;
  const colorClass = tierColors[tier?.toLowerCase()] || "bg-slate-500 text-white";
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  return (
    <Badge className={`${colorClass} ${sizeClasses[size]} flex items-center gap-1.5`}>
      <TierIcon className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
      <span className="capitalize font-semibold">{tier}</span>
      {points !== undefined && (
        <span className="ml-1 opacity-90">• {points.toLocaleString()} pts</span>
      )}
    </Badge>
  );
}