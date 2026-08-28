import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { outputService } from '../services/outputService';
import { hapticService } from '../services/hapticService';
import { Colors } from '../theme/colors';

export const ModeSelectScreen: React.FC = () => {
  const { setMode } = useAccessibility();

  useEffect(() => {
    const announceWelcome = async () => {
      await outputService.announce(
        'Welcome to Access Plus. Tap the top half of your screen for Visual Assistance. Tap the bottom half for Hearing Assistance. Or tap the bottom bar for Guardian Mode.',
        'high'
      );
    };
    announceWelcome();
  }, []);

  const handleSelectBlind = async () => {
    await hapticService.heavy();
    await setMode('blind');
  };

  const handleSelectDeaf = async () => {
    await hapticService.heavy();
    await setMode('deaf');
  };

  const handleSelectGuardian = async () => {
    await hapticService.medium();
    await setMode('guardian');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />

      {/* TOP HALF: VISUAL ASSISTANCE (BLIND / LOW VISION) */}
      <TouchableOpacity
        accessible={true}
        accessibilityLabel="Visual Assistance Mode for Blind and Visually Impaired Users"
        accessibilityHint="Double tap to enter voice-first visual assistance mode"
        accessibilityRole="button"
        activeOpacity={0.8}
        onPress={handleSelectBlind}
        style={styles.blindSection}
      >
        <View style={styles.cardContent}>
          <Text style={styles.modeIcon}>👁️</Text>
          <Text style={styles.modeTitleAmber}>VISUAL ASSISTANCE</Text>
          <Text style={styles.modeSubtitleAmber}>
            Voice Assistant • Scene AI • Navigation • Obstacle Detection
          </Text>
          <View style={styles.badgeAmber}>
            <Text style={styles.badgeTextAmber}>TAP TOP HALF</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* TACTILE DIVIDER */}
      <View style={styles.divider} />

      {/* BOTTOM HALF: HEARING ASSISTANCE (DEAF / HARD OF HEARING) */}
      <TouchableOpacity
        accessible={true}
        accessibilityLabel="Hearing Assistance Mode for Deaf and Hard of Hearing Users"
        accessibilityHint="Double tap to enter visual-first hearing assistance mode"
        accessibilityRole="button"
        activeOpacity={0.8}
        onPress={handleSelectDeaf}
        style={styles.deafSection}
      >
        <View style={styles.cardContent}>
          <Text style={styles.modeIcon}>🧏</Text>
          <Text style={styles.modeTitleTeal}>HEARING ASSISTANCE</Text>
          <Text style={styles.modeSubtitleTeal}>
            Live Captions • Siren & Horn Detection • Visual Haptic Alerts
          </Text>
          <View style={styles.badgeTeal}>
            <Text style={styles.badgeTextTeal}>TAP BOTTOM HALF</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* FOOTER: GUARDIAN MODE */}
      <TouchableOpacity
        accessible={true}
        accessibilityLabel="Guardian Mode"
        accessibilityHint="Double tap to open guardian tracking and emergency monitoring"
        accessibilityRole="button"
        activeOpacity={0.8}
        onPress={handleSelectGuardian}
        style={styles.guardianBar}
      >
        <Text style={styles.guardianText}>🛡️ Open Guardian / Family Monitor</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
  blindSection: {
    flex: 1,
    backgroundColor: Colors.blindSurface,
    borderBottomWidth: 3,
    borderColor: Colors.blindBorder,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deafSection: {
    flex: 1,
    backgroundColor: Colors.deafSurface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIcon: {
    fontSize: 50,
    marginBottom: 8,
  },
  modeTitleAmber: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.blindPrimary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modeSubtitleAmber: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: '92%',
    fontWeight: '600',
    lineHeight: 22,
  },
  badgeAmber: {
    backgroundColor: Colors.blindPrimary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 14,
  },
  badgeTextAmber: {
    color: '#121110',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  modeTitleTeal: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2DD4BF', // Light Ocean Teal
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modeSubtitleTeal: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: '92%',
    fontWeight: '600',
    lineHeight: 22,
  },
  badgeTeal: {
    backgroundColor: Colors.deafPrimary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 14,
  },
  badgeTextTeal: {
    color: '#FAF7F2',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  divider: {
    height: 3,
    backgroundColor: Colors.borderSubtle,
  },
  guardianBar: {
    height: 64,
    backgroundColor: Colors.surfaceElevated,
    borderTopWidth: 2,
    borderColor: Colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guardianText: {
    color: Colors.textHighEmphasis,
    fontSize: 16,
    fontWeight: '700',
  },
});
