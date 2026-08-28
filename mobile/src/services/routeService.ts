import { NavigationRequest, Destination } from './destinationResolver';
import { LocationData, locationService } from './locationService';
import { hapticService } from './hapticService';

export type NavigationState =
  | 'IDLE'
  | 'REQUESTING_LOCATION'
  | 'RESOLVING_DESTINATION'
  | 'CALCULATING_ROUTE'
  | 'ROUTE_READY'
  | 'NAVIGATING'
  | 'ARRIVED'
  | 'ERROR';

export interface RouteStep {
  instruction: string;
  maneuver: string;
  modifier?: string;
  distanceMeters: number;
  durationSeconds: number;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  bearing?: number;
  streetName?: string;
}

export interface RouteResult {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number; name: string; address?: string };
  distanceMeters: number;
  formattedDistance: string;
  durationSeconds: number;
  formattedDuration: string;
  steps: RouteStep[];
  geometry?: [number, number][]; // [longitude, latitude] coordinates
  provider: 'OSRM_FOOT_DE' | 'OSRM_FOOT_ORG';
  timestamp: number;
  spokenSummary: string;
}

export interface RouteCalculationResult {
  success: boolean;
  state: NavigationState;
  routeResult?: RouteResult;
  spokenMessage: string;
  error?: string;
}

class RouteService {
  private currentState: NavigationState = 'IDLE';
  private currentAbortController: AbortController | null = null;
  private activeRoute: RouteResult | null = null;

  public getState(): NavigationState {
    return this.currentState;
  }

  public getActiveRoute(): RouteResult | null {
    return this.activeRoute;
  }

  /**
   * Cancel ongoing route calculation or reset navigation state
   */
  public cancel(): void {
    if (this.currentAbortController) {
      try {
        this.currentAbortController.abort();
      } catch {
        // ignore
      }
      this.currentAbortController = null;
    }
    this.currentState = 'IDLE';
    this.activeRoute = null;
  }

  /**
   * Format meters into natural speech for blind users
   */
  public formatDistance(meters: number): string {
    if (meters < 50) {
      return 'less than 50 meters';
    }
    if (meters < 1000) {
      const rounded = Math.round(meters / 10) * 10;
      return `${rounded} meters`;
    }
    const km = (meters / 1000).toFixed(1);
    return `${km} kilometers`;
  }

