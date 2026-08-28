import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useLocationContext } from '../../context/LocationContext';
import { useVoiceAssistant, VoiceCommandResult } from '../../hooks/useVoiceAssistant';
import { outputService } from '../../services/outputService';
import { AccessibleButton } from '../../components/AccessibleButton';
import { Colors } from '../../theme/colors';

interface BlindDashboardProps {
  onNavigateToCamera: (task: 'scene_description' | 'ocr_text' | 'currency_recognition') => void;
  onNavigateToNavigation: () => void;
  onSwitchMode: () => void;
}

export const BlindDashboardScreen: React.FC<BlindDashboardProps> = ({
  onNavigateToCamera,
  onNavigateToNavigation,
  onSwitchMode,
}) => {
  const { triggerSos } = useAccessibility();
  const { refreshLocation } = useLocationContext();
  const { isListening, simulateVoiceCommand } = useVoiceAssistant();
  const [lastSpokenAction, setLastSpokenAction] = useState<string>('Voice assistant is ready.');

  const handleVoiceResult = (res: VoiceCommandResult) => {
    switch (res.intent) {
      case 'describe_scene':
        setLastSpokenAction('Opening camera for scene description.');
        outputService.announce('Opening camera to describe scene.');
        onNavigateToCamera('scene_description');
        break;
      case 'read_text':
        setLastSpokenAction('Opening camera to read text.');
        outputService.announce('Opening camera to read text and signs.');
        onNavigateToCamera('ocr_text');
        break;
      case 'check_currency':
        setLastSpokenAction('Opening camera to check currency.');
        outputService.announce('Opening camera to identify currency.');
        onNavigateToCamera('currency_recognition');
        break;
      case 'navigate_to':
        setLastSpokenAction(`Starting navigation to ${res.parameter || 'destination'}.`);
        outputService.announce(`Starting navigation to ${res.parameter || 'destination'}.`);
        onNavigateToNavigation();
        break;
      case 'where_am_i':
        handleWhereAmI();
        break;
      case 'emergency_sos':
        triggerSos('manual');
        break;
      default:
        outputService.announce('I did not recognize that command. You can say: "What is in front of me", "Read text", "Check currency", or "Where am I".');
    }
  };

  const handleWhereAmI = async () => {
    const loc = await refreshLocation();
    if (loc) {
      const lat = loc.coords.latitude.toFixed(4);
      const lon = loc.coords.longitude.toFixed(4);
      const speech = `Your current coordinates are latitude ${lat}, longitude ${lon}. Accuracy is within ${Math.round(loc.coords.accuracy || 10)} meters.`;
      setLastSpokenAction(speech);
      outputService.announce(speech, 'high');
    } else {
      outputService.announce('Fetching GPS location. Please ensure location services are enabled.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CALM HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👁️ Visual Assistant</Text>
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{lastSpokenAction}</Text>
          </View>
        </View>

        {/* LARGE TACTILE VOICE BUTTON */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Touch to Speak Voice Assistant"
          accessibilityHint="Double tap to speak your command"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={() => simulateVoiceCommand("what's in front of me", handleVoiceResult)}
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
        >
          <Text style={styles.voiceIcon}>🎙️</Text>
          <Text style={styles.voiceButtonText}>
            {isListening ? 'Listening...' : 'Tap to Speak'}
          </Text>
          <Text style={styles.voiceButtonSubtext}>
            Say: "What's in front of me?"
          </Text>
        </TouchableOpacity>

        {/* ACCESSIBLE SHORTCUT CARDS */}
        <View style={styles.actionsGrid}>
          <AccessibleButton
            title="🔍 What's in front of me?"
            accessibilityHint="Analyzes the scene in front of the camera and speaks objects"
            size="large"
            variant="primary"
            onPress={() => {
              outputService.announce('Opening camera to describe scene.');
              onNavigateToCamera('scene_description');
            }}
          />

          <AccessibleButton
            title="📄 Read Text / Document"
            accessibilityHint="Reads signs, text, and documents in front of camera"
            size="large"
            variant="secondary"
            onPress={() => {
              outputService.announce('Opening camera to read text.');
              onNavigateToCamera('ocr_text');
            }}
          />

          <AccessibleButton
            title="💵 Check Currency Note"
            accessibilityHint="Identifies currency note denomination"
            size="large"
            variant="secondary"
            onPress={() => {
              outputService.announce('Opening camera to identify currency.');
              onNavigateToCamera('currency_recognition');
            }}
          />

          <AccessibleButton
            title="🧭 Voice Navigation"
            accessibilityHint="Opens turn by turn walking navigation"
            size="large"
            variant="secondary"
            onPress={() => {
              outputService.announce('Opening voice navigation.');
              onNavigateToNavigation();
            }}
          />

          <AccessibleButton
            title="📍 Where am I? (GPS)"
            accessibilityHint="Speaks your current GPS location coordinates"
            size="large"
            variant="subtle"
            onPress={handleWhereAmI}
          />

          <AccessibleButton
            title="🚨 Emergency SOS"
            accessibilityHint="Triggers 5-second emergency countdown with Twilio SMS dispatch"
            size="large"
            variant="danger"
            onPress={() => triggerSos('manual')}
          />
        </View>

        {/* FOOTER SWITCH MODE */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Switch Accessibility Mode"
          accessibilityRole="button"
          onPress={onSwitchMode}
          style={styles.switchModeButton}
        >
          <Text style={styles.switchModeText}>🔄 Switch to Hearing Assistance / Guardian</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.blindPrimary,
    letterSpacing: 0.5,
  },
  statusBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statusText: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    fontWeight: '600',
    lineHeight: 22,
  },
  voiceButton: {
    backgroundColor: Colors.blindPrimary,
    borderWidth: 3,
    borderColor: Colors.blindBorder,
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  voiceButtonActive: {
    backgroundColor: Colors.danger,
    borderColor: '#B91C1C',
  },
  voiceIcon: {
    fontSize: 44,
    marginBottom: 6,
  },
  voiceButtonText: {
    color: '#121110',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  voiceButtonSubtext: {
    color: '#382806',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  actionsGrid: {
    gap: 8,
  },
  switchModeButton: {
    marginTop: 24,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  switchModeText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
});
