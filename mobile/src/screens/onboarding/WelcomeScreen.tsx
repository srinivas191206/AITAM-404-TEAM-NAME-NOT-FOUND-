import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AccessibleButton } from '../../components/AccessibleButton';
import { outputService } from '../../services/outputService';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  useEffect(() => {
    outputService.announce(
      'Welcome to Access Plus. An intelligent accessibility and safety companion. Tap the button at the bottom to get started.',
      'normal'
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* TOP BRANDING */}
        <View style={styles.headerSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ACCESSIBILITY & SAFETY</Text>
          </View>
          <Text style={styles.title}>Welcome to Access+</Text>
          <Text style={styles.subtitle}>
            An intelligent accessibility and safety companion designed for physical mobile devices.
          </Text>
        </View>

        {/* CALM VALUE PROPOSITIONS */}
        <View style={styles.cardsSection}>
          <View style={styles.valueCard}>
            <Text style={styles.cardIcon}>👁️</Text>
            <View style={styles.cardTextGroup}>
              <Text style={styles.cardTitle}>Visual Assistance</Text>
              <Text style={styles.cardDesc}>
                Voice-first assistant, camera scene understanding, document reading, and pedestrian guidance.
              </Text>
            </View>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.cardIcon}>🧏</Text>
            <View style={styles.cardTextGroup}>
              <Text style={styles.cardTitle}>Hearing Assistance</Text>
              <Text style={styles.cardDesc}>
                Live conversation captions, ambient sound radar, siren/horn detection, and visual alerts.
              </Text>
            </View>
          </View>

          <View style={styles.valueCard}>
            <Text style={styles.cardIcon}>🛡️</Text>
            <View style={styles.cardTextGroup}>
              <Text style={styles.cardTitle}>Guardian & Emergency SOS</Text>
              <Text style={styles.cardDesc}>
                Impact sensor fall detection with a 5-second cancel timer and live location alerts.
              </Text>
            </View>
          </View>
        </View>

        {/* GET STARTED CTA */}
        <View style={styles.bottomSection}>
          <AccessibleButton
            title="Get Started →"
            size="large"
            variant="primary"
            accessibilityHint="Double tap to start the setup process"
            onPress={onContinue}
          />
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
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: Spacing.xl,
  },
  headerSection: {
    marginTop: Spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceInteractive,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  badgeText: {
    color: Colors.blindPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMediumEmphasis,
    lineHeight: 24,
    fontWeight: '500',
  },
  cardsSection: {
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  cardIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  cardTextGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textHighEmphasis,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.textMediumEmphasis,
    lineHeight: 20,
    fontWeight: '500',
  },
  bottomSection: {
    marginTop: Spacing.lg,
  },
});
