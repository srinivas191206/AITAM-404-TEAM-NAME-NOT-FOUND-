import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  AppState,
  AppStateStatus,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { CameraView } from 'expo-camera';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { ttsService } from '../../services/ttsService';
import { hapticService } from '../../services/hapticService';
import { speechRecognitionService } from '../../services/speechRecognitionService';
import { commandRouter, CommandRouteResult } from '../../services/commandRouter';
import { RecognizedIntentType } from '../../services/intentService';
import { visionService } from '../../services/visionService';
import { cameraService } from '../../services/cameraService';
import { DetectionResult } from '../../services/objectDetectionService';
import { VisionCameraPreview } from '../../components/camera/VisionCameraPreview';
import { BottomTabBar, TabItem } from '../../components/BottomTabBar';
import { ScenePerceptionScreen } from './ScenePerceptionScreen';
import { VoiceNavigationScreen } from './VoiceNavigationScreen';

export type VoiceState = 'READY' | 'LISTENING' | 'PROCESSING' | 'RESPONDING' | 'ERROR';

interface VisualDashboardShellProps {
  onOpenSettings: () => void;
}

const EyeHeaderIcon = ({ color = '#0F9D9A', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <Circle cx="12" cy="12" r="3.5" fill={color} />
  </Svg>
);

const SettingsGearIcon = ({ color = '#0F9D9A', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

const BigMicWavesIcon = ({ color = '#0F9D9A' }) => (
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

const SpeakerIcon = ({ color = '#0F9D9A', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 5L6 9H2v6h4l5 4V5z" />
    <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </Svg>
);

const ClockIcon = ({ color = '#0F9D9A', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

const VisualTabIcon = (color: string) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <Circle cx="12" cy="12" r="3" fill={color} />
  </Svg>
);

const CameraTabIcon = (color: string) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const NavTabIcon = (color: string) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 11L22 2L13 21L11 13L3 11Z" />
  </Svg>
);

const SettingsTabIcon = (color: string) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

export const VisualDashboardShell: React.FC<VisualDashboardShellProps> = ({
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<string>('assistant');
  const [voiceState, setVoiceState] = useState<VoiceState>('READY');
  const [transcript, setTranscript] = useState<string>('');
  const [detectedIntent, setDetectedIntent] = useState<RecognizedIntentType | null>(null);
  const [responseMessage, setResponseMessage] = useState<string>(
    ttsService.translateKey('ready')
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [activeDetections, setActiveDetections] = useState<DetectionResult[]>([]);

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

  const isMountedRef = useRef(true);
  const cameraRef = useRef<any>(null);

  const tabs: TabItem[] = [
    {
      id: 'assistant',
      label: 'Visual AI',
      icon: VisualTabIcon,
    },
    {
      id: 'perception',
      label: 'Camera Vision',
      icon: CameraTabIcon,
    },
    {
      id: 'navigation',
      label: 'Navigation',
      icon: NavTabIcon,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsTabIcon,
    },
  ];

  useEffect(() => {
    isMountedRef.current = true;

    visionService.registerCaptureDelegate(async () => {
      return await cameraService.captureFrameFromRef(cameraRef);
    });

    visionService.registerVisibilityListener((visible: boolean) => {
      if (isMountedRef.current) {
        setIsCameraActive(visible);
      }
    });

    visionService.registerDetectionListener((detections: DetectionResult[]) => {
      if (isMountedRef.current) {
        setActiveDetections(detections);
      }
    });

    // HANDS-FREE FOR BLIND USER: Speak audio greeting immediately on open, then start continuous listening loop!
    const welcomeAnnouncement = ttsService.translateKey('ready');
    ttsService.speak(welcomeAnnouncement, {
      onDone: () => {
        if (isMountedRef.current) {
          startListeningHandsFree();
        }
      },
    });

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      isMountedRef.current = false;
      subscription.remove();
      visionService.registerCaptureDelegate(null);
      visionService.registerVisibilityListener(null);
      visionService.registerDetectionListener(null);
      cleanupAllResources();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      cleanupAllResources();
    }
  };

  const cleanupAllResources = async () => {
    await speechRecognitionService.stopListening();
    await ttsService.stop();
    visionService.closeCamera();
    if (isMountedRef.current) {
      setIsCameraActive(false);
      setActiveDetections([]);
      setVoiceState('READY');
    }
  };

  /**
   * Continuous Hands-Free Auto-Listening Loop for Blind Users
   */
  const startListeningHandsFree = async () => {
    if (!isMountedRef.current) return;
    if (ttsService.getSpeakingState()) return;

    setErrorMessage(null);
    setVoiceState('LISTENING');
    setResponseMessage(ttsService.translateKey('listening'));

    const started = await speechRecognitionService.startListening({
      onStart: () => {
        if (isMountedRef.current) {
          setVoiceState('LISTENING');
        }
      },
      onResult: (spokenText: string) => {
        if (isMountedRef.current) {
          processSpokenCommand(spokenText);
        }
      },
      onError: (err: string) => {
        if (isMountedRef.current) {
          handleVoiceError(err);
        }
      },
      onSilenceTimeout: () => {
        if (isMountedRef.current) {
          handleSilenceTimeout();
        }
      },
    });

    if (!started && isMountedRef.current) {
      setVoiceState('READY');
    }
  };

  const handleMicrophonePress = async () => {
    await hapticService.light();
    if (ttsService.getSpeakingState()) {
      await ttsService.stop();
    }

    if (voiceState === 'LISTENING') {
      await speechRecognitionService.stopListening();
      setVoiceState('READY');
      return;
    }

    await startListeningHandsFree();
  };

  const processSpokenCommand = async (rawTranscript: string) => {
    await hapticService.medium();
    setVoiceState('PROCESSING');
    setTranscript(rawTranscript);
    setResponseMessage(ttsService.translateKey('analyzing'));

    const routeResult: CommandRouteResult = await commandRouter.routeCommand(rawTranscript);

    if (!isMountedRef.current) return;

    setDetectedIntent(routeResult.intent);
    setResponseMessage(routeResult.responseMessage);

    if (routeResult.isActionInterrupted) {
      await hapticService.success();
      visionService.closeCamera();
      setIsCameraActive(false);
      setActiveDetections([]);
      setVoiceState('READY');
      // Resume hands-free listening loop
      setTimeout(startListeningHandsFree, 800);
      return;
    }

    if (routeResult.intent === 'UNKNOWN') {
      await hapticService.error();
    } else if (routeResult.intent === 'VISION_QUERY') {
      const spatial = visionService.getLastSpatialAnalysis();
      if (spatial && spatial.hasMovementRelevantObstacle) {
        await hapticService.medium();
      } else {
        await hapticService.light();
      }
    } else if (
      routeResult.intent === 'READ_TEXT' ||
      routeResult.intent === 'CURRENCY_QUERY' ||
      routeResult.intent === 'SCENE_DESCRIPTION'
    ) {
      await hapticService.light();
    } else {
      await hapticService.success();
    }

    setVoiceState('RESPONDING');

    // Speak response aloud via TTS
    await ttsService.speak(routeResult.responseMessage, {
      onDone: async () => {
        if (isMountedRef.current) {
          await hapticService.light();
          if (
            routeResult.intent === 'VISION_QUERY' ||
            routeResult.intent === 'READ_TEXT' ||
            routeResult.intent === 'CURRENCY_QUERY' ||
            routeResult.intent === 'SCENE_DESCRIPTION'
          ) {
            visionService.closeCamera();
            setIsCameraActive(false);
          }
          setVoiceState('READY');
          // HANDS-FREE AUTOMATIC RESUME: Listen again after answering!
          setTimeout(startListeningHandsFree, 600);
        }
      },
      onError: () => {
        if (isMountedRef.current) {
          if (
            routeResult.intent === 'VISION_QUERY' ||
            routeResult.intent === 'READ_TEXT' ||
            routeResult.intent === 'CURRENCY_QUERY' ||
            routeResult.intent === 'SCENE_DESCRIPTION'
          ) {
            visionService.closeCamera();
            setIsCameraActive(false);
          }
          setVoiceState('READY');
          setTimeout(startListeningHandsFree, 1000);
        }
      },
    });
  };

  const handleSilenceTimeout = async () => {
    await hapticService.light();
    if (isMountedRef.current) {
      setVoiceState('READY');
      // Quietly restart listening loop so blind user is never locked out!
      setTimeout(startListeningHandsFree, 1500);
    }
  };

  const handleVoiceError = async (errType: string) => {
    await hapticService.error();
    setVoiceState('ERROR');

    const spokenError = ttsService.translateKey('error_unknown');
    setErrorMessage(spokenError);
    setResponseMessage(spokenError);

    await ttsService.speak(spokenError, {
      onDone: () => {
        if (isMountedRef.current) {
          setVoiceState('READY');
          setTimeout(startListeningHandsFree, 1200);
        }
      },
    });
  };

  const triggerSimulation = (phrase: string) => {
    if (phrase === '__SILENCE__') {
      handleSilenceTimeout();
    } else {
      processSpokenCommand(phrase);
    }
  };

  const handleSelectTab = (tabId: string) => {
    if (tabId === 'settings') {
      onOpenSettings();
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.card} />

      {/* SCREEN CONTAINER BASED ON TAB */}
      <View style={styles.screenContainer}>
        {activeTab === 'perception' ? (
          <ScenePerceptionScreen />
        ) : activeTab === 'navigation' ? (
          <VoiceNavigationScreen />
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* HEADER WITH TITLE & SETTINGS ICON */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.titleIconCircle, { backgroundColor: palette.accentLight }]}>
                    <EyeHeaderIcon color={palette.accentTeal} size={24} />
                  </View>
                  <Text style={[styles.headerTitle, { color: palette.primaryText }]}>Visual Assistant</Text>
                </View>
                <Text style={[styles.headerGreeting, { color: palette.secondaryText }]}>Hands-Free Voice Active</Text>
              </View>
              <TouchableOpacity
                accessible={true}
                accessibilityLabel="Open Settings"
                accessibilityRole="button"
                onPress={async () => {
                  await cleanupAllResources();
                  onOpenSettings();
                }}
                style={[styles.settingsIconBtn, { backgroundColor: palette.accentLight }]}
              >
                <SettingsGearIcon color={palette.accentTeal} size={22} />
              </TouchableOpacity>
            </View>

            {/* ACTIVE CAMERA VIEW (WHEN VISION / OCR / CURRENCY ACTIVE) */}
            {isCameraActive ? (
              <VisionCameraPreview
                cameraRef={cameraRef}
                isActive={isCameraActive}
                detections={activeDetections}
              />
            ) : null}

            {/* STATE INDICATOR HUD CARD */}
            <View style={[styles.statusBox, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={styles.stateIndicatorRow}>
                <View style={[styles.stateDot, { backgroundColor: palette.accentTeal }]} />
                <Text style={[styles.stateLabel, { color: palette.accentTeal }]}>HANDS-FREE STATE: {voiceState}</Text>
              </View>
              <Text style={[styles.statusMessage, { color: palette.primaryText }]}>{responseMessage}</Text>
            </View>

            {/* FULL-SCREEN HANDS-FREE VOICE MIC CARD */}
            <TouchableOpacity
              accessible={true}
              accessibilityLabel={
                voiceState === 'LISTENING'
                  ? 'Hands-free mic active. Speak your command now.'
                  : 'Voice assistant active. Tap to toggle.'
              }
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={handleMicrophonePress}
              style={[
                styles.micArea,
                {
                  backgroundColor: '#F4FBFB',
                  borderColor: palette.accentTeal,
                },
              ]}
            >
              <BigMicWavesIcon color={palette.accentTeal} />
              <Text style={[styles.micTitle, { color: palette.accentTeal }]}>
                {voiceState === 'LISTENING'
                  ? 'LISTENING... (SAY ANYTHING)'
                  : voiceState === 'PROCESSING'
                  ? 'ANALYZING VOICE...'
                  : voiceState === 'RESPONDING'
                  ? 'SPEAKING RESPONSE'
                  : 'HANDS-FREE READY'}
              </Text>
              <Text style={[styles.micSubtitle, { color: palette.secondaryText }]}>
                Say "Hey Hi", "What's in front of me?", or "Check currency"
              </Text>
            </TouchableOpacity>

            {/* RECOGNIZED SPEECH TRANSCRIPT */}
            {transcript ? (
              <View style={[styles.transcriptCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Text style={[styles.transcriptLabel, { color: palette.accentTeal }]}>RECOGNIZED SPEECH:</Text>
                <Text style={[styles.transcriptText, { color: palette.primaryText }]}>"{transcript}"</Text>
              </View>
            ) : null}

            {/* VOICE SIMULATION TRAY */}
            <View style={[styles.testTray, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.testTrayLabel, { color: palette.secondaryText }]}>
                TEST VOICE INTERACTION (SIMULATION):
              </Text>
              <View style={styles.testChipsRow}>
                <TouchableOpacity
                  accessible={true}
                  accessibilityLabel="Simulate saying Hey Hi"
                  accessibilityRole="button"
                  onPress={() => triggerSimulation('Hey Hi')}
                  style={[styles.testChip, { backgroundColor: palette.card, borderColor: palette.accentTeal }]}
                >
                  <SpeakerIcon color={palette.accentTeal} size={15} />
                  <Text style={[styles.testChipText, { color: palette.primaryText }]}>"Hey Hi"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessible={true}
                  accessibilityLabel="Simulate saying What is in front of me"
                  accessibilityRole="button"
                  onPress={() => triggerSimulation('What is in front of me?')}
                  style={[styles.testChip, { backgroundColor: palette.card, borderColor: palette.accentTeal }]}
                >
                  <SpeakerIcon color={palette.accentTeal} size={15} />
                  <Text style={[styles.testChipText, { color: palette.primaryText }]}>"What's in front of me?"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessible={true}
                  accessibilityLabel="Simulate saying Read text"
                  accessibilityRole="button"
                  onPress={() => triggerSimulation('Read text')}
                  style={[styles.testChip, { backgroundColor: palette.card, borderColor: palette.accentTeal }]}
                >
                  <SpeakerIcon color={palette.accentTeal} size={15} />
                  <Text style={[styles.testChipText, { color: palette.primaryText }]}>"Read text"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessible={true}
                  accessibilityLabel="Simulate saying Check currency"
                  accessibilityRole="button"
                  onPress={() => triggerSimulation('Check currency')}
                  style={[styles.testChip, { backgroundColor: palette.card, borderColor: palette.accentTeal }]}
                >
                  <SpeakerIcon color={palette.accentTeal} size={15} />
                  <Text style={[styles.testChipText, { color: palette.primaryText }]}>"Check currency"</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* BOTTOM TAB BAR */}
      <BottomTabBar
        activeTab={activeTab}
        tabs={tabs}
        onSelectTab={handleSelectTab}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  titleIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerGreeting: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 4,
  },
  settingsIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBox: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  stateIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  stateLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  micArea: {
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginVertical: 2,
  },
  micTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 16,
  },
  micSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
  },
  transcriptCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  transcriptText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  testTray: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  testTrayLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  testChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  testChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