  /**
   * Format seconds into natural speech for blind users
   */
  public formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) {
      return 'less than a minute';
    }
    if (minutes === 1) {
      return 'about 1 minute';
    }
    if (minutes < 60) {
      return `about ${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    if (remMins === 0) {
      return `about ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `about ${hours} hour${hours > 1 ? 's' : ''} and ${remMins} minutes`;
  }

  /**
   * Convert maneuver into spoken turn instruction
   */
  private buildManeuverInstruction(
    type: string,
    modifier?: string,
    name?: string
  ): string {
    const street = name && name.trim().length > 0 ? ` onto ${name.trim()}` : '';

    switch (type) {
      case 'depart':
        return name ? `Head along ${name}` : 'Start walking';
      case 'arrive':
        return 'You will arrive at your destination';
      case 'turn':
        if (modifier === 'left') return `Turn left${street}`;
        if (modifier === 'right') return `Turn right${street}`;
        if (modifier === 'sharp left') return `Make a sharp left${street}`;
        if (modifier === 'sharp right') return `Make a sharp right${street}`;
        if (modifier === 'slight left') return `Bear slightly left${street}`;
        if (modifier === 'slight right') return `Bear slightly right${street}`;
        if (modifier === 'uturn') return 'Make a U-turn';
        return `Turn${street}`;
      case 'continue':
      case 'new name':
        return `Continue straight${street}`;
      case 'fork':
        return `Keep ${modifier || 'straight'} at the fork${street}`;
      case 'roundabout':
      case 'rotary':
        return `Enter the roundabout and take the exit${street}`;
      default:
        return modifier ? `Turn ${modifier}${street}` : `Continue straight${street}`;
    }
  }

  /**
   * Calculate walking route for a NavigationRequest
   */
  public async calculateRoute(
    navRequest: NavigationRequest
  ): Promise<RouteCalculationResult> {
    // 1. Cancel previous in-flight calculation if running
    this.cancel();

    // 2. Validate Origin and Destination
    const origin = navRequest.origin;
    const dest = navRequest.destination;

    if (!dest || typeof dest.latitude !== 'number' || typeof dest.longitude !== 'number') {
      this.currentState = 'ERROR';
      return {
        success: false,
        state: 'ERROR',
        spokenMessage: "Destination coordinates are missing or invalid.",
        error: 'invalid_destination',
      };
    }

    if (!origin || typeof origin.latitude !== 'number' || typeof origin.longitude !== 'number') {
      this.currentState = 'ERROR';
      return {
        success: false,
        state: 'ERROR',
        spokenMessage: "Current location is unavailable for routing.",
        error: 'invalid_origin',
      };
    }

    // 3. Check if origin and destination are essentially the same (< 15 meters)
    const distanceStraight = this.calculateStraightDistance(
      origin.latitude,
      origin.longitude,
      dest.latitude,
      dest.longitude
    );

    if (distanceStraight < 15) {
      this.currentState = 'ROUTE_READY';
      hapticService.success();
      const message = `You are already near ${dest.name}.`;
      const zeroRoute: RouteResult = {
        origin: { latitude: origin.latitude, longitude: origin.longitude },
        destination: {
          latitude: dest.latitude,
          longitude: dest.longitude,
          name: dest.name,
          address: dest.address,
        },
        distanceMeters: 0,
        formattedDistance: '0 meters',
        durationSeconds: 0,
        formattedDuration: '0 minutes',
        steps: [
          {
            instruction: `You have arrived at ${dest.name}.`,
            maneuver: 'arrive',
            distanceMeters: 0,
            durationSeconds: 0,
            startLocation: { latitude: origin.latitude, longitude: origin.longitude },
            endLocation: { latitude: dest.latitude, longitude: dest.longitude },
          },
        ],
        provider: 'OSRM_FOOT_DE',
        timestamp: Date.now(),
        spokenSummary: message,
      };
      this.activeRoute = zeroRoute;
      return {
        success: true,
        state: 'ROUTE_READY',
        routeResult: zeroRoute,
        spokenMessage: message,
      };
    }

    this.currentState = 'CALCULATING_ROUTE';
    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    // 4. Primary & Fallback OSRM Pedestrian Foot Endpoints
    const endpoints = [
      {
        url: `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${origin.longitude},${origin.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=geojson&steps=true`,
        provider: 'OSRM_FOOT_DE' as const,
      },
      {
        url: `https://router.project-osrm.org/route/v1/foot/${origin.longitude},${origin.latitude};${dest.longitude},${dest.latitude}?overview=full&geometries=geojson&steps=true`,
        provider: 'OSRM_FOOT_ORG' as const,
      },
    ];

    for (const ep of endpoints) {
      if (signal.aborted) {
        this.currentState = 'IDLE';
        return {
          success: false,
          state: 'IDLE',
          spokenMessage: 'Route calculation was cancelled.',
          error: 'aborted',
        };
      }

      try {
        const timeoutId = setTimeout(() => this.currentAbortController?.abort(), 12000);
        const response = await fetch(ep.url, {
          headers: { 'User-Agent': 'AccessPlusAccessibilityApp/1.0' },
          signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          continue;
        }

        const data = await response.json();

        if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const mainRoute = data.routes[0];
          const legs = mainRoute.legs || [];
          const legSteps = legs.length > 0 ? legs[0].steps || [] : [];

          const steps: RouteStep[] = legSteps.map((s: any) => {
            const loc = s.maneuver?.location || [0, 0];
            const instruction = this.buildManeuverInstruction(
              s.maneuver?.type || 'continue',
              s.maneuver?.modifier,
              s.name
            );

            return {
              instruction,
              maneuver: s.maneuver?.type || 'continue',
              modifier: s.maneuver?.modifier,
              distanceMeters: Math.round(s.distance || 0),
              durationSeconds: Math.round(s.duration || 0),
              startLocation: { latitude: loc[1], longitude: loc[0] },
              endLocation: { latitude: loc[1], longitude: loc[0] },
              bearing: s.maneuver?.bearing_after,
              streetName: s.name || '',
            };
          });

          const totalDistance = Math.round(mainRoute.distance || distanceStraight);
          const totalDuration = Math.round(mainRoute.duration || (totalDistance / 1.2)); // ~1.2 m/s avg walking speed
          const formattedDistance = this.formatDistance(totalDistance);
          const formattedDuration = this.formatDuration(totalDuration);

          const spokenSummary = `I found a walking route to ${dest.name}. It's approximately ${formattedDistance} and should take ${formattedDuration}.`;

          const routeResult: RouteResult = {
            origin: { latitude: origin.latitude, longitude: origin.longitude },
            destination: {
              latitude: dest.latitude,
              longitude: dest.longitude,
              name: dest.name,
              address: dest.address,
            },
            distanceMeters: totalDistance,
            formattedDistance,
            durationSeconds: totalDuration,
            formattedDuration,
            steps,
            geometry: mainRoute.geometry?.coordinates,
            provider: ep.provider,
            timestamp: Date.now(),
            spokenSummary,
          };

          this.currentState = 'ROUTE_READY';
          this.activeRoute = routeResult;
          this.currentAbortController = null;
          hapticService.success();

          return {
            success: true,
            state: 'ROUTE_READY',
            routeResult,
            spokenMessage: spokenSummary,
          };
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || signal.aborted) {
          this.currentState = 'IDLE';
          return {
            success: false,
            state: 'IDLE',
            spokenMessage: 'Route calculation was cancelled.',
            error: 'aborted',
          };
        }
        console.warn(`[RouteService] Endpoint ${ep.provider} error:`, err);
      }
    }

    // All endpoints failed or no walking path found
    this.currentState = 'ERROR';
    this.currentAbortController = null;
    hapticService.warning();

    const failureMessage = `I couldn't find a walking route to ${dest.name}. Please try another destination.`;
    return {
      success: false,
      state: 'ERROR',
      spokenMessage: failureMessage,
      error: 'no_route_found',
    };
  }

  private calculateStraightDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }
}

export const routeService = new RouteService();
