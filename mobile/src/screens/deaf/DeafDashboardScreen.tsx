import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useSoundClassifier } from '../../hooks/useSoundClassifier';
import { AccessibleButton } from '../../components/AccessibleButton';
import { Colors } from '../../theme/colors';

interface DeafDashboardProps {
  onNavigateToCaptions: () => void;
  onNavigateToSoundAlerts: () => void;
  onSwitchMode: () => void;
}

export const DeafDashboardScreen: React.FC<DeafDashboardProps> = ({
  onNavigateToCaptions,
  onNavigateToSoundAlerts,
  onSwitchMode,
}) => {
  const { triggerSos } = useAccessibility();
  const { currentDecibels, activeAlert, startMonitoring } = useSoundClassifier();

  useEffect(() => {
    startMonitoring();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🧏 Hearing Assistant</Text>
          <Text style={styles.statusText}>Visual Radar & Sound Monitoring Active</Text>
        </View>

        {/* ACTIVE SOUND ALERT BANNER IF DETECTED */}
        {activeAlert && (
          <View
            style={[
              styles.alertBanner,
              activeAlert.severity === 'danger' ? styles.alertDanger : styles.alertWarning,
            ]}
          >
            <Text style={styles.alertIcon}>🚨</Text>
            <View style={styles.alertTextGroup}>
              <Text style={styles.alertTitle}>{activeAlert.name.toUpperCase()} DETECTED</Text>
              <Text style={styles.alertDetails}>
                Sound Level: {activeAlert.decibels} dB • Confidence: {Math.round(activeAlert.confidence * 100)}%
              </Text>
            </View>
          </View>
        )}

        {/* LIVE AMBIENT SOUND RADAR CARD */}
        <View style={styles.radarCard}>
          <View style={styles.radarHeader}>
            <Text style={styles.radarTitle}>AMBIENT SOUND RADAR</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LISTENING</Text>
            </View>
          </View>

          <View style={styles.dbMeterContainer}>
            <Text style={styles.dbNumber}>{currentDecibels}</Text>
            <Text style={styles.dbUnit}>dB</Text>
          </View>

          <View style={styles.dbBarBackground}>
            <View
              style={[
                styles.dbBarFill,
                { width: `${Math.min(100, (currentDecibels / 100) * 100)}%` },
                currentDecibels > 75 ? styles.dbBarHigh : styles.dbBarNormal,
              ]}
            />
          </View>
          <Text style={styles.dbLegend}>Normal Ambient (40–60 dB) • Warning Level (&gt;75 dB)</Text>
        </View>

        {/* PRIMARY ACTION CARDS */}
        <View style={styles.actionsGrid}>
          <AccessibleButton
            title="💬 Live Conversation Captions"
            accessibilityHint="Opens continuous speech to text live transcription"
            size="large"
            variant="teal"
            onPress={onNavigateToCaptions}
          />

          <AccessibleButton
            title="🔔 Environmental Sound Alerts"
            accessibilityHint="View detected sirens, horns, alarms, and door knocks"
            size="large"
            variant="secondary"
            onPress={onNavigateToSoundAlerts}
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
          <Text style={styles.switchModeText}>🔄 Switch to Visual Assistance / Guardian</Text>
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
    color: Colors.deafBorder,
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    marginTop: 4,
    fontWeight: '600',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  alertDanger: {
    backgroundColor: Colors.emergencySurface,
    borderColor: Colors.danger,
  },
  alertWarning: {
    backgroundColor: '#382806',
    borderColor: Colors.warning,
  },
  alertIcon: {
    fontSize: 30,
    marginRight: 12,
  },
  alertTextGroup: {
    flex: 1,
  },
  alertTitle: {
    color: Colors.textHighEmphasis,
    fontSize: 17,
    fontWeight: '800',
  },
  alertDetails: {
    color: Colors.textMediumEmphasis,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  radarCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    marginBottom: 20,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radarTitle: {
    color: Colors.deafBorder,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.deafSurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.deafBorder,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.deafBorder,
    marginRight: 6,
  },
  liveText: {
    color: Colors.textHighEmphasis,
    fontSize: 12,
    fontWeight: '700',
  },
  dbMeterContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 14,
  },
  dbNumber: {
    fontSize: 60,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
  },
  dbUnit: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.deafBorder,
    marginLeft: 6,
  },
  dbBarBackground: {
    height: 12,
    backgroundColor: Colors.surfaceInteractive,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dbBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  dbBarNormal: {
    backgroundColor: Colors.deafPrimary,
  },
  dbBarHigh: {
    backgroundColor: Colors.danger,
  },
  dbLegend: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
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
