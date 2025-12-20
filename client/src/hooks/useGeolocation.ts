import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onPositionUpdate?: (position: GeolocationPosition) => void;
  onError?: (error: GeolocationPositionError) => void;
}

interface GeolocationState {
  position: GeolocationPosition | null;
  error: string | null;
  isLoading: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unsupported';
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    retryAttempts = 3,
    retryDelay = 2000,
    onPositionUpdate,
    onError,
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: false,
    permissionState: 'prompt',
  });

  const watchIdRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check permission status
  const checkPermission = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setState(prev => ({ ...prev, permissionState: 'unsupported' }));
      return 'unsupported';
    }

    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ ...prev, permissionState: result.state as any }));
        
        // Listen for permission changes
        result.onchange = () => {
          setState(prev => ({ ...prev, permissionState: result.state as any }));
        };
        
        return result.state;
      } catch (err) {
        console.warn('Permission API not available, will request directly');
        return 'prompt';
      }
    }

    return 'prompt';
  }, []);

  // Request permission with retry logic
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const permissionStatus = await checkPermission();
    
    if (permissionStatus === 'unsupported') {
      const errorMsg = 'Geolocation is not supported by your browser';
      setState(prev => ({ ...prev, error: errorMsg }));
      toast({
        variant: 'destructive',
        title: 'Geolocation Unavailable',
        description: errorMsg,
      });
      return false;
    }

    if (permissionStatus === 'denied') {
      const errorMsg = 'Location permission denied. Please enable it in your browser settings.';
      setState(prev => ({ ...prev, error: errorMsg }));
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: errorMsg,
        duration: 8000,
      });
      return false;
    }

    if (permissionStatus === 'granted') {
      return true;
    }

    // Permission is 'prompt', request it
    return new Promise((resolve) => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      navigator.geolocation.getCurrentPosition(
        () => {
          setState(prev => ({ ...prev, permissionState: 'granted', isLoading: false }));
          toast({
            title: 'Location Access Granted',
            description: 'Location tracking is now active',
          });
          resolve(true);
        },
        (error) => {
          setState(prev => ({ 
            ...prev, 
            permissionState: error.code === 1 ? 'denied' : 'prompt',
            isLoading: false,
            error: error.message,
          }));
          
          if (error.code === 1) {
            toast({
              variant: 'destructive',
              title: 'Permission Denied',
              description: 'Please enable location access in your browser settings',
              duration: 8000,
            });
          }
          
          resolve(false);
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }, [checkPermission, enableHighAccuracy, timeout, maximumAge, toast]);

  // Get current position with retry
  const getCurrentPosition = useCallback(async (): Promise<GeolocationPosition | null> => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;

    return new Promise((resolve, reject) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };

          setState(prev => ({ ...prev, position: pos, isLoading: false }));
          retryCountRef.current = 0;
          onPositionUpdate?.(pos);
          resolve(pos);
        },
        (error) => {
          if (retryCountRef.current < retryAttempts) {
            retryCountRef.current++;
            toast({
              title: 'Retrying location access',
              description: `Attempt ${retryCountRef.current} of ${retryAttempts}`,
            });

            retryTimeoutRef.current = setTimeout(() => {
              getCurrentPosition().then(resolve).catch(reject);
            }, retryDelay);
          } else {
            const errorMsg = error.message || 'Failed to get location';
            setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
            onError?.(error);
            reject(error);
          }
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }, [requestPermission, enableHighAccuracy, timeout, maximumAge, retryAttempts, retryDelay, onPositionUpdate, onError, toast]);

  // Start watching position
  const startWatching = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    if (watchIdRef.current !== null) {
      return; // Already watching
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const pos: GeolocationPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };

        setState(prev => ({ ...prev, position: pos, isLoading: false }));
        retryCountRef.current = 0;
        onPositionUpdate?.(pos);
      },
      (error) => {
        console.error('Geolocation error:', error);
        const errorMsg = error.message || 'Failed to watch location';
        setState(prev => ({ ...prev, error: errorMsg }));
        onError?.(error);

        // Auto-retry on timeout/position unavailable
        if (error.code === 3 || error.code === 2) {
          if (retryCountRef.current < retryAttempts) {
            retryCountRef.current++;
            toast({
              title: 'Location tracking interrupted',
              description: `Reconnecting... (${retryCountRef.current}/${retryAttempts})`,
            });
          }
        }
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [requestPermission, enableHighAccuracy, timeout, maximumAge, retryAttempts, onPositionUpdate, onError, toast]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setState(prev => ({ ...prev, isLoading: false }));
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    checkPermission();

    return () => {
      stopWatching();
    };
  }, [checkPermission, stopWatching]);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    requestPermission,
    isWatching: watchIdRef.current !== null,
  };
}
