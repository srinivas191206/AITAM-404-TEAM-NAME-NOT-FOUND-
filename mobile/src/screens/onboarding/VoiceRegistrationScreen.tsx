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
import { outputService } from '../../services/outputService';
import { hapticService } from '../../services/hapticService';
import { voiceInputService } from '../../services/voiceInputService';
import { speechRecognitionService } from '../../services/speechRecognitionService';
import { ttsService } from '../../services/ttsService';

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
    initialProfile.emergencyContact?.relationship || ''
  );
  const [guardianLinked, setGuardianLinked] = useState<boolean>(false);

  const isMounted = useRef(true);
  const currentFieldRef = useRef<VoiceRegistrationField>('fullName');
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    currentFieldRef.current = 'fullName';
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

  const getQuestionText = (field: VoiceRegistrationField): string => {
    const lang = ttsService.getLanguage().slice(0, 2);
    if (lang === 'te') {
      switch (field) {
        case 'fullName':
          return 'మీ పూర్తి పేరు ఏమిటి?';
        case 'phoneNumber':
          return 'మీ మొబైల్ ఫోన్ నంబర్ ఏమిటి?';
        case 'address':
          return 'మీ ఊరు లేదా చిరునామా ఏమిటి?';
        case 'emergencyContactName':
          return 'మీ అత్యవసర కాంటాక్ట్ పేరు ఏమిటి?';
        case 'emergencyContactPhone':
          return 'మీ అత్యవసర కాంటాక్ట్ ఫోన్ నంబర్ ఏమిటి?';
        case 'emergencyContactRelation':
          return 'వారితో మీ సంబంధం ఏమిటి? కుటుంబ సభ్యులా లేదా స్నేహితులా?';
        case 'guardianChoice':
          return 'గార్డియన్‌ని ఇప్పుడే లింక్ చేయాలా లేదా తర్వాత సెటప్ చేయాలా? లింక్ లేదా తర్వాత అని చెప్పండి.';
        case 'review':
          return `మీ సమాచారం: పేరు ${fullName}, ఫోన్ ${phoneNumber}, అత్యవసర ఫోన్ ${emergencyPhone}. పూర్తి చేయడానికి అవును అని చెప్పండి.`;
      }
    } else if (lang === 'hi') {
      switch (field) {
        case 'fullName':
          return 'आपका पूरा नाम क्या है?';
        case 'phoneNumber':
          return 'आपका मोबाइल फोन नंबर क्या है?';
        case 'address':
          return 'आपका शहर या पता क्या है?';
        case 'emergencyContactName':
          return 'आपके आपातकालीन संपर्क का पूरा नाम क्या है?';
        case 'emergencyContactPhone':
          return 'आपके आपातकालीन संपर्क का फोन नंबर क्या है?';
        case 'emergencyContactRelation':
          return 'उनके साथ आपका क्या संबंध है?';
        case 'guardianChoice':
          return 'क्या आप अभिभावक को अभी जोड़ना चाहते हैं? लिंक या बाद में कहें।';
        case 'review':
          return `आपकी जानकारी: नाम ${fullName}, फोन ${phoneNumber}, आपातकालीन ${emergencyPhone}। पूरा करने के लिए हाँ कहें।`;
      }
    }

    // Default English
    switch (field) {
      case 'fullName':
        return 'What is your full name?';
      case 'phoneNumber':
        return 'What is your mobile phone number?';
      case 'address':
        return 'What is your city or address?';
      case 'emergencyContactName':
        return 'What is the full name of your emergency contact?';
      case 'emergencyContactPhone':
        return "What is your emergency contact's phone number?";
      case 'emergencyContactRelation':
        return 'What is their relationship to you, such as Family or Friend?';
      case 'guardianChoice':
        return 'Would you like to link a guardian now, or set it up later? Say Link or Later.';
      case 'review':
        return `Let's review your information. Your name is ${fullName}. Phone is ${phoneNumber}. Emergency contact is ${emergencyName} at ${emergencyPhone}. Say Yes to finish.`;
    }
  };

  const askCurrentQuestion = async (field: VoiceRegistrationField) => {
    currentFieldRef.current = field;
    setCurrentField(field);
    setPendingValue('');
    setSpokenTranscript('');
    setIsListening(false);

    const question = getQuestionText(field);
    await outputService.announce(question, 'urgent');
    setTimeout(() => {
      if (isMounted.current) {
        startMicListener();
      }
    }, 1000);
  };

  /**
   * 4-Second Speech Pause Auto-Submit Logic
   */
  const handleSpokenInput = async (rawInput: string) => {
    if (!rawInput.trim()) return;

    await hapticService.medium();
    setSpokenTranscript(rawInput);

    const activeField = currentFieldRef.current;

    let cleanValue = rawInput.trim();
    if (activeField === 'phoneNumber' || activeField === 'emergencyContactPhone') {
      cleanValue = voiceInputService.normalizePhoneNumber(rawInput);
    }

    setPendingValue(cleanValue);

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    // 4-Second Pause Auto-Submit Timer
    pauseTimerRef.current = setTimeout(async () => {
      if (!isMounted.current) return;
      await autoSubmitSpokenValue(cleanValue, activeField);
    }, 4000);
  };

  const getSavedAudioText = (fieldLabel: string, val: string): string => {
    const lang = ttsService.getLanguage().slice(0, 2);
    if (lang === 'te') return `${fieldLabel} ${val} గా సేవ్ చేయబడింది.`;
    if (lang === 'hi') return `${fieldLabel} ${val} सहेजा गया।`;
    return `${fieldLabel} saved as ${val}.`;
  };

  const autoSubmitSpokenValue = async (value: string, field: VoiceRegistrationField) => {
    await hapticService.heavy();
    const lang = ttsService.getLanguage().slice(0, 2);

    switch (field) {
      case 'fullName':
        setFullName(value);
        await onSaveProfile({ fullName: value, name: value });
        await outputService.announce(getSavedAudioText(lang === 'te' ? 'పేరు' : lang === 'hi' ? 'नाम' : 'Name', value), 'high');
        await askCurrentQuestion('phoneNumber');
        break;

      case 'phoneNumber':
        setPhoneNumber(value);
        await onSaveProfile({ phoneNumber: value, phone: value });
        await outputService.announce(getSavedAudioText(lang === 'te' ? 'ఫోన్ నంబర్' : lang === 'hi' ? 'फोन नंबर' : 'Phone number', value), 'high');
        await askCurrentQuestion('address');
        break;

      case 'address':
        setAddress(value);
        await onSaveProfile({ address: value });
        await outputService.announce(getSavedAudioText(lang === 'te' ? 'చిరునామా' : lang === 'hi' ? 'पता' : 'Address', value), 'high');
        await askCurrentQuestion('emergencyContactName');
        break;

      case 'emergencyContactName':
        setEmergencyName(value);
        await outputService.announce(getSavedAudioText(lang === 'te' ? 'అత్యవసర కాంటాక్ట్ పేరు' : lang === 'hi' ? 'आपातकालीन नाम' : 'Emergency contact name', value), 'high');
        await askCurrentQuestion('emergencyContactPhone');
        break;

      case 'emergencyContactPhone':
        setEmergencyPhone(value);
        await outputService.announce(getSavedAudioText(lang === 'te' ? 'అత్యవసర ఫోన్' : lang === 'hi' ? 'आपातकालीन फोन' : 'Emergency phone', value), 'high');
        await askCurrentQuestion('emergencyContactRelation');
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

        const completeMsg = lang === 'te' ? 'అత్యవసర కాంటాక్ట్ వివరాలు పూర్తయ్యాయి.' : lang === 'hi' ? 'आपातकालीन संपर्क पूरा हुआ।' : 'Emergency contact complete.';
        await outputService.announce(completeMsg, 'high');
        await askCurrentQuestion('guardianChoice');
        break;
      }

      case 'guardianChoice': {
        const isLinked = value.toLowerCase().includes('link') || value.toLowerCase().includes('లింక్');
        setGuardianLinked(isLinked);
        const guardianObj: GuardianState = {
          guardianLinked: isLinked,
        };
        await onSaveProfile({
          guardian: guardianObj,
          guardianLinked: isLinked,
        });

        const guardianMsg = lang === 'te' ? 'గార్డియన్ వివరాలు సేవ్ చేయబడ్డాయి.' : lang === 'hi' ? 'अभिभावक सेटिंग्स सहेजी गईं।' : 'Guardian settings saved.';
        await outputService.announce(guardianMsg, 'high');
        await askCurrentQuestion('review');
        break;
      }

      case 'review': {
        const finishMsg = lang === 'te' ? 'ప్రొఫైల్ సెటప్ పూర్తయింది. విజువల్ అసిస్టెంట్ ప్రారంభమవుతోంది.' : lang === 'hi' ? 'प्रोफ़ाइल सेटअप पूरा हुआ।' : 'Profile setup complete. Entering Visual Assistant mode.';
        await outputService.announce(finishMsg, 'high');
        await onComplete();
        break;
      }
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
                {pendingValue ? `Recognized: "${pendingValue}"` : getQuestionText(currentField)}
              </Text>
              <Text style={[styles.questionSubtitle, { color: palette.secondaryText }]}>
                {pendingValue
                  ? 'Waiting 4s pause to auto-save and continue...'
                  : 'Microphone active. Speak out loud now.'}
              </Text>
            </View>
          </View>
        </View>

        {/* LARGE INTERACTIVE MIC TARGET CARD */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel={`Microphone active.`}
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
            {pendingValue ? 'Auto-submitting in 4s...' : 'Listening for your answer...'}
          </Text>
        </TouchableOpacity>

        {/* FULL COLLECTED PROFILE SUMMARY CARD */}
        <View style={[styles.summaryCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.summaryTitle, { color: palette.secondaryText }]}>
            COMPLETE COLLECTED PROFILE INFORMATION
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Full Name: <Text style={{ fontWeight: fullName ? '700' : '400' }}>{fullName || '—'}</Text>
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Mobile Phone: <Text style={{ fontWeight: phoneNumber ? '700' : '400' }}>{phoneNumber || '—'}</Text>
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Address / City: <Text style={{ fontWeight: address ? '700' : '400' }}>{address || '—'}</Text>
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Emergency Contact Name: <Text style={{ fontWeight: emergencyName ? '700' : '400' }}>{emergencyName || '—'}</Text>
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Emergency Contact Phone: <Text style={{ fontWeight: emergencyPhone ? '700' : '400' }}>{emergencyPhone || '—'}</Text>
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Relationship: <Text style={{ fontWeight: emergencyRelation ? '700' : '400' }}>{emergencyRelation || '—'}</Text>
          </Text>
          <Text style={[styles.summaryItem, { color: palette.primaryText }]}>
            • Guardian Link Status: <Text style={{ fontWeight: guardianLinked ? '700' : '400' }}>{guardianLinked ? 'Linked' : 'Setup Later'}</Text>
          </Text>
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
