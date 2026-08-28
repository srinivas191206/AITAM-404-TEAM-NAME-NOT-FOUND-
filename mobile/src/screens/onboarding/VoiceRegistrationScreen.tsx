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
import { speechRecognitionService } from '../../services/speechRecognitionService';

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
    <Svg width="24" height="36" viewBox="0 0 24 36" fill="none">
      <Rect x="2" y="12" width="3" height="12" rx="1.5" fill="#BCE7E5" />
      <Rect x="9" y="6" width="3" height="24" rx="1.5" fill="#80D0CD" />
      <Rect x="16" y="2" width="3" height="32" rx="1.5" fill={color} />
    </Svg>

    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill={color} />
        <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <Path d="M12 19v3M8 22h8" />
      </Svg>
    </View>

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
  const [isListening, setIsListening] = useState<boolean>(false);

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
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    startVoiceOnboarding();
    return () => {
      isMounted.current = false;
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      speechRecognitionService.stopListening();
      outputService.stopAll();
    };
  }, []);

  const startVoiceOnboarding = async () => {
    await askCurrentQuestion('fullName');
  };

  const startMicListener = () => {
    if (!isMounted.current) return;
    setIsListening(true);
    speechRecognitionService.startListening({
      onResult: (spokenText: string) => {
        if (isMounted.current && spokenText.trim()) {
          setIsListening(false);
          handleSpokenInput(spokenText.trim());
        }
      },
      onError: () => {
        if (isMounted.current) {
          setIsListening(false);
        }
      },
    });
  };

  const askCurrentQuestion = async (field: VoiceRegistrationField) => {
    setIsConfirming(false);
    setPendingValue('');
    setIsListening(false);

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
        question = `Let's review your information. Your name is ${fullName}. Phone is ${phoneNumber}. Emergency contact is ${emergencyName} at ${emergencyPhone}. Say Yes to finish.`;
        break;
    }

    await outputService.announce(question, 'urgent');
    setTimeout(() => {
      startMicListener();
    }, 1000);
  };

  /**
   * 2-Second Speech Pause Auto-Submit Logic
   * When user says "Srinivas", wait 2 seconds for any additional words.
   * If silence continues, automatically accept Srinivas and move to next question!
   */
  const handleSpokenInput = async (rawInput: string) => {
    if (!rawInput.trim()) return;

    await hapticService.medium();
    setSpokenTranscript(rawInput);

    let cleanValue = rawInput.trim();
    if (currentField === 'phoneNumber' || currentField === 'emergencyContactPhone') {
      cleanValue = voiceInputService.normalizePhoneNumber(rawInput);
    }

    setPendingValue(cleanValue);

    // Clear previous timer if user is still speaking
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    // 2-Second Pause Auto-Submit Timer
    pauseTimerRef.current = setTimeout(async () => {
      if (!isMounted.current) return;
      await autoSubmitSpokenValue(cleanValue);
    }, 2000);
  };

  const autoSubmitSpokenValue = async (value: string) => {
    await hapticService.heavy();

    switch (currentField) {
      case 'fullName':
        setFullName(value);
        await onSaveProfile({ fullName: value, name: value });
        await outputService.announce(`Name saved as ${value}.`, 'high');
        setCurrentField('phoneNumber');
        setTimeout(() => askCurrentQuestion('phoneNumber'), 1200);
        break;

      case 'phoneNumber':
        setPhoneNumber(value);
        await onSaveProfile({ phoneNumber: value, phone: value });
        await outputService.announce(`Phone number saved as ${value}.`, 'high');
        setCurrentField('address');
        setTimeout(() => askCurrentQuestion('address'), 1200);
        break;

      case 'address':
        setAddress(value);
        await onSaveProfile({ address: value });
        await outputService.announce(`Address saved.`, 'high');
        setCurrentField('emergencyContactName');
        setTimeout(() => askCurrentQuestion('emergencyContactName'), 1200);
        break;

      case 'emergencyContactName':
        setEmergencyName(value);
        await outputService.announce(`Emergency contact name set to ${value}.`, 'high');
        setCurrentField('emergencyContactPhone');
        setTimeout(() => askCurrentQuestion('emergencyContactPhone'), 1200);
        break;

      case 'emergencyContactPhone':
        setEmergencyPhone(value);
        await outputService.announce(`Emergency phone set to ${value}.`, 'high');
        setCurrentField('emergencyContactRelation');
        setTimeout(() => askCurrentQuestion('emergencyContactRelation'), 1200);
        break;

      case 'emergencyContactRelation': {
        const relation = value || 'Family';
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

        await outputService.announce(`Emergency contact complete.`, 'high');
        setCurrentField('guardianChoice');
        setTimeout(() => askCurrentQuestion('guardianChoice'), 1200);
        break;
      }

      case 'guardianChoice': {
        const isLinked = value.toLowerCase().includes('link');
        setGuardianLinked(isLinked);
        const guardianObj: GuardianState = {
          guardianLinked: isLinked,
        };
        await onSaveProfile({
          guardian: guardianObj,
          guardianLinked: isLinked,
        });

        await outputService.announce(`Guardian settings saved.`, 'high');
        setCurrentField('review');
        setTimeout(() => askCurrentQuestion('review'), 1200);
        break;
      }

      case 'review':
        await outputService.announce(`Profile setup complete. Entering Visual Assistant mode.`, 'high');
        await onComplete();
        break;
    }
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
                {pendingValue ? `Recognized: "${pendingValue}"` : getFieldPrompt(currentField)}
              </Text>
              <Text style={[styles.questionSubtitle, { color: palette.secondaryText }]}>
                {pendingValue
                  ? 'Waiting 2s pause to auto-save and continue...'
                  : 'Microphone active. Speak out loud now.'}
              </Text>
            </View>
          </View>
        </View>

        {/* LARGE INTERACTIVE MIC TARGET CARD */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel={`Microphone active. Speak your ${getFieldLabel(currentField)}`}
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={() => startMicListener()}
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
            {isListening ? 'MICROPHONE ACTIVE (SPEAK NOW)' : pendingValue ? `SAVING: "${pendingValue}"` : 'TAP OR SPEAK ANSWER'}
          </Text>
          <Text style={[styles.voiceSubtext, { color: palette.secondaryText }]}>
            {pendingValue ? 'Auto-submitting in 2s...' : `Listening for your ${getFieldLabel(currentField)}...`}
          </Text>
        </TouchableOpacity>

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
