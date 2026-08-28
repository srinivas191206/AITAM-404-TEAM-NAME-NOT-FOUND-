import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  EmergencyContact,
  GuardianState,
  UserProfile,
  VoiceRegistrationField,
} from '../../types';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { AccessibleButton } from '../../components/AccessibleButton';
import { outputService } from '../../services/outputService';
import { hapticService } from '../../services/hapticService';
import { voiceInputService } from '../../services/voiceInputService';

interface VoiceRegistrationScreenProps {
  initialProfile: UserProfile;
  onSaveProfile: (profile: Partial<UserProfile>) => Promise<void>;
  onComplete: () => Promise<void>;
  onBack: () => void;
}

export const VoiceRegistrationScreen: React.FC<VoiceRegistrationScreenProps> = ({
  initialProfile,
  onSaveProfile,
  onComplete,
  onBack,
}) => {
  const [currentField, setCurrentField] = useState<VoiceRegistrationField>('fullName');
  const [pendingValue, setPendingValue] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');

  // Profile data being collected
  const [fullName, setFullName] = useState<string>(initialProfile.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(initialProfile.phoneNumber || '');
  const [address, setAddress] = useState<string>(initialProfile.address || '');
  const [emergencyName, setEmergencyName] = useState<string>(
    initialProfile.emergencyContact?.name || ''
  );
  const [emergencyPhone, setEmergencyPhone] = useState<string>(
    initialProfile.emergencyContact?.phoneNumber || ''
  );
  const [emergencyRelation, setEmergencyRelation] = useState<string>(
    initialProfile.emergencyContact?.relationship || 'Family'
  );
  const [guardianLinked, setGuardianLinked] = useState<boolean>(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    startVoiceOnboarding();
    return () => {
      isMounted.current = false;
      outputService.stopAll();
    };
  }, []);

  const startVoiceOnboarding = async () => {
    await outputService.announce(
      "Let's set up your account. I will ask you a few quick questions. First: What is your full name?",
      'urgent'
    );
  };

  const askCurrentQuestion = async (field: VoiceRegistrationField) => {
    setIsConfirming(false);
    setPendingValue('');

    let question = '';
    switch (field) {
      case 'fullName':
        question = 'What is your full name?';
        break;
      case 'phoneNumber':
        question = 'What is your mobile phone number?';
        break;
      case 'address':
        question = 'What is your city or address?';
        break;
      case 'emergencyContactName':
        question = 'What is the full name of your emergency contact?';
        break;
      case 'emergencyContactPhone':
        question = "What is your emergency contact's phone number?";
        break;
      case 'emergencyContactRelation':
        question = 'What is their relationship to you, such as Family or Friend?';
        break;
      case 'guardianChoice':
        question = 'Would you like to link a guardian now, or set it up later? Say Link or Later.';
        break;
      case 'review':
        question = `Let's review your information. Your name is ${fullName}. Phone is ${phoneNumber}. Emergency contact is ${emergencyName} at ${emergencyPhone}. Is everything correct? Say Yes to finish, or No to edit.`;
        break;
    }

    await outputService.announce(question, 'urgent');
  };

  const handleSpokenInput = async (rawInput: string) => {
    if (!rawInput.trim()) return;

    await hapticService.medium();
    setSpokenTranscript(rawInput);

    // If currently confirming "I heard...", parse YES / NO
    if (isConfirming) {
      const confirmation = voiceInputService.parseConfirmation(rawInput);

      if (confirmation.isConfirmed === true) {
        // User confirmed YES
        await handleConfirmYes();
      } else if (confirmation.isConfirmed === false) {
        // User said NO
        await handleConfirmNo();
      } else {
        await outputService.announce(
          `I heard ${rawInput}. Please say Yes to confirm, or No to say it again.`,
          'urgent'
        );
      }
      return;
    }

    // Processing new input for current field
    let cleanValue = rawInput.trim();

    if (currentField === 'phoneNumber' || currentField === 'emergencyContactPhone') {
      cleanValue = voiceInputService.normalizePhoneNumber(rawInput);
    }

    setPendingValue(cleanValue);
    setIsConfirming(true);

    if (currentField === 'guardianChoice') {
      const isLater = rawInput.toLowerCase().includes('later') || rawInput.toLowerCase().includes('skip') || rawInput.toLowerCase().includes('no');
      const choiceText = isLater ? 'Setup Later' : 'Link Guardian';
      setPendingValue(choiceText);
      await outputService.announce(`I heard ${choiceText}. Is that correct? Say Yes or No.`, 'urgent');
      return;
    }

    // MANDATORY "I heard..." confirmation
    await outputService.announce(`I heard ${cleanValue}. Is that correct? Say Yes or No.`, 'urgent');
  };

  const handleConfirmYes = async () => {
    await hapticService.heavy();

    switch (currentField) {
      case 'fullName':
        setFullName(pendingValue);
        await onSaveProfile({ fullName: pendingValue, name: pendingValue });
        setCurrentField('phoneNumber');
        await askCurrentQuestion('phoneNumber');
        break;

      case 'phoneNumber':
        setPhoneNumber(pendingValue);
        await onSaveProfile({ phoneNumber: pendingValue, phone: pendingValue });
        setCurrentField('address');
        await askCurrentQuestion('address');
        break;

      case 'address':
        setAddress(pendingValue);
        await onSaveProfile({ address: pendingValue });
        setCurrentField('emergencyContactName');
        await askCurrentQuestion('emergencyContactName');
        break;

      case 'emergencyContactName':
        setEmergencyName(pendingValue);
        setCurrentField('emergencyContactPhone');
        await askCurrentQuestion('emergencyContactPhone');
        break;

      case 'emergencyContactPhone':
        setEmergencyPhone(pendingValue);
        setCurrentField('emergencyContactRelation');
        await askCurrentQuestion('emergencyContactRelation');
        break;

      case 'emergencyContactRelation': {
        const relation = pendingValue || 'Family';
        setEmergencyRelation(relation);

        const contactObj: EmergencyContact = {
          id: 'ec_1',
          name: emergencyName,
          phoneNumber: emergencyPhone,
          phone: emergencyPhone,
          relationship: relation,
          relation: relation,
        };
        await onSaveProfile({
          emergencyContacts: [contactObj],
          emergencyContact: contactObj,
        });

        setCurrentField('guardianChoice');
        await askCurrentQuestion('guardianChoice');
        break;
      }

      case 'guardianChoice': {
        const isLinked = pendingValue.toLowerCase().includes('link');
        setGuardianLinked(isLinked);
        const guardianObj: GuardianState = {
          guardianLinked: isLinked,
        };
        await onSaveProfile({
          guardian: guardianObj,
          guardianLinked: isLinked,
        });

        setCurrentField('review');
        await askCurrentQuestion('review');
        break;
      }

      case 'review':
        await onComplete();
        break;
    }
  };

  const handleConfirmNo = async () => {
    await hapticService.light();
    setIsConfirming(false);
    setPendingValue('');

    if (currentField === 'review') {
      await outputService.announce('Let us update your information from the beginning.');
      setCurrentField('fullName');
      await askCurrentQuestion('fullName');
      return;
    }

    await outputService.announce(`Okay. Please say your ${getFieldLabel(currentField)} again.`);
  };

  const getFieldLabel = (field: VoiceRegistrationField): string => {
    switch (field) {
      case 'fullName':
        return 'full name';
      case 'phoneNumber':
        return 'phone number';
      case 'address':
        return 'address or city';
      case 'emergencyContactName':
        return 'emergency contact name';
      case 'emergencyContactPhone':
        return 'emergency contact phone number';
      case 'emergencyContactRelation':
        return 'relationship';
      case 'guardianChoice':
        return 'guardian choice';
      case 'review':
        return 'profile review';
    }
  };

  const getFieldProgressText = (): string => {
    switch (currentField) {
      case 'fullName':
        return 'Step 1 of 6: Full Name';
      case 'phoneNumber':
        return 'Step 2 of 6: Phone Number';
      case 'address':
        return 'Step 3 of 6: Address';
      case 'emergencyContactName':
        return 'Step 4 of 6: Emergency Contact Name';
      case 'emergencyContactPhone':
        return 'Step 5 of 6: Emergency Phone';
      case 'emergencyContactRelation':
        return 'Step 6 of 6: Relationship';
      case 'guardianChoice':
        return 'Optional: Guardian Setup';
      case 'review':
        return 'Final Review & Confirmation';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <AppHeader title="Voice Registration" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* STEP PROGRESS BADGE */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getFieldProgressText().toUpperCase()}</Text>
        </View>

        {/* ACTIVE QUESTION BANNER */}
        <View style={styles.questionCard}>
          <Text style={styles.questionIcon}>🎙️</Text>
          <Text style={styles.questionTitle}>
            {isConfirming
              ? `I heard: "${pendingValue}"`
              : getFieldPrompt(currentField)}
          </Text>
          <Text style={styles.questionSubtitle}>
            {isConfirming
              ? 'Is that correct? Say "Yes" or "No" below.'
              : 'Tap the large microphone button or say your answer.'}
          </Text>
        </View>

        {/* LARGE VOICE TRIGGER & STATE BUTTON */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel={
            isConfirming
              ? `I heard ${pendingValue}. Tap to repeat confirmation.`
              : `Tap to speak your ${getFieldLabel(currentField)}`
          }
          accessibilityHint="Double tap to speak"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={() => {
            if (isConfirming) {
              outputService.announce(`I heard ${pendingValue}. Is that correct? Say Yes or No.`, 'urgent');
            } else {
              askCurrentQuestion(currentField);
            }
          }}
          style={[styles.voiceCenterBlock, isConfirming && styles.voiceConfirmingBlock]}
        >
          <Text style={styles.voiceIcon}>{isConfirming ? '❓' : '🎙️'}</Text>
          <Text style={styles.voiceMainText}>
            {isConfirming ? 'CONFIRM ANSWER' : 'LISTENING / SPEAK'}
          </Text>
          <Text style={styles.voiceSubtext}>
            {isConfirming ? `"${pendingValue}"` : `Say your ${getFieldLabel(currentField)}`}
          </Text>
        </TouchableOpacity>

        {/* CONFIRMATION CONTROLS (YES / NO / DEMO INPUTS) */}
        {isConfirming ? (
          <View style={styles.confirmRow}>
            <AccessibleButton
              title="✓ YES, THAT'S RIGHT"
              size="large"
              variant="primary"
              style={styles.confirmBtn}
              onPress={handleConfirmYes}
            />
            <AccessibleButton
              title="✗ NO, SAY AGAIN"
              size="large"
              variant="danger"
              style={styles.confirmBtn}
              onPress={handleConfirmNo}
            />
          </View>
        ) : (
          /* QUICK SPOKEN DEMO SHORTCUTS FOR ACCESSIBILITY TESTING */
          <View style={styles.demoTray}>
            <Text style={styles.demoTrayLabel}>TEST SPEECH INPUT (SIMULATION):</Text>
            <View style={styles.demoChipsRow}>
              {getSimulatedChips(currentField).map((phrase, idx) => (
                <TouchableOpacity
                  key={idx}
                  accessible={true}
                  accessibilityLabel={`Simulate saying ${phrase}`}
                  accessibilityRole="button"
                  onPress={() => handleSpokenInput(phrase)}
                  style={styles.demoChip}
                >
                  <Text style={styles.demoChipText}>"{phrase}"</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* PROFILE SUMMARY SO FAR */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>COLLECTED PROFILE INFORMATION</Text>
          <Text style={styles.summaryItem}>• Name: {fullName || '—'}</Text>
          <Text style={styles.summaryItem}>• Phone: {phoneNumber || '—'}</Text>
          <Text style={styles.summaryItem}>• Address: {address || '—'}</Text>
          <Text style={styles.summaryItem}>
            • Emergency Contact: {emergencyName ? `${emergencyName} (${emergencyPhone})` : '—'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function getFieldPrompt(field: VoiceRegistrationField): string {
  switch (field) {
    case 'fullName':
      return 'What is your full name?';
    case 'phoneNumber':
      return 'What is your mobile phone number?';
    case 'address':
      return 'What is your city or address?';
    case 'emergencyContactName':
      return 'What is your emergency contact name?';
    case 'emergencyContactPhone':
      return "What is your emergency contact's phone?";
    case 'emergencyContactRelation':
      return 'What is their relationship to you?';
    case 'guardianChoice':
      return 'Would you like to link a guardian now?';
    case 'review':
      return 'Review your profile and confirm.';
  }
}

function getSimulatedChips(field: VoiceRegistrationField): string[] {
  switch (field) {
    case 'fullName':
      return ['Varun Kumar', 'Ananya Sharma', 'Ravi Teja'];
    case 'phoneNumber':
      return ['9876543210', '9123456780', '8887776655'];
    case 'address':
      return ['Green Park, Bengaluru', 'Main Road, Visakhapatnam', 'Sector 4, Hyderabad'];
    case 'emergencyContactName':
      return ['Ravi Kumar', 'Dr. Ramesh', 'Priya Sharma'];
    case 'emergencyContactPhone':
      return ['9988776655', '9848012345', '9123450000'];
    case 'emergencyContactRelation':
      return ['Family', 'Parent', 'Doctor'];
    case 'guardianChoice':
      return ['Link Guardian', 'Set Up Later'];
    case 'review':
      return ['Yes, everything is correct', 'No, please edit'];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceInteractive,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  badgeText: {
    color: Colors.blindPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  questionCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.blindBorder,
  },
  questionIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    lineHeight: 28,
  },
  questionSubtitle: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    marginTop: Spacing.xs,
    lineHeight: 22,
    fontWeight: '500',
  },
  voiceCenterBlock: {
    backgroundColor: Colors.blindPrimary,
    borderRadius: Spacing.radiusLg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.blindBorder,
    minHeight: 140,
    marginVertical: Spacing.xs,
  },
  voiceConfirmingBlock: {
    backgroundColor: Colors.warning,
    borderColor: '#B45309',
  },
  voiceIcon: {
    fontSize: 44,
    marginBottom: 6,
  },
  voiceMainText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#121110',
    letterSpacing: 0.5,
  },
  voiceSubtext: {
    fontSize: 16,
    fontWeight: '700',
    color: '#382806',
    marginTop: 4,
    textAlign: 'center',
  },
  confirmRow: {
    gap: Spacing.sm,
  },
  confirmBtn: {
    width: '100%',
  },
  demoTray: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: Spacing.radiusMd,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  demoTrayLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs + 2,
  },
  demoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  demoChip: {
    backgroundColor: Colors.surfaceInteractive,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.blindBorder,
  },
  demoChipText: {
    color: Colors.textHighEmphasis,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginTop: Spacing.sm,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  summaryItem: {
    fontSize: 14,
    color: Colors.textHighEmphasis,
    fontWeight: '600',
    lineHeight: 22,
  },
});
