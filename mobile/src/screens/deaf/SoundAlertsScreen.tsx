import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSoundClassifier } from '../../hooks/useSoundClassifier';
import { AccessibleButton } from '../../components/AccessibleButton';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

interface SoundAlertsScreenProps {
  onBack?: () => void;
}

export const SoundAlertsScreen: React.FC<SoundAlertsScreenProps> = ({ onBack }) => {
  const { recentEvents, triggerDetection } = useSoundClassifier();

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

  const handleSimulateSound = (
    category: 'siren' | 'car_horn' | 'fire_alarm' | 'doorbell' | 'knock',
    name: string,
    decibels: number,
    severity: 'info' | 'warning' | 'danger'
  ) => {
    triggerDetection({
      category,
      name,
      confidence: 0.96,
      decibels,
      severity,
    });
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'danger':
        return { label: 'CRITICAL', bg: Colors.danger, text: '#FFFFFF' };
      case 'warning':
        return { label: 'WARNING', bg: Colors.warning, text: '#FFFFFF' };
      default:
        return { label: 'INFO', bg: palette.accentLight, text: palette.accentTeal };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: palette.accentTeal }]}>← BACK</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.headerTitle, { color: palette.primaryText }]}>🔔 Environmental Sound Radar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* SIMULATE ENVIRONMENTAL SOUNDS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.accentTeal }]}>SIMULATE ENVIRONMENTAL SOUNDS</Text>
          <Text style={[styles.sectionSubtitle, { color: palette.secondaryText }]}>
            Tap any button to trigger environmental sound detection & customized haptic pattern.
          </Text>
        </View>

        <View style={styles.buttonGrid}>
          <AccessibleButton
            title="🚨 Emergency Siren (88 dB)"
            variant="danger"
            size="normal"
            onPress={() => handleSimulateSound('siren', 'Emergency Vehicle Siren', 88, 'danger')}
          />

          <AccessibleButton
            title="🚗 Car Horn (82 dB)"
            variant="warning"
            size="normal"
            onPress={() => handleSimulateSound('car_horn', 'Loud Car Horn', 82, 'danger')}
          />

          <AccessibleButton
            title="🔥 Fire Alarm (92 dB)"
            variant="danger"
            size="normal"
            onPress={() => handleSimulateSound('fire_alarm', 'Building Fire Alarm', 92, 'danger')}
          />

          <AccessibleButton
            title="🚪 Doorbell (68 dB)"
            variant="teal"
            size="normal"
            onPress={() => handleSimulateSound('doorbell', 'Doorbell Chime', 68, 'info')}
          />

          <AccessibleButton
            title="✊ Door Knock (62 dB)"
            variant="secondary"
            size="normal"
            onPress={() => handleSimulateSound('knock', 'Knock on Door', 62, 'info')}
          />
        </View>

        {/* DETECTED ALERTS FEED */}
        <Text style={[styles.sectionTitle, { color: palette.accentTeal, marginTop: 24 }]}>
          RECENT DETECTIONS ({recentEvents.length})
        </Text>

        {recentEvents.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: palette.accentLight }]}>
              <Text style={{ fontSize: 28 }}>🔔</Text>
            </View>
            <Text style={[styles.emptyText, { color: palette.primaryText }]}>No critical sounds detected yet.</Text>
            <Text style={[styles.emptySubtext, { color: palette.secondaryText }]}>
              Microphone is actively monitoring ambient sound.
            </Text>
          </View>
        ) : (
          recentEvents.map((evt) => {
            const badge = getSeverityBadge(evt.severity);
            return (
              <View
                key={evt.id}
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                    borderLeftColor: palette.accentTeal,
                  },
                ]}
              >
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventName, { color: palette.primaryText }]}>{evt.name}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.eventFooter}>
                  <Text style={[styles.eventMeta, { color: palette.secondaryText }]}>
                    Level: {evt.decibels} dB • Conf: {Math.round(evt.confidence * 100)}%
                  </Text>
                  <Text style={[styles.eventTime, { color: palette.secondaryText }]}>{evt.timestamp}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontWeight: '800',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  buttonGrid: {
    gap: 10,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  eventCard: {
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  eventMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 12,
  },
});
