export type AccessibilityMode = 'blind' | 'deaf' | 'guardian' | null;

export type LanguageCode = 'en' | 'te' | 'hi' | 'ta' | 'es' | 'fr';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  isAvailable: boolean;
}

export type OnboardingStep =
  | 'welcome'
  | 'mode_selection'
  | 'language_selection'
  | 'registration'
  | 'emergency_contact'
  | 'guardian_setup'
  | 'completed';

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'critical';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  name?: string; // alias
  phone: string;
  email?: string;
  address?: string;
  mode: AccessibilityMode;
  language: LanguageCode;
  emergencyContact: EmergencyContact;
  emergencyContacts?: EmergencyContact[];
  guardianLinked: boolean;
  guardianId?: string;
  guardianPhone?: string;
  guardianCode?: string;
  safeZoneCenter?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  safeZoneRadiusMeters?: number;
  isOnboardingCompleted: boolean;
}

export type InteractionState = 'ready' | 'listening' | 'processing';

export interface SoundDetectionEvent {
  id: string;
  category: 'siren' | 'car_horn' | 'fire_alarm' | 'doorbell' | 'knock' | 'loud_noise';
  name: string;
  confidence: number;
  decibels: number;
  severity: AlertSeverity;
  timestamp: string;
}

export interface NavigationStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuverType: string;
  modifier?: string;
  location: [number, number]; // [lon, lat]
}

export interface NavigationRoute {
  destinationName: string;
  destinationCoord: { latitude: number; longitude: number };
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  steps: NavigationStep[];
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
}

export interface SosPayload {
  userId: string;
  userName: string;
  mode: AccessibilityMode;
  latitude: number;
  longitude: number;
  triggerType: 'manual' | 'sensor_fall' | 'sensor_impact';
  emergencyContacts: EmergencyContact[];
  timestamp: string;
}
