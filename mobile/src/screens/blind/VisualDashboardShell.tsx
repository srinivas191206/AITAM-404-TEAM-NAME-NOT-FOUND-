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
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { ttsService } from '../../services/ttsService';
import { hapticService } from '../../services/hapticService';
import { speechRecognitionService } from '../../services/speechRecognitionService';

export type VoiceState = 'READY' | 'LISTENING' | 'PROCESSING' | 'RESPONDING' | 'ERROR';

interface VisualDashboardShellProps {
  onOpenSettings: () => void;
}

export const VisualDashboardShell: React.FC<VisualDashboardShellProps> = ({
  onOpenSettings,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('READY');
  const [transcript, setTranscript] = useState<string>('');
  const [responseMessage, setResponseMessage] = useState<string>(
    'Voice assistant ready. Tap the microphone area to speak.'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // App state listener to stop audio on background/minimize
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMountedRef.current = false;
      subscription.remove();
      cleanupAudio();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      cleanupAudio();
    }
  };

  const cleanupAudio = async () => {
    await speechRecognitionService.stopListening();
    await ttsService.stop();
    if (isMountedRef.current) {
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
          processSpokenTranscript(spokenText);
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
   * Process recognized speech transcript through Phase 4.1 Temporary Response System
   */
  const processSpokenTranscript = async (rawTranscript: string) => {
    await hapticService.medium();
    setVoiceState('PROCESSING');
    setTranscript(rawTranscript);
    setResponseMessage('Processing recognized speech...');

    // Small processing pause to mimic natural speech turn
    setTimeout(async () => {
      if (!isMountedRef.current) return;

      const normalized = rawTranscript.trim().toLowerCase();
      let responseText = '';

      // Phase 4.1 Temporary Response Rules
      if (normalized === 'hello' || normalized.startsWith('hello') || normalized === 'hi') {
        responseText = "Hello. I'm listening.";
      } else if (
        normalized.includes('how are you') ||
        normalized.includes('how are you doing')
      ) {
        responseText = "I'm doing well. How can I help you?";
      } else {
        responseText = 'I heard you. Intelligent commands will be connected next.';
      }

      setResponseMessage(responseText);
      setVoiceState('RESPONDING');

      // Speak response aloud via TTS
      await ttsService.speak(responseText, {
        onDone: async () => {
          if (isMountedRef.current) {
            await hapticService.light();
            setVoiceState('READY');
          }
        },
        onError: () => {
          if (isMountedRef.current) {
            setVoiceState('READY');
          }
        },
      });
    }, 400);
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
      processSpokenTranscript(phrase);
    }
  };

  const getStateAccessibilityLabel = () => {
    switch (voiceState) {
      case 'LISTENING':
        return 'Assistant is listening. Speak your voice command.';
      case 'PROCESSING':
        return 'Assistant is processing your voice.';
      case 'RESPONDING':
        return `Assistant is speaking: ${responseMessage}`;
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
              await cleanupAudio();
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

        {/* LARGE ACCESSIBLE MICROPHONE TOUCH AREA */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel={
            voiceState === 'LISTENING'
              ? 'Microphone is active. Tap to cancel listening.'
              : 'Voice assistant. Activate microphone.'
          }
          accessibilityHint="Double tap to speak to the assistant"
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
              ? 'PROCESSING...'
              : voiceState === 'RESPONDING'
              ? 'SPEAKING RESPONSE'
              : voiceState === 'ERROR'
              ? 'TAP TO RETRY'
              : 'TAP TO SPEAK'}
          </Text>
          <Text style={styles.micSubtitle}>
            {voiceState === 'LISTENING'
              ? 'Say "Hello" or "How are you?"'
              : 'Tap to start voice interaction'}
          </Text>
        </TouchableOpacity>

        {/* RECOGNIZED TRANSCRIPT DISPLAY */}
        {transcript ? (
          <View
            accessible={true}
            accessibilityLabel={`Recognized speech: ${transcript}`}
            style={styles.transcriptCard}
          >
            <Text style={styles.transcriptLabel}>RECOGNIZED SPEECH:</Text>
            <Text style={styles.transcriptText}>"{transcript}"</Text>
          </View>
        ) : null}

        {/* ACCESSIBILITY SPEECH TESTING TRAY (FOR VERIFICATION) */}
        <View style={styles.testTray}>
          <Text style={styles.testTrayLabel}>TEST VOICE INTERACTION (SIMULATION):</Text>
          <View style={styles.testChipsRow}>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Simulate saying Hello"
              accessibilityRole="button"
              onPress={() => triggerSimulation('Hello')}
              style={styles.testChip}
            >
              <Text style={styles.testChipText}>"Hello"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Simulate saying How are you"
              accessibilityRole="button"
              onPress={() => triggerSimulation('How are you?')}
              style={styles.testChip}
            >
              <Text style={styles.testChipText}>"How are you?"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Simulate saying What time is it"
              accessibilityRole="button"
              onPress={() => triggerSimulation('What time is it?')}
              style={styles.testChip}
            >
              <Text style={styles.testChipText}>"What time is it?"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Simulate silence timeout"
              accessibilityRole="button"
              onPress={() => triggerSimulation('__SILENCE__')}
              style={[styles.testChip, styles.testChipSilence]}
            >
              <Text style={styles.testChipText}>Silence Timeout</Text>
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
    minHeight: 180,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceInteractive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  micEmoji: {
    fontSize: 32,
  },
  micTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.5,
  },
  micSubtitle: {
    fontSize: 14,
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
  transcriptLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.blindPrimary,
    letterSpacing: 0.5,
    marginBottom: 4,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  testChipSilence: {
    borderColor: '#78350F',
  },
  testChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textHighEmphasis,
  },
});
