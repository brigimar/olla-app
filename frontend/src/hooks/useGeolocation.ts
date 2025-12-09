// hooks/useGeolocation.ts
import { useState, useEffect, useCallback } from 'react';
import { Location, GeolocationError, GeolocationResult } from '@/types/hooks';

export const useGeolocation = (): GeolocationResult => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(GeolocationError.UNSUPPORTED);
      return;
    }

    setLoading(true);
    setError(null);

    const successCallback = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setLocation({
        lat: latitude,
        lng: longitude,
        source: 'auto',
      });
      setLoading(false);
    };

    const errorCallback = (err: GeolocationPositionError) => {
      let geolocationError: GeolocationError;

      switch (err.code) {
        case err.PERMISSION_DENIED:
          geolocationError = GeolocationError.PERMISSION_DENIED;
          break;
        case err.POSITION_UNAVAILABLE:
          geolocationError = GeolocationError.POSITION_UNAVAILABLE;
          break;
        case err.TIMEOUT:
          geolocationError = GeolocationError.TIMEOUT;
          break;
        default:
          geolocationError = GeolocationError.UNKNOWN;
      }

      setError(geolocationError);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    });
  }, []);

  // Auto-request on mount
  useEffect(() => {
    getCurrentLocation();
    // ✅ incluimos getCurrentLocation en dependencias
  }, [getCurrentLocation]);

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    clearLocation,
  };
};




