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
import Svg, { Circle } from 'react-native-svg';
import { LanguageCode, LanguageOption } from '../../types';
import { LanguageRegistry, getLanguageLabel } from '../../config/languages';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { AccessibleButton } from '../../components/AccessibleButton';
import { outputService } from '../../services/outputService';
import { hapticService } from '../../services/hapticService';
import { useApp } from '../../context/AppContext';

interface LanguageSelectionScreenProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onContinue: () => void;
  onBack: () => void;
}

const RadioCheckedIcon = ({ color = '#0F9D9A' }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" />
    <Circle cx="12" cy="12" r="5" fill={color} />
  </Svg>
);

const RadioUncheckedIcon = ({ color = '#CBD5E1' }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
  </Svg>
);

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onContinue,
  onBack,
}) => {
  const { activeMode } = useApp();
  const [visualToast, setVisualToast] = useState<string | null>(null);

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

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

  const handleContinuePress = () => {
    hapticService.medium();
    if (activeMode === 'blind') {
      outputService.announce(`Continuing to Registration with ${getLanguageLabel(selectedLanguage)}.`);
    }
    onContinue();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.card} />
      <AppHeader title="Select Language" onBack={onBack} lightMode={true} />

      {visualToast ? (
        <View style={[styles.toast, { backgroundColor: palette.accentLight, borderColor: palette.accentTeal }]}>
          <Text style={[styles.toastText, { color: palette.accentTeal }]}>✓ {visualToast}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* INTRO HEADER */}
        <View style={styles.intro}>
          <View style={[styles.stepBadge, { backgroundColor: palette.accentLight }]}>
            <Text style={[styles.stepBadgeText, { color: palette.accentTeal }]}>STEP 2 OF 5</Text>
          </View>
          <Text style={[styles.title, { color: palette.primaryText }]}>Language Preferences</Text>
          <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
            {activeMode === 'blind'
              ? 'Voice responses and screen reader guidance will use this language.'
              : 'Screen text and live captions will adapt to this language.'}
          </Text>
        </View>

        {/* LANGUAGES RADIO LIST */}
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
                style={[
                  styles.langCard,
                  {
                    backgroundColor: isSelected ? '#F4FBFB' : palette.card,
                    borderColor: isSelected ? palette.accentTeal : palette.border,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
              >
                <View style={styles.langTextGroup}>
                  <Text style={[styles.langLabel, { color: palette.primaryText }, isSelected && styles.langLabelSelected]}>
                    {lang.label}
                  </Text>
                  <Text style={[styles.nativeLabel, { color: palette.secondaryText }]}>{lang.nativeLabel}</Text>
                </View>
                {isSelected ? <RadioCheckedIcon color={palette.accentTeal} /> : <RadioUncheckedIcon color="#CBD5E1" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CONTINUE CTA */}
        <View style={styles.bottomSection}>
          <AccessibleButton
            title="Continue to Registration →"
            size="large"
            variant="teal"
            accessibilityHint="Double tap to proceed to registration"
            onPress={handleContinuePress}
          />
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
  },
  intro: {
    marginBottom: Spacing.md,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 10,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  toast: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  toastText: {
    fontSize: 14,
    fontWeight: '700',
  },
  languagesList: {
    gap: 12,
    marginBottom: Spacing.xl,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 60,
  },
  langTextGroup: {
    flex: 1,
  },
  langLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  langLabelSelected: {
    fontWeight: '800',
  },
  nativeLabel: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '400',
  },
  bottomSection: {
    marginTop: Spacing.xs,
  },
});
