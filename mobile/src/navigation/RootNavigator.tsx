import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { SplashScreen } from '../screens/onboarding/SplashScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { ModeSelectionScreen } from '../screens/onboarding/ModeSelectionScreen';
import { LanguageSelectionScreen } from '../screens/onboarding/LanguageSelectionScreen';
import { RegistrationScreen } from '../screens/onboarding/RegistrationScreen';
import { EmergencyContactScreen } from '../screens/onboarding/EmergencyContactScreen';
import { GuardianSetupScreen } from '../screens/onboarding/GuardianSetupScreen';
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
    goToOnboardingStep,
    completeOnboarding,
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. App Initialization / Splash
  if (!isInitialized) {
    return <SplashScreen />;
  }

  // 2. First-time Onboarding Flow
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
            onSelectMode={(mode) => {
              setMode(mode);
              goToOnboardingStep('language_selection');
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
            initialContact={userProfile.emergencyContact}
            onSaveContact={(contact) => updateProfile({ emergencyContact: contact })}
            onContinue={() => goToOnboardingStep('guardian_setup')}
            onBack={() => goToOnboardingStep('registration')}
          />
        );

      case 'guardian_setup':
        return (
          <GuardianSetupScreen
            onComplete={(guardianData) => {
              if (guardianData) {
                updateProfile({
                  guardianLinked: !!guardianData.guardianPhone || !!guardianData.guardianCode,
                  guardianPhone: guardianData.guardianPhone,
                  guardianCode: guardianData.guardianCode,
                });
              }
              completeOnboarding();
            }}
            onBack={() => goToOnboardingStep('emergency_contact')}
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

  // Fallback to Visual Dashboard
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
