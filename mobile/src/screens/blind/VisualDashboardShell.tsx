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
import { VisionCameraPreview } from '../../components/camera/VisionCameraPreview';

export type VoiceState = 'READY' | 'LISTENING' | 'PROCESSING' | 'RESPONDING' | 'ERROR';

interface VisualDashboardShellProps {
  onOpenSettings: () => void;
}

export const VisualDashboardShell: React.FC<VisualDashboardShellProps> = ({
  onOpenSettings,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('READY');
  const [transcript, setTranscript] = useState<string>('');
  const [detectedIntent, setDetectedIntent] = useState<RecognizedIntentType | null>(null);
  const [responseMessage, setResponseMessage] = useState<string>(
    'Voice assistant ready. Tap the microphone area to speak.'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const isMountedRef = useRef(true);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    isMountedRef.current = true;

    // Register VisionService capture delegate & visibility listener
    visionService.registerCaptureDelegate(async () => {
      return await cameraService.captureFrameFromRef(cameraRef);
    });

    visionService.registerVisibilityListener((visible: boolean) => {
      if (isMountedRef.current) {
        setIsCameraActive(visible);
      }
    });

    // App state listener to stop audio & camera on background/minimize
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      visionService.registerCaptureDelegate(null);
      visionService.registerVisibilityListener(null);
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
      setVoiceState('READY');
    }
  };

  /**
   * Handle primary Microphone activation
   */
  const handleMicrophonePress = async () => {
    // 1. Interrupt any active TTS or ongoing speech
    if (ttsService.getSpeakingState()) {
      await ttsService.stop();
    }

    // If currently listening, tapping stops listening
    if (voiceState === 'LISTENING') {
      await hapticService.light();
      await speechRecognitionService.stopListening();
      setVoiceState('READY');
      setResponseMessage('Listening cancelled. Voice assistant ready.');
      return;
    }

    // 2. Light haptic feedback for mic activation
    await hapticService.light();
    setErrorMessage(null);
    setVoiceState('LISTENING');
    setTranscript('');
    setResponseMessage('Listening...');

    // 3. Start controlled listening session
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

    if (!started) {
      // Permission or init failure handled inside onError
    }
  };

  /**
   * Process spoken command through Phase 4/5 Intent Understanding & Command Router
   */
  const processSpokenCommand = async (rawTranscript: string) => {
    await hapticService.medium();
    setVoiceState('PROCESSING');
    setTranscript(rawTranscript);
    setResponseMessage('Understanding command...');

    // Route through central Command Router
    const routeResult: CommandRouteResult = await commandRouter.routeCommand(rawTranscript);

    if (!isMountedRef.current) return;

    setDetectedIntent(routeResult.intent);
    setResponseMessage(routeResult.responseMessage);

    // If STOP was commanded, interrupt and reset immediately
    if (routeResult.isActionInterrupted) {
      await hapticService.success();
      visionService.closeCamera();
      setIsCameraActive(false);
      setVoiceState('READY');
      return;
    }

    // Haptic feedback based on recognition result
    if (routeResult.intent === 'UNKNOWN') {
      await hapticService.error();
    } else {
      await hapticService.success();
    }

    setVoiceState('RESPONDING');

    // Speak response aloud via TTS
    await ttsService.speak(routeResult.responseMessage, {
      onDone: async () => {
        if (isMountedRef.current) {
          await hapticService.light();
          // Pause camera after vision perception query completes
          if (routeResult.intent === 'VISION_QUERY') {
            visionService.closeCamera();
            setIsCameraActive(false);
          }
          setVoiceState('READY');
        }
      },
      onError: () => {
        if (isMountedRef.current) {
          if (routeResult.intent === 'VISION_QUERY') {
            visionService.closeCamera();
            setIsCameraActive(false);
          }
          setVoiceState('READY');
        }
      },
    });
  };

  /**
   * Handle silence timeout
   */
  const handleSilenceTimeout = async () => {
    await hapticService.error();
    setVoiceState('ERROR');
    const msg = "I didn't hear anything. Please try again.";
    setErrorMessage(msg);
    setResponseMessage(msg);

    await ttsService.speak(msg, {
      onDone: () => {
        if (isMountedRef.current) {
          setVoiceState('READY');
        }
      },
    });
  };

  /**
   * Handle speech & permission errors gracefully
   */
  const handleVoiceError = async (errType: string) => {
    await hapticService.error();
    setVoiceState('ERROR');

    let spokenError = '';

    if (errType === 'permission_denied' || errType === 'permission_permanently_denied') {
      spokenError =
        "I can't access the microphone. You can enable microphone access in your phone settings.";
    } else if (errType === 'silence_timeout' || errType === 'no_speech_detected') {
      spokenError = "I didn't hear anything. Please try again.";
    } else {
      spokenError = "I couldn't understand that. Please try again.";
    }

    setErrorMessage(spokenError);
    setResponseMessage(spokenError);

    await ttsService.speak(spokenError, {
      onDone: () => {
        if (isMountedRef.current) {
          setVoiceState('READY');
        }
      },
    });
  };

  /**
   * Test speech simulation trigger (for automated and physical testing)
   */
  const triggerSimulation = (phrase: string) => {
    if (phrase === '__SILENCE__') {
      handleSilenceTimeout();
    } else {
      processSpokenCommand(phrase);
    }
  };

  const getStateAccessibilityLabel = () => {
    switch (voiceState) {
      case 'LISTENING':
        return 'Assistant is listening. Speak your voice command.';
      case 'PROCESSING':
        return 'Assistant is processing your command.';
      case 'RESPONDING':
        return `Assistant is responding: ${responseMessage}`;
      case 'ERROR':
        return `Assistant error: ${errorMessage || responseMessage}`;
      case 'READY':
      default:
        return 'Assistant is ready. Tap the microphone area to speak.';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* CALM ACCESSIBLE HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>👁️ Visual Assistant</Text>
            <Text style={styles.headerGreeting}>Hi. How can I help you?</Text>
          </View>
          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Open Settings"
            accessibilityHint="Double tap to open profile and app settings"
            accessibilityRole="button"
            onPress={async () => {
              await cleanupAllResources();
              onOpenSettings();
            }}
            style={styles.settingsIconBtn}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* LOGICAL STATE HUD */}
        <View
          accessible={true}
          accessibilityLabel={getStateAccessibilityLabel()}
          style={[
            styles.statusBox,
            voiceState === 'LISTENING' && styles.statusBoxListening,
            voiceState === 'ERROR' && styles.statusBoxError,
          ]}
        >
          <View style={styles.stateIndicatorRow}>
            <View
              style={[
                styles.stateDot,
                voiceState === 'LISTENING' && styles.dotListening,
                voiceState === 'PROCESSING' && styles.dotProcessing,
                voiceState === 'RESPONDING' && styles.dotResponding,
                voiceState === 'ERROR' && styles.dotError,
                voiceState === 'READY' && styles.dotReady,
              ]}
            />
            <Text style={styles.stateLabel}>STATE: {voiceState}</Text>
          </View>
          <Text style={styles.statusMessage}>{responseMessage}</Text>
        </View>

        {/* CAMERA PERCEPTION PREVIEW VIEWPORT */}
        <VisionCameraPreview
          cameraRef={cameraRef}
          isActive={isCameraActive}
          onCameraReady={() => cameraService.setCameraReady(true)}
          onMountError={(err) => {
            console.warn('[VisualDashboardShell] Camera error:', err);
            cameraService.setCameraReady(false);
          }}
        />

        {/* LARGE ACCESSIBLE MICROPHONE TOUCH AREA */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel={
            voiceState === 'LISTENING'
              ? 'Microphone is active. Tap to cancel listening.'
              : 'Voice assistant. Activate microphone.'
          }
          accessibilityHint="Double tap to speak a command to the assistant"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={handleMicrophonePress}
          style={[
            styles.micArea,
            voiceState === 'LISTENING' && styles.micAreaListening,
            voiceState === 'PROCESSING' && styles.micAreaProcessing,
            voiceState === 'RESPONDING' && styles.micAreaResponding,
            voiceState === 'ERROR' && styles.micAreaError,
          ]}
        >
          <View style={styles.micIconCircle}>
            <Text style={styles.micEmoji}>🎙️</Text>
          </View>
          <Text style={styles.micTitle}>
            {voiceState === 'LISTENING'
              ? 'LISTENING...'
              : voiceState === 'PROCESSING'
              ? 'UNDERSTANDING...'
              : voiceState === 'RESPONDING'
              ? 'RESPONDING'
              : voiceState === 'ERROR'
              ? 'TAP TO RETRY'
              : 'TAP TO SPEAK'}
          </Text>
          <Text style={styles.micSubtitle}>
            {voiceState === 'LISTENING'
              ? 'Speak naturally (e.g. "What\'s in front of me?")'
              : 'Tap to start voice interaction'}
          </Text>
        </TouchableOpacity>

        {/* RECOGNIZED COMMAND & INTENT CARD */}
        {transcript ? (
          <View
            accessible={true}
            accessibilityLabel={`Recognized command: ${transcript}, Intent: ${detectedIntent || 'Pending'}`}
            style={styles.transcriptCard}
          >
            <View style={styles.transcriptHeaderRow}>
              <Text style={styles.transcriptLabel}>RECOGNIZED COMMAND</Text>
              {detectedIntent ? (
                <View style={styles.intentBadge}>
                  <Text style={styles.intentBadgeText}>{detectedIntent}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.transcriptText}>"{transcript}"</Text>
          </View>
        ) : null}

        {/* TEST MATRIX TRAY (PHASE 4 & 5 TEST COMMANDS) */}
        <View style={styles.testTray}>
          <Text style={styles.testTrayLabel}>TEST COMMAND INTENT MATRIX:</Text>
          <View style={styles.testChipsRow}>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Test What's in front of me"
              accessibilityRole="button"
              onPress={() => triggerSimulation("What's in front of me?")}
              style={[styles.testChip, styles.testChipVision]}
            >
              <Text style={styles.testChipVisionText}>📷 "What's in front of me?"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Test What is ahead"
              accessibilityRole="button"
              onPress={() => triggerSimulation('What is ahead?')}
              style={[styles.testChip, styles.testChipVision]}
            >
              <Text style={styles.testChipVisionText}>📷 "What is ahead?"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Test Read this"
              accessibilityRole="button"
              onPress={() => triggerSimulation('Read this.')}
              style={styles.testChip}
            >
              <Text style={styles.testChipText}>"Read this."</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Test Describe my surroundings"
              accessibilityRole="button"
              onPress={() => triggerSimulation('Describe my surroundings.')}
              style={styles.testChip}
            >
              <Text style={styles.testChipText}>"Describe my surroundings."</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Test What currency is this"
              accessibilityRole="button"
              onPress={() => triggerSimulation('What currency is this?')}
              style={styles.testChip}
            >
              <Text style={styles.testChipText}>"What currency is this?"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Test Take me to the nearest hospital"
              accessibilityRole="button"
              onPress={() => triggerSimulation('Take me to the nearest hospital.')}
              style={styles.testChip}
            >
              <Text style={styles.testChipText}>"Take me to nearest hospital"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Test Help"
              accessibilityRole="button"
              onPress={() => triggerSimulation('Help.')}
              style={styles.testChip}
            >
              <Text style={styles.testChipText}>"Help."</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Test Stop"
              accessibilityRole="button"
              onPress={() => triggerSimulation('Stop.')}
              style={styles.testChip}
            >
              <Text style={styles.testChipText}>"Stop."</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Test Repeat that"
              accessibilityRole="button"
              onPress={() => triggerSimulation('Repeat that.')}
              style={styles.testChip}
            >
              <Text style={styles.testChipText}>"Repeat that."</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Test Unknown command"
              accessibilityRole="button"
              onPress={() => triggerSimulation('Play jazz music.')}
              style={[styles.testChip, styles.testChipUnknown]}
            >
              <Text style={styles.testChipText}>"Play jazz music"</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.blindPrimary,
    letterSpacing: 0.3,
  },
  headerGreeting: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMediumEmphasis,
    marginTop: 2,
  },
  settingsIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 22,
  },
  statusBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statusBoxListening: {
    borderColor: Colors.blindPrimary,
    backgroundColor: '#1E1A14',
  },
  statusBoxError: {
    borderColor: Colors.danger,
    backgroundColor: '#201212',
  },
  stateIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs + 2,
  },
  dotReady: {
    backgroundColor: '#EAB308',
  },
  dotListening: {
    backgroundColor: '#22C55E',
  },
  dotProcessing: {
    backgroundColor: '#3B82F6',
  },
  dotResponding: {
    backgroundColor: Colors.blindPrimary,
  },
  dotError: {
    backgroundColor: Colors.danger,
  },
  stateLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMediumEmphasis,
    letterSpacing: 0.8,
  },
  statusMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textHighEmphasis,
    lineHeight: 22,
  },
  micArea: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    minHeight: 160,
  },
  micAreaListening: {
    borderColor: '#22C55E',
    backgroundColor: '#142217',
  },
  micAreaProcessing: {
    borderColor: '#3B82F6',
    backgroundColor: '#131A26',
  },
  micAreaResponding: {
    borderColor: Colors.blindPrimary,
    backgroundColor: '#231B10',
  },
  micAreaError: {
    borderColor: Colors.danger,
    backgroundColor: '#241212',
  },
  micIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceInteractive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  micEmoji: {
    fontSize: 28,
  },
  micTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.5,
  },
  micSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMediumEmphasis,
    marginTop: Spacing.xs,
  },
  transcriptCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  transcriptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMediumEmphasis,
    letterSpacing: 0.5,
  },
  intentBadge: {
    backgroundColor: Colors.blindSurface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.blindBorder,
  },
  intentBadgeText: {
    color: Colors.blindPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  transcriptText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textHighEmphasis,
    lineHeight: 24,
  },
  testTray: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginTop: Spacing.xs,
  },
  testTrayLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMediumEmphasis,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  testChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  testChip: {
    backgroundColor: Colors.surfaceInteractive,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 3,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  testChipVision: {
    borderColor: Colors.blindBorder,
    backgroundColor: Colors.blindSurface,
  },
  testChipVisionText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.blindPrimary,
  },
  testChipUnknown: {
    borderColor: '#78350F',
  },
  testChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textHighEmphasis,
  },
});
