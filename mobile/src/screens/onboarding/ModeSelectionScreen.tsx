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
import Svg, { Path, Circle } from 'react-native-svg';
import { AccessibilityMode } from '../../types';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { outputService } from '../../services/outputService';
import { hapticService } from '../../services/hapticService';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: AccessibilityMode) => void;
  onBack: () => void;
}

const EyeIcon = ({ color = '#0F9D9A', size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <Circle cx="12" cy="12" r="3.5" fill={color} />
  </Svg>
);

const EarIcon = ({ color = '#0284C7', size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10" />
    <Path d="M15 8.5a3.5 3.5 0 1 1-7 0" />
    <Circle cx="10" cy="11" r="1.5" fill={color} />
  </Svg>
);

const ShieldIcon = ({ color = '#475569', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Circle cx="12" cy="10" r="2.5" fill={color} />
    <Path d="M8 17c0-2.2 1.8-4 4-4s4 1.8 4 4" />
  </Svg>
);

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  onSelectMode,
  onBack,
}) => {
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

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
    outputService.announce(
      'Step 1 of 5: Choose your accessibility mode. Tap anywhere on the top half of your screen for Visual Assistance. Tap the bottom half for Hearing Assistance. Or tap Guardian at the footer.',
      'high'
    );
  }, []);

  const handleSelectVisual = async () => {
    await hapticService.heavy();
    await outputService.announce('Visual Assistance selected.', 'urgent');
    setFeedbackBanner('👁️ Visual Assistance Selected');
    setTimeout(() => {
      onSelectMode('blind');
    }, 400);
  };

  const handleSelectHearing = async () => {
    await hapticService.heavy();
    setFeedbackBanner('🧏 Hearing Assistance Selected');
    outputService.broadcastVisualAlert({
      title: 'Hearing Assistance Selected',
      message: 'Visual-first mode active. Proceeding to language selection.',
      severity: 'info',
      timestamp: new Date().toLocaleTimeString(),
    });
    setTimeout(() => {
      onSelectMode('deaf');
    }, 400);
  };

  const handleSelectGuardian = async () => {
    await hapticService.medium();
    await outputService.announce('Guardian mode selected.');
    setFeedbackBanner('🛡️ Guardian Mode Selected');
    setTimeout(() => {
      onSelectMode('guardian');
    }, 300);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.card} />
      <AppHeader title="Select Mode" onBack={onBack} lightMode={true} />

      {/* VISUAL CONFIRMATION TOAST BANNER */}
      {feedbackBanner ? (
        <View style={[styles.feedbackToast, { backgroundColor: palette.accentLight, borderColor: palette.accentTeal }]}>
          <Text style={[styles.feedbackToastText, { color: palette.accentTeal }]}>{feedbackBanner}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* STEP BADGE & INTRO */}
        <View style={styles.intro}>
          <View style={[styles.stepBadge, { backgroundColor: palette.accentLight }]}>
            <Text style={[styles.stepBadgeText, { color: palette.accentTeal }]}>STEP 1 OF 5</Text>
          </View>
          <Text style={[styles.title, { color: palette.primaryText }]}>Choose Accessibility Mode</Text>
          <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
            Large split targets designed for effortless touch navigation.
          </Text>
        </View>

        {/* TARGET 1: VISUAL ASSISTANCE */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Visual Assistance for blind or low-vision users. Voice-first assistant."
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={handleSelectVisual}
          style={[
            styles.modeCard,
            {
              backgroundColor: '#F4FBFB',
              borderColor: palette.accentTeal,
              borderWidth: 1.5,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: palette.accentLight }]}>
              <EyeIcon color={palette.accentTeal} size={26} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.cardTitle, { color: palette.primaryText }]}>Visual Assistance</Text>
              <Text style={[styles.subBadge, { color: palette.accentTeal }]}>VOICE-FIRST • TAP TOP HALF</Text>
            </View>
          </View>
          <Text style={[styles.cardDesc, { color: palette.secondaryText }]}>
            Designed for blind and visually impaired users. Spoken voice assistant, scene descriptions, text reading, and obstacle alerts.
          </Text>
        </TouchableOpacity>

        {/* TARGET 2: HEARING ASSISTANCE */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Hearing Assistance for deaf or hard of hearing users. Visual-first mode."
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={handleSelectHearing}
          style={[
            styles.modeCard,
            {
              backgroundColor: palette.card,
              borderColor: '#BAE6FD',
              borderWidth: 1.5,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <EarIcon color="#0284C7" size={26} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.cardTitle, { color: '#0369A1' }]}>Hearing Assistance</Text>
              <Text style={[styles.subBadge, { color: '#0284C7' }]}>VISUAL-FIRST • TAP BOTTOM HALF</Text>
            </View>
          </View>
          <Text style={[styles.cardDesc, { color: palette.secondaryText }]}>
            Designed for deaf and hard-of-hearing users. Real-time conversation captions, ambient sound detection, and vibration alerts.
          </Text>
        </TouchableOpacity>

        {/* TARGET 3: GUARDIAN / CAREGIVER */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Guardian Mode for family and caregivers"
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={handleSelectGuardian}
          style={[
            styles.modeCard,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#F1F5F9' }]}>
              <ShieldIcon color="#475569" size={24} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.cardTitle, { color: palette.primaryText }]}>Guardian / Caregiver</Text>
              <Text style={[styles.subBadge, { color: '#64748B' }]}>MONITOR & EMERGENCY ALERTS</Text>
            </View>
          </View>
          <Text style={[styles.cardDesc, { color: palette.secondaryText }]}>
            Monitor assisted user status, safe-zone geofencing, and receive real-time SOS alerts.
          </Text>
        </TouchableOpacity>
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
    gap: 16,
  },
  intro: {
    marginBottom: 4,
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
  feedbackToast: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  feedbackToastText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modeCard: {
    borderRadius: 20,
    padding: 18,
    shadowColor: '#0F9D9A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
});
