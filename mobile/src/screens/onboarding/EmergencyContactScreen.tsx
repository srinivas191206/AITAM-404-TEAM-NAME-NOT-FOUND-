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
import Svg, { Path, Circle } from 'react-native-svg';
import { EmergencyContact } from '../../types';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { AccessibleInput } from '../../components/AccessibleInput';
import { AccessibleButton } from '../../components/AccessibleButton';
import { outputService } from '../../services/outputService';

interface EmergencyContactScreenProps {
  initialContact: EmergencyContact;
  onSaveContact: (contact: EmergencyContact) => void;
  onContinue: () => void;
  onBack: () => void;
}

const UserCircleIcon = ({ color = '#0F9D9A', size = 20 }) => (
  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  </View>
);

const PhoneCircleIcon = ({ color = '#0F9D9A', size = 18 }) => (
  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  </View>
);

const UsersCircleIcon = ({ color = '#0F9D9A', size = 18 }) => (
  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M9 21v-2a4 4 0 0 1 4-4h1" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  </View>
);

const ChevronDownIcon = ({ color = '#0F9D9A', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

export const EmergencyContactScreen: React.FC<EmergencyContactScreenProps> = ({
  initialContact,
  onSaveContact,
  onContinue,
  onBack,
}) => {
  const [name, setName] = useState(initialContact.name || '');
  const [phone, setPhone] = useState(initialContact.phone || initialContact.phoneNumber || '');
  const [relation, setRelation] = useState(initialContact.relation || initialContact.relationship || 'Family');
  const [errorText, setErrorText] = useState('');

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
      'Step 4 of 5: Set up your primary emergency contact. This person receives automatic SMS alerts with your GPS location during SOS.',
      'normal'
    );
  }, []);

  const handleNext = () => {
    if (!name.trim() || !phone.trim()) {
      setErrorText('Please provide both contact name and phone number');
      outputService.announce('Please provide both contact name and phone number.');
      return;
    }
    setErrorText('');
    onSaveContact({
      id: initialContact.id || '1',
      name: name.trim(),
      phoneNumber: phone.trim(),
      phone: phone.trim(),
      relationship: relation.trim() || 'Family',
      relation: relation.trim() || 'Family',
    });
    onContinue();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.card} />
      <AppHeader title="Emergency Contact" onBack={onBack} lightMode={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* STEP BADGE & INTRO */}
          <View style={styles.intro}>
            <View style={[styles.stepBadge, { backgroundColor: palette.accentLight }]}>
              <Text style={[styles.stepBadgeText, { color: palette.accentTeal }]}>STEP 4 OF 5</Text>
            </View>
            <Text style={[styles.title, { color: palette.primaryText }]}>Primary Emergency Contact</Text>
            <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
              This contact will be immediately notified via SMS with your live GPS coordinates whenever SOS is triggered.
            </Text>
          </View>

          {/* FORM INPUTS */}
          <View style={styles.form}>
            <AccessibleInput
              label="Contact Full Name *"
              placeholder="e.g. Jane Doe"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errorText) setErrorText('');
              }}
              autoCapitalize="words"
              leftIcon={<UserCircleIcon color={palette.accentTeal} />}
              lightMode={true}
            />

            <AccessibleInput
              label="Contact Phone Number *"
              placeholder="e.g. +91 98765 00000"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                if (errorText) setErrorText('');
              }}
              keyboardType="phone-pad"
              helperText="Receives emergency SMS alerts"
              leftIcon={<PhoneCircleIcon color={palette.accentTeal} />}
              lightMode={true}
            />

            <AccessibleInput
              label="Relationship"
              placeholder="e.g. Family, Parent, Friend"
              value={relation}
              onChangeText={setRelation}
              autoCapitalize="words"
              leftIcon={<UsersCircleIcon color={palette.accentTeal} />}
              rightIcon={<ChevronDownIcon color={palette.accentTeal} />}
              lightMode={true}
            />

            {errorText ? <Text style={styles.formError}>{errorText}</Text> : null}
          </View>

          {/* NEXT CTA BUTTON */}
          <View style={styles.buttonContainer}>
            <AccessibleButton
              title="Next: Guardian Setup →"
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
  formError: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '700',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: Spacing.xs,
  },
});
