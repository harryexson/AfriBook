import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Utensils,
  LayoutGrid,
  List,
  User as UserIcon,
  LogOut,
  Bot,
  Star,
  MessageCircle,
  Wallet,
  FileText,
  Calendar,
  History,
  Gift,
  Settings as SettingsIcon,
  Users,
  TrendingUp,
  ThumbsUp,
  Power,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

import { Headphones } from "lucide-react";
import NotificationBell from '../components/notifications/NotificationBell';
import BrowserNotificationManager from '../components/notifications/BrowserNotificationManager';

const riderNavItems = [
    { title: "Home", url: createPageUrl("Dashboard"), icon: LayoutGrid },
    { title: "Book Ride", url: createPageUrl("BookRide"), icon: Car },
    { title: "Order Food", url: createPageUrl("FoodMenu"), icon: Utensils },
    { title: "My Orders", url: createPageUrl("MyOrders"), icon: Utensils },
    { title: "Scheduled", url: createPageUrl("ScheduledRides"), icon: Calendar },
    { title: "Prime", url: createPageUrl("Prime"), icon: Star },
    { title: "Referrals", url: createPageUrl("Referrals"), icon: Gift },
    { title: "AI Assistant", url: createPageUrl("TextToOrder"), icon: Bot },
    { title: "Support", url: createPageUrl("Support"), icon: Headphones },
    { title: "My Rides", url: createPageUrl("MyRides"), icon: List },
    { title: "Profile", url: createPageUrl("Profile"), icon: UserIcon },
];

const driverNavItems = [
    { title: "Dashboard", url: createPageUrl("DriverDashboard"), icon: LayoutGrid },
    { title: "Schedule", url: createPageUrl("DriverScheduling"), icon: Calendar },
    { title: "Earnings", url: createPageUrl("DriverEarnings"), icon: Wallet },
    { title: "Referrals", url: createPageUrl("DriverReferrals"), icon: Gift },
    { title: "Trip History", url: createPageUrl("DriverRideHistory"), icon: History },
    { title: "Documents", url: createPageUrl("DriverDocuments"), icon: FileText },
    { title: "Profile", url: createPageUrl("DriverProfile"), icon: UserIcon },
    { title: "Settings", url: createPageUrl("DriverSettings"), icon: SettingsIcon },
];

