import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Real-time location tracking hook
 */
export const useRealTimeLocation = (driverId, enabled = true) => {
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const isMountedRef = useRef(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!driverId || !enabled) {
      setIsTracking(false);
      return;
    }

    setIsTracking(true);
    
    const fetchLocation = async () => {
      if (!isMountedRef.current) return;
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 8000)
        );

        const locationsPromise = base44.entities.DriverLocation.filter({
          driver_id: driverId
        }, '-last_ping', 1);

        const locations = await Promise.race([
          locationsPromise,
          timeoutPromise
        ]).catch(() => []);

        if (isMountedRef.current && locations && locations.length > 0) {
          setLocation(locations[0]);
        }
      } catch (error) {
        // Silent fail
      }
    };

    // Initial fetch after delay
    const initialTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        fetchLocation();
      }
    }, 1000);
    
    // Poll every 5 seconds
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchLocation();
      }
    }, 5000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [driverId, enabled]);

  return {
    location,
    isTracking,
    isPredicted: false
  };
};

/**
 * Real-time ride status tracking
 */
export const useRealTimeRideStatus = (rideId, enabled = true) => {
  const [ride, setRide] = useState(null);
  const [previousStatus, setPreviousStatus] = useState(null);
  const [statusChanged, setStatusChanged] = useState(false);
  const isMountedRef = useRef(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!rideId || !enabled) {
      return;
    }

    const fetchRide = async () => {
      if (!isMountedRef.current) return;
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 8000)
        );

        const ridePromise = base44.entities.Ride.get(rideId);

        const updatedRide = await Promise.race([
          ridePromise,
          timeoutPromise
        ]).catch(() => null);

        if (!isMountedRef.current || !updatedRide) return;
        
        // Detect status change
        if (previousStatus && updatedRide.status !== previousStatus) {
          setStatusChanged(true);
          setTimeout(() => {
            if (isMountedRef.current) {
              setStatusChanged(false);
            }
          }, 3000);
        }
        
        setPreviousStatus(updatedRide.status);
        setRide(updatedRide);
      } catch (error) {
        // Silent fail
      }
    };

    // Initial fetch after delay
    const initialTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        fetchRide();
      }
    }, 1000);
    
    // Poll every 5 seconds
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchRide();
      }
    }, 5000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [rideId, enabled, previousStatus]);

  return {
    ride,
    statusChanged,
    isLoading: !ride
  };
};

/**
 * Dynamic ETA calculation
 */
export const useDynamicETA = (currentLocation, destination, rideId) => {
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const isMountedRef = useRef(true);
  const lastCalcRef = useRef(0);

  // Haversine distance calculation
  const calculateDistance = (from, to) => {
    if (!from || !to) return 0;
    
    const R = 6371; // Earth radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!currentLocation || !destination) {
      return;
    }

    const estimateETA = () => {
      if (!isMountedRef.current) return;
      
      try {
        const dist = calculateDistance(
          { lat: currentLocation.latitude, lng: currentLocation.longitude },
          { lat: destination.latitude, lng: destination.longitude }
        );
        
        if (!isMountedRef.current) return;
        
        setDistance(dist);
        
        // Use current speed if available, otherwise assume 40 km/h
        const speed = currentLocation.speed || 40;
        const estimatedMinutes = Math.max(1, Math.round((dist / speed) * 60));
        
        setEta({
          minutes: estimatedMinutes,
          distance: dist
        });
      } catch (error) {
        // Silent fail
      }
    };

    // Calculate immediately
    estimateETA();
    
    // Update every 10 seconds
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        estimateETA();
      }
    }, 10000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [currentLocation, destination]);

  return {
    eta,
    distance,
    formattedETA: eta ? `${eta.minutes} min` : 'Calculating...',
    formattedDistance: distance ? `${distance.toFixed(1)} km` : '...'
  };
};