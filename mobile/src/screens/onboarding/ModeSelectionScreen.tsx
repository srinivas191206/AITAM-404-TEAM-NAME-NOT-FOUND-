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
  useEffect(() => {
    outputService.announce(
      'Step 1 of 5: Choose your primary accessibility mode. Tap Visual Assistance for blind or low vision support, or tap Hearing Assistance for deaf or hard of hearing support.',
      'normal'
    );
  }, []);

  const handleSelect = async (mode: AccessibilityMode) => {
    await hapticService.heavy();
    onSelectMode(mode);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <AppHeader title="Accessibility Mode" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.stepLabel}>STEP 1 OF 5</Text>
          <Text style={styles.title}>How would you like to use Access+?</Text>
          <Text style={styles.subtitle}>
            You can customize or change this anytime in Settings.
          </Text>
        </View>

        {/* MODE OPTION 1: VISUAL ASSISTANCE */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Visual Assistance Mode for Blind and Low Vision Users"
          accessibilityHint="Double tap to select voice-first visual assistance"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={() => handleSelect('blind')}
          style={styles.blindCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.icon}>👁️</Text>
            <View style={styles.headerText}>
              <Text style={styles.blindTitle}>Visual Assistance</Text>
              <Text style={styles.badgeAmber}>VOICE-FIRST INTERACTION</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Tailored for blind or visually impaired users. Features voice guidance, camera scene narration, text reader, and obstacle alerts.
          </Text>
        </TouchableOpacity>

        {/* MODE OPTION 2: HEARING ASSISTANCE */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Hearing Assistance Mode for Deaf and Hard of Hearing Users"
          accessibilityHint="Double tap to select visual-first hearing assistance"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={() => handleSelect('deaf')}
          style={styles.deafCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.icon}>🧏</Text>
            <View style={styles.headerText}>
              <Text style={styles.deafTitle}>Hearing Assistance</Text>
              <Text style={styles.badgeTeal}>VISUAL-FIRST INTERACTION</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            Tailored for deaf or hard-of-hearing users. Features real-time speech captions, ambient sound detection, and vibration feedback.
          </Text>
        </TouchableOpacity>

        {/* MODE OPTION 3: GUARDIAN MODE */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Guardian Mode for Family and Caretakers"
          accessibilityHint="Double tap to select guardian monitor mode"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={() => handleSelect('guardian')}
          style={styles.guardianCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.icon}>🛡️</Text>
            <View style={styles.headerText}>
              <Text style={styles.guardianTitle}>Guardian / Caretaker Mode</Text>
              <Text style={styles.badgeSlate}>MONITOR & ALERTS</Text>
            </View>
          </View>
          <Text style={styles.cardDesc}>
            For family members and guardians monitoring an assisted user's safety and receiving instant emergency SOS notifications.
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
    marginBottom: Spacing.sm,
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
  blindCard: {
    backgroundColor: Colors.blindSurface,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.blindBorder,
  },
  deafCard: {
    backgroundColor: Colors.deafSurface,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.deafBorder,
  },
  guardianCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  icon: {
    fontSize: 36,
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
  },
});