const adminNavItems = [
    { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: LayoutGrid },
    { title: "User Management", url: createPageUrl("AdminUserManagement"), icon: Users },
    { title: "Ride Monitor", url: createPageUrl("AdminRideMonitor"), icon: Car },
    { title: "Document Review", url: createPageUrl("AdminDocumentReview"), icon: FileText },
    { title: "Support Panel", url: createPageUrl("AdminSupportPanel"), icon: MessageCircle },
    { title: "Analytics", url: createPageUrl("AdminAnalytics"), icon: TrendingUp },
    { title: "Feedback Insights", url: createPageUrl("AdminFeedbackAnalytics"), icon: ThumbsUp },
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [currentMode, setCurrentMode] = useState('rider');
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [lastMessageCheck, setLastMessageCheck] = useState(0);

    useEffect(() => {
        let isMounted = true;
        
        const fetchUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                if (isMounted) {
                    setUser(currentUser);
                    
                    const driverPages = ['DriverDashboard', 'DriverEarnings', 'DriverDocuments', 'DriverDiagnostics', 'DriverRideHistory', 'DriverProfile', 'DriverSettings', 'DriverScheduling'];
                    if (driverPages.includes(currentPageName)) {
                        setCurrentMode('driver');
                    } else {
                        setCurrentMode('rider');
                    }
                }
            } catch (error) {
                // User not logged in
            } finally {
                if (isMounted) {
                    setIsLoadingUser(false);
                }
            }
        };
        
        fetchUser();
        
        return () => {
            isMounted = false;
        };
    }, [currentPageName]);

    // FIXED: Better rate-limit handling for message polling
    useEffect(() => {
        if (isLoadingUser) {
            return;
        }

        if (!user?.id) {
            setUnreadMessagesCount(0);
            return;
        }

        let isMounted = true;
        let isChecking = false;

        const checkUnreadMessages = async () => {
            // Prevent concurrent checks
            if (isChecking || !isMounted) return;
            
            // Rate limiting: Don't check more than once every 20 seconds
            const now = Date.now();
            if (now - lastMessageCheck < 20000) {
                return;
            }
            
            isChecking = true;
            setLastMessageCheck(now);
            
            try {
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 8000)
                );

                // Only get rides with active messages (more efficient query)
                const recentRidesPromise = base44.entities.Ride.filter({
                    $or: [
                        { rider_id: user.id },
                        { driver_id: user.id }
                    ],
                    status: { $in: ['accepted', 'arriving', 'in_progress'] }
                }, '-created_date', 3);

                const rides = await Promise.race([
                    recentRidesPromise,
                    timeoutPromise
                ]).catch(() => []);

                if (!isMounted) return;

                if (!rides || rides.length === 0) {
                    setUnreadMessagesCount(0);
                    return;
                }

                const rideIds = rides.map(r => r.id).filter(Boolean);
                
                if (rideIds.length === 0) {
                    setUnreadMessagesCount(0);
                    return;
                }
                
                // Count unread messages
                const unreadMessagesPromise = base44.entities.RideMessage.filter({
                    ride_id: { $in: rideIds },
                    is_read: false,
                    sender_id: { $ne: user.id }
                });

                const unreadMessages = await Promise.race([
                    unreadMessagesPromise,
                    timeoutPromise
                ]).catch(() => []);

                if (isMounted) {
                    setUnreadMessagesCount(unreadMessages.length);
                }
            } catch (error) {
                // Silently handle rate limit errors
                if (error.message && error.message.includes('Rate limit')) {
                    console.log('[LAYOUT] Rate limit reached, will retry later');
                } else if (error.message && !error.message.includes('Timeout')) {
                    console.error('[LAYOUT] Error checking messages:', error.message);
                }
            } finally {
                isChecking = false;
            }
        };

        // Initial check after delay
        const initialTimeout = setTimeout(() => {
            if (isMounted) {
                checkUnreadMessages();
            }
        }, 2000);
        
        // Check every 30 seconds (reduced from 15)
        const interval = setInterval(() => {
            if (isMounted) {
                checkUnreadMessages();
            }
        }, 30000);

        return () => {
            isMounted = false;
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [user?.id, isLoadingUser, lastMessageCheck]);

    const handleModeChange = (newMode) => {
        setCurrentMode(newMode);
        if (newMode === 'driver') {
            navigate(createPageUrl('DriverDashboard'));
        } else {
            navigate(createPageUrl('Dashboard'));
        }
    };

    if (['Landing', 'KitchenTerminal', 'TrackRide'].includes(currentPageName)) {
        return <>{children}</>;
    }

    const isActive = (url) => location.pathname === url;
    const isBothUserType = user?.user_type === 'both';
    const isDriverMode = currentMode === 'driver';
    const isAdminUser = user?.role === 'admin' || user?.internal_role === 'admin' || user?.internal_role === 'support';
    const isDriverAvailable = user?.driver_info?.is_available || false;
    
    const navItems = isAdminUser && currentPageName.startsWith('Admin')
        ? adminNavItems
        : isDriverMode 
            ? driverNavItems 
            : riderNavItems;

    return (
        <div className="min-h-screen">
            {/* Desktop Sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:bg-gray-900 text-white lg:border-r border-gray-700">
                <div className="flex h-20 items-center justify-center p-3">
                    <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/f8c9e961e_PassageroruserInterface-appbase44com-20251016-22_16_13.png"
                            alt="Ride-ly" 
                            className="h-9 w-auto" 
                        />
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/9c466391c_RidelyredLogofile_01c38620ea6e26681e4ae899e1.png" 
                            alt="Logo" 
                            className="h-10 w-auto" 
                        />
                    </Link>
                </div>
                
                {isBothUserType && !isAdminUser && (
                    <div className="px-3 pb-4 border-b border-gray-700">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-1">
                            <button
                                onClick={() => handleModeChange(isDriverMode ? 'rider' : 'driver')}
                                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-md bg-gray-900 hover:bg-gray-800 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    {isDriverMode ? <Car className="w-5 h-5 text-blue-400" /> : <UserIcon className="w-5 h-5 text-purple-400" />}
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-white">
                                            {isDriverMode ? 'Driver Mode' : 'Rider Mode'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {isDriverMode ? (
                                                isDriverAvailable ? '🟢 Online' : '⚫ Offline'
                                            ) : 'Tap to switch'}
                                        </p>
                                    </div>
                                </div>
                                <RefreshCw className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}
                
                <nav className="flex-1 space-y-2 p-3 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.title}
                            to={item.url}
                            className={cn(
                                "flex items-center gap-4 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors relative",
                                isActive(item.url)
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                            )}
                        >
                            <item.icon className="h-6 w-6" />
                            <span>{item.title}</span>
                            {item.url === createPageUrl("AdminSupportPanel") && unreadMessagesCount > 0 && (
                                <Badge className="absolute top-1 right-2 bg-red-500 text-white px-2 py-0.5 text-[10px] min-w-[20px] h-5 flex items-center justify-center">
                                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                                </Badge>
                            )}
                        </Link>
                    ))}
                </nav>
                
                <div className="p-3 border-t border-gray-700/50">
                    <button
                        onClick={() => base44.auth.logout('/')}
                        className="flex items-center gap-4 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-900/40 hover:text-red-300 w-full"
                    >
                        <LogOut className="h-6 w-6" />
                        <span>Log Out</span>
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 text-white p-4 flex items-center justify-between h-20 border-b border-gray-700/50">
                <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68cb8e87d04ecc8a4e377985/f8c9e961e_PassageroruserInterface-appbase44com-20251016-22_16_13.png"
                        alt="Ride-ly" 
                        className="h-9 w-auto" 
                    />
                </Link>
                <div className="flex items-center gap-3">
                    <NotificationBell />
                    {unreadMessagesCount > 0 && (
                        <div className="relative">
                            <MessageCircle className="w-6 h-6 text-white" />
                            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-1.5 py-0.5 text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                            </Badge>
                        </div>
                    )}
                    {isBothUserType && !isAdminUser && (
                        <button
                            onClick={() => handleModeChange(isDriverMode ? 'rider' : 'driver')}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg",
                                isDriverMode 
                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                                    : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                            )}
                        >
                            {isDriverMode ? (
                                <>
                                    <Car className="w-3 h-3" />
                                    <span>Driver</span>
                                    {isDriverAvailable && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                                </>
                            ) : (
                                <>
                                    <UserIcon className="w-3 h-3" />
                                    <span>Rider</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 z-50 rounded-full shadow-2xl">
                <nav className="flex items-center justify-around gap-1 p-2">
                    {(isDriverMode ? [driverNavItems[0], driverNavItems[2], driverNavItems[5]] : [riderNavItems[0], riderNavItems[1], riderNavItems[6]]).map((item) => (
                        <Link
                            key={item.title}
                            to={item.url}
                            className={cn(
                                "flex flex-col items-center justify-center w-16 h-16 rounded-full transition-colors relative",
                                isActive(item.url) ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[9px] mt-1">{item.title.split(' ')[0]}</span>
                            {item.title === 'AI Assistant' && unreadMessagesCount > 0 && (
                                <Badge className="absolute top-0 right-2 bg-red-500 text-white px-1.5 py-0.5 text-[10px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
                                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                                </Badge>
                            )}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Floating Mode Switcher for Mobile */}
            {isBothUserType && !isAdminUser && (
                <div className="lg:hidden fixed bottom-24 right-4 z-50">
                    <motion.button
                        onClick={() => handleModeChange(isDriverMode ? 'rider' : 'driver')}
                        className={cn(
                            "w-16 h-16 rounded-full shadow-2xl flex flex-col items-center justify-center text-white transition-all",
                            isDriverMode 
                                ? "bg-gradient-to-br from-blue-600 to-blue-700" 
                                : "bg-gradient-to-br from-purple-600 to-purple-700"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isDriverMode ? (
                            <>
                                <UserIcon className="w-6 h-6" />
                                <span className="text-[9px] font-bold mt-1">Rider</span>
                                {isDriverAvailable && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                                )}
                            </>
                        ) : (
                            <>
                                <Car className="w-6 h-6" />
                                <span className="text-[9px] font-bold mt-1">Driver</span>
                            </>
                        )}
                    </motion.button>
                </div>
            )}

            <div className="lg:pl-64">
                <main className="pt-24 lg:pt-8 px-4 sm:px-6 lg:px-8 pb-28 lg:pb-8">{children}</main>
            </div>

            {/* Browser Notification Permission Prompt */}
            <BrowserNotificationManager />
        </div>
    );
}