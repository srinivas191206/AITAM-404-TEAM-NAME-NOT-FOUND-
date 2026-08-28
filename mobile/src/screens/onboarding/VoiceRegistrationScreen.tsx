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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
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

const MicHeaderIcon = ({ color = '#0F9D9A', size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Path d="M12 19v3M8 22h8" />
  </Svg>
);

const BigMicWavesIcon = ({ color = '#0F9D9A', size = 48 }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
    {/* Left Wave lines */}
    <Svg width="24" height="36" viewBox="0 0 24 36" fill="none">
      <Rect x="2" y="12" width="3" height="12" rx="1.5" fill="#BCE7E5" />
      <Rect x="9" y="6" width="3" height="24" rx="1.5" fill="#80D0CD" />
      <Rect x="16" y="2" width="3" height="32" rx="1.5" fill={color} />
    </Svg>

    {/* Center Mic Circle */}
    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill={color} />
        <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <Path d="M12 19v3M8 22h8" />
      </Svg>
    </View>

    {/* Right Wave lines */}
    <Svg width="24" height="36" viewBox="0 0 24 36" fill="none">
      <Rect x="2" y="2" width="3" height="32" rx="1.5" fill={color} />
      <Rect x="9" y="6" width="3" height="24" rx="1.5" fill="#80D0CD" />
      <Rect x="16" y="12" width="3" height="12" rx="1.5" fill="#BCE7E5" />
    </Svg>
  </View>
);

export const VoiceRegistrationScreen: React.FC<VoiceRegistrationScreenProps> = ({
  initialProfile,
  onSaveProfile,
  onComplete,
  onBack,
}) => {
  const [currentField, setCurrentField] = useState<VoiceRegistrationField>('fullName');
  const [pendingValue, setPendingValue] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

  // Profile data state
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

    if (isConfirming) {
      const confirmation = voiceInputService.parseConfirmation(rawInput);
      if (confirmation.isConfirmed === true) {
        await handleConfirmYes();
      } else if (confirmation.isConfirmed === false) {
        await handleConfirmNo();
      } else {
        await outputService.announce(
          `I heard ${rawInput}. Please say Yes to confirm, or No to say it again.`,
          'urgent'
        );
      }
      return;
    }

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
        return 'STEP 1 OF 6: FULL NAME';
      case 'phoneNumber':
        return 'STEP 2 OF 6: PHONE NUMBER';
      case 'address':
        return 'STEP 3 OF 6: ADDRESS';
      case 'emergencyContactName':
        return 'STEP 4 OF 6: EMERGENCY CONTACT NAME';
      case 'emergencyContactPhone':
        return 'STEP 5 OF 6: EMERGENCY PHONE';
      case 'emergencyContactRelation':
        return 'STEP 6 OF 6: RELATIONSHIP';
      case 'guardianChoice':
        return 'OPTIONAL: GUARDIAN SETUP';
      case 'review':
        return 'FINAL REVIEW & CONFIRMATION';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.card} />
      <AppHeader title="Voice Registration" onBack={onBack} lightMode={true} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* STEP PROGRESS BADGE */}
        <View style={[styles.stepBadge, { backgroundColor: palette.accentLight }]}>
          <Text style={[styles.stepBadgeText, { color: palette.accentTeal }]}>{getFieldProgressText()}</Text>
        </View>

        {/* ACTIVE QUESTION PROMPT CARD */}
        <View style={[styles.questionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.questionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: palette.accentLight }]}>
              <MicHeaderIcon color={palette.accentTeal} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.questionTitle, { color: palette.primaryText }]}>
                {isConfirming ? `I heard: "${pendingValue}"` : getFieldPrompt(currentField)}
              </Text>
              <Text style={[styles.questionSubtitle, { color: palette.secondaryText }]}>
                {isConfirming
                  ? 'Is that correct? Say "Yes" or "No" below.'
                  : 'Tap the large microphone button or say your answer.'}
              </Text>
            </View>
          </View>
        </View>

        {/* LARGE INTERACTIVE MIC TARGET CARD */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel={
            isConfirming
              ? `I heard ${pendingValue}. Tap to repeat confirmation.`
              : `Tap to speak your ${getFieldLabel(currentField)}`
          }
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={() => {
            if (isConfirming) {
              outputService.announce(`I heard ${pendingValue}. Is that correct? Say Yes or No.`, 'urgent');
            } else {
              askCurrentQuestion(currentField);
            }
          }}
          style={[
            styles.voiceTargetCard,
            {
              backgroundColor: '#F4FBFB',
              borderColor: palette.accentTeal,
            },
          ]}
        >
          <BigMicWavesIcon color={palette.accentTeal} size={48} />
          <Text style={[styles.voiceMainText, { color: palette.accentTeal }]}>
            {isConfirming ? 'CONFIRM ANSWER' : 'LISTENING / SPEAK'}
          </Text>
          <Text style={[styles.voiceSubtext, { color: palette.secondaryText }]}>
            {isConfirming ? `"${pendingValue}"` : `Say your ${getFieldLabel(currentField)}`}
          </Text>
        </TouchableOpacity>

        {/* CONFIRMATION CONTROLS OR QUICK SIMULATION CHIPS */}
        {isConfirming ? (
          <View style={styles.confirmRow}>
            <AccessibleButton
              title="✓ YES, THAT'S RIGHT"
              size="large"
              variant="teal"
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
          <View style={[styles.demoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.demoCardLabel, { color: palette.secondaryText }]}>
              TEST SPEECH INPUT (SIMULATION):
            </Text>
            <View style={styles.demoChipsRow}>
              {getSimulatedChips(currentField).map((phrase, idx) => (
                <TouchableOpacity
                  key={idx}
                  accessible={true}
                  accessibilityLabel={`Simulate saying ${phrase}`}
                  accessibilityRole="button"
                  onPress={() => handleSpokenInput(phrase)}
                  style={[styles.demoChip, { backgroundColor: palette.card, borderColor: palette.accentTeal }]}
                >
                  <Text style={[styles.demoChipText, { color: palette.primaryText }]}>"{phrase}"</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* COLLECTED PROFILE SUMMARY CARD */}
        <View style={[styles.summaryCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.summaryTitle, { color: palette.secondaryText }]}>
            COLLECTED PROFILE INFORMATION
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Name: <Text style={{ fontWeight: fullName ? '700' : '400' }}>{fullName || '—'}</Text>
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Phone: <Text style={{ fontWeight: phoneNumber ? '700' : '400' }}>{phoneNumber || '—'}</Text>
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Address: <Text style={{ fontWeight: address ? '700' : '400' }}>{address || '—'}</Text>
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Emergency Contact: <Text style={{ fontWeight: emergencyName ? '700' : '400' }}>{emergencyName ? `${emergencyName} (${emergencyPhone})` : '—'}</Text>
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
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: 14,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 2,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  questionCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#0F9D9A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  questionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  questionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  voiceTargetCard: {
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginVertical: 2,
  },
  voiceMainText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 14,
  },
  voiceSubtext: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  confirmRow: {
    gap: 10,
  },
  confirmBtn: {
    width: '100%',
  },
  demoCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  demoCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  demoChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  demoChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginTop: 2,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  summaryItem: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
});
