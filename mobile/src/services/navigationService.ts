import { NavigationRoute, NavigationStep } from '../types';

export interface PlaceSearchResult {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
}

class NavigationService {
  /**
   * Search arbitrary real-world destinations using OpenStreetMap Nominatim
   */
  public async searchPlace(
    query: string,
    currentLocation?: { latitude: number; longitude: number }
  ): Promise<PlaceSearchResult[]> {
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5&addressdetails=1`;

      if (currentLocation) {
        const { latitude, longitude } = currentLocation;
        url += `&viewbox=${longitude - 0.08},${latitude + 0.08},${longitude + 0.08},${latitude - 0.08}`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AccessPlusAccessibilityApp/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: item.type || 'place',
      }));
    } catch (error) {
      console.warn('[NavigationService] Geocoding fallback:', error);
      // Return a safe mock nearby destination if offline or network rate-limited
      return [
        {
          name: query,
          displayName: `${query} (Local approximation)`,
          latitude: currentLocation ? currentLocation.latitude + 0.002 : 12.9716,
          longitude: currentLocation ? currentLocation.longitude + 0.002 : 77.5946,
          type: 'poi',
        },
      ];
    }
  }

  /**
   * Calculate turn-by-turn pedestrian route using OSRM Foot Routing Engine
   */
  public async getWalkingRoute(
    start: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number; name: string }
  ): Promise<NavigationRoute | null> {
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
        return null;
      }

      const primaryRoute = data.routes[0];
      const rawSteps = primaryRoute.legs?.[0]?.steps || [];

      const parsedSteps: NavigationStep[] = rawSteps.map((step: any) => {
        let instruction = step.maneuver?.instruction || '';
        if (!instruction) {
          const type = step.maneuver?.type || 'continue';
          const modifier = step.maneuver?.modifier || '';
          const street = step.name ? `onto ${step.name}` : '';
          instruction = `${type.toUpperCase()} ${modifier} ${street} for ${Math.round(step.distance)} meters`.trim();
        }

        return {
          instruction,
          distanceMeters: Math.round(step.distance || 0),
          durationSeconds: Math.round(step.duration || 0),
          maneuverType: step.maneuver?.type || 'straight',
          modifier: step.maneuver?.modifier,
          location: step.maneuver?.location || [start.longitude, start.latitude],
        };
      });

      return {
        destinationName: destination.name,
        destinationCoord: { latitude: destination.latitude, longitude: destination.longitude },
        totalDistanceMeters: Math.round(primaryRoute.distance || 0),
        totalDurationSeconds: Math.round(primaryRoute.duration || 0),
        steps: parsedSteps,
        geometry: primaryRoute.geometry || { type: 'LineString', coordinates: [] },
      };
    } catch (error) {
      console.warn('[NavigationService] Route calculation error:', error);
      // Return straight line pedestrian step fallback
      return {
        destinationName: destination.name,
        destinationCoord: { latitude: destination.latitude, longitude: destination.longitude },
        totalDistanceMeters: 250,
        totalDurationSeconds: 180,
        steps: [
          {
            instruction: `Walk straight toward ${destination.name} for 250 meters.`,
            distanceMeters: 250,
            durationSeconds: 180,
            maneuverType: 'depart',
            location: [start.longitude, start.latitude],
          },
          {
            instruction: `You have arrived at ${destination.name}.`,
            distanceMeters: 0,
            durationSeconds: 0,
            maneuverType: 'arrive',
            location: [destination.longitude, destination.latitude],
          },
        ],
        geometry: {
          type: 'LineString',
          coordinates: [
            [start.longitude, start.latitude],
            [destination.longitude, destination.latitude],
          ],
        },
      };
    }
  }
}

export const navigationService = new NavigationService();
