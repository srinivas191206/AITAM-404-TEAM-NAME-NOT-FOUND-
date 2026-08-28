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

interface SoundAlertsScreenProps {
  onBack: () => void;
}

export const SoundAlertsScreen: React.FC<SoundAlertsScreenProps> = ({ onBack }) => {
  const { recentEvents, triggerDetection } = useSoundClassifier();

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
        return { label: 'CRITICAL', bg: Colors.danger, text: '#FAF7F2' };
      case 'warning':
        return { label: 'WARNING', bg: Colors.warning, text: '#121110' };
      default:
        return { label: 'INFO', bg: Colors.surfaceInteractive, text: Colors.textHighEmphasis };
    }
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
        <Text style={styles.headerTitle}>🔔 Sound Alerts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SIMULATE ENVIRONMENTAL SOUNDS */}
        <Text style={styles.sectionTitle}>SIMULATE ENVIRONMENTAL SOUNDS</Text>
        <Text style={styles.sectionSubtitle}>
          Tap any button to trigger environmental sound detection & customized haptic pattern.
        </Text>

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
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          RECENT DETECTIONS ({recentEvents.length})
        </Text>

        {recentEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No critical sounds detected yet.</Text>
            <Text style={styles.emptySubtext}>Microphone is actively monitoring in the background.</Text>
          </View>
        ) : (
          recentEvents.map((evt) => {
            const badge = getSeverityBadge(evt.severity);
            return (
              <View key={evt.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventName}>{evt.name}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.eventFooter}>
                  <Text style={styles.eventMeta}>
                    Level: {evt.decibels} dB • Conf: {Math.round(evt.confidence * 100)}%
                  </Text>
                  <Text style={styles.eventTime}>{evt.timestamp}</Text>
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
    backgroundColor: Colors.canvasPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 12,
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.deafBorder,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  buttonGrid: {
    gap: 8,
  },
  emptyCard: {
    backgroundColor: Colors.surfaceElevated,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  emptyText: {
    color: Colors.textHighEmphasis,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.deafBorder,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    color: Colors.textHighEmphasis,
    fontSize: 17,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
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
    color: Colors.textMediumEmphasis,
    fontSize: 13,
    fontWeight: '600',
  },
  eventTime: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
