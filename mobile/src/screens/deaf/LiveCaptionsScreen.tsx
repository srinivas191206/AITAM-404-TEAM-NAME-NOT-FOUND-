import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { outputService } from '../../services/outputService';
import { Colors } from '../../theme/colors';

interface LiveCaptionsScreenProps {
  onBack: () => void;
}

export const LiveCaptionsScreen: React.FC<LiveCaptionsScreenProps> = ({ onBack }) => {
  const [fontSize, setFontSize] = useState<number>(26);
  const [isTranscribing] = useState(true);
  const [transcripts, setTranscripts] = useState<Array<{ speaker: string; text: string; time: string }>>([
    {
      speaker: 'Nearby Speaker',
      text: 'Hello! I am speaking clearly near your mobile device.',
      time: 'Just now',
    },
    {
      speaker: 'Nearby Speaker',
      text: 'Access Plus transcribes speech continuously in high contrast for comfortable reading.',
      time: 'Just now',
    },
  ]);

  const addSimulatedPhrase = (phrase: string) => {
    outputService.triggerHaptic('info');
    setTranscripts((prev) => [
      ...prev,
      {
        speaker: 'Nearby Speaker',
        text: phrase,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Back to Dashboard"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Live Captions</Text>
        <View style={styles.fontSizeControls}>
          <TouchableOpacity
            onPress={() => setFontSize((s) => Math.max(18, s - 4))}
            style={styles.sizeBtn}
            accessible={true}
            accessibilityLabel="Decrease Text Size"
          >
            <Text style={styles.sizeBtnText}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFontSize((s) => Math.min(40, s + 4))}
            style={styles.sizeBtn}
            accessible={true}
            accessibilityLabel="Increase Text Size"
          >
            <Text style={styles.sizeBtnText}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STATUS BAR */}
      <View style={styles.statusBar}>
        <View style={styles.liveIndicator}>
          <View style={styles.pulsingDot} />
          <Text style={styles.statusText}>
            {isTranscribing ? 'MICROPHONE ACTIVE • TRANSCRIBING' : 'PAUSED'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setTranscripts([])}
          style={styles.clearBtn}
          accessible={true}
          accessibilityLabel="Clear Captions History"
        >
          <Text style={styles.clearBtnText}>CLEAR</Text>
        </TouchableOpacity>
      </View>

      {/* CAPTIONS STREAM */}
      <ScrollView contentContainerStyle={styles.captionsStream}>
        {transcripts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎙️</Text>
            <Text style={styles.emptyText}>Listening for speech nearby...</Text>
            <Text style={styles.emptySubtext}>Spoken sentences appear here in large, high-contrast text.</Text>
          </View>
        ) : (
          transcripts.map((item, index) => (
            <View key={index} style={styles.captionBubble}>
              <View style={styles.captionHeader}>
                <Text style={styles.speakerLabel}>{item.speaker}</Text>
                <Text style={styles.timeLabel}>{item.time}</Text>
              </View>
              <Text style={[styles.captionText, { fontSize, lineHeight: fontSize * 1.35 }]}>
                {item.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* DEMO SHORTCUT TRAY */}
      <View style={styles.testTray}>
        <Text style={styles.trayLabel}>DEMO SPEECH SHORTCUTS:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trayChips}>
          <TouchableOpacity
            onPress={() => addSimulatedPhrase("Excuse me, where is the main entrance?")}
            style={styles.demoChip}
          >
            <Text style={styles.demoChipText}>"Where is the entrance?"</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => addSimulatedPhrase("Your order number 404 is ready.")}
            style={styles.demoChip}
          >
            <Text style={styles.demoChipText}>"Order 404 is ready"</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => addSimulatedPhrase("Please wait here for assistance.")}
            style={styles.demoChip}
          >
            <Text style={styles.demoChipText}>"Please wait here"</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceInteractive,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  backButtonText: {
    color: Colors.deafBorder,
    fontWeight: '800',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
  },
  fontSizeControls: {
    flexDirection: 'row',
    gap: 6,
  },
  sizeBtn: {
    backgroundColor: Colors.surfaceInteractive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sizeBtnText: {
    color: Colors.textHighEmphasis,
    fontWeight: '800',
    fontSize: 14,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.deafBorder,
    marginRight: 8,
  },
  statusText: {
    color: Colors.deafBorder,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.surfaceInteractive,
    borderRadius: 8,
  },
  clearBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  captionsStream: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.textHighEmphasis,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  captionBubble: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.deafBorder,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  captionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  speakerLabel: {
    color: Colors.deafBorder,
    fontSize: 13,
    fontWeight: '700',
  },
  timeLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  captionText: {
    color: Colors.textHighEmphasis,
    fontWeight: '600',
  },
  testTray: {
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  trayLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  trayChips: {
    gap: 8,
  },
  demoChip: {
    backgroundColor: Colors.surfaceInteractive,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  demoChipText: {
    color: Colors.textHighEmphasis,
    fontSize: 13,
    fontWeight: '600',
  },
});
