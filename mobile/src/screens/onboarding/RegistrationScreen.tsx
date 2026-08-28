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
import Svg, { Path } from 'react-native-svg';
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

const MicInputIcon = ({ color = '#0F9D9A', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Path d="M12 19v3M8 22h8" />
  </Svg>
);

const PhoneInputIcon = ({ color = '#0F9D9A', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const MailInputIcon = ({ color = '#0F9D9A', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Path d="M22 6l-10 7L2 6" />
  </Svg>
);

const LocationInputIcon = ({ color = '#0F9D9A', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
  </Svg>
);

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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.card} />
      <AppHeader title="Personal Information" onBack={onBack} lightMode={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* STEP BADGE & INTRO */}
          <View style={styles.intro}>
            <View style={[styles.stepBadge, { backgroundColor: palette.accentLight }]}>
              <Text style={[styles.stepBadgeText, { color: palette.accentTeal }]}>STEP 3 OF 5</Text>
            </View>
            <Text style={[styles.title, { color: palette.primaryText }]}>Your Profile Details</Text>
            <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
              This information is stored locally on your device for emergency alerts.
            </Text>
          </View>

          {/* FORM INPUTS */}
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
              rightIcon={<MicInputIcon color={palette.accentTeal} size={20} />}
              lightMode={true}
            />

            <AccessibleInput
              label="Phone Number"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              helperText="Your mobile device number"
              rightIcon={<PhoneInputIcon color={palette.accentTeal} size={20} />}
              lightMode={true}
            />

            <AccessibleInput
              label="Email (Optional)"
              placeholder="e.g. user@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              rightIcon={<MailInputIcon color={palette.accentTeal} size={20} />}
              lightMode={true}
            />

            <AccessibleInput
              label="Home Address / Area (Optional)"
              placeholder="e.g. Green Park, Bengaluru"
              value={address}
              onChangeText={setAddress}
              helperText="Used as default home safe zone reference"
              rightIcon={<LocationInputIcon color={palette.accentTeal} size={20} />}
              lightMode={true}
            />
          </View>

          {/* NEXT CTA BUTTON */}
          <View style={styles.buttonContainer}>
            <AccessibleButton
              title="Next: Emergency Contact →"
              size="large"
              variant="teal"
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
  form: {
    gap: 12,
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    marginTop: Spacing.xs,
  },
});
