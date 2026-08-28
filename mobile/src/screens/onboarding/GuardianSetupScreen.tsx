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
} from 'react-native';
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

export const GuardianSetupScreen: React.FC<GuardianSetupScreenProps> = ({
  onComplete,
  onBack,
}) => {
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianCode, setGuardianCode] = useState('');

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <AppHeader title="Guardian Linking" onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <Text style={styles.stepLabel}>STEP 5 OF 5</Text>
            <Text style={styles.title}>Optional Guardian Linking</Text>
            <Text style={styles.subtitle}>
              Link a family member or caregiver to share real-time safe zone updates and receive direct SOS telemetry.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🛡️ What Guardians Can Do:</Text>
            <Text style={styles.infoItem}>• View assisted user status and GPS coordinates</Text>
            <Text style={styles.infoItem}>• Monitor safe-zone boundary alerts</Text>
            <Text style={styles.infoItem}>• Receive real-time SOS push notifications</Text>
          </View>

          <View style={styles.form}>
            <AccessibleInput
              label="Guardian Phone Number (Optional)"
              placeholder="e.g. +91 98765 11111"
              value={guardianPhone}
              onChangeText={setGuardianPhone}
              keyboardType="phone-pad"
              helperText="Phone number of your guardian"
            />

            <AccessibleInput
              label="Guardian Pairing Code (Optional)"
              placeholder="e.g. 404-GUARD"
              value={guardianCode}
              onChangeText={setGuardianCode}
              autoCapitalize="characters"
              helperText="6-character code generated on Guardian app"
            />
          </View>

          <View style={styles.buttonGroup}>
            <AccessibleButton
              title="Complete Setup & Enter App ✓"
              size="large"
              variant="primary"
              onPress={handleLinkAndFinish}
            />

            <AccessibleButton
              title="Skip Guardian Setup"
              size="normal"
              variant="subtle"
              onPress={handleSkipAndFinish}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
  keyboardContainer: {
    flex: 1,
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
  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    marginBottom: Spacing.sm,
  },
  infoItem: {
    fontSize: 14,
    color: Colors.textMediumEmphasis,
    lineHeight: 22,
    fontWeight: '500',
  },
  form: {
    gap: Spacing.xs,
    marginVertical: Spacing.md,
  },
  buttonGroup: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
});
