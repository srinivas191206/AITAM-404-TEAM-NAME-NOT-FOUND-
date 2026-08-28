import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  DeviceEventEmitter,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { outputService } from '../../services/outputService';
import { speechRecognitionService } from '../../services/speechRecognitionService';

interface WelcomeScreenProps {
  onContinue: (selectedMode?: 'blind' | 'deaf' | 'guardian') => void;
}

const EyeIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#0F9D9A',
  size = 28,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <Circle cx="12" cy="12" r="3.5" fill={color} />
  </Svg>
);

const EarIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#0F9D9A',
  size = 28,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10" />
    <Path d="M15 8.5a3.5 3.5 0 1 1-7 0" />
    <Circle cx="10" cy="11" r="1.5" fill={color} />
  </Svg>
);

const ShieldIcon: React.FC<{ color?: string; size?: number }> = ({
  color = '#0F9D9A',
  size = 28,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="M12 8v8M9 12h6" strokeWidth="2" />
  </Svg>
);

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  const isHandledRef = useRef(false);

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

  const handleSelectBlind = () => {
    if (isHandledRef.current) return;
    isHandledRef.current = true;
    onContinue('blind');
  };

  const handleSelectDeaf = () => {
    if (isHandledRef.current) return;
    isHandledRef.current = true;
    onContinue('deaf');
  };

  useEffect(() => {
    // Audio prompt announced on mount in English, Telugu, and Hindi
    const announcementText =
      'Welcome to Access Plus. Say anything or tap the screen for Visual Assistance Mode. Double tap bottom for Hearing Assistance Mode.';

    outputService.announce(announcementText, 'high');

    // Hardware volume change listener fallback
    const sub1 = DeviceEventEmitter.addListener('onVolumeChange', handleSelectBlind);
    const sub2 = DeviceEventEmitter.addListener('VolumeChanged', handleSelectBlind);

    // Auto-listen for voice command
    speechRecognitionService.startListening({
      onResult: (spokenText: string) => {
        const lower = spokenText.toLowerCase();
        if (lower.includes('deaf') || lower.includes('hearing') || lower.includes('ear')) {
          handleSelectDeaf();
        } else if (lower.includes('guardian') || lower.includes('caregiver')) {
          onContinue('guardian');
        } else {
          // ANY spoken input defaults to Visual Assistance Mode for blind users!
          handleSelectBlind();
        }
      },
      onError: () => {},
    });

    return () => {
      sub1.remove();
      sub2.remove();
      speechRecognitionService.stopListening();
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* TOP BRANDING & HEADER */}
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: palette.primaryText }]}>Access+ Assistant</Text>
          <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
            Tap anywhere or say "Hi" to start Visual Assistance. Voice assistant is listening...
          </Text>
        </View>

        {/* 0-TOUCH LARGE SELECTION CARDS */}
        <View style={styles.cardsSection}>
          {/* Visual Assistance (Blind Mode) - LARGE PRIMARY TARGET */}
          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Visual Assistance Mode for Blind users. Say anything or tap anywhere here to start."
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={handleSelectBlind}
            style={[styles.modeCard, styles.primaryBlindCard, { backgroundColor: '#F4FBFB', borderColor: palette.accentTeal }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: palette.accentLight }]}>
              <EyeIcon color={palette.accentTeal} size={36} />
            </View>
            <View style={styles.cardTextGroup}>
              <Text style={[styles.cardTitle, { color: palette.primaryText }]}>👁️ Visual Assistance (Blind)</Text>
              <Text style={[styles.cardDesc, { color: palette.secondaryText }]}>
                TAP ANYWHERE or SAY ANYTHING out loud to select automatically. Includes hands-free camera vision, OCR, and currency detection.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Hearing Assistance (Deaf Mode) */}
          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Hearing Assistance Mode for Deaf users. Say Deaf or tap here."
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={handleSelectDeaf}
            style={[styles.modeCard, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: palette.accentLight }]}>
              <EarIcon color={palette.accentTeal} size={28} />
            </View>
            <View style={styles.cardTextGroup}>
              <Text style={[styles.cardTitle, { color: palette.primaryText }]}>🧏 Hearing Assistance (Deaf)</Text>
              <Text style={[styles.cardDesc, { color: palette.secondaryText }]}>
                Live speech captions, sound radar (siren, horn, doorbell), and visual emergency alerts. Say "Deaf" or tap here.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Guardian Mode */}
          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Guardian Monitor Mode. Say Guardian or tap here."
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={() => onContinue('guardian')}
            style={[styles.modeCard, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: palette.accentLight }]}>
              <ShieldIcon color={palette.accentTeal} size={28} />
            </View>
            <View style={styles.cardTextGroup}>
              <Text style={[styles.cardTitle, { color: palette.primaryText }]}>🛡️ Guardian Monitor</Text>
              <Text style={[styles.cardDesc, { color: palette.secondaryText }]}>
                Caregiver safe-zone geofencing and emergency notification alerts.
              </Text>
            </View>
          </TouchableOpacity>
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  cardsSection: {
    gap: 16,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 22,
    borderWidth: 2,
    shadowColor: '#0F9D9A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  primaryBlindCard: {
    paddingVertical: 32,
    borderWidth: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
});
