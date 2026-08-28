import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LanguageCode, LanguageOption } from '../../types';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { outputService } from '../../services/outputService';
import { hapticService } from '../../services/hapticService';

interface LanguageSelectionScreenProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onContinue: () => void;
  onBack: () => void;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English (Default)', isAvailable: true },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు (Telugu)', isAvailable: true },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी (Hindi)', isAvailable: true },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ் (Tamil)', isAvailable: true },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español (Spanish)', isAvailable: true },
  { code: 'fr', label: 'French', nativeLabel: 'Français (French)', isAvailable: true },
];

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onContinue,
  onBack,
}) => {
  useEffect(() => {
    outputService.announce(
      'Step 2 of 5: Choose your preferred language. English is currently selected.',
      'normal'
    );
  }, []);

  const handleSelect = async (lang: LanguageOption) => {
    await hapticService.medium();
    onSelectLanguage(lang.code);
    outputService.announce(`${lang.label} selected. Tap continue at bottom.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <AppHeader title="Language Selection" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.stepLabel}>STEP 2 OF 5</Text>
          <Text style={styles.title}>Select Your Language</Text>
          <Text style={styles.subtitle}>
            Voice assistance, speech-to-text, and screen text will adapt to your language.
          </Text>
        </View>

        <View style={styles.languagesList}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                accessible={true}
                accessibilityLabel={`${lang.label}. ${lang.nativeLabel}`}
                accessibilityHint="Double tap to choose this language"
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                activeOpacity={0.8}
                onPress={() => handleSelect(lang)}
                style={[styles.langCard, isSelected && styles.langCardSelected]}
              >
                <View style={styles.langTextGroup}>
                  <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>
                    {lang.label}
                  </Text>
                  <Text style={styles.nativeLabel}>{lang.nativeLabel}</Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Continue to Registration"
          accessibilityRole="button"
          onPress={onContinue}
          style={styles.continueBtn}
        >
          <Text style={styles.continueText}>Continue →</Text>
        </TouchableOpacity>
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
  },
  intro: {
    marginBottom: Spacing.lg,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.blindPrimary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    lineHeight: 22,
  },
  languagesList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    minHeight: Spacing.minTouchTarget,
  },
  langCardSelected: {
    borderColor: Colors.blindBorder,
    backgroundColor: Colors.blindSurface,
  },
  langTextGroup: {
    flex: 1,
  },
  langLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textHighEmphasis,
  },
  langLabelSelected: {
    color: Colors.blindPrimary,
  },
  nativeLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.blindPrimary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.blindPrimary,
  },
  continueBtn: {
    backgroundColor: Colors.blindPrimary,
    minHeight: Spacing.minTouchTarget,
    borderRadius: Spacing.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {
    color: '#121110',
    fontSize: 18,
    fontWeight: '800',
  },
});
