import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LanguageCode, LanguageOption, AccessibilityMode } from '../../types';
import { LanguageRegistry, getLanguageLabel } from '../../config/languages';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { outputService } from '../../services/outputService';
import { hapticService } from '../../services/hapticService';
import { useApp } from '../../context/AppContext';

interface LanguageSelectionScreenProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onContinue,
  onBack,
}) => {
  const { activeMode } = useApp();
  const [visualToast, setVisualToast] = useState<string | null>(null);

  useEffect(() => {
    if (activeMode === 'blind') {
      outputService.announce(
        `Step 2 of 5: Please select your language. ${getLanguageLabel(
          selectedLanguage
        )} is currently selected. Double tap to change language, or tap the continue button at the bottom.`,
        'normal'
      );
    }
  }, [activeMode]);

  const handleSelect = async (lang: LanguageOption) => {
    await hapticService.medium();
    onSelectLanguage(lang.code);
    setVisualToast(`${lang.label} Selected`);

    if (activeMode === 'blind') {
      await outputService.announce(`${lang.label} selected.`);
    } else if (activeMode === 'deaf') {
      outputService.broadcastVisualAlert({
        title: 'Language Selected',
        message: `${lang.label} selected.`,
        severity: 'info',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  const handleContinuePress = async () => {
    await hapticService.medium();
    if (activeMode === 'blind') {
      await outputService.announce(`Continuing to Registration with ${getLanguageLabel(selectedLanguage)}.`);
    }
    onContinue();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <AppHeader title="Select Language" onBack={onBack} />

      {visualToast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {visualToast}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.stepLabel}>STEP 2 OF 5</Text>
          <Text style={styles.title}>Language Preferences</Text>
          <Text style={styles.subtitle}>
            {activeMode === 'blind'
              ? 'Voice responses and screen reader guidance will use this language.'
              : 'Screen text and live captions will adapt to this language.'}
          </Text>
        </View>

        <View style={styles.languagesList}>
          {LanguageRegistry.supportedLanguages.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                accessible={true}
                accessibilityLabel={`${lang.label}. ${lang.nativeLabel}`}
                accessibilityHint="Double tap to select this language"
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
          accessibilityLabel={`Continue to Registration with ${getLanguageLabel(selectedLanguage)}`}
          accessibilityHint="Double tap to proceed to personal information step"
          accessibilityRole="button"
          onPress={handleContinuePress}
          style={styles.continueBtn}
        >
          <Text style={styles.continueText}>Continue to Registration →</Text>
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
    marginBottom: Spacing.md,
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
  toast: {
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  toastText: {
    color: Colors.success,
    fontWeight: '700',
    fontSize: 14,
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
    fontWeight: '800',
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
