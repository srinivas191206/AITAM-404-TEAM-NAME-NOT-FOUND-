import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { SplashScreen } from '../screens/onboarding/SplashScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { ModeSelectionScreen } from '../screens/onboarding/ModeSelectionScreen';
import { LanguageSelectionScreen } from '../screens/onboarding/LanguageSelectionScreen';
import { VoiceRegistrationScreen } from '../screens/onboarding/VoiceRegistrationScreen';
import { RegistrationScreen } from '../screens/onboarding/RegistrationScreen';
import { EmergencyContactScreen } from '../screens/onboarding/EmergencyContactScreen';
import { GuardianSetupScreen } from '../screens/onboarding/GuardianSetupScreen';
import { ReviewSummaryScreen } from '../screens/onboarding/ReviewSummaryScreen';
import { VisualDashboardShell } from '../screens/blind/VisualDashboardShell';
import { HearingDashboardShell } from '../screens/deaf/HearingDashboardShell';
import { GuardianDashboardShell } from '../screens/guardian/GuardianDashboardShell';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { Colors } from '../theme/colors';

export const RootNavigator: React.FC = () => {
  const {
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
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. App Initialization / Splash
  if (!isInitialized) {
    return <SplashScreen />;
  }

  // 2. First-Time Onboarding Flow
  if (!isOnboardingCompleted) {
    switch (onboardingStep) {
      case 'welcome':
        return (
          <WelcomeScreen
            onContinue={() => goToOnboardingStep('mode_selection')}
          />
        );

      case 'mode_selection':
        return (
          <ModeSelectionScreen
            onSelectMode={async (mode) => {
              await setMode(mode);
              await goToOnboardingStep('language_selection');
            }}
            onBack={() => goToOnboardingStep('welcome')}
          />
        );

      case 'language_selection':
        return (
          <LanguageSelectionScreen
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setLanguage}
            onContinue={() => goToOnboardingStep('registration')}
            onBack={() => goToOnboardingStep('mode_selection')}
          />
        );

      case 'registration':
        // ROUTE ADAPTIVELY BASED ON ACCESSIBILITY MODE
        if (activeMode === 'blind') {
          // VOICE-FIRST REGISTRATION FOR BLIND USERS
          return (
            <VoiceRegistrationScreen
              initialProfile={userProfile}
              onSaveProfile={updateProfile}
              onComplete={completeOnboarding}
              onBack={() => goToOnboardingStep('language_selection')}
            />
          );
        }

        // CONVENTIONAL VISUAL STEP 1 FOR DEAF & GUARDIAN USERS
        return (
          <RegistrationScreen
            userProfile={userProfile}
            onSaveProfile={updateProfile}
            onContinue={() => goToOnboardingStep('emergency_contact')}
            onBack={() => goToOnboardingStep('language_selection')}
          />
        );

      case 'emergency_contact':
        return (
          <EmergencyContactScreen
            initialContact={
              userProfile.emergencyContact ||
              userProfile.emergencyContacts?.[0] || {
                id: 'ec_1',
                name: '',
                phoneNumber: '',
                relationship: 'Family',
              }
            }
            onSaveContact={async (contact) => {
              await setEmergencyContact(contact);
            }}
            onContinue={() => goToOnboardingStep('guardian_setup')}
            onBack={() => goToOnboardingStep('registration')}
          />
        );

      case 'guardian_setup':
        return (
          <GuardianSetupScreen
            onComplete={async (guardianData) => {
              if (guardianData && (guardianData.guardianPhone || guardianData.guardianCode)) {
                await setGuardianState({
                  guardianLinked: true,
                  phoneNumber: guardianData.guardianPhone,
                  phone: guardianData.guardianPhone,
                  code: guardianData.guardianCode,
                });
              } else {
                await setGuardianState({ guardianLinked: false });
              }
              await goToOnboardingStep('review');
            }}
            onBack={() => goToOnboardingStep('emergency_contact')}
          />
        );

      case 'review':
        return (
          <ReviewSummaryScreen
            userProfile={userProfile}
            onEditSection={(step) => goToOnboardingStep(step)}
            onConfirmComplete={completeOnboarding}
            onBack={() => goToOnboardingStep('guardian_setup')}
          />
        );

      default:
        return (
          <WelcomeScreen
            onContinue={() => goToOnboardingStep('mode_selection')}
          />
        );
    }
  }

  // 3. Post-Onboarding: Settings or Mode-Specific Dashboard Shells
  if (isSettingsOpen) {
    return <SettingsScreen onBack={() => setIsSettingsOpen(false)} />;
  }

  if (activeMode === 'blind') {
    return (
      <VisualDashboardShell
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    );
  }

  if (activeMode === 'deaf') {
    return (
      <HearingDashboardShell
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    );
  }

  if (activeMode === 'guardian') {
    return (
      <GuardianDashboardShell
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    );
  }

  // Fallback
  return (
    <VisualDashboardShell
      onOpenSettings={() => setIsSettingsOpen(true)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
});
