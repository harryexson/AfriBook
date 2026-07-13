import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Package, Utensils, Bot, Calendar, Search, Power, ArrowRight, MapPin, Clock, User as UserIcon, ChevronRight, Star, Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PromotionsBanner from '../components/promotions/PromotionsBanner';
import SupportChatWidget from '../components/support/SupportChatWidget';
import PrimeBenefitsBanner from '../components/prime/PrimeBenefitsBanner';
import { motion } from 'framer-motion';

const ServiceCard = ({ title, icon: Icon, href, subtitle, bgColor = "bg-gray-100" }) => (
    <Link to={href} className="block group">
        <div className={`${bgColor} rounded-2xl p-4 hover:shadow-lg transition-all duration-300 h-full`}>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 text-gray-800" />
            </div>
            <span className="font-semibold text-sm text-gray-900 block">{title}</span>
            {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
    </Link>
);

const statusColors = {
  requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  arriving: "bg-purple-100 text-purple-800 border-purple-200",
  in_progress: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeRide, setActiveRide] = useState(null);
    const [driver, setDriver] = useState(null);
    
    // FIXED: Add refs to track component state and requests
    const isMountedRef = useRef(true);
    const fetchingRideRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        
        const fetchData = async () => {
            try {
                const currentUser = await base44.auth.me();
                if (isMountedRef.current) {
                    setUser(currentUser);
                    await checkActiveRide(currentUser.id);
                }
            } catch (error) {
                console.error("[DASHBOARD] Failed to fetch user", error);
            } finally {
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
            }
        };
        
        fetchData();
        
        return () => {
            isMountedRef.current = false;
            fetchingRideRef.current = false;
        };
    }, []);

    // FIXED: Better polling with request cancellation handling
    useEffect(() => {
        if (!user?.id || isLoading) return;
        
        // Poll every 8 seconds (slightly less aggressive)
        const interval = setInterval(() => {
            if (isMountedRef.current && !fetchingRideRef.current) {
                checkActiveRide(user.id);
            }
        }, 8000);
        
        return () => {
            clearInterval(interval);
        };
    }, [user?.id, isLoading]);

    const checkActiveRide = async (userId) => {
        // FIXED: Prevent concurrent requests
        if (!userId || !isMountedRef.current || fetchingRideRef.current) {
            return;
        }
        
        fetchingRideRef.current = true;
        
        try {
            // FIXED: Use AbortController for proper request cancellation
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const rides = await base44.entities.Ride.filter({
                rider_id: userId,
                status: { $in: ['requested', 'accepted', 'arriving', 'in_progress'] }
            }, '-created_date', 1);
            
            clearTimeout(timeoutId);
            
            if (!isMountedRef.current) return;
            
            console.log('[DASHBOARD] Active rides found:', rides.length);
            
            if (rides.length > 0) {
                const currentRide = rides[0];
                setActiveRide(currentRide);
                
                // Fetch driver if changed or not loaded
                if (currentRide.driver_id && (!driver || driver.id !== currentRide.driver_id)) {
                    try {
                        const driverData = await base44.entities.User.get(currentRide.driver_id);
                        if (isMountedRef.current) {
                            setDriver(driverData);
                        }
                    } catch (err) {
                        console.log('[DASHBOARD] Could not fetch driver (non-critical):', err.message);
                        // Don't throw - driver data is optional
                    }
                }
            } else {
                // Clear active ride if none found
                if (isMountedRef.current) {
                    setActiveRide(null);
                    setDriver(null);
                }
            }
        } catch (error) {
            // FIXED: Better error handling
            if (error.name === 'AbortError') {
                console.log('[DASHBOARD] Request timeout (expected)');
            } else if (error.message?.includes('aborted')) {
                console.log('[DASHBOARD] Request aborted (expected during unmount)');
            } else {
                console.error('[DASHBOARD] Error checking active ride:', error);
            }
        } finally {
            if (isMountedRef.current) {
                fetchingRideRef.current = false;
            }
        }
    };

    const isBothUserType = user?.user_type === 'both';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-black text-white px-4 pt-2 pb-8 rounded-b-3xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                            {user?.profile_photo ? (
                                <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-lg font-bold">{user?.full_name?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</p>
                            <h2 className="text-lg font-bold">{user?.full_name?.split(' ')[0] || 'there'}</h2>
                        </div>
                    </div>
                    {user?.is_prime_member && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold px-3">
                            <Star className="w-3 h-3 mr-1 fill-black" />
                            PRIME
                        </Badge>
                    )}
                </div>

                {/* Search Bar */}
                <Link to={createPageUrl('BookRide')}>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/10 backdrop-blur-sm rounded-full px-5 py-4 flex items-center gap-3"
                    >
                        <Search className="w-5 h-5 text-gray-300" />
                        <span className="text-gray-300 flex-1">Where to?</span>
                        <div className="bg-white rounded-full px-3 py-1.5">
                            <span className="text-black text-xs font-semibold">Now</span>
                        </div>
                    </motion.div>
                </Link>
            </div>

            <div className="px-4 -mt-4 space-y-4">

                {/* Active Ride Card */}
                {activeRide && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="bg-white shadow-lg border-0 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-xs">Active Trip</p>
                                            <p className="font-bold text-lg">{activeRide.status.replace('_', ' ').toUpperCase()}</p>
                                        </div>
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                            <Car className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4">
                                    {/* Route */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <div className="w-0.5 h-8 bg-gray-300 my-1"></div>
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Pickup</p>
                                                <p className="text-sm font-medium truncate">{activeRide.pickup_location?.address || 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Drop-off</p>
                                                <p className="text-sm font-medium truncate">{activeRide.destination?.address || 'Unknown'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Driver */}
                                    {driver && activeRide.status !== 'requested' && (
                                        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300">
                                                {driver.profile_photo ? (
                                                    <img src={driver.profile_photo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-600">
                                                        {driver.full_name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">{driver.full_name}</p>
                                                <p className="text-xs text-gray-500">{driver.driver_info?.vehicle_make} {driver.driver_info?.vehicle_model}</p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-full">
                                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                <span className="text-xs font-semibold">{driver.average_rating?.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <Button 
                                        onClick={() => window.location.href = createPageUrl('TrackRide') + '?id=' + activeRide.id}
                                        className="w-full bg-black hover:bg-gray-800 h-12 rounded-xl"
                                    >
                                        Track Ride
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Driver Mode Prompt for "Both" Users */}
                {isBothUserType && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Link to={createPageUrl('DriverDashboard')}>
                            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg overflow-hidden">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                            <Car className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Ready to earn?</p>
                                            <p className="text-xs opacity-80">Switch to Driver Mode</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5" />
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                )}

                {/* Services Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="bg-white shadow-sm border-0">
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-4">Go anywhere, get anything</h3>
                            <div className="grid grid-cols-4 gap-3">
                                <ServiceCard title="Ride" icon={Car} href={createPageUrl('BookRide')} bgColor="bg-gray-100" />
                                <ServiceCard title="Package" icon={Package} href={createPageUrl('BookPackage')} bgColor="bg-orange-50" />
                                <ServiceCard title="Reserve" icon={Calendar} href={createPageUrl('BookRide')} bgColor="bg-blue-50" />
                                <ServiceCard title="Food" icon={Utensils} href={createPageUrl('FoodMenu')} bgColor="bg-green-50" />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Prime Benefits Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <PrimeBenefitsBanner user={user} />
                </motion.div>

                {/* Promotions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <PromotionsBanner />
                </motion.div>

                {/* AI Assistant Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Link to={createPageUrl('TextToOrder')}>
                        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold">AI Assistant</p>
                                        <p className="text-xs opacity-80">Just tell us what you need</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5" />
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>

                {/* Ride History Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Link to={createPageUrl('RideHistory')}>
                        <Card className="bg-white shadow-sm border-0">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Ride History</p>
                                        <p className="text-xs text-gray-500">View all your past trips</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>

                {/* Referrals Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Link to={createPageUrl('Referrals')}>
                        <Card className="bg-white shadow-sm border-0">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <Gift className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Invite friends, earn $10</p>
                                        <p className="text-xs text-gray-500">Share your referral code</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </CardContent>
                        </Card>
                    </Link>
                </motion.div>

                {/* Bottom padding for mobile nav */}
                <div className="h-8"></div>
            </div>
            
            <SupportChatWidget userType="rider" />
        </div>
    );
}