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
import { UserProfile } from '../../types';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { AccessibleInput } from '../../components/AccessibleInput';
import { AccessibleButton } from '../../components/AccessibleButton';
import { outputService } from '../../services/outputService';

interface RegistrationScreenProps {
  userProfile: UserProfile;
  onSaveProfile: (profile: Partial<UserProfile>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({
  userProfile,
  onSaveProfile,
  onContinue,
  onBack,
}) => {
  const [fullName, setFullName] = useState(userProfile.fullName || '');
  const [phone, setPhone] = useState(userProfile.phone || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [address, setAddress] = useState(userProfile.address || '');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    outputService.announce(
      'Step 3 of 5: Enter your personal information. Please provide your name and phone number.',
      'normal'
    );
  }, []);

  const handleNext = () => {
    if (!fullName.trim()) {
      setNameError('Please enter your full name');
      outputService.announce('Please enter your full name to proceed.');
      return;
    }
    setNameError('');
    onSaveProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
    });
    onContinue();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <AppHeader title="Personal Information" onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <Text style={styles.stepLabel}>STEP 3 OF 5</Text>
            <Text style={styles.title}>Your Profile Details</Text>
            <Text style={styles.subtitle}>
              This information is stored locally on your device for emergency alerts.
            </Text>
          </View>

          <View style={styles.form}>
            <AccessibleInput
              label="Full Name *"
              placeholder="e.g. John Doe"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (nameError) setNameError('');
              }}
              errorText={nameError}
              helperText="Spoken during emergency SOS broadcasts"
              autoCapitalize="words"
            />

            <AccessibleInput
              label="Phone Number"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              helperText="Your mobile device number"
            />

            <AccessibleInput
              label="Email (Optional)"
              placeholder="e.g. user@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AccessibleInput
              label="Home Address / Area (Optional)"
              placeholder="e.g. Green Park, Bengaluru"
              value={address}
              onChangeText={setAddress}
              helperText="Used as default home safe zone reference"
            />
          </View>

          <View style={styles.buttonContainer}>
            <AccessibleButton
              title="Next: Emergency Contact →"
              size="large"
              variant="primary"
              onPress={handleNext}
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
  form: {
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
});
