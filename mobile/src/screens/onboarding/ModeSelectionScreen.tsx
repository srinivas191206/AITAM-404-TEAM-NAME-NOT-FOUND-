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

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  onSelectMode,
  onBack,
}) => {
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <AppHeader title="Select Mode" onBack={onBack} />

      {/* VISUAL CONFIRMATION BANNER */}
      {feedbackBanner ? (
        <View style={styles.feedbackToast}>
          <Text style={styles.feedbackToastText}>{feedbackBanner}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.stepLabel}>STEP 1 OF 5</Text>
          <Text style={styles.title}>Choose Accessibility Mode</Text>
          <Text style={styles.subtitle}>
            Large split targets designed for effortless touch navigation.
          </Text>
        </View>

        {/* LARGE TOUCH TARGET 1: VISUAL ASSISTANCE (TOP) */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Visual Assistance for blind or low-vision users. Tap top half of screen."
          accessibilityHint="Double tap anywhere on the top half to activate voice-first visual assistance"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={handleSelectVisual}
          style={styles.blindCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.icon}>👁️</Text>
            <View style={styles.headerText}>
              <Text style={styles.blindTitle}>Visual Assistance</Text>
              <Text style={styles.badgeAmber}>VOICE-FIRST • TAP TOP HALF</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Designed for blind and visually impaired users. Spoken voice assistant, scene descriptions, text reading, and obstacle alerts.
          </Text>
        </TouchableOpacity>

        {/* LARGE TOUCH TARGET 2: HEARING ASSISTANCE (BOTTOM) */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Hearing Assistance for deaf or hard of hearing users. Tap bottom half of screen."
          accessibilityHint="Double tap anywhere on the bottom half to activate visual-first hearing assistance"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={handleSelectHearing}
          style={styles.deafCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.icon}>🧏</Text>
            <View style={styles.headerText}>
              <Text style={styles.deafTitle}>Hearing Assistance</Text>
              <Text style={styles.badgeTeal}>VISUAL-FIRST • TAP BOTTOM HALF</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Designed for deaf and hard-of-hearing users. Real-time conversation captions, ambient sound detection, and vibration alerts.
          </Text>
        </TouchableOpacity>

        {/* GUARDIAN MODE OPTION */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Guardian Mode for family and caregivers"
          accessibilityHint="Double tap to setup guardian monitor"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={handleSelectGuardian}
          style={styles.guardianCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.icon}>🛡️</Text>
            <View style={styles.headerText}>
              <Text style={styles.guardianTitle}>Guardian / Caregiver</Text>
              <Text style={styles.badgeSlate}>MONITOR & EMERGENCY ALERTS</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
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
    backgroundColor: Colors.canvasPrimary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  intro: {
    marginBottom: Spacing.xs,
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
  feedbackToast: {
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 2,
    borderColor: Colors.blindPrimary,
    alignItems: 'center',
  },
  feedbackToastText: {
    color: Colors.textHighEmphasis,
    fontSize: 16,
    fontWeight: '800',
  },
  blindCard: {
    backgroundColor: Colors.blindSurface,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 2.5,
    borderColor: Colors.blindBorder,
    minHeight: 140,
    justifyContent: 'center',
  },
  deafCard: {
    backgroundColor: Colors.deafSurface,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 2.5,
    borderColor: Colors.deafBorder,
    minHeight: 140,
    justifyContent: 'center',
  },
  guardianCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    minHeight: 100,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 34,
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  blindTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.blindPrimary,
  },
  deafTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.deafBorder,
  },
  guardianTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
  },
  badgeAmber: {
    color: Colors.blindPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  badgeTeal: {
    color: Colors.deafBorder,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  badgeSlate: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.textMediumEmphasis,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
});
