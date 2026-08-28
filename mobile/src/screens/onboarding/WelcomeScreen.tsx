import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AccessibleButton } from '../../components/AccessibleButton';
import { outputService } from '../../services/outputService';

interface WelcomeScreenProps {
  onContinue: () => void;
}

// Crisp Teal & Slate SVG Icons
const BadgeShieldIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#0F9D9A',
  size = 14,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="M12 8v5M12 16h.01" strokeWidth="2.5" />
  </Svg>
);

const EyeIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#0F9D9A',
  size = 24,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <Circle cx="12" cy="12" r="3.5" fill={color} />
  </Svg>
);

const EarIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#0F9D9A',
  size = 24,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10" />
    <Path d="M15 8.5a3.5 3.5 0 1 1-7 0" />
    <Circle cx="10" cy="11" r="1.5" fill={color} />
  </Svg>
);

const ShieldIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#0F9D9A',
  size = 24,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="M12 8v8M9 12h6" strokeWidth="2" />
  </Svg>
);

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
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
      'Welcome to Access Plus. An intelligent accessibility and safety companion. Tap the button at the bottom to get started.',
      'normal'
    );
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* TOP BRANDING & HEADER */}
        <View style={styles.headerSection}>
          <View style={[styles.badge, { backgroundColor: palette.accentLight }]}>
            <BadgeShieldIcon color={palette.accentTeal} size={14} />
            <Text style={[styles.badgeText, { color: palette.accentTeal }]}>
              ACCESSIBILITY & SAFETY
            </Text>
          </View>
          <Text style={[styles.title, { color: palette.primaryText }]}>Welcome to Access+</Text>
          <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
            An intelligent accessibility and safety companion designed for physical mobile devices.
          </Text>
        </View>

        {/* VALUE PROPOSITION CARDS */}
        <View style={styles.cardsSection}>
          {/* Card 1: Visual Assistance */}
          <View style={[styles.valueCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: palette.accentLight }]}>
              <EyeIcon color={palette.accentTeal} size={24} />
            </View>
            <View style={styles.cardTextGroup}>
              <Text style={[styles.cardTitle, { color: palette.primaryText }]}>Visual Assistance</Text>
              <Text style={[styles.cardDesc, { color: palette.secondaryText }]}>
                Voice-first assistant, camera scene understanding, document reading, and pedestrian guidance.
              </Text>
            </View>
          </View>

          {/* Card 2: Hearing Assistance */}
          <View style={[styles.valueCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: palette.accentLight }]}>
              <EarIcon color={palette.accentTeal} size={24} />
            </View>
            <View style={styles.cardTextGroup}>
              <Text style={[styles.cardTitle, { color: palette.primaryText }]}>Hearing Assistance</Text>
              <Text style={[styles.cardDesc, { color: palette.secondaryText }]}>
                Live conversation captions, ambient sound radar, siren/horn detection, and visual alerts.
              </Text>
            </View>
          </View>

          {/* Card 3: Guardian & Emergency SOS */}
          <View style={[styles.valueCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: palette.accentLight }]}>
              <ShieldIcon color={palette.accentTeal} size={24} />
            </View>
            <View style={styles.cardTextGroup}>
              <Text style={[styles.cardTitle, { color: palette.primaryText }]}>Guardian & Emergency SOS</Text>
              <Text style={[styles.cardDesc, { color: palette.secondaryText }]}>
                Impact sensor fall detection with a 5-second cancel timer and live location alerts.
              </Text>
            </View>
          </View>
        </View>

        {/* GET STARTED CTA BUTTON */}
        <View style={styles.bottomSection}>
          <AccessibleButton
            title="Get Started →"
            size="large"
            variant="teal"
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
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerSection: {
    marginTop: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: Spacing.md,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs + 2,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  cardsSection: {
    marginVertical: Spacing.lg,
    gap: 14,
  },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    // Subtle elevation shadow
    shadowColor: '#0F9D9A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  cardTextGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bottomSection: {
    marginTop: Spacing.md,
  },
});
