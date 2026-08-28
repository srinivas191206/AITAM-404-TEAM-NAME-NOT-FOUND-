import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccessibilityMode,
  EmergencyContact,
  GuardianState,
  LanguageCode,
  OnboardingStep,
  UserProfile,
} from '../types';
import { outputService } from '../services/outputService';

interface AppContextType {
  isInitialized: boolean;
  isOnboardingCompleted: boolean;
  onboardingStep: OnboardingStep;
  activeMode: AccessibilityMode;
  selectedLanguage: LanguageCode;
  userProfile: UserProfile;
  setMode: (mode: AccessibilityMode) => Promise<void>;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  setEmergencyContact: (contact: EmergencyContact) => Promise<void>;
  setGuardianState: (guardian: GuardianState) => Promise<void>;
  goToOnboardingStep: (step: OnboardingStep) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const DEFAULT_EMERGENCY_CONTACT: EmergencyContact = {
  id: 'ec_1',
  name: '',
  phoneNumber: '',
  relationship: 'Family',
};

const DEFAULT_GUARDIAN_STATE: GuardianState = {
  guardianLinked: false,
};

const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'user_' + Math.random().toString(36).substr(2, 8),
  fullName: '',
  phoneNumber: '',
  email: '',
  address: '',
  accessibilityMode: null,
  language: 'en',
  createdAt: new Date().toISOString(),
  onboardingCompleted: false,
  isOnboardingCompleted: false,
  emergencyContacts: [DEFAULT_EMERGENCY_CONTACT],
  emergencyContact: DEFAULT_EMERGENCY_CONTACT,
  guardian: DEFAULT_GUARDIAN_STATE,
  guardianLinked: false,
  safeZoneRadiusMeters: 50,
};

const STORAGE_KEY = '@access_plus_app_state_v3';

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [activeMode, setActiveMode] = useState<AccessibilityMode>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  useEffect(() => {
    loadLocalState();
  }, []);

  const loadLocalState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.userProfile) {
          const profile = parsed.userProfile;
          setUserProfile(profile);
          const isDone = Boolean(profile.onboardingCompleted || profile.isOnboardingCompleted);
          setIsOnboardingCompleted(isDone);
          setActiveMode(profile.accessibilityMode || profile.mode || null);
          setSelectedLanguage(profile.language || 'en');
        }
        if (parsed.onboardingStep && !parsed.userProfile?.onboardingCompleted) {
          setOnboardingStep(parsed.onboardingStep);
        }
      }
    } catch (e) {
      console.warn('[AppContext] Failed to load local profile state:', e);
    } finally {
      setIsInitialized(true);
    }
  };

  const persistState = async (
    updatedProfile: UserProfile,
    step: OnboardingStep = onboardingStep
  ) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          userProfile: updatedProfile,
          onboardingStep: step,
        })
      );
    } catch (e) {
      console.warn('[AppContext] Failed to persist profile state:', e);
    }
  };

  const setMode = async (mode: AccessibilityMode) => {
    setActiveMode(mode);
    const updated = {
      ...userProfile,
      accessibilityMode: mode,
      mode: mode,
    };
    setUserProfile(updated);
    await persistState(updated, onboardingStep);
  };

  const setLanguage = async (language: LanguageCode) => {
    setSelectedLanguage(language);
    const updated = { ...userProfile, language };
    setUserProfile(updated);
    await persistState(updated, onboardingStep);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...userProfile,
      ...updates,
      phone: updates.phoneNumber || updates.phone || userProfile.phoneNumber,
      name: updates.fullName || updates.name || userProfile.fullName,
    };
    setUserProfile(updated);
    await persistState(updated, onboardingStep);
  };

  const setEmergencyContact = async (contact: EmergencyContact) => {
    const updatedContact: EmergencyContact = {
      ...contact,
      phone: contact.phoneNumber || contact.phone || '',
      relation: contact.relationship || contact.relation || 'Family',
    };
    const updated: UserProfile = {
      ...userProfile,
      emergencyContacts: [updatedContact],
      emergencyContact: updatedContact,
    };
    setUserProfile(updated);
    await persistState(updated, onboardingStep);
  };

  const setGuardianState = async (guardian: GuardianState) => {
    const updated: UserProfile = {
      ...userProfile,
      guardian,
      guardianLinked: guardian.guardianLinked,
      guardianPhone: guardian.phoneNumber || guardian.phone,
      guardianCode: guardian.code,
    };
    setUserProfile(updated);
    await persistState(updated, onboardingStep);
  };

  const goToOnboardingStep = async (step: OnboardingStep) => {
    setOnboardingStep(step);
    await persistState(userProfile, step);
  };

  const completeOnboarding = async () => {
    const updated: UserProfile = {
      ...userProfile,
      accessibilityMode: activeMode,
      mode: activeMode,
      language: selectedLanguage,
      onboardingCompleted: true,
      isOnboardingCompleted: true,
    };
    setUserProfile(updated);
    setIsOnboardingCompleted(true);
    setOnboardingStep('completed');
    await persistState(updated, 'completed');

    if (activeMode === 'blind') {
      await outputService.announce('Registration and profile setup complete. Welcome to Access Plus.');
    } else if (activeMode === 'deaf') {
      outputService.broadcastVisualAlert({
        title: 'Profile Created',
        message: 'Registration complete. Welcome to Hearing Assistance.',
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const resetOnboarding = async () => {
    const fresh: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      id: 'user_' + Math.random().toString(36).substr(2, 8),
      createdAt: new Date().toISOString(),
    };
    setUserProfile(fresh);
    setIsOnboardingCompleted(false);
    setActiveMode(null);
    setSelectedLanguage('en');
    setOnboardingStep('welcome');
    await AsyncStorage.removeItem(STORAGE_KEY);
    await outputService.announce('Profile reset. Returning to welcome screen.');
  };

  return (
    <AppContext.Provider
      value={{
        isInitialized,
        isOnboardingCompleted,
        onboardingStep,
        activeMode,
        selectedLanguage,
        userProfile,
        setMode,
        setLanguage,
        updateProfile,
        setEmergencyContact,
        setGuardianState,
        goToOnboardingStep,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
