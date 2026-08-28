import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { AccessibleButton } from '../../components/AccessibleButton';
import { outputService } from '../../services/outputService';
import { ttsService } from '../../services/ttsService';

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
  } = useApp();

  const primaryContact =
    userProfile.emergencyContact || userProfile.emergencyContacts?.[0];

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

  const handleReset = async () => {
    await resetOnboarding();
    outputService.announce('Application reset. Returning to welcome screen.');
  };

  const handleLanguageChange = (langCode: 'en' | 'te' | 'hi' | 'ta' | 'es' | 'fr') => {
    setLanguage(langCode);
    ttsService.setLanguage(langCode);
    const feedback = ttsService.translateKey('ready', langCode);
    outputService.announce(feedback, 'high');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.card} />
      <AppHeader title="Settings & Setup" onBack={onBack} lightMode={true} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: USER PROFILE SUMMARY */}
        <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.accentTeal }]}>USER PROFILE</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: palette.secondaryText }]}>Name:</Text>
            <Text style={[styles.infoValue, { color: palette.primaryText }]}>
              {userProfile.fullName || userProfile.name || 'Assisted User'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: palette.secondaryText }]}>Phone:</Text>
            <Text style={[styles.infoValue, { color: palette.primaryText }]}>
              {userProfile.phoneNumber || userProfile.phone || 'Not specified'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: palette.secondaryText }]}>Address:</Text>
            <Text style={[styles.infoValue, { color: palette.primaryText }]}>
              {userProfile.address || 'Not specified'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: palette.secondaryText }]}>Emergency Contact:</Text>
            <Text style={[styles.infoValue, { color: palette.primaryText }]}>
              {primaryContact?.name
                ? `${primaryContact.name} (${primaryContact.phoneNumber || primaryContact.phone})`
                : 'Not configured'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: palette.secondaryText }]}>Guardian Status:</Text>
            <Text style={[styles.infoValue, { color: palette.primaryText }]}>
              {userProfile.guardian?.guardianLinked || userProfile.guardianLinked
                ? '✓ Linked'
                : 'Set Up Later'}
            </Text>
          </View>
        </View>

        {/* SECTION 2: ACCESSIBILITY MODE SWITCHER */}
        <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.accentTeal }]}>ACTIVE ACCESSIBILITY MODE</Text>
          <View style={styles.modeButtonsRow}>
            <TouchableOpacity
              onPress={() => setMode('blind')}
              style={[
                styles.modeChip,
                activeMode === 'blind'
                  ? { backgroundColor: palette.accentTeal, borderColor: palette.accentTeal }
                  : { backgroundColor: palette.background, borderColor: palette.border },
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  { color: activeMode === 'blind' ? '#FFFFFF' : palette.primaryText },
                ]}
              >
                👁️ Visual Assist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('deaf')}
              style={[
                styles.modeChip,
                activeMode === 'deaf'
                  ? { backgroundColor: palette.accentTeal, borderColor: palette.accentTeal }
                  : { backgroundColor: palette.background, borderColor: palette.border },
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  { color: activeMode === 'deaf' ? '#FFFFFF' : palette.primaryText },
                ]}
              >
                🧏 Hearing Assist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('guardian')}
              style={[
                styles.modeChip,
                activeMode === 'guardian'
                  ? { backgroundColor: palette.accentTeal, borderColor: palette.accentTeal }
                  : { backgroundColor: palette.background, borderColor: palette.border },
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  { color: activeMode === 'guardian' ? '#FFFFFF' : palette.primaryText },
                ]}
              >
                🛡️ Guardian
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 3: LANGUAGE SWITCHER WITH INDIAN ACCENT / VOICE SUPPORT */}
        <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.accentTeal }]}>SYSTEM LANGUAGE & VOICE (INDIAN ACCENT)</Text>
          <View style={styles.modeButtonsRow}>
            {[
              { code: 'en', label: 'English (en-IN)' },
              { code: 'hi', label: 'Hindi (hi-IN)' },
              { code: 'te', label: 'Telugu (te-IN)' },
              { code: 'ta', label: 'Tamil (ta-IN)' },
            ].map(({ code, label }) => (
              <TouchableOpacity
                key={code}
                onPress={() => handleLanguageChange(code as any)}
                style={[
                  styles.modeChip,
                  selectedLanguage === code
                    ? { backgroundColor: palette.accentTeal, borderColor: palette.accentTeal }
                    : { backgroundColor: palette.background, borderColor: palette.border },
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    { color: selectedLanguage === code ? '#FFFFFF' : palette.primaryText },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION 4: RESET APP */}
        <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.accentTeal }]}>DEVELOPER & TESTING TOOLS</Text>
          <Text style={[styles.cardDesc, { color: palette.secondaryText }]}>
            Test first-time onboarding and registration from scratch:
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
          <Text style={[styles.appInfoTitle, { color: palette.primaryText }]}>Access+ Mobile v1.0.0</Text>
          <Text style={[styles.appInfoDesc, { color: palette.secondaryText }]}>
            Teal & Slate Accessibility Architecture (All Phases 1–12 Integrated)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: 14,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  modeButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  appInfoBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appInfoTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  appInfoDesc: {
    fontSize: 13,
    marginTop: 2,
  },
});
