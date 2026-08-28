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

export const EmergencyContactScreen: React.FC<EmergencyContactScreenProps> = ({
  initialContact,
  onSaveContact,
  onContinue,
  onBack,
}) => {
  const [name, setName] = useState(initialContact.name || '');
  const [phone, setPhone] = useState(initialContact.phone || '');
  const [relation, setRelation] = useState(initialContact.relation || 'Family');
  const [errorText, setErrorText] = useState('');

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <AppHeader title="Emergency Contact" onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <Text style={styles.stepLabel}>STEP 4 OF 5</Text>
            <Text style={styles.title}>Primary Emergency Contact</Text>
            <Text style={styles.subtitle}>
              This contact will be immediately notified via SMS with your live GPS coordinates whenever SOS is triggered.
            </Text>
          </View>

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
            />

            <AccessibleInput
              label="Relationship"
              placeholder="e.g. Parent, Sibling, Caregiver"
              value={relation}
              onChangeText={setRelation}
              autoCapitalize="words"
            />

            {errorText ? <Text style={styles.formError}>{errorText}</Text> : null}
          </View>

          <View style={styles.buttonContainer}>
            <AccessibleButton
              title="Next: Guardian Setup →"
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
  formError: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
});
