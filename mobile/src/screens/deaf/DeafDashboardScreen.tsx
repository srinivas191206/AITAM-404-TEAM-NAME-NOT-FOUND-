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
import { Spacing } from '../../theme/spacing';

interface DeafDashboardProps {
  onNavigateToCaptions: () => void;
  onNavigateToAlerts?: () => void;
  onSwitchMode?: () => void;
}

export const DeafDashboardScreen: React.FC<DeafDashboardProps> = ({
  onNavigateToCaptions,
  onNavigateToAlerts,
  onSwitchMode,
}) => {
  const { triggerSos } = useAccessibility();
  const { currentDecibels, activeAlert, startMonitoring } = useSoundClassifier();

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
    startMonitoring();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: palette.primaryText }]}>🧏 Hearing Assistant</Text>
          <Text style={[styles.statusText, { color: palette.secondaryText }]}>
            Visual Radar & Live Captions Active
          </Text>
        </View>

        {/* ACTIVE SOUND ALERT BANNER IF DETECTED */}
        {activeAlert ? (
          <View
            style={[
              styles.alertBanner,
              activeAlert.severity === 'danger'
                ? { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }
                : { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
            ]}
          >
            <Text style={styles.alertIcon}>🚨</Text>
            <View style={styles.alertTextGroup}>
              <Text style={[styles.alertTitle, { color: palette.primaryText }]}>
                {activeAlert.name.toUpperCase()} DETECTED
              </Text>
              <Text style={[styles.alertDetails, { color: palette.secondaryText }]}>
                Sound Level: {activeAlert.decibels} dB • Confidence: {Math.round(activeAlert.confidence * 100)}%
              </Text>
            </View>
          </View>
        ) : null}

        {/* LIVE AMBIENT SOUND RADAR CARD */}
        <View style={[styles.radarCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.radarHeader}>
            <Text style={[styles.radarTitle, { color: palette.accentTeal }]}>AMBIENT SOUND RADAR</Text>
            <View style={[styles.liveIndicator, { backgroundColor: palette.accentLight }]}>
              <View style={[styles.liveDot, { backgroundColor: palette.accentTeal }]} />
              <Text style={[styles.liveText, { color: palette.accentTeal }]}>LISTENING</Text>
            </View>
          </View>

          <View style={styles.dbMeterContainer}>
            <Text style={[styles.dbNumber, { color: palette.primaryText }]}>{currentDecibels}</Text>
            <Text style={[styles.dbUnit, { color: palette.accentTeal }]}>dB</Text>
          </View>

          <View style={[styles.dbBarBackground, { backgroundColor: palette.background }]}>
            <View
              style={[
                styles.dbBarFill,
                { width: `${Math.min(100, (currentDecibels / 100) * 100)}%` },
                currentDecibels > 75
                  ? { backgroundColor: '#EF4444' }
                  : { backgroundColor: palette.accentTeal },
              ]}
            />
          </View>
          <Text style={[styles.dbLegend, { color: palette.secondaryText }]}>
            Normal Ambient (40–60 dB) • Warning Level (&gt;75 dB)
          </Text>
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

          {onNavigateToAlerts ? (
            <AccessibleButton
              title="🔔 Environmental Sound Alerts"
              accessibilityHint="View detected sirens, horns, alarms, and door knocks"
              size="large"
              variant="secondary"
              onPress={onNavigateToAlerts}
            />
          ) : null}

          <AccessibleButton
            title="🚨 Emergency SOS"
            accessibilityHint="Triggers 5-second emergency countdown with Twilio SMS dispatch"
            size="large"
            variant="danger"
            onPress={() => triggerSos('manual')}
          />
        </View>

        {/* FOOTER SWITCH MODE */}
        {onSwitchMode ? (
          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Switch Accessibility Mode"
            accessibilityRole="button"
            onPress={onSwitchMode}
            style={[styles.switchModeButton, { borderColor: palette.border }]}
          >
            <Text style={[styles.switchModeText, { color: palette.secondaryText }]}>
              🔄 Switch Mode (Visual / Guardian)
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statusText: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '400',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  alertIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  alertTextGroup: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  alertDetails: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  radarCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#0F9D9A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radarTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dbMeterContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dbNumber: {
    fontSize: 54,
    fontWeight: '900',
  },
  dbUnit: {
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 6,
  },
  dbBarBackground: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dbBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  dbLegend: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  actionsGrid: {
    gap: 10,
  },
  switchModeButton: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  switchModeText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
