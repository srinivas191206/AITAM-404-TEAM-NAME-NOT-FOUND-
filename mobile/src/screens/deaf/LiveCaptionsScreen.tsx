import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { outputService } from '../../services/outputService';
import { speechRecognitionService } from '../../services/speechRecognitionService';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

interface LiveCaptionsScreenProps {
  onBack?: () => void;
}

export const LiveCaptionsScreen: React.FC<LiveCaptionsScreenProps> = ({ onBack }) => {
  const [fontSize, setFontSize] = useState<number>(24);
  const [isTranscribing, setIsTranscribing] = useState(true);
  const [transcripts, setTranscripts] = useState<Array<{ speaker: string; text: string; time: string }>>([
    {
      speaker: 'Nearby Speaker',
      text: 'Hello! Speech is continuously transcribed here with large readable text.',
      time: 'Just now',
    },
  ]);

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

  useEffect(() => {
    // Start continuous listening for speech
    speechRecognitionService.startListening({
      onResult: (spokenText: string) => {
        if (spokenText.trim()) {
          setTranscripts((prev) => [
            ...prev,
            {
              speaker: 'Nearby Speaker',
              text: spokenText.trim(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      },
      onError: () => {},
    });

    return () => {
      speechRecognitionService.stopListening();
    };
  }, []);

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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* TOP BAR */}
      <View style={[styles.header, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={[styles.backText, { color: palette.accentTeal }]}>← BACK</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.headerTitle, { color: palette.primaryText }]}>💬 Live Speech Captions</Text>
        <View style={styles.fontSizeControls}>
          <TouchableOpacity
            onPress={() => setFontSize((s) => Math.max(18, s - 4))}
            style={[styles.sizeBtn, { backgroundColor: palette.accentLight }]}
          >
            <Text style={[styles.sizeBtnText, { color: palette.accentTeal }]}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFontSize((s) => Math.min(36, s + 4))}
            style={[styles.sizeBtn, { backgroundColor: palette.accentLight }]}
          >
            <Text style={[styles.sizeBtnText, { color: palette.accentTeal }]}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STATUS BAR */}
      <View style={[styles.statusBar, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.liveIndicator}>
          <View style={[styles.pulsingDot, { backgroundColor: palette.accentTeal }]} />
          <Text style={[styles.statusText, { color: palette.accentTeal }]}>
            {isTranscribing ? 'MICROPHONE ACTIVE • TRANSCRIBING' : 'PAUSED'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setTranscripts([])}
          style={styles.clearBtn}
        >
          <Text style={[styles.clearBtnText, { color: palette.secondaryText }]}>CLEAR</Text>
        </TouchableOpacity>
      </View>

      {/* CAPTIONS STREAM */}
      <ScrollView contentContainerStyle={styles.captionsStream} showsVerticalScrollIndicator={false}>
        {transcripts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: palette.accentLight }]}>
              <Text style={{ fontSize: 32 }}>🎙️</Text>
            </View>
            <Text style={[styles.emptyText, { color: palette.primaryText }]}>Listening for speech nearby...</Text>
            <Text style={[styles.emptySubtext, { color: palette.secondaryText }]}>
              Spoken sentences appear here in real time.
            </Text>
          </View>
        ) : (
          transcripts.map((item, index) => (
            <View
              key={index}
              style={[
                styles.captionBubble,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                  borderLeftColor: palette.accentTeal,
                },
              ]}
            >
              <View style={styles.captionHeader}>
                <Text style={[styles.speakerLabel, { color: palette.accentTeal }]}>{item.speaker}</Text>
                <Text style={[styles.timeLabel, { color: palette.secondaryText }]}>{item.time}</Text>
              </View>
              <Text style={[styles.captionText, { fontSize, color: palette.primaryText, lineHeight: fontSize * 1.35 }]}>
                {item.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* SIMULATION TRAY */}
      <View style={[styles.testTray, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.trayLabel, { color: palette.secondaryText }]}>TEST SPEECH INPUT (SIMULATION):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trayChips}>
          <TouchableOpacity
            onPress={() => addSimulatedPhrase('Excuse me, where is the main entrance?')}
            style={[styles.demoChip, { backgroundColor: palette.background, borderColor: palette.accentTeal }]}
          >
            <Text style={[styles.demoChipText, { color: palette.primaryText }]}>"Where is the entrance?"</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => addSimulatedPhrase('Your order number 404 is ready.')}
            style={[styles.demoChip, { backgroundColor: palette.background, borderColor: palette.accentTeal }]}
          >
            <Text style={[styles.demoChipText, { color: palette.primaryText }]}>"Order 404 is ready"</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => addSimulatedPhrase('Please wait here for assistance.')}
            style={[styles.demoChip, { backgroundColor: palette.background, borderColor: palette.accentTeal }]}
          >
            <Text style={[styles.demoChipText, { color: palette.primaryText }]}>"Please wait here"</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  backText: {
    fontWeight: '800',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  fontSizeControls: {
    flexDirection: 'row',
    gap: 6,
  },
  sizeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sizeBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  captionsStream: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  captionBubble: {
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
  },
  captionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  speakerLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  timeLabel: {
    fontSize: 12,
  },
  captionText: {
    fontWeight: '600',
  },
  testTray: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  trayLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  trayChips: {
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
});
