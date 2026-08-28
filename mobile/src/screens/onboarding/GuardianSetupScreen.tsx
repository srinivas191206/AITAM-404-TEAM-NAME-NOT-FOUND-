import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { AccessibleInput } from '../../components/AccessibleInput';
import { AccessibleButton } from '../../components/AccessibleButton';
import { outputService } from '../../services/outputService';

interface GuardianSetupScreenProps {
  onComplete: (guardianData?: { guardianPhone?: string; guardianCode?: string }) => void;
  onBack: () => void;
}

const ShieldInfoIcon = ({ color = '#0F9D9A', size = 26 }) => (
  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <Path d="M12 8v8M9 12h6" strokeWidth="2" />
    </Svg>
  </View>
);

const CheckCircleIcon = ({ color = '#0F9D9A', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} />
    <Path d="M8 12l3 3 5-5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhoneCircleIcon = ({ color = '#0F9D9A', size = 18 }) => (
  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  </View>
);

const LockCircleIcon = ({ color = '#0F9D9A', size = 18 }) => (
  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  </View>
);

export const GuardianSetupScreen: React.FC<GuardianSetupScreenProps> = ({
  onComplete,
  onBack,
}) => {
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianCode, setGuardianCode] = useState('');

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
      'Step 5 of 5: Optional Guardian Linking. You can link a guardian device or skip this step.',
      'normal'
    );
  }, []);

  const handleLinkAndFinish = () => {
    onComplete({
      guardianPhone: guardianPhone.trim(),
      guardianCode: guardianCode.trim(),
    });
  };

  const handleSkipAndFinish = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.card} />
      <AppHeader title="Guardian Linking" onBack={onBack} lightMode={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* STEP BADGE & INTRO */}
          <View style={styles.intro}>
            <View style={[styles.stepBadge, { backgroundColor: palette.accentLight }]}>
              <Text style={[styles.stepBadgeText, { color: palette.accentTeal }]}>STEP 5 OF 5</Text>
            </View>
            <Text style={[styles.title, { color: palette.primaryText }]}>Optional Guardian Linking</Text>
            <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
              Link a family member or caregiver to share real-time safe zone updates and receive direct SOS telemetry.
            </Text>
          </View>

          {/* WHAT GUARDIANS CAN DO CARD */}
          <View style={[styles.infoCard, { backgroundColor: '#F4FBFB', borderColor: '#BCE7E5' }]}>
            <View style={styles.infoCardHeader}>
              <ShieldInfoIcon color={palette.accentTeal} />
              <Text style={[styles.infoTitle, { color: palette.primaryText }]}>What Guardians Can Do:</Text>
            </View>
            <View style={styles.checkList}>
              <View style={styles.checkRow}>
                <CheckCircleIcon color={palette.accentTeal} />
                <Text style={[styles.checkText, { color: palette.secondaryText }]}>View assisted user status and GPS coordinates</Text>
              </View>
              <View style={styles.checkRow}>
                <CheckCircleIcon color={palette.accentTeal} />
                <Text style={[styles.checkText, { color: palette.secondaryText }]}>Monitor safe-zone boundary alerts</Text>
              </View>
              <View style={styles.checkRow}>
                <CheckCircleIcon color={palette.accentTeal} />
                <Text style={[styles.checkText, { color: palette.secondaryText }]}>Receive real-time SOS push notifications</Text>
              </View>
            </View>
          </View>

          {/* FORM INPUTS */}
          <View style={styles.form}>
            <AccessibleInput
              label="Guardian Phone Number (Optional)"
              placeholder="e.g. +91 98765 11111"
              value={guardianPhone}
              onChangeText={setGuardianPhone}
              keyboardType="phone-pad"
              helperText="Phone number of your guardian"
              leftIcon={<PhoneCircleIcon color={palette.accentTeal} />}
              lightMode={true}
            />

            <AccessibleInput
              label="Guardian Pairing Code (Optional)"
              placeholder="e.g. 404-GUARD"
              value={guardianCode}
              onChangeText={setGuardianCode}
              autoCapitalize="characters"
              helperText="6-character code generated on Guardian app"
              leftIcon={<LockCircleIcon color={palette.accentTeal} />}
              lightMode={true}
            />
          </View>

          {/* BUTTON ACTIONS */}
          <View style={styles.buttonGroup}>
            <AccessibleButton
              title="Complete Setup & Enter App ✓"
              size="large"
              variant="teal"
              onPress={handleLinkAndFinish}
            />

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Skip Guardian Setup"
              accessibilityRole="button"
              activeOpacity={0.8}
              onPress={handleSkipAndFinish}
              style={[styles.skipBtn, { borderColor: palette.accentTeal, backgroundColor: palette.card }]}
            >
              <Text style={[styles.skipBtnText, { color: palette.accentTeal }]}>Skip Guardian Setup</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
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
  infoCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginVertical: 4,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  checkList: {
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  form: {
    gap: 12,
    marginVertical: Spacing.md,
  },
  buttonGroup: {
    marginTop: Spacing.xs,
    gap: 10,
  },
  skipBtn: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
