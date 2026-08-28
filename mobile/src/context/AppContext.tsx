import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccessibilityMode,
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
  setMode: (mode: AccessibilityMode) => void;
  setLanguage: (lang: LanguageCode) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  goToOnboardingStep: (step: OnboardingStep) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'user_' + Math.random().toString(36).substr(2, 8),
  fullName: '',
  phone: '',
  email: '',
  address: '',
  mode: null,
  language: 'en',
  emergencyContact: {
    id: '1',
    name: '',
    phone: '',
    relation: 'Family',
  },
  guardianLinked: false,
  isOnboardingCompleted: false,
};

const STORAGE_KEY = '@access_plus_app_state_v1';

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
          setUserProfile(parsed.userProfile);
          setIsOnboardingCompleted(!!parsed.userProfile.isOnboardingCompleted);
          setActiveMode(parsed.userProfile.mode);
          setSelectedLanguage(parsed.userProfile.language || 'en');
        }
      }
    } catch (e) {
      console.warn('Failed to load app state from local storage:', e);
    } finally {
      setIsInitialized(true);
    }
  };

  const persistState = async (updatedProfile: UserProfile) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ userProfile: updatedProfile })
      );
    } catch (e) {
      console.warn('Failed to persist app state:', e);
    }
  };

  const setMode = (mode: AccessibilityMode) => {
    setActiveMode(mode);
    const updated = { ...userProfile, mode };
    setUserProfile(updated);
    persistState(updated);
  };

  const setLanguage = (language: LanguageCode) => {
    setSelectedLanguage(language);
    const updated = { ...userProfile, language };
    setUserProfile(updated);
    persistState(updated);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    persistState(updated);
  };

  const goToOnboardingStep = (step: OnboardingStep) => {
    setOnboardingStep(step);
  };

  const completeOnboarding = async () => {
    const updated: UserProfile = {
      ...userProfile,
      mode: activeMode,
      language: selectedLanguage,
      isOnboardingCompleted: true,
    };
    setUserProfile(updated);
    setIsOnboardingCompleted(true);
    setOnboardingStep('completed');
    await persistState(updated);

    if (activeMode === 'blind') {
      await outputService.announce('Setup complete. Welcome to Visual Assistance.');
    } else if (activeMode === 'deaf') {
      outputService.broadcastVisualAlert({
        title: 'Setup Complete',
        message: 'Welcome to Hearing Assistance.',
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const resetOnboarding = async () => {
    const fresh: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      id: 'user_' + Math.random().toString(36).substr(2, 8),
    };
    setUserProfile(fresh);
    setIsOnboardingCompleted(false);
    setActiveMode(null);
    setSelectedLanguage('en');
    setOnboardingStep('welcome');
    await AsyncStorage.removeItem(STORAGE_KEY);
    await outputService.announce('Application reset to initial setup.');
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
