import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { calculateDistanceMeters } from '../utils/geoUtils';
import { useAccessibility } from './AccessibilityContext';
import { outputService } from '../services/outputService';
import { backendService } from '../services/backendService';

interface LocationContextType {
  currentLocation: Location.LocationObject | null;
  locationPermissionGranted: boolean;
  isInsideSafeZone: boolean;
  distanceFromSafeZoneCenter: number | null;
  setSafeZone: (lat: number, lon: number, radiusMeters?: number) => void;
  requestLocationPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<Location.LocationObject | null>;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, updateUserProfile } = useAccessibility();
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isInsideSafeZone, setIsInsideSafeZone] = useState(true);
  const [distanceFromSafeZoneCenter, setDistanceFromSafeZoneCenter] = useState<number | null>(null);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermissionGranted(granted);
      if (granted) {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(loc);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Location permission request failed', err);
      return false;
    }
  };

  const refreshLocation = async (): Promise<Location.LocationObject | null> => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(loc);
      return loc;
    } catch (e) {
      console.warn('Failed to refresh location', e);
      return currentLocation;
    }
  };

  const setSafeZone = (lat: number, lon: number, radiusMeters: number = 50) => {
    updateUserProfile({
      safeZoneCenter: { latitude: lat, longitude: lon },
      safeZoneRadiusMeters: radiusMeters,
    });
  };

  // Safe-zone geofence check & telemetry dispatch
  const evaluateGeofence = useCallback(
    (loc: Location.LocationObject) => {
      const { latitude, longitude } = loc.coords;

      // Telemetry update to backend
      backendService.emitLocationUpdate({
        userId: userProfile.id,
        latitude,
        longitude,
        speed: loc.coords.speed || 0,
        heading: loc.coords.heading || 0,
      });

      if (userProfile.safeZoneCenter) {
        const dist = calculateDistanceMeters(
          latitude,
          longitude,
          userProfile.safeZoneCenter.latitude,
          userProfile.safeZoneCenter.longitude
        );
        setDistanceFromSafeZoneCenter(dist);

        const safeRadius = userProfile.safeZoneRadiusMeters || 50;
        const inside = dist <= safeRadius;
        if (!inside && isInsideSafeZone) {
          // Trigger Out-of-safe-zone Alert
          setIsInsideSafeZone(false);
          outputService.broadcastVisualAlert({
            title: 'Safe Zone Boundary Exceeded',
            message: `User is ${dist}m away from designated safe area.`,
            severity: 'warning',
            timestamp: new Date().toISOString(),
          });
          outputService.announce(`Warning: You are outside your ${safeRadius} meter safe area.`, 'high');
        } else if (inside && !isInsideSafeZone) {
          setIsInsideSafeZone(true);
        }
      }
    },
    [userProfile, isInsideSafeZone]
  );

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    const startLocationWatch = async () => {
      const granted = await requestLocationPermission();
      if (granted) {
        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 10,
          },
          (loc) => {
            setCurrentLocation(loc);
            evaluateGeofence(loc);
          }
        );
      }
    };

    startLocationWatch();

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        locationPermissionGranted,
        isInsideSafeZone,
        distanceFromSafeZoneCenter,
        setSafeZone,
        requestLocationPermission,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return context;
};
