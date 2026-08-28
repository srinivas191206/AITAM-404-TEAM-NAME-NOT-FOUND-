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
import { hapticService } from '../../services/hapticService';
import { outputService } from '../../services/outputService';

interface HearingDashboardShellProps {
  onOpenSettings: () => void;
}

export const HearingDashboardShell: React.FC<HearingDashboardShellProps> = ({
  onOpenSettings,
}) => {
  const [feedbackNote, setFeedbackNote] = useState<string>(
    'Speech captions & sound monitoring will be connected in future phases.'
  );

  const handleTriggerHapticDemo = async (type: string) => {
    await hapticService.warning();
    setFeedbackNote(`Simulated ${type} haptic vibration triggered.`);
    outputService.broadcastVisualAlert({
      title: `${type} Test`,
      message: 'Haptic pattern verified.',
      severity: 'warning',
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>🧏 Hearing Assistant</Text>
            <Text style={styles.headerSubtitle}>Visual Radar & Live Captions</Text>
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

        {/* PLACEHOLDER 1: LIVE CAPTIONS CONTAINER */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💬 LIVE SPEECH CAPTIONS</Text>
            <View style={styles.badgeTeal}>
              <Text style={styles.badgeTextTeal}>SHELL READY</Text>
            </View>
          </View>
          <Text style={styles.placeholderBody}>
            "Spoken conversations will appear here continuously with large, high-contrast readable typography."
          </Text>
          <AccessibleButton
            title="Open Live Captions View"
            size="normal"
            variant="teal"
            onPress={() => setFeedbackNote('Live Captions screen connected to speech engine in Phase 4.')}
          />
        </View>

        {/* PLACEHOLDER 2: ENVIRONMENTAL SOUND RADAR */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔔 ENVIRONMENTAL SOUND RADAR</Text>
            <View style={styles.badgeAmber}>
              <Text style={styles.badgeTextAmber}>PASSIVE RADAR</Text>
            </View>
          </View>
          <Text style={styles.placeholderBody}>
            Ambient sound level, sirens, car horns, fire alarms, and door knocks will be displayed here with multi-sensory color & vibration patterns.
          </Text>

          <View style={styles.hapticDemoRow}>
            <AccessibleButton
              title="🚨 Test Siren Haptic"
              size="normal"
              variant="danger"
              style={styles.halfBtn}
              onPress={() => handleTriggerHapticDemo('Emergency Siren')}
            />
            <AccessibleButton
              title="🚗 Test Horn Haptic"
              size="normal"
              variant="warning"
              style={styles.halfBtn}
              onPress={() => handleTriggerHapticDemo('Car Horn')}
            />
          </View>
        </View>

        {/* PLACEHOLDER 3: HAPTIC & SENSOR STATUS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ HAPTIC SYSTEM STATUS</Text>
            <Text style={styles.statusOkText}>ACTIVE ✓</Text>
          </View>
          <Text style={styles.placeholderBody}>
            Physical device vibration actuator configured for distinct alert rhythms.
          </Text>
        </View>

        {/* EMERGENCY SOS BUTTON */}
        <AccessibleButton
          title="🚨 EMERGENCY SOS"
          size="large"
          variant="danger"
          accessibilityHint="Triggers emergency SOS dispatch"
          onPress={() => {
            hapticService.danger();
            setFeedbackNote('Emergency SOS triggered: 5s countdown modal will dispatch Twilio SMS.');
          }}
        />
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
    color: Colors.deafBorder,
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
    color: Colors.deafBorder,
    letterSpacing: 0.5,
  },
  badgeTeal: {
    backgroundColor: Colors.deafSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.deafBorder,
  },
  badgeTextTeal: {
    color: Colors.deafBorder,
    fontSize: 10,
    fontWeight: '800',
  },
  badgeAmber: {
    backgroundColor: Colors.blindSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.blindBorder,
  },
  badgeTextAmber: {
    color: Colors.blindPrimary,
    fontSize: 10,
    fontWeight: '800',
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
    marginBottom: Spacing.md,
  },
  hapticDemoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfBtn: {
    flex: 1,
  },
});
