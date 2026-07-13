import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Star, Shield, Loader2, FileText, MessageCircle, Power, ChevronRight, TrendingUp, Clock, Navigation, Camera } from 'lucide-react';
import RideRequestNotification from '../components/driver/RideRequestNotification';
import ActiveRideMap from '../components/driver/ActiveRideMap';
import OnlineToggle from '../components/driver/OnlineToggle';
import ScheduleWidget from '../components/driver/ScheduleWidget';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { createPageUrl } from '@/utils';
import EnhancedActiveRideMap from '../components/driver/EnhancedActiveRideMap';
import SupportChatWidget from '../components/support/SupportChatWidget';
import PushNotificationManager from '../components/notifications/PushNotificationManager';
import FacialVerificationModal from '../components/driver/FacialVerificationModal';
import ScheduledRidesSection from '../components/driver/ScheduledRidesSection';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function DriverDashboard() {
    const [user, setUser] = useState(null);
    const [activeRide, setActiveRide] = useState(null);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [showFacialVerification, setShowFacialVerification] = useState(false);
        const [isVerified, setIsVerified] = useState(false);
        const [showProfileCamera, setShowProfileCamera] = useState(false);
        const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const newRequestSoundRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const messageCheckIntervalRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        
        const fetchInitialData = async () => {
            try {
                const currentUser = await base44.auth.me();
                if (!isMountedRef.current) return;
                
                if (!currentUser) {
                    setIsLoading(false);
                    return;
                }
                setUser(currentUser);

                // Check if facial verification is needed for this session
                const isDriver = currentUser.user_type === 'driver' || currentUser.user_type === 'both';
                const sessionVerified = sessionStorage.getItem(`facial_verified_${currentUser.id}`);
                
                if (isDriver && !sessionVerified) {
                    // Check if driver has approved license
                    const hasApprovedLicense = currentUser.driver_info?.documents_verified || false;
                    
                    if (hasApprovedLicense) {
                        setShowFacialVerification(true);
                    } else {
                        // No license yet, skip verification
                        setIsVerified(true);
                    }
                } else {
                    setIsVerified(true);
                }

                const activeRides = await base44.entities.Ride.filter({
                    driver_id: currentUser.id,
                    status: { $in: ['accepted', 'arriving', 'in_progress'] }
                }, '-created_date', 1).catch(() => []);

                if (isMountedRef.current && activeRides.length > 0) {
                    setActiveRide(activeRides[0]);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        fetchInitialData();
        
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Poll for unread messages
    useEffect(() => {
        if (!user?.id || !activeRide?.id) {
            setUnreadMessagesCount(0);
            if (messageCheckIntervalRef.current) {
                clearInterval(messageCheckIntervalRef.current);
                messageCheckIntervalRef.current = null;
            }
            return;
        }

        const checkUnreadMessages = async () => {
            if (!isMountedRef.current) return;
            
            try {
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                );

                const unreadMessagesPromise = base44.entities.RideMessage.filter({
                    ride_id: activeRide.id,
                    is_read: false,
                    sender_id: { $ne: user.id }
                });

                const unreadMessages = await Promise.race([
                    unreadMessagesPromise,
                    timeoutPromise
                ]).catch(() => []);

                if (isMountedRef.current) {
                    setUnreadMessagesCount(Array.isArray(unreadMessages) ? unreadMessages.length : 0);
                }
            } catch (error) {
                // Silently fail
                // console.error('Error checking unread messages:', error); // For debugging if needed
            }
        };

        // Initial check
        checkUnreadMessages();
        
        // Set up interval
        messageCheckIntervalRef.current = setInterval(checkUnreadMessages, 8000);

        return () => {
            if (messageCheckIntervalRef.current) {
                clearInterval(messageCheckIntervalRef.current);
                messageCheckIntervalRef.current = null;
            }
        };
    }, [user?.id, activeRide?.id]);

    useEffect(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        if (!user || activeRide || !user?.driver_info?.is_available) {
            setPendingRequest(null);
            return;
        }

        const pollForRequests = async () => {
            if (!isMountedRef.current) return;
            
            try {
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                );

                const requestsPromise = base44.entities.RideRequest.filter({
                    driver_id: user.id,
                    status: 'pending'
                }, '-created_date', 5);

                const allPendingRequests = await Promise.race([
                    requestsPromise,
                    timeoutPromise
                ]).catch(() => []);

                if (!isMountedRef.current) return;

                if (allPendingRequests.length > 0) {
                    const now = new Date();
                    const validRequests = allPendingRequests.filter(req => new Date(req.expires_at) > now);
                    
                    if (validRequests.length > 0) {
                        const latestRequest = validRequests[0];
                        
                        if (!pendingRequest || pendingRequest.id !== latestRequest.id) {
                            setPendingRequest(latestRequest);
                            toast.info("New ride request received!");

                            if (newRequestSoundRef.current) {
                                newRequestSoundRef.current.currentTime = 0;
                                newRequestSoundRef.current.play().catch(e => console.log("Sound failed"));
                            }
                        }
                    } else if (pendingRequest) {
                        setPendingRequest(null);
                    }
                } else if (pendingRequest) {
                    setPendingRequest(null);
                }
            } catch (error) {
                console.error("Poll error:", error);
            }
        };

        // Initial check after delay
        const initialTimeout = setTimeout(() => {
            if (isMountedRef.current) {
                pollForRequests();
            }
        }, 2000);

        // Set up interval
        pollingIntervalRef.current = setInterval(pollForRequests, 45000);

        return () => {
            clearTimeout(initialTimeout);
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [user, activeRide, pendingRequest]);

    const handleRideAccept = (acceptedRide) => {
        setActiveRide(acceptedRide);
        setPendingRequest(null);
        toast.success("Ride accepted!");
    };

    const handleRideDecline = () => {
        setPendingRequest(null);
        toast.info("Ride request declined.");
    };

    const handleRideUpdate = (updatedRide) => {
        if (updatedRide.status === 'completed' || updatedRide.status === 'cancelled') {
            setActiveRide(null);
            if (updatedRide.status === 'completed') {
                toast.success("Ride completed successfully!");
            } else {
                toast.info("Ride was cancelled.");
            }
        } else {
            setActiveRide(updatedRide);
        }
    };

    const handleStatusChange = async (newStatus) => {
        // Refresh user data after status change
        try {
            const updatedUser = await base44.auth.me();
            if (isMountedRef.current) {
                setUser(updatedUser);
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const isOnline = user?.driver_info?.is_available || false;

    const handleVerificationComplete = () => {
        setShowFacialVerification(false);
        setIsVerified(true);
        if (user?.id) {
            sessionStorage.setItem(`facial_verified_${user.id}`, 'true');
        }
        toast.success('Identity verified! Welcome back.');
    };

    const handleProfilePhotoUpload = async (file) => {
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            await base44.auth.updateMe({ profile_photo: file_url });
            const updatedUser = await base44.auth.me();
            setUser(updatedUser);
            toast.success('Profile photo updated!');
        } catch (error) {
            toast.error('Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
            </div>
        );
    }

    // Show facial verification modal if needed
    if (showFacialVerification && !isVerified && user) {
        return (
            <>
                <Toaster richColors />
                <FacialVerificationModal
                    isOpen={showFacialVerification}
                    onVerified={handleVerificationComplete}
                    onClose={() => {}}
                    user={user}
                />
                <div className="flex items-center justify-center h-screen bg-gray-100">
                    <Card className="max-w-md mx-4 text-center">
                        <CardContent className="p-8">
                            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                            <h2 className="text-xl font-bold mb-2">Identity Verification Required</h2>
                            <p className="text-gray-600">Please complete facial verification to access the driver dashboard.</p>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    if (!user || (user.user_type !== 'driver' && user.user_type !== 'both')) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Driver Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>This area is for registered drivers only.</p>
                    <Button 
                        onClick={() => window.location.href = createPageUrl('DriverOnboarding')}
                        className="mt-4"
                    >
                        Complete Driver Onboarding
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Toaster richColors />
            
            {/* Push Notification Manager for incoming ride requests */}
            {activeRide && (
                <PushNotificationManager 
                    rideId={activeRide.id}
                    userType="driver"
                    onRideStatusChange={(updatedRide) => {
                        if (updatedRide.status === 'cancelled') {
                            setActiveRide(null);
                            toast.info('Ride was cancelled by rider');
                        } else {
                            setActiveRide(updatedRide);
                        }
                    }}
                />
            )}

            {pendingRequest && (
                <RideRequestNotification
                    request={pendingRequest}
                    onAccept={handleRideAccept}
                    onDecline={handleRideDecline}
                />
            )}

            {/* Modern Header with Profile */}
            <div className="bg-black text-white px-4 pt-2 pb-6 rounded-b-3xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center border-2 border-white/20">
                                {user.profile_photo ? (
                                    <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl font-bold">{user.full_name?.charAt(0) || 'D'}</span>
                                )}
                            </div>
                            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="user"
                                    className="hidden"
                                    onChange={(e) => handleProfilePhotoUpload(e.target.files[0])}
                                    disabled={uploadingPhoto}
                                />
                                {uploadingPhoto ? (
                                    <Loader2 className="w-3 h-3 text-black animate-spin" />
                                ) : (
                                    <Camera className="w-3 h-3 text-black" />
                                )}
                            </label>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs">Welcome back</p>
                            <h2 className="text-lg font-bold">{user.full_name?.split(' ')[0] || 'Driver'}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-sm">{user.average_rating?.toFixed(1) || '5.0'}</span>
                        </div>
                    </div>
                </div>

                {/* Online Status Toggle */}
                {!activeRide && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-500' : 'bg-gray-600'}`}>
                                    {isOnline ? (
                                        <Navigation className="w-6 h-6 text-white" />
                                    ) : (
                                        <Power className="w-6 h-6 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {isOnline ? 'You\'re Online' : 'You\'re Offline'}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {isOnline ? 'Accepting ride requests' : 'Go online to start earning'}
                                    </p>
                                </div>
                            </div>
                            {isOnline && (
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Quick Toggle Button (Floating) */}
            {!activeRide && (
                <div className="px-4 -mt-4 relative z-10">
                    <OnlineToggle user={user} onStatusChange={handleStatusChange} />
                </div>
            )}

            {activeRide ? (
                <div className="px-4 py-4">
                    <EnhancedActiveRideMap ride={activeRide} onRideUpdate={handleRideUpdate} />
                </div>
            ) : (
                <div className="px-4 py-4 space-y-4">
                    {/* Earnings Summary Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-white shadow-sm border-0 overflow-hidden">
                            <CardContent className="p-0">
                                <Link to={createPageUrl('DriverEarnings')} className="block">
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                <Wallet className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-sm">Today's Earnings</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    ${user.driver_info?.today_earnings?.toFixed(2) || '0.00'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Trips</p>
                                                <p className="font-bold text-lg">{user.driver_info?.today_rides || 0}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-3 gap-3"
                    >
                        <Card className="bg-white shadow-sm border-0">
                            <CardContent className="p-4 text-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-xl font-bold">{user.driver_info?.acceptance_rate || 92}%</p>
                                <p className="text-xs text-gray-500">Acceptance</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white shadow-sm border-0">
                            <CardContent className="p-4 text-center">
                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Star className="w-5 h-5 text-yellow-600" />
                                </div>
                                <p className="text-xl font-bold">{user.average_rating?.toFixed(1) || '5.0'}</p>
                                <p className="text-xs text-gray-500">Rating</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white shadow-sm border-0">
                            <CardContent className="p-4 text-center">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Shield className="w-5 h-5 text-purple-600" />
                                </div>
                                <p className="text-xl font-bold">{user.driver_info?.safety_score || 98}</p>
                                <p className="text-xs text-gray-500">Safety</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Scheduled Rides Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <ScheduledRidesSection driverId={user.id} />
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="bg-white shadow-sm border-0">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <Link to={createPageUrl('DriverEarnings')} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                            <Wallet className="w-5 h-5 text-green-600" />
                                        </div>
                                        <span className="text-xs text-gray-700 text-center">Earnings</span>
                                    </Link>
                                    <Link to={createPageUrl('RideHistory')} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="text-xs text-gray-700 text-center">History</span>
                                    </Link>
                                    <Link to={createPageUrl('Support')} className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                                            <MessageCircle className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <span className="text-xs text-gray-700 text-center">Support</span>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Schedule Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <ScheduleWidget driverId={user.id} />
                    </motion.div>
                </div>
            )}
            
            {/* Add Support Chat Widget */}
            <SupportChatWidget userType="driver" />
        </div>
    );
}