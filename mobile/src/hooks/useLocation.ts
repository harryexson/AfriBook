// ─── useLocation Hook ────────────────────────────────────────
// GPS tracking for drivers and riders. Handles permissions,
// background tracking, and continuous location updates.
// ──────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';

interface LocationState {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: number;
}

interface UseLocationOptions {
  /** Update interval in milliseconds. */
  intervalMs?: number;
  /** Minimum distance (meters) between updates to reduce noise. */
  distanceFilter?: number;
  /** Whether to track in background. */
  backgroundTracking?: boolean;
  /** Enable high accuracy GPS. */
  highAccuracy?: boolean;
}

interface UseLocationReturn {
  /** Current location or null if not yet available. */
  location: LocationState | null;
  /** Whether location tracking is active. */
  isTracking: boolean;
  /** Permission status: 'undetermined' | 'granted' | 'denied'. */
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  /** Error message if tracking failed. */
  error: string | null;
  /** Start tracking. */
  startTracking: () => Promise<void>;
  /** Stop tracking. */
  stopTracking: () => void;
  /** Request permission. */
  requestPermission: () => Promise<boolean>;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const {
    intervalMs = 5000,
    distanceFilter = 10,
    backgroundTracking = false,
    highAccuracy = true,
  } = options;

  const [location, setLocation] = useState<LocationState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [error, setError] = useState<string | null>(null);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setPermissionStatus(granted ? 'granted' : 'denied');

    if (backgroundTracking) {
      const bgStatus = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus.status !== 'granted') {
        console.warn('[useLocation] Background permission denied');
      }
    }

    return granted;
  }, [backgroundTracking]);

  const startTracking = useCallback(async () => {
    try {
      setError(null);

      const granted = await requestPermission();
      if (!granted) {
        setError('Location permission denied');
        return;
      }

      // Start watching position
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: highAccuracy
            ? Location.Accuracy.High
            : Location.Accuracy.Balanced,
          distanceInterval: distanceFilter,
          timeInterval: intervalMs,
        },
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading ?? 0,
            speed: pos.coords.speed ?? 0,
            accuracy: pos.coords.accuracy ?? 0,
            timestamp: pos.timestamp,
          });
        },
      );

      setIsTracking(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
    }
  }, [requestPermission, highAccuracy, distanceFilter, intervalMs]);

  const stopTracking = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Handle app state changes (pause when backgrounded)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (appStateRef.current === 'active' && nextState !== 'active') {
          // App is going to background
          if (!backgroundTracking && watchRef.current) {
            watchRef.current.remove();
            watchRef.current = null;
          }
        } else if (appStateRef.current !== 'active' && nextState === 'active') {
          // App is coming to foreground
          if (!watchRef.current && isTracking) {
            startTracking();
          }
        }
        appStateRef.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [backgroundTracking, isTracking, startTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return {
    location,
    isTracking,
    permissionStatus,
    error,
    startTracking,
    stopTracking,
    requestPermission,
  };
}
