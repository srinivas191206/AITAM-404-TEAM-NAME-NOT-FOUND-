import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { AccessibleButton } from '../../components/AccessibleButton';
import { outputService } from '../../services/outputService';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const {
    userProfile,
    activeMode,
    selectedLanguage,
    setMode,
    setLanguage,
    resetOnboarding,
    goToOnboardingStep,
  } = useApp();

  const handleReset = async () => {
    await resetOnboarding();
    outputService.announce('Application reset. Returning to welcome screen.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <AppHeader title="Settings & Setup" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* SECTION 1: PROFILE SUMMARY */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>USER PROFILE</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{userProfile.fullName || 'Assisted User'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{userProfile.phone || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency Contact:</Text>
            <Text style={styles.infoValue}>
              {userProfile.emergencyContact.name
                ? `${userProfile.emergencyContact.name} (${userProfile.emergencyContact.phone})`
                : 'Not configured'}
            </Text>
          </View>
        </View>

        {/* SECTION 2: ACCESSIBILITY MODE SWITCHER */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ACTIVE ACCESSIBILITY MODE</Text>
          <View style={styles.modeButtonsRow}>
            <TouchableOpacity
              onPress={() => setMode('blind')}
              style={[styles.modeChip, activeMode === 'blind' && styles.modeChipActiveAmber]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  activeMode === 'blind' && styles.modeChipTextActiveDark,
                ]}
              >
                👁️ Visual Assist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('deaf')}
              style={[styles.modeChip, activeMode === 'deaf' && styles.modeChipActiveTeal]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  activeMode === 'deaf' && styles.modeChipTextActiveLight,
                ]}
              >
                🧏 Hearing Assist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('guardian')}
              style={[styles.modeChip, activeMode === 'guardian' && styles.modeChipActiveSlate]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  activeMode === 'guardian' && styles.modeChipTextActiveLight,
                ]}
              >
                🛡️ Guardian
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 3: LANGUAGE SWITCHER */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>LANGUAGE</Text>
          <View style={styles.modeButtonsRow}>
            {(['en', 'te', 'hi'] as const).map((langCode) => (
              <TouchableOpacity
                key={langCode}
                onPress={() => setLanguage(langCode)}
                style={[styles.modeChip, selectedLanguage === langCode && styles.modeChipActiveAmber]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    selectedLanguage === langCode && styles.modeChipTextActiveDark,
                  ]}
                >
                  {langCode === 'en' ? 'English' : langCode === 'te' ? 'Telugu' : 'Hindi'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION 4: RE-RUN ONBOARDING / RESET APP */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DEVELOPER & TESTING TOOLS</Text>
          <Text style={styles.cardDesc}>
            Test the complete first-time onboarding flow from the beginning:
          </Text>

          <AccessibleButton
            title="🔄 Re-run Setup & Onboarding Flow"
            size="normal"
            variant="warning"
            onPress={handleReset}
          />
        </View>

        {/* APP INFO */}
        <View style={styles.appInfoBox}>
          <Text style={styles.appInfoTitle}>Access+ Mobile v1.0.0</Text>
          <Text style={styles.appInfoDesc}>
            Phase 1 Mobile Application Shell & Core Navigation
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  sectionCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderColor: Colors.surfaceInteractive,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textHighEmphasis,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  modeButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  modeChip: {
    backgroundColor: Colors.surfaceInteractive,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Spacing.radiusMd,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  modeChipActiveAmber: {
    backgroundColor: Colors.blindPrimary,
    borderColor: Colors.blindBorder,
  },
  modeChipActiveTeal: {
    backgroundColor: Colors.deafPrimary,
    borderColor: Colors.deafBorder,
  },
  modeChipActiveSlate: {
    backgroundColor: Colors.guardianPrimary,
    borderColor: Colors.guardianAccent,
  },
  modeChipText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  modeChipTextActiveDark: {
    color: '#121110',
    fontWeight: '800',
  },
  modeChipTextActiveLight: {
    color: '#FAF7F2',
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.textMediumEmphasis,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  appInfoBox: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  appInfoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
  },
  appInfoDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
