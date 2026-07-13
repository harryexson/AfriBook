import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Power, Loader2, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function OnlineToggle({ user, onStatusChange }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const isOnline = user?.driver_info?.is_available || false;

    const handleToggle = async () => {
        setIsUpdating(true);
        try {
            const newStatus = !isOnline;
            await base44.auth.updateMe({
                driver_info: {
                    ...user.driver_info,
                    is_available: newStatus
                }
            });
            
            toast.success(newStatus ? '✅ You are now ONLINE - Ready to accept rides!' : '⏸️ You are now OFFLINE - Not accepting rides');
            onStatusChange(newStatus);
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Could not update your status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <Card className={`border-2 shadow-xl ${isOnline ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400' : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-400'}`}>
                <CardContent className="p-8">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}>
                                <Power className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {isOnline ? 'You are ONLINE' : 'You are OFFLINE'}
                                </h3>
                                <p className="text-base text-gray-600 mt-1">
                                    {isOnline ? 'Accepting ride requests' : 'Not accepting ride requests'}
                                </p>
                            </div>
                            {isOnline && (
                                <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-semibold text-green-700">ACTIVE</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Enhanced Large Slider Toggle */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleToggle}
                                disabled={isUpdating}
                                className={`relative w-full h-20 rounded-full transition-all duration-300 shadow-lg ${
                                    isOnline 
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/50' 
                                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl cursor-pointer transform hover:scale-[1.02]'}`}
                            >
                                <motion.div
                                    className="absolute top-2 bottom-2 w-32 bg-white rounded-full shadow-2xl flex items-center justify-center"
                                    initial={false}
                                    animate={{
                                        left: isOnline ? 'calc(100% - 8.5rem)' : '0.5rem'
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30
                                    }}
                                >
                                    {isUpdating ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                                    ) : (
                                        <span className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            {isOnline ? (
                                                <>
                                                    <Activity className="w-5 h-5 text-green-600" />
                                                    ON
                                                </>
                                            ) : (
                                                <>
                                                    <Power className="w-5 h-5 text-gray-600" />
                                                    OFF
                                                </>
                                            )}
                                        </span>
                                    )}
                                </motion.div>
                                
                                {/* Text Labels */}
                                <div className="absolute inset-0 flex items-center justify-between px-8 pointer-events-none">
                                    <span className={`text-lg font-semibold transition-opacity ${!isOnline ? 'opacity-0' : 'opacity-100 text-white'}`}>
                                        GO OFFLINE
                                    </span>
                                    <span className={`text-lg font-semibold transition-opacity ${isOnline ? 'opacity-0' : 'opacity-100 text-white'}`}>
                                        GO ONLINE
                                    </span>
                                </div>
                            </button>
                        </div>
                        
                        {isOnline && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="pt-4 border-t-2 border-green-200"
                            >
                                <div className="flex items-center gap-3 text-green-700">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-lg font-semibold">Looking for ride requests nearby...</span>
                                </div>
                                <div className="mt-3 bg-green-100 rounded-lg p-3">
                                    <p className="text-sm text-green-800">
                                        💡 <strong>Tip:</strong> Stay in high-demand areas for more ride requests. Check the surge map to find busy zones!
                                    </p>
                                </div>
                            </motion.div>
                        )}
                        
                        {!isOnline && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="pt-4 border-t-2 border-gray-200"
                            >
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-sm text-blue-800 mb-2">
                                        <strong>Ready to start earning?</strong>
                                    </p>
                                    <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                                        <li>Toggle "GO ONLINE" to accept ride requests</li>
                                        <li>You'll receive notifications when nearby riders need a ride</li>
                                        <li>Accept requests within 15 seconds for best results</li>
                                    </ul>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}