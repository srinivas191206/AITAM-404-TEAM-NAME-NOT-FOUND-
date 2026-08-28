import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { InteractionState } from '../../types';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AccessibleButton } from '../../components/AccessibleButton';
import { outputService } from '../../services/outputService';
import { hapticService } from '../../services/hapticService';

interface VisualDashboardShellProps {
  onOpenSettings: () => void;
}

export const VisualDashboardShell: React.FC<VisualDashboardShellProps> = ({
  onOpenSettings,
}) => {
  const [interactionState, setInteractionState] = useState<InteractionState>('ready');
  const [placeholderMessage, setPlaceholderMessage] = useState<string>(
    'Voice assistant ready. Tap the microphone area to speak.'
  );

  const handleMicTap = async () => {
    if (interactionState === 'ready') {
      await hapticService.medium();
      setInteractionState('listening');
      setPlaceholderMessage('Listening for your command...');
      outputService.announce('Listening.');

      setTimeout(async () => {
        setInteractionState('processing');
        setPlaceholderMessage('Processing voice intent...');

        setTimeout(() => {
          setInteractionState('ready');
          const responseText = 'Voice recognition module will be connected in Phase 3.';
          setPlaceholderMessage(responseText);
          outputService.announce(responseText);
        }, 1200);
      }, 1500);
    }
  };

  const handlePlaceholderAction = async (featureName: string) => {
    await hapticService.light();
    const msg = `${featureName} module will be connected in a future phase.`;
    setPlaceholderMessage(msg);
    outputService.announce(msg);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* CALM HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>👁️ Visual Assistant</Text>
            <Text style={styles.headerGreeting}>Hi. How can I help you?</Text>
          </View>
          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Open Settings"
            accessibilityRole="button"
            onPress={onOpenSettings}
            style={styles.settingsIconBtn}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* STATUS HUD & ASSISTANT STATE INDICATOR */}
        <View style={styles.statusBox}>
          <View style={styles.stateIndicatorRow}>
            <View
              style={[
                styles.stateDot,
                interactionState === 'listening'
                  ? styles.dotListening
                  : interactionState === 'processing'
                  ? styles.dotProcessing
                  : styles.dotReady,
              ]}
            />
            <Text style={styles.stateLabel}>
              {interactionState === 'listening'
                ? 'STATE: LISTENING'
                : interactionState === 'processing'
                ? 'STATE: PROCESSING'
                : 'STATE: READY'}
            </Text>
          </View>
          <Text style={styles.statusMessage}>{placeholderMessage}</Text>
        </View>

        {/* LARGE ACCESSIBLE MICROPHONE TOUCH AREA */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel={
            interactionState === 'listening'
              ? 'Listening for command'
              : 'Tap to speak voice command'
          }
          accessibilityHint="Double tap to trigger voice assistant"
          accessibilityRole="button"
          activeOpacity={0.8}
          onPress={handleMicTap}
          style={[
            styles.micArea,
            interactionState === 'listening'
              ? styles.micAreaListening
              : interactionState === 'processing'
              ? styles.micAreaProcessing
              : styles.micAreaReady,
          ]}
        >
          <Text style={styles.micIcon}>🎙️</Text>
          <Text style={styles.micMainText}>
            {interactionState === 'listening'
              ? 'LISTENING...'
              : interactionState === 'processing'
              ? 'PROCESSING...'
              : 'TAP TO SPEAK'}
          </Text>
          <Text style={styles.micSubtext}>
            {interactionState === 'ready' ? 'Say: "What\'s in front of me?"' : 'Speak clearly'}
          </Text>
        </TouchableOpacity>

        {/* ACCESSIBLE ACTION SHORTCUT PLACEHOLDERS */}
        <View style={styles.actionsList}>
          <Text style={styles.actionsHeader}>ACCESSIBILITY ACTIONS</Text>

          <AccessibleButton
            title="🔍 What's in front of me?"
            size="large"
            variant="primary"
            accessibilityHint="Analyzes camera scene"
            onPress={() => handlePlaceholderAction('Camera Scene Understanding')}
          />

          <AccessibleButton
            title="📄 Read Text / Document"
            size="large"
            variant="secondary"
            accessibilityHint="Reads visible document text"
            onPress={() => handlePlaceholderAction('OCR Text Reader')}
          />

          <AccessibleButton
            title="💵 Currency Recognition"
            size="large"
            variant="secondary"
            accessibilityHint="Identifies banknote denomination"
            onPress={() => handlePlaceholderAction('Currency Recognition')}
          />

          <AccessibleButton
            title="🧭 Voice Navigation"
            size="large"
            variant="secondary"
            accessibilityHint="Opens turn-by-turn walking guidance"
            onPress={() => handlePlaceholderAction('Pedestrian Navigation')}
          />

          <AccessibleButton
            title="🚨 Emergency SOS"
            size="large"
            variant="danger"
            accessibilityHint="Triggers emergency SOS dispatch"
            onPress={() => handlePlaceholderAction('Emergency SOS')}
          />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.blindPrimary,
    letterSpacing: 0.5,
  },
  headerGreeting: {
    fontSize: 16,
    color: Colors.textHighEmphasis,
    fontWeight: '600',
    marginTop: 2,
  },
  settingsIconBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  settingsIcon: {
    fontSize: 20,
  },
  statusBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  stateIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs + 2,
  },
  dotReady: {
    backgroundColor: Colors.blindPrimary,
  },
  dotListening: {
    backgroundColor: Colors.danger,
  },
  dotProcessing: {
    backgroundColor: Colors.warning,
  },
  stateLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statusMessage: {
    fontSize: 15,
    color: Colors.textHighEmphasis,
    fontWeight: '600',
    lineHeight: 22,
  },
  micArea: {
    borderRadius: Spacing.radiusLg,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    minHeight: Spacing.massiveTouchTarget,
    borderWidth: 3,
  },
  micAreaReady: {
    backgroundColor: Colors.blindPrimary,
    borderColor: Colors.blindBorder,
  },
  micAreaListening: {
    backgroundColor: Colors.danger,
    borderColor: '#B91C1C',
  },
  micAreaProcessing: {
    backgroundColor: Colors.warning,
    borderColor: '#B45309',
  },
  micIcon: {
    fontSize: 48,
    marginBottom: 6,
  },
  micMainText: {
    color: '#121110',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  micSubtext: {
    color: '#382806',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  actionsList: {
    gap: Spacing.xs,
  },
  actionsHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.blindPrimary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
});
