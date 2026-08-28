import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityMode, EmergencyContact, LanguageCode, UserProfile } from '../types';
import { outputService } from '../services/outputService';

interface AccessibilityContextType {
  mode: AccessibilityMode;
  setMode: (mode: AccessibilityMode) => Promise<void>;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => Promise<void>;
  removeEmergencyContact: (id: string) => Promise<void>;
  sosActive: boolean;
  triggerSos: (type?: 'manual' | 'sensor_fall' | 'sensor_impact') => void;
  cancelSos: () => void;
  sosCountdown: number | null;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'user_' + Math.random().toString(36).substr(2, 9),
  fullName: 'Assisted User',
  name: 'Assisted User',
  phoneNumber: '',
  phone: '',
  address: '',
  accessibilityMode: null,
  mode: null,
  language: 'en',
  createdAt: new Date().toISOString(),
  onboardingCompleted: false,
  isOnboardingCompleted: false,
  emergencyContact: {
    id: '1',
    name: 'Primary Guardian',
    phoneNumber: '+1234567890',
    phone: '+1234567890',
    relationship: 'Family',
    relation: 'Family',
  },
  emergencyContacts: [
    {
      id: '1',
      name: 'Primary Guardian',
      phoneNumber: '+1234567890',
      phone: '+1234567890',
      relationship: 'Family',
      relation: 'Family',
    },
    {
      id: '2',
      name: 'Emergency Services',
      phoneNumber: '112',
      phone: '112',
      relationship: 'Emergency',
      relation: 'Emergency',
    },
  ],
  guardian: { guardianLinked: false },
  guardianLinked: false,
  safeZoneRadiusMeters: 50,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

const STORAGE_KEY = '@access_plus_user_profile';

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [mode, setModeState] = useState<AccessibilityMode>(null);
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);

  useEffect(() => {
    loadStoredProfile();
  }, []);

  const loadStoredProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: UserProfile = JSON.parse(stored);
        setUserProfile(parsed);
        setModeState(parsed.mode || parsed.accessibilityMode || null);
      }
    } catch (e) {
      console.warn('Failed to load profile from AsyncStorage', e);
    }
  };

  const setMode = async (newMode: AccessibilityMode) => {
    setModeState(newMode);
    const updated = { ...userProfile, mode: newMode };
    setUserProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (newMode === 'blind') {
      await outputService.announce('Visual Assistance Mode activated. Screen reader and voice assistant are ready.');
    } else if (newMode === 'deaf') {
      outputService.broadcastVisualAlert({
        title: 'Hearing Assistance Active',
        message: 'Visual alerts, sound monitoring, and live captions are running.',
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
    } else if (newMode === 'guardian') {
      await outputService.announce('Guardian monitoring mode active.');
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addEmergencyContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: Math.random().toString(36).substr(2, 9),
    };
    const currentList = userProfile.emergencyContacts || [];
    const updatedContacts = [...currentList, newContact];
    await updateUserProfile({ emergencyContacts: updatedContacts });
  };

  const removeEmergencyContact = async (id: string) => {
    const currentList = userProfile.emergencyContacts || [];
    const updatedContacts = currentList.filter((c: EmergencyContact) => c.id !== id);
    await updateUserProfile({ emergencyContacts: updatedContacts });
  };

  const triggerSos = (type: 'manual' | 'sensor_fall' | 'sensor_impact' = 'manual') => {
    setSosCountdown(5);
    outputService.triggerHaptic('critical');
    outputService.announce(`Emergency alert starting in 5 seconds. Tap anywhere to cancel.`, 'urgent');
  };

  const cancelSos = () => {
    setSosCountdown(null);
    setSosActive(false);
    outputService.stopAll();
    outputService.announce('Emergency SOS cancelled.');
  };

  return (
    <AccessibilityContext.Provider
      value={{
        mode,
        setMode,
        userProfile,
        updateUserProfile,
        addEmergencyContact,
        removeEmergencyContact,
        sosActive,
        triggerSos,
        cancelSos,
        sosCountdown,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
