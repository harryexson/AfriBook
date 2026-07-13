import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation,
  CheckCircle,
  X,
  Volume2,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from 'sonner';

export default function RideRequestNotification({ request, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResponding, setIsResponding] = useState(false);
  const audioRef = useRef(null);
  const soundTimeoutRef = useRef(null);

  useEffect(() => {
    // Create and play loud notification sound
    if (typeof window !== 'undefined') {
        try {
            const soundUrls = [
                'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
                'https://www.soundjay.com/phone/sounds/telephone-ring-1.mp3'
            ];
            
            audioRef.current = new Audio(soundUrls[0]);
            audioRef.current.loop = true;
            audioRef.current.volume = 1.0;
            
            const playPromise = audioRef.current.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('🔊 NOTIFICATION PLAYING');
                        soundTimeoutRef.current = setTimeout(() => {
                            if (audioRef.current) {
                                audioRef.current.pause();
                                audioRef.current.currentTime = 0;
                            }
                        }, 7000);
                    })
                    .catch(error => {
                        console.error('Audio play failed:', error);
                        audioRef.current.src = soundUrls[1];
                        audioRef.current.play().catch(e => console.log('Backup sound also failed'));
                    });
            }
        } catch (error) {
            console.error('Failed to create audio:', error);
        }
    }

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (soundTimeoutRef.current) {
            clearTimeout(soundTimeoutRef.current);
        }
    };
  }, []);

  useEffect(() => {
    if (!request?.expires_at) return;
    
    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(request.expires_at);
      const remaining = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0 && !isResponding) {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        onDecline(); 
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [request?.expires_at, onDecline, isResponding]);

  const handleAccept = async () => {
    setIsResponding(true);
    
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current);
    }

    try {
      const updatedRide = await base44.entities.Ride.update(request.ride_id, {
        driver_id: request.driver_id,
        status: "accepted",
        estimated_arrival: new Date(Date.now() + (request.estimated_duration || 5) * 60000).toISOString()
      });

      await base44.entities.RideRequest.update(request.id, {
        status: "accepted",
        response_time: new Date().toISOString()
      });

      try {
            await base44.functions.invoke('cancelOtherRequests', { 
                rideId: request.ride_id, 
                acceptedDriverId: request.driver_id 
            });
          } catch (e) {
            console.log('Could not cancel other requests');
          }

          try {
            await base44.functions.invoke('sendRideStatusNotification', { 
              rideId: request.ride_id,
              newStatus: 'accepted',
              recipientType: 'rider'
            });
          } catch (e) {
            console.log('Notification error (non-blocking)');
          }

            toast.success("Ride Accepted! Rider has been notified.");
            onAccept(updatedRide);

    } catch (error) {
      console.error('Error accepting ride:', error);
      toast.error("Could not accept ride.");
      setIsResponding(false);
      onDecline();
    }
  };

  const handleDecline = async () => {
    setIsResponding(true);
    
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current);
    }

    try {
      await base44.entities.RideRequest.update(request.id, {
        status: "declined",
        response_time: new Date().toISOString()
      });
      onDecline();
    } catch (error) {
      console.error('Error declining:', error);
    } finally {
      setIsResponding(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getTimerColor = () => {
    if (timeLeft > 30) return 'text-green-600';
    if (timeLeft > 15) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getProgressPercentage = () => {
    const totalTime = 60;
    return (timeLeft / totalTime) * 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] bg-black bg-opacity-80 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-md shadow-2xl border-4 border-green-500 overflow-hidden">
        {/* Timer Progress Bar */}
        <div className="h-2 bg-gray-200 overflow-hidden">
            <motion.div
                className={`h-full ${
                    timeLeft > 30 ? 'bg-green-500' :
                    timeLeft > 15 ? 'bg-yellow-500' :
                    'bg-red-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 0.5 }}
            />
        </div>
        
        <CardContent className="p-0">
          {/* Animated Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <Navigation className="w-10 h-10 text-white animate-bounce" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
            </div>
            <h2 className="text-2xl font-bold mb-2">🚗 NEW RIDE REQUEST!</h2>
            <div className="flex items-center justify-center gap-2 bg-white/20 rounded-full px-4 py-2 inline-flex">
              <Clock className="w-5 h-5" />
              <span className={`font-mono text-2xl font-bold ${timeLeft <= 15 ? 'animate-pulse' : ''} ${getTimerColor()}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Pulsing Indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pickup</p>
                  <p className="text-gray-900 font-semibold">{request.pickup_location?.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Destination</p>
                  <p className="text-gray-900 font-semibold">{request.destination?.address}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-semibold text-lg">{request.estimated_distance?.toFixed(1) || '5'} mi</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ETA</p>
                    <p className="font-semibold text-lg">{request.estimated_duration || '15'} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Earnings</p>
                    <p className="font-semibold text-lg text-green-600">${request.estimated_fare?.toFixed(2) || '10.00'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50 h-14 text-lg"
                onClick={handleDecline}
                disabled={isResponding}
              >
                <X className="w-5 h-5 mr-2" />
                Decline
              </Button>
              <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-14 text-xl font-bold shadow-lg"
                  onClick={handleAccept}
                  disabled={isResponding}
                >
                  <CheckCircle className="w-6 h-6 mr-2" />
                  {isResponding ? "..." : "ACCEPT"}
                </Button>
              </motion.div>
            </div>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              💡 Accept quickly to secure this ride
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}