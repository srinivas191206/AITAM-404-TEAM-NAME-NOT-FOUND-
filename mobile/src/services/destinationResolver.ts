import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData, locationService } from './locationService';
import { hapticService } from './hapticService';
import { groqVisionService } from './groqVisionService';

export interface DestinationRequest {
  rawUserQuery: string;
  destinationName: string;
  destinationCategory?: string;
  searchPreference?: 'NEAREST' | 'SPECIFIC';
  homeRequest?: boolean;
  clarificationRequired?: boolean;
}

export interface Destination {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  category?: string;
  source: 'OPENSTREETMAP_NOMINATIM' | 'SAVED_HOME' | 'USER_SPECIFIC';
  confidence: number;
  distanceMeters?: number;
  formattedDistance?: string;
}

export interface NavigationRequest {
  origin: LocationData;
  destination: Destination;
  requestedAt: number;
  userQuery: string;
  destinationConfidence: number;
}

export type ResolutionStatus =
  | 'RESOLVED'
  | 'AMBIGUOUS'
  | 'NOT_FOUND'
  | 'HOME_NOT_SET'
  | 'LOCATION_ERROR'
  | 'NETWORK_ERROR';

export interface DestinationResolutionResult {
  status: ResolutionStatus;
  destination?: Destination;
  candidates?: Destination[];
  spokenMessage: string;
  navigationRequest?: NavigationRequest;
}

class DestinationResolver {
  /**
   * Calculate real-world Haversine distance in meters between two GPS coordinates
   */
  public calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Format distance naturally for spoken audio
   */
  public formatDistanceSpoken(meters: number): string {
    if (meters < 1000) {
      return `about ${meters} meters away`;
    }
    const km = (meters / 1000).toFixed(1).replace('.0', '');
    return `about ${km} kilometers away`;
  }

  /**
   * Parse user voice text to extract structured DestinationRequest
   * Uses Groq NLU with deterministic fallback
   */
  public async extractDestinationIntent(rawQuery: string): Promise<DestinationRequest> {
    const text = rawQuery.trim();

    // 1. Try Groq NLU Language Understanding
    if (groqVisionService.hasActiveKeys()) {
      try {
        const groqPrompt = `Extract destination intent from user command: "${text}". 
Respond with ONLY JSON format:
{
  "destinationName": "string or empty",
  "category": "hospital|pharmacy|atm|police|railway station|airport|petrol station|general",
  "searchPreference": "NEAREST|SPECIFIC",
  "isHome": boolean
}`;
        const groqResponse = await groqVisionService.answerVisualQuery('', groqPrompt);
        if (groqResponse) {
          const jsonMatch = groqResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              rawUserQuery: text,
              destinationName: parsed.destinationName || text,
              destinationCategory: parsed.category !== 'general' ? parsed.category : undefined,
              searchPreference: parsed.searchPreference || 'SPECIFIC',
              homeRequest: Boolean(parsed.isHome),
            };
          }
        }
      } catch (err) {
        console.warn('[DestinationResolver] Groq NLU fallback to regex:', err);
      }
    }

    // 2. Deterministic Rule-Based Fallback (Zero Hallucinations)
    const lower = text.toLowerCase();

    if (/\b(home|my house|my place)\b/i.test(lower)) {
      return {
        rawUserQuery: text,
        destinationName: 'Home',
        homeRequest: true,
        searchPreference: 'SPECIFIC',
      };
    }

    const isNearest = /\b(nearest|closest|nearby|closest to me)\b/i.test(lower);
    const searchPreference = isNearest ? 'NEAREST' : 'SPECIFIC';

    let category: string | undefined;
    if (/\bhospital|clinic|doctor|medical\b/i.test(lower)) category = 'hospital';
    else if (/\bpharmacy|chemist|medical store|drugstore\b/i.test(lower)) category = 'pharmacy';
    else if (/\batm|cash machine|bank\b/i.test(lower)) category = 'atm';
    else if (/\bpolice|police station\b/i.test(lower)) category = 'police station';
    else if (/\brailway station|train station\b/i.test(lower)) category = 'railway station';
    else if (/\bairport\b/i.test(lower)) category = 'airport';
    else if (/\bpetrol|fuel station|gas station\b/i.test(lower)) category = 'petrol station';
    else if (/\bbus stand|bus station|bus stop\b/i.test(lower)) category = 'bus station';

    // Strip navigation triggers to isolate place name
    const cleaned = lower
      .replace(/^(take me to|navigate to|go to|find the|where is the|direct me to|guide me to)\s+/i, '')
      .replace(/^(the nearest|the closest|nearest|closest)\s+/i, '')
      .trim();

    return {
      rawUserQuery: text,
      destinationName: cleaned || text,
      destinationCategory: category,
      searchPreference,
      homeRequest: false,
    };
  }

  /**
   * Geocode and resolve real geographic coordinates via OpenStreetMap Nominatim
   */
  public async searchGeographicCoordinates(
    query: string,
    currentLocation?: LocationData
  ): Promise<Destination[]> {
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5&addressdetails=1`;

      if (currentLocation) {
        const { latitude, longitude } = currentLocation;
        // Search radial viewbox (~8km)
        url += `&viewbox=${longitude - 0.08},${latitude + 0.08},${longitude + 0.08},${latitude - 0.08}`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AccessPlusAccessibilityNavigator/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        return [];
      }

      return data.map((item: any) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        let dist: number | undefined;
        let formattedDist: string | undefined;

        if (currentLocation) {
          dist = this.calculateDistanceMeters(currentLocation.latitude, currentLocation.longitude, lat, lon);
          formattedDist = this.formatDistanceSpoken(dist);
        }

        const primaryName = item.name || item.display_name.split(',')[0].trim();

        return {
          name: primaryName,
          latitude: lat,
          longitude: lon,
          address: item.display_name,
          category: item.type || item.class,
          source: 'OPENSTREETMAP_NOMINATIM',
          confidence: item.importance ? Math.min(0.99, item.importance) : 0.88,
          distanceMeters: dist,
          formattedDistance: formattedDist,
        };
      });
    } catch (err) {
      console.warn('[DestinationResolver] Geocoding network error:', err);
      return [];
    }
  }

  /**
   * Resolve user destination request and return structured NavigationRequest
   */
  public async resolveDestination(rawQuery: string): Promise<DestinationResolutionResult> {
    // 1. Acquire current location
    const locResult = await locationService.getCurrentLocation();
    if (!locResult.success || !locResult.location) {
      return {
        status: 'LOCATION_ERROR',
        spokenMessage: locResult.spokenMessage,
      };
    }

    const origin = locResult.location;

    // 2. Extract structured destination intent
    const req = await this.extractDestinationIntent(rawQuery);

    // 3. Handle "Take me home"
    if (req.homeRequest) {
      const savedProfile = await AsyncStorage.getItem('@access_plus_profile');
      let homeAddress = '';
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          homeAddress = parsed.address || parsed.homeAddress || '';
        } catch {
          // ignore
        }
      }

      if (!homeAddress || homeAddress.trim().length === 0) {
        return {
          status: 'HOME_NOT_SET',
          spokenMessage: "I don't have a saved home location yet. You can add your home address in settings.",
        };
      }

      // Geocode saved home address
      const homeCoords = await this.searchGeographicCoordinates(homeAddress, origin);
      if (homeCoords.length === 0) {
        return {
          status: 'NOT_FOUND',
          spokenMessage: `I couldn't resolve your saved home address: ${homeAddress}. Please check the address in settings.`,
        };
      }

      const homeDest: Destination = {
        ...homeCoords[0],
        name: 'Home',
        source: 'SAVED_HOME',
        confidence: 0.99,
      };

      hapticService.light();

      const navigationRequest: NavigationRequest = {
        origin,
        destination: homeDest,
        requestedAt: Date.now(),
        userQuery: rawQuery,
        destinationConfidence: 0.99,
      };

      const distPhrase = homeDest.formattedDistance ? `, ${homeDest.formattedDistance}` : '';
      return {
        status: 'RESOLVED',
        destination: homeDest,
        spokenMessage: `Navigating to Home${distPhrase}. Shall I begin guidance?`,
        navigationRequest,
      };
    }

    // 4. Perform Geographic Geocoding for Destination
    const searchQuery = req.destinationCategory || req.destinationName;
    const candidates = await this.searchGeographicCoordinates(searchQuery, origin);

    // 5. Handle Not Found (e.g. "Take me to the moon")
    if (candidates.length === 0) {
      return {
        status: 'NOT_FOUND',
        spokenMessage: `I couldn't find ${req.destinationName}. Please try saying the destination or a landmark nearby.`,
      };
    }

    // 6. Sort candidates by real geographic distance if nearest is preferred
    if (req.searchPreference === 'NEAREST') {
      candidates.sort((a, b) => (a.distanceMeters || 999999) - (b.distanceMeters || 999999));
    }

    // 7. Check for Ambiguity
    // If the top 2 candidates have distinct names and close proximity, ask for spoken clarification
    if (
      candidates.length >= 2 &&
      req.searchPreference !== 'NEAREST' &&
      candidates[0].name.toLowerCase() !== candidates[1].name.toLowerCase() &&
      Math.abs((candidates[0].confidence || 0) - (candidates[1].confidence || 0)) < 0.15
    ) {
      hapticService.warning();
      const first = candidates[0].name;
      const second = candidates[1].name;
      return {
        status: 'AMBIGUOUS',
        candidates: candidates.slice(0, 2),
        spokenMessage: `I found multiple locations nearby: ${first}, and ${second}. Which one do you mean?`,
      };
    }

    // 8. Single Clear Match Resolved
    const selected = candidates[0];
    hapticService.success();

    const navigationRequest: NavigationRequest = {
      origin,
      destination: selected,
      requestedAt: Date.now(),
      userQuery: rawQuery,
      destinationConfidence: selected.confidence,
    };

    let confirmationSpoken = '';
    if (req.searchPreference === 'NEAREST' && selected.formattedDistance) {
      confirmationSpoken = `I found ${selected.name}, ${selected.formattedDistance}. Shall I navigate you there?`;
    } else {
      confirmationSpoken = `You want to go to ${selected.name}, correct?`;
    }

    return {
      status: 'RESOLVED',
      destination: selected,
      spokenMessage: confirmationSpoken,
      navigationRequest,
    };
  }
}

export const destinationResolver = new DestinationResolver();
