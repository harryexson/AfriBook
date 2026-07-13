import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Gift,
  ShoppingBag,
  Star,
  Check,
  Trash2,
  Archive,
  AlertCircle,
  MessageSquare,
  Calendar,
  Trophy,
  Settings,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  BellRing,
  CheckCircle
} from "lucide-react";
import { Notification } from "@/entities/Notification";
import { CustomerProfile } from "@/entities/CustomerProfile";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("notifications");
  const [notificationSettings, setNotificationSettings] = useState({
    push_enabled: true,
    sound_enabled: true,
    order_updates: true,
    reservation_updates: true,
    loyalty_milestones: true,
    promotions: true,
    sms_notifications: true,
    email_notifications: true
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [profile, setProfile] = useState(null);
  const audioRef = useRef(null);
  const previousCountRef = useRef(0);

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwiR1/PMey0GI3fH8N2RQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKzn77hiFwgA');
    loadNotifications();
    
    // Poll for new notifications
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allNotifications = await Notification.filter({
        customer_email: currentUser.email
      }, "-created_date", 100);

      // Play sound for new notifications
      const newUnreadCount = allNotifications.filter(n => n.status === "unread").length;
      if (newUnreadCount > previousCountRef.current && notificationSettings.sound_enabled && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed'));
      }
      previousCountRef.current = newUnreadCount;

      setNotifications(allNotifications);

      // Load notification settings from profile
      const profiles = await CustomerProfile.filter({ user_email: currentUser.email });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        if (profiles[0].notification_preferences) {
          setNotificationSettings(prev => ({
            ...prev,
            ...profiles[0].notification_preferences
          }));
        }
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
    setIsLoading(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, {
        status: "read",
        read_at: new Date().toISOString()
      });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, status: "read", read_at: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => n.status === "unread").map(n => n.id);
      
      for (const id of unreadIds) {
        await Notification.update(id, {
          status: "read",
          read_at: new Date().toISOString()
        });
      }

      loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      await Notification.update(notificationId, { status: "archived" });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error archiving:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.status === "unread") {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      if (profile) {
        await CustomerProfile.update(profile.id, {
          notification_preferences: notificationSettings
        });
      }
      alert("Settings saved!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    }
    setIsSavingSettings(false);
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

  const getIconColor = (type) => {
    const colors = {
      order_update: "text-blue-600 bg-blue-100",
      promotion: "text-purple-600 bg-purple-100",
      loyalty_reward: "text-amber-600 bg-amber-100",
      loyalty_milestone: "text-yellow-600 bg-yellow-100",
      offer: "text-emerald-600 bg-emerald-100",
      reservation: "text-indigo-600 bg-indigo-100",
      reservation_confirmation: "text-green-600 bg-green-100",
      reservation_reminder: "text-orange-600 bg-orange-100",
      system: "text-slate-600 bg-slate-100"
    };
    return colors[type] || "text-slate-600 bg-slate-100";
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return n.status !== "archived";
    if (filter === "unread") return n.status === "unread";
    if (filter === "reservation") {
      return ["reservation", "reservation_confirmation", "reservation_reminder"].includes(n.type) && n.status !== "archived";
    }
    if (filter === "loyalty_reward") {
      return ["loyalty_reward", "loyalty_milestone"].includes(n.type) && n.status !== "archived";
    }
    return n.type === filter && n.status !== "archived";
  });

  const unreadCount = notifications.filter(n => n.status === "unread").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <Bell className="w-10 h-10 text-emerald-600" />
              Notifications
            </h1>
            <p className="text-slate-600">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-white border border-slate-200 p-1 mb-6">
            <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {unreadCount > 0 && <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* General Settings */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">General</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <BellRing className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-slate-600">Receive in-app notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.push_enabled}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, push_enabled: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {notificationSettings.sound_enabled ? <Volume2 className="w-5 h-5 text-emerald-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                        <div>
                          <p className="font-medium">Notification Sound</p>
                          <p className="text-sm text-slate-600">Play sound for new notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.sound_enabled}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, sound_enabled: checked})}
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Types */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Notification Types</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Order Updates</p>
                          <p className="text-sm text-slate-600">Status changes, ready for pickup, delivery updates</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.order_updates}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, order_updates: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="font-medium">Reservation Updates</p>
                          <p className="text-sm text-slate-600">Confirmations, reminders, and changes</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.reservation_updates}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, reservation_updates: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="font-medium">Loyalty Milestones</p>
                          <p className="text-sm text-slate-600">Points earned, tier upgrades, reward unlocks</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.loyalty_milestones}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, loyalty_milestones: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-medium">Promotions & Offers</p>
                          <p className="text-sm text-slate-600">Special deals and personalized offers</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.promotions}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, promotions: checked})}
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Channels */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Delivery Channels</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm text-slate-600">Receive important updates via text message</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.sms_notifications}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, sms_notifications: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-slate-600">Receipts and order confirmations via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationSettings.email_notifications}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, email_notifications: checked})}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSavingSettings}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isSavingSettings ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
        {/* Filters */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="all">
              All
              {notifications.filter(n => n.status !== "archived").length > 0 && (
                <Badge className="ml-2 bg-slate-200 text-slate-800">
                  {notifications.filter(n => n.status !== "archived").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-emerald-600">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="order_update">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="promotion">
              <Gift className="w-4 h-4 mr-2" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="loyalty_reward">
              <Star className="w-4 h-4 mr-2" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="reservation">
              <Calendar className="w-4 h-4 mr-2" />
              Reservations
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="h-24 animate-pulse bg-slate-200" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No notifications</p>
              <p className="text-slate-400 text-sm mt-1">You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const isUnread = notification.status === "unread";

              return (
                <Card
                  key={notification.id}
                  className={`border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${
                    isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className={`font-bold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notification.title}
                          </h3>
                          {isUnread && (
                            <Badge className="bg-emerald-600 ml-2">New</Badge>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 mb-2">{notification.message}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{format(new Date(notification.created_date), 'MMM d, h:mm a')}</span>
                            {notification.sms_sent && (
                              <Badge variant="outline" className="text-xs">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                SMS Sent
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {notification.action_label && (
                              <Button size="sm" variant="outline">
                                {notification.action_label}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveNotification(notification.id);
                              }}
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}