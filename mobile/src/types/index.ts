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
  | 'review'
  | 'completed';

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'critical';

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  phone?: string; // alias
  relationship: string;
  relation?: string; // alias
}

export interface GuardianState {
  id?: string;
  name?: string;
  phoneNumber?: string;
  phone?: string;
  email?: string;
  code?: string;
  guardianLinked: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  name?: string; // alias
  phoneNumber: string;
  phone?: string; // alias
  email?: string;
  address?: string;
  accessibilityMode: AccessibilityMode;
  mode?: AccessibilityMode; // alias
  language: LanguageCode;
  createdAt: string;
  onboardingCompleted: boolean;
  isOnboardingCompleted?: boolean; // alias
  emergencyContacts: EmergencyContact[];
  emergencyContact?: EmergencyContact; // primary contact alias
  guardian: GuardianState;
  guardianLinked?: boolean;
  guardianPhone?: string;
  guardianCode?: string;
  safeZoneCenter?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  safeZoneRadiusMeters?: number;
}

export type InteractionState = 'ready' | 'listening' | 'processing';

export type VoiceRegistrationField =
  | 'fullName'
  | 'phoneNumber'
  | 'address'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'emergencyContactRelation'
  | 'guardianChoice'
  | 'review';

export interface VoiceRegistrationStepState {
  field: VoiceRegistrationField;
  prompt: string;
  pendingValue: string;
  isConfirming: boolean;
}

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
  location: [number, number];
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
