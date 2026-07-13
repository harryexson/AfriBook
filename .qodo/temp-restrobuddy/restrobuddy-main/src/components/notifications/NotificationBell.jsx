import React, { useState, useEffect, useRef } from "react";
import { Bell, ShoppingBag, Gift, Star, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Notification } from "@/entities/Notification";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef(null);
  const previousCountRef = useRef(0);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const notifications = await Notification.filter({
        customer_email: currentUser.email,
        status: "unread"
      }, "-created_date", 10);

      // Animate bell if new notifications
      if (notifications.length > previousCountRef.current) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      }
      previousCountRef.current = notifications.length;

      setUnreadCount(notifications.length);
      setRecentNotifications(notifications.slice(0, 5));
    } catch (error) {
      console.log("Error loading notifications:", error);
    }
  };

  const markAsRead = async (notification) => {
    try {
      await Notification.update(notification.id, {
        status: "read",
        read_at: new Date().toISOString()
      });
      loadUnreadCount();
      if (notification.action_url) {
        navigate(notification.action_url);
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
    setShowDropdown(false);
  };

  const getIcon = (type) => {
    const icons = {
      order_update: ShoppingBag,
      promotion: Gift,
      loyalty_reward: Star,
      offer: Gift,
      reservation: Calendar
    };
    const Icon = icons[type] || Bell;
    return <Icon className="w-4 h-4" />;
  };

  const getIconColor = (type) => {
    const colors = {
      order_update: "text-blue-600 bg-blue-100",
      promotion: "text-purple-600 bg-purple-100",
      loyalty_reward: "text-amber-600 bg-amber-100",
      offer: "text-emerald-600 bg-emerald-100",
      reservation: "text-indigo-600 bg-indigo-100"
    };
    return colors[type] || "text-slate-600 bg-slate-100";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className={`relative ${isAnimating ? 'animate-bounce' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell className={`w-5 h-5 ${isAnimating ? 'text-emerald-600' : ''}`} />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {showDropdown && (
        <Card className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto shadow-2xl z-50 border-0">
          <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Notifications</h4>
            {unreadCount > 0 && (
              <Badge className="bg-emerald-600">{unreadCount} new</Badge>
            )}
          </div>
          <CardContent className="p-0">
            {recentNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification)}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{notification.title}</p>
                        <p className="text-xs text-slate-600 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-2 border-t">
              <Link to={createPageUrl("NotificationCenter")}>
                <Button variant="ghost" className="w-full text-emerald-600 hover:text-emerald-700">
                  View All Notifications
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}