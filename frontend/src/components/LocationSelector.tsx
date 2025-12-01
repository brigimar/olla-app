// LocationSelector.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Location, PartidoAMBA } from '@/types/location';
import { PARTIDOS_AMBA } from '@/constants/partidos';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface LocationSelectorProps {
  onLocationChange: (location: Location) => void;
  initialLocation?: Location;
  showSelector?: boolean;
}

const STORAGE_KEY = 'olla_app_location';

const LocationSelector = ({
  onLocationChange,
  initialLocation,
  showSelector = true
}: LocationSelectorProps) => {
  const [location, setLocation] = useLocalStorage<Location | null>(
    STORAGE_KEY, 
    initialLocation || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualPartido, setManualPartido] = useState<string | null>(null);
  const [showManualSelector, setShowManualSelector] = useState(false);

  // Initialize from localStorage or initial prop
  useEffect(() => {
    if (initialLocation && !location) {
      setLocation(initialLocation);
      onLocationChange(initialLocation);
    } else if (location) {
      onLocationChange(location);
    }
  }, [initialLocation, location, setLocation, onLocationChange]);

  // Determine partido from coordinates using point-in-polygon
  const findPartidoFromCoords = useCallback((lat: number, lng: number): PartidoAMBA | null => {
    for (const partido of PARTIDOS_AMBA) {
      if (isPointInPolygon([lat, lng], partido.poligono)) {
        return partido;
      }
    }
    return null;
  }, []);

  // Point-in-polygon algorithm (ray casting)
  const isPointInPolygon = ([lat, lng]: [number, number], polygon: [number, number][]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      const intersect = ((yi > lat) !== (yj > lat)) && 
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Handle geolocation success
  const handleGeolocationSuccess = (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    const partido = findPartidoFromCoords(latitude, longitude);
    
    const newLocation: Location = {
      lat: latitude,
      lng: longitude,
      partido: partido?.nombre,
      source: 'auto'
    };
    
    setLocation(newLocation);
    onLocationChange(newLocation);
    setLoading(false);
    setError(null);
    setShowManualSelector(false);
  };

  // Handle geolocation errors
  const handleGeolocationError = (error: GeolocationPositionError) => {
    console.warn('Geolocation error:', error);
    setLoading(false);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setError('Permiso de ubicación denegado');
        break;
      case error.POSITION_UNAVAILABLE:
        setError('Ubicación no disponible');
        break;
      case error.TIMEOUT:
        setError('Tiempo de espera agotado');
        break;
      default:
        setError('Error al obtener ubicación');
    }
    
    // Fallback to manual selection
    setShowManualSelector(true);
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      setShowManualSelector(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      handleGeolocationSuccess,
      handleGeolocationError,
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 300000 
      }
    );
  };

  // Handle manual partido selection
  const handlePartidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const partidoId = e.target.value;
    if (!partidoId) {
      setManualPartido(null);
      return;
    }
    
    const partido = PARTIDOS_AMBA.find(p => p.id === partidoId);
    if (partido) {
      const [lat, lng] = partido.coordenadas_centro;
      const newLocation: Location = {
        lat,
        lng,
        partido: partido.nombre,
        source: 'manual'
      };
      
      setManualPartido(partidoId);
      setLocation(newLocation);
      onLocationChange(newLocation);
    }
  };

  // Initialize on mount
  useEffect(() => {
    // Only auto-request geolocation if no initial location
    if (!initialLocation && !location) {
      getCurrentLocation();
    } else if (location?.source === 'manual') {
      setShowManualSelector(true);
      const partido = PARTIDOS_AMBA.find(p => p.nombre === location.partido);
      if (partido) setManualPartido(partido.id);
    }
  }, []);

  // Reset to automatic mode
  const useCurrentLocation = () => {
    getCurrentLocation();
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          {showSelector && (
            <div className="relative">
              <select
                value={manualPartido || ''}
                onChange={handlePartidoChange}
                disabled={!showManualSelector}
                className={`w-full px-4 py-3 pr-10 rounded-xl border ${
                  showManualSelector 
                    ? 'bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500' 
                    : 'bg-gray-100 border-gray-200 cursor-not-allowed'
                } focus:outline-none focus:ring-1`}
              >
                <option value="">Seleccionar partido</option>
                {PARTIDOS_AMBA.map(partido => (
                  <option key={partido.id} value={partido.id}>
                    {partido.nombre}
                  </option>
                ))}
              </select>
              
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-xl">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <svg 
            className={`h-5 w-5 ${loading ? 'animate-pulse' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Usar mi ubicación
        </button>
      </div>
      
      {(error || location) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {error && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </span>
          )}
          
          {location && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              location.source === 'auto' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {location.source === 'auto' ? (
                <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              ) : (
                <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {location.partido || 'Ubicación detectada'}
            </span>
          )}
        </div>
      )}
      
      {showManualSelector && !location && (
        <p className="mt-2 text-sm text-gray-600">
          Selecciona tu partido manualmente para continuar
        </p>
      )}
    </div>
  );
};

export default LocationSelector;