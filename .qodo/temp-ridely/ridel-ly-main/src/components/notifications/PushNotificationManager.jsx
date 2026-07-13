import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Navigation,
  Clock,
  Star,
  Bell,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NOTIFICATION_SOUNDS = {
  ride_accepted: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  driver_arriving: 'https://assets.mixkit.co/active_storage/sfx/2462/2462-preview.mp3',
  ride_started: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  ride_completed: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  ride_cancelled: 'https://assets.mixkit.co/active_storage/sfx/2462/2462-preview.mp3',
  new_message: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'
};

const NotificationConfig = {
  ride_accepted: {
    icon: CheckCircle2,
    color: 'bg-gradient-to-r from-green-500 to-emerald-600',
    borderColor: 'border-green-500',
    title: '🚗 Driver On The Way!',
    subtitle: 'Your driver has accepted your ride',
    duration: 8000,
    vibrate: true
  },
  driver_arriving: {
    icon: MapPin,
    color: 'bg-gradient-to-r from-purple-500 to-purple-600',
    borderColor: 'border-purple-500',
    title: '📍 Driver Has Arrived!',
    subtitle: 'Head to the pickup point now',
    duration: 12000,
    vibrate: true
  },
  ride_started: {
    icon: Navigation,
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    title: '🛣️ Trip In Progress!',
    subtitle: 'Enjoy your ride',
    duration: 5000
  },
  ride_completed: {
    icon: Star,
    color: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    borderColor: 'border-yellow-500',
    title: '✅ Trip Complete!',
    subtitle: 'Thanks for riding with Ride-ly',
    duration: 10000
  },
  ride_cancelled: {
    icon: XCircle,
    color: 'bg-gradient-to-r from-red-500 to-red-600',
    borderColor: 'border-red-500',
    title: '❌ Ride Cancelled',
    subtitle: 'Your ride has been cancelled',
    duration: 6000
  },
  eta_update: {
    icon: Clock,
    color: 'bg-gradient-to-r from-orange-500 to-amber-500',
    borderColor: 'border-orange-500',
    title: '⏱️ ETA Updated',
    subtitle: 'Your arrival time has changed',
    duration: 5000
  }
};

export default function PushNotificationManager({ 
  rideId, 
  userType = 'rider',
  onRideStatusChange 
}) {
  const [notifications, setNotifications] = useState([]);
  const [lastStatus, setLastStatus] = useState(null);
  const audioRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!rideId) return;

    const pollRideStatus = async () => {
      if (!isMountedRef.current) return;

      try {
        const ride = await base44.entities.Ride.get(rideId);
        
        if (!isMountedRef.current) return;
        
        if (ride && ride.status !== lastStatus && lastStatus !== null) {
          // Status changed - trigger notification
          const notificationType = getNotificationType(ride.status, userType);
          
          if (notificationType) {
            triggerNotification(notificationType, ride);
          }
          
          onRideStatusChange?.(ride);
        }
        
        setLastStatus(ride?.status);
      } catch (error) {
        console.log('[NOTIFICATION] Poll error:', error.message);
      }
    };

    // Initial check
    pollRideStatus();
    
    // Poll every 3 seconds for real-time updates
    pollIntervalRef.current = setInterval(pollRideStatus, 3000);

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [rideId, lastStatus]);

  const getNotificationType = (status, userType) => {
    const statusMap = {
      accepted: 'ride_accepted',
      arriving: 'driver_arriving',
      in_progress: 'ride_started',
      completed: 'ride_completed',
      cancelled: 'ride_cancelled'
    };
    return statusMap[status];
  };

  const triggerNotification = (type, ride) => {
    const config = NotificationConfig[type];
    if (!config) return;

    // Play sound
    playNotificationSound(type);

    // Vibrate if supported and configured
    if (config.vibrate && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Add visual notification
    const notification = {
      id: `${type}-${Date.now()}`,
      type,
      ride,
      timestamp: new Date(),
      ...config
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after duration
    setTimeout(() => {
      if (isMountedRef.current) {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }
    }, config.duration);

    // Browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(config.title.replace(/[🚗📍🛣️✅❌⏱️]/g, '').trim(), {
        body: getNotificationBody(type, ride),
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: type === 'ride_completed' || type === 'driver_arriving'
      });
    }
  };

  const playNotificationSound = (type) => {
    try {
      const soundUrl = NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.ride_accepted;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(soundUrl);
      audioRef.current.volume = 0.7;
      audioRef.current.play().catch(e => console.log('Sound blocked'));
    } catch (e) {
      console.log('Sound error');
    }
  };

  const getNotificationBody = (type, ride) => {
    switch (type) {
      case 'ride_accepted':
        return `Your driver is on their way to ${ride.pickup_location?.address}`;
      case 'driver_arriving':
        return 'Your driver will arrive in about 2 minutes';
      case 'ride_started':
        return `Heading to ${ride.destination?.address}`;
      case 'ride_completed':
        return `Trip complete! Total: $${ride.fare?.total_fare?.toFixed(2) || '0.00'}`;
      case 'ride_cancelled':
        return 'Your ride has been cancelled';
      default:
        return '';
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = notification.icon;
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={cn(
                "bg-white rounded-xl shadow-2xl border-l-4 overflow-hidden",
                notification.borderColor
              )}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white",
                    notification.color
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 text-base">
                        {notification.title}
                      </h4>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {notification.subtitle && (
                      <p className="text-xs text-gray-500">{notification.subtitle}</p>
                    )}
                    <p className="text-sm text-gray-700 mt-1 font-medium">
                      {getNotificationBody(notification.type, notification.ride)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Progress bar for auto-dismiss */}
              <motion.div
                className={cn("h-1", notification.color)}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: notification.duration / 1000, ease: 'linear' }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}