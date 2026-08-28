import * as Location from 'expo-location';
import { ttsService } from './ttsService';
import { hapticService } from './hapticService';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type LocationErrorType =
  | 'PERMISSION_DENIED'
  | 'PERMISSION_PERMANENTLY_DENIED'
  | 'SERVICES_DISABLED'
  | 'POOR_ACCURACY'
  | 'LOCATION_UNAVAILABLE'
  | 'TIMEOUT';

export interface LocationResult {
  success: boolean;
  location?: LocationData;
  error?: LocationErrorType;
  spokenMessage: string;
}

class LocationService {
  private maxAcceptableAccuracyMeters: number = 65; // Threshold for acceptable GPS fix
  private lastKnownLocation: LocationData | null = null;

  /**
   * Request location permission on-demand with spoken blind accessibility guidance
   */
  public async ensureLocationPermission(): Promise<{ granted: boolean; error?: LocationErrorType; spokenMessage?: string }> {
    try {
      // 1. Check if location services are enabled globally on the device
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        return {
          granted: false,
          error: 'SERVICES_DISABLED',
          spokenMessage: 'Location services are turned off. Please turn on GPS in your phone settings.',
        };
      }

      // 2. Check existing permission status
      const currentPerm = await Location.getForegroundPermissionsAsync();
      if (currentPerm.status === Location.PermissionStatus.GRANTED) {
        return { granted: true };
      }

      // 3. Spoken prompt before triggering native permission dialog
      await ttsService.speak('I need your location to start navigation.');

      const requestedPerm = await Location.requestForegroundPermissionsAsync();
      if (requestedPerm.status === Location.PermissionStatus.GRANTED) {
        return { granted: true };
      }

      if (!requestedPerm.canAskAgain) {
        return {
          granted: false,
          error: 'PERMISSION_PERMANENTLY_DENIED',
          spokenMessage: 'Location permission was denied. Please enable location access in app settings.',
        };
      }

      return {
        granted: false,
        error: 'PERMISSION_DENIED',
        spokenMessage: 'I cannot find destinations without location permission.',
      };
    } catch (err) {
      console.warn('[LocationService] Permission check error:', err);
      return {
        granted: false,
        error: 'LOCATION_UNAVAILABLE',
        spokenMessage: 'Unable to check location permissions. Please try again.',
      };
    }
  }

  /**
   * Acquire a single accurate GPS fix on-demand for NavigationRequest
   */
  public async getCurrentLocation(timeoutMs: number = 10000): Promise<LocationResult> {
    const permission = await this.ensureLocationPermission();
    if (!permission.granted) {
      return {
        success: false,
        error: permission.error,
        spokenMessage: permission.spokenMessage || 'Location permission is required.',
      };
    }

    try {
      // Fetch high accuracy GPS fix
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: timeoutMs,
      });

      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = position.timestamp || Date.now();

      const locationData: LocationData = {
        latitude,
        longitude,
        accuracy: accuracy || 10,
        timestamp,
      };

      this.lastKnownLocation = locationData;

      // Check GPS Accuracy
      if (accuracy && accuracy > this.maxAcceptableAccuracyMeters) {
        console.warn(`[LocationService] Weak GPS accuracy: ${accuracy}m`);
        return {
          success: false,
          location: locationData,
          error: 'POOR_ACCURACY',
          spokenMessage: "Your GPS signal isn't accurate enough right now. Please move to an area with an open view of the sky.",
        };
      }

      // Subtle haptic confirmation when accurate location is acquired
      hapticService.light();

      return {
        success: true,
        location: locationData,
        spokenMessage: 'Location acquired.',
      };
    } catch (err) {
      console.warn('[LocationService] GPS fix error:', err);

      // Try fallback to last known location if recent (< 2 minutes)
      if (this.lastKnownLocation && Date.now() - this.lastKnownLocation.timestamp < 120000) {
        return {
          success: true,
          location: this.lastKnownLocation,
          spokenMessage: 'Using recent location.',
        };
      }

      return {
        success: false,
        error: 'LOCATION_UNAVAILABLE',
        spokenMessage: "I couldn't acquire your current GPS location. Please check your connection and try again.",
      };
    }
  }

  public getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }
}

export const locationService = new LocationService();
