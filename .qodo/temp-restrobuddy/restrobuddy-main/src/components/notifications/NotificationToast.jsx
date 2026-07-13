import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell, ShoppingBag, Gift, Star, Calendar, Trophy,
  X, ArrowRight, BellRing, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Notification } from "@/entities/Notification";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationToast() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    checkForNewNotifications();
    const interval = setInterval(checkForNewNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkForNewNotifications = async () => {
    try {
      const user = await base44.auth.me();
      const notifications = await Notification.filter({
        customer_email: user.email,
        status: "unread"
      }, "-created_date", 5);

      const newNotifications = notifications.filter(n => 
        new Date(n.created_date) > lastChecked
      );

      if (newNotifications.length > 0) {
        setToasts(prev => [...prev, ...newNotifications].slice(-3));
        setLastChecked(new Date());
      }
    } catch (error) {
      // Silently fail
    }
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToastClick = async (notification) => {
    try {
      await Notification.update(notification.id, {
        status: "read",
        read_at: new Date().toISOString()
      });
    } catch (e) {}
    
    dismissToast(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getIcon = (type) => {
    const icons = {
      order_update: ShoppingBag,
      promotion: Gift,
      loyalty_reward: Star,
      loyalty_milestone: Trophy,
      offer: Gift,
      reservation: Calendar,
      reservation_confirmation: Calendar,
      reservation_reminder: BellRing,
      system: AlertCircle
    };
    return icons[type] || Bell;
  };

  const getColor = (type) => {
    const colors = {
      order_update: "border-blue-500 bg-blue-50",
      promotion: "border-purple-500 bg-purple-50",
      loyalty_reward: "border-amber-500 bg-amber-50",
      loyalty_milestone: "border-yellow-500 bg-yellow-50",
      offer: "border-emerald-500 bg-emerald-50",
      reservation: "border-indigo-500 bg-indigo-50",
      reservation_confirmation: "border-green-500 bg-green-50",
      reservation_reminder: "border-orange-500 bg-orange-50",
      system: "border-slate-500 bg-slate-50"
    };
    return colors[type] || "border-slate-500 bg-slate-50";
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = getIcon(toast.type);
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className={`border-l-4 shadow-2xl cursor-pointer hover:shadow-3xl transition-shadow ${getColor(toast.type)}`}
                onClick={() => handleToastClick(toast)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">{toast.title}</h4>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 -mt-1 -mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissToast(toast.id);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">{toast.message}</p>
                      {toast.action_label && (
                        <Button size="sm" variant="link" className="p-0 h-auto mt-2 text-xs">
                          {toast.action_label}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}