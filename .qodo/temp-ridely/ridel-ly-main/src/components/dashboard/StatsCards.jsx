import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const colorClasses = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  yellow: "bg-yellow-100 text-yellow-600",
  purple: "bg-purple-100 text-purple-600"
};

export default function StatsCards({ title, value, icon: Icon, color = "blue", trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="md-card p-6 h-full">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
              <div className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                {value}
              </div>
              {trend && (
                <p className="text-xs text-muted-foreground">{trend}</p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
      </div>
    </motion.div>
  );
}