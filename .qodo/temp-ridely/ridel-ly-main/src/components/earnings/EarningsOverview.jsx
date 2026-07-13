import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function EarningsOverview({ earnings, canRequestPayout }) {
  const cards = [
    {
      title: "Available Balance",
      amount: earnings?.available_balance || 0,
      icon: DollarSign,
      color: "green",
      subtitle: canRequestPayout ? "Ready for payout" : "Below minimum"
    },
    {
      title: "Pending Earnings", 
      amount: earnings?.pending_balance || 0,
      icon: Clock,
      color: "yellow",
      subtitle: "From recent rides"
    },
    {
      title: "Total Earnings",
      amount: earnings?.total_earnings || 0,
      icon: TrendingUp,
      color: "blue",
      subtitle: "All time"
    },
    {
      title: "Instant Available",
      amount: earnings?.instant_payout_balance || 0,
      icon: Zap,
      color: "purple",
      subtitle: "For instant payout"
    }
  ];

  const colorClasses = {
    green: "from-emerald-500 to-emerald-600 text-emerald-600",
    yellow: "from-amber-500 to-amber-600 text-amber-600", 
    blue: "from-blue-500 to-blue-600 text-blue-600",
    purple: "from-purple-500 to-purple-600 text-purple-600"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClasses[card.color].split(' text-')[0]} opacity-5 rounded-full transform translate-x-8 -translate-y-8`} />
            
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    ${card.amount.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[card.color].split(' text-')[0]} bg-opacity-10`}>
                  <card.icon className={`w-6 h-6 ${colorClasses[card.color].split(' ')[1]}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}