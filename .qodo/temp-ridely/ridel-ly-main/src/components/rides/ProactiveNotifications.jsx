import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { AlertTriangle, Navigation, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

/**
 * Monitors ride for delays and route changes, sending proactive notifications
 */
export default function useProactiveNotifications(rideId, currentEta, originalEta) {
  const [delaysSent, setDelaysSent] = useState(new Set());
  const [routeChangesSent, setRouteChangesSent] = useState(new Set());
  const lastEtaRef = useRef(null);
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    if (!rideId || !currentEta || !originalEta) return;

    const checkForDelays = async () => {
      try {
        const currentMinutes = currentEta.minutes || 0;
        const originalMinutes = originalEta;

        // Delay detection: current ETA is significantly longer than original
        const delayMinutes = currentMinutes - originalMinutes;
        
        if (delayMinutes >= 5 && !delaysSent.has(`delay_${delayMinutes}`)) {
          // Fetch reason from ride
          const ride = await base44.entities.Ride.get(rideId);
          
          const delayReason = currentEta.route?.traffic_multiplier > 1.3
            ? 'Heavy traffic on current route'
            : currentEta.weather_condition && currentEta.weather_condition !== 'Clear'
              ? `Weather conditions: ${currentEta.weather_condition}`
              : 'Unexpected traffic conditions';

          // Send notification
          toast.warning(`Delay Alert: +${delayMinutes} min`, {
            description: delayReason,
            icon: <AlertTriangle className="w-5 h-5" />,
            duration: 8000
          });

          // Record delay notification
          const notifications = ride.delay_notifications_sent || [];
          await base44.entities.Ride.update(rideId, {
            delay_notifications_sent: [
              ...notifications,
              {
                timestamp: new Date().toISOString(),
                reason: delayReason,
                delay_minutes: delayMinutes
              }
            ]
          });

          setDelaysSent(prev => new Set([...prev, `delay_${delayMinutes}`]));
        }

        // ETA improvement notification
        if (lastEtaRef.current && currentMinutes < lastEtaRef.current - 3) {
          const improvement = lastEtaRef.current - currentMinutes;
          
          toast.success(`Great news! ETA improved by ${improvement} min`, {
            description: 'Faster route or reduced traffic',
            icon: <TrendingUp className="w-5 h-5" />,
            duration: 5000
          });
        }

        // Arrival soon notification
        if (currentMinutes <= 2 && currentMinutes > 0 && !delaysSent.has('arriving_soon')) {
          toast.info('Driver arriving in 2 minutes', {
            description: 'Please be ready at the pickup location',
            icon: <Navigation className="w-5 h-5" />,
            duration: 10000
          });
          
          setDelaysSent(prev => new Set([...prev, 'arriving_soon']));
        }

        lastEtaRef.current = currentMinutes;
      } catch (error) {
        console.error('Error checking for delays:', error);
      }
    };

    // Check immediately
    checkForDelays();

    // Check every 30 seconds
    checkIntervalRef.current = setInterval(checkForDelays, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [rideId, currentEta, originalEta, delaysSent]);

  return null;
}

/**
 * Status change notifications
 */
export function useStatusNotifications(ride, previousStatus) {
  useEffect(() => {
    if (!ride || !previousStatus || ride.status === previousStatus) return;

    const notifications = {
      accepted: {
        title: '✅ Driver Assigned!',
        description: 'Your driver is on the way to pick you up',
        icon: CheckCircle2,
        duration: 8000
      },
      arriving: {
        title: '🚗 Driver Arriving Soon',
        description: 'Your driver is almost at the pickup location',
        icon: Navigation,
        duration: 10000
      },
      in_progress: {
        title: '🎯 On Your Way!',
        description: 'Enjoy your ride to the destination',
        icon: TrendingUp,
        duration: 5000
      },
      completed: {
        title: '✨ Ride Completed',
        description: 'Thank you for riding with us!',
        icon: CheckCircle2,
        duration: 6000
      },
      cancelled: {
        title: '❌ Ride Cancelled',
        description: 'Your ride has been cancelled',
        icon: AlertTriangle,
        duration: 8000
      }
    };

    const notification = notifications[ride.status];
    if (notification) {
      toast.success(notification.title, {
        description: notification.description,
        icon: <notification.icon className="w-5 h-5" />,
        duration: notification.duration
      });
    }
  }, [ride?.status, previousStatus]);
}