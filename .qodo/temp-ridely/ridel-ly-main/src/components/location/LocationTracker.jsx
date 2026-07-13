import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

let locationWatcher = null;
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 60000; // Update every 60 seconds
let isUpdating = false;

export default function LocationTracker({ isEnabled }) {
  useEffect(() => {
    const startWatching = () => {
      if (!navigator.geolocation) {
        return;
      }

      if (locationWatcher) {
        navigator.geolocation.clearWatch(locationWatcher);
      }
      
      locationWatcher = navigator.geolocation.watchPosition(
        async (position) => {
          const now = Date.now();
          if (now - lastUpdateTime < UPDATE_INTERVAL || isUpdating) {
            return;
          }
          
          isUpdating = true;
          lastUpdateTime = now;

          try {
            await base44.auth.updateMe({
              driver_info: {
                current_location: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  last_updated: new Date().toISOString(),
                },
              },
            });
          } catch (error) {
            // Silent fail
          } finally {
            isUpdating = false;
          }
        },
        (error) => {
          // Silent fail
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    };

    const stopWatching = () => {
      if (locationWatcher) {
        navigator.geolocation.clearWatch(locationWatcher);
        locationWatcher = null;
      }
      isUpdating = false;
    };
    
    if (isEnabled) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => {
      stopWatching();
    };
  }, [isEnabled]);

  return null;
}