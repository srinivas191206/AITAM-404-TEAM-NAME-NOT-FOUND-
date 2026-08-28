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
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AccessibleButton } from '../../components/AccessibleButton';

interface GuardianDashboardShellProps {
  onOpenSettings: () => void;
}

export const GuardianDashboardShell: React.FC<GuardianDashboardShellProps> = ({
  onOpenSettings,
}) => {
  const [feedbackNote, setFeedbackNote] = useState<string>(
    'Guardian telemetry & safe-zone monitoring will connect in Phase 6.'
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>🛡️ Guardian Monitor</Text>
            <Text style={styles.headerSubtitle}>Assisted User: Connected Device</Text>
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

        {/* FEEDBACK STATUS BANNER */}
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{feedbackNote}</Text>
        </View>

        {/* PLACEHOLDER 1: ASSISTED USER STATUS & TELEMETRY */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>LIVE ASSISTED USER STATUS</Text>
            <View style={styles.badgeSafe}>
              <Text style={styles.badgeTextSafe}>STATUS: NORMAL</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>LAST UPDATE</Text>
              <Text style={styles.metricValue}>Just now</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>BATTERY</Text>
              <Text style={styles.metricValue}>85%</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>MODE</Text>
              <Text style={styles.metricValue}>Assisted</Text>
            </View>
          </View>
        </View>

        {/* PLACEHOLDER 2: LOCATION & MAP CONTAINER */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📍 GPS LOCATION & SAFE-ZONE</Text>
            <Text style={styles.badgeMuted}>GEOFENCE: 50M</Text>
          </View>

          <View style={styles.mapPlaceholderBox}>
            <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
            <Text style={styles.mapPlaceholderTitle}>Interactive Location Map</Text>
            <Text style={styles.mapPlaceholderDesc}>
              Real-time GPS pin tracking, route paths, and safe-zone circle will render here.
            </Text>
          </View>

          <AccessibleButton
            title="Refresh Live Location"
            size="normal"
            variant="secondary"
            onPress={() => setFeedbackNote('Location polling simulation triggered.')}
          />
        </View>

        {/* PLACEHOLDER 3: EMERGENCY SOS DISPATCH LOG */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚨 SOS BROADCAST STATUS</Text>
            <Text style={styles.statusOkText}>STANDBY ✓</Text>
          </View>
          <Text style={styles.placeholderBody}>
            Direct SMS and push notifications will alert this guardian device instantly when an impact or manual SOS occurs.
          </Text>
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
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    fontWeight: '500',
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
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statusText: {
    fontSize: 14,
    color: Colors.textHighEmphasis,
    fontWeight: '600',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.5,
  },
  badgeSafe: {
    backgroundColor: '#143820',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTextSafe: {
    color: '#86EFAC',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeMuted: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.surfaceInteractive,
    padding: Spacing.md,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textHighEmphasis,
    marginTop: 4,
  },
  mapPlaceholderBox: {
    backgroundColor: Colors.surfaceInteractive,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.xl,
    alignItems: 'center',
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  mapPlaceholderIcon: {
    fontSize: 40,
    marginBottom: Spacing.xs,
  },
  mapPlaceholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textHighEmphasis,
  },
  mapPlaceholderDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '85%',
    lineHeight: 18,
  },
  statusOkText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  placeholderBody: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    lineHeight: 22,
    fontWeight: '500',
  },
});
