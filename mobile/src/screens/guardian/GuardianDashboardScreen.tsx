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
import { AccessibleButton } from '../../components/AccessibleButton';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

interface GuardianDashboardProps {
  onSwitchMode?: () => void;
}

export const GuardianDashboardScreen: React.FC<GuardianDashboardProps> = ({ onSwitchMode }) => {
  const { userProfile, updateUserProfile } = useAccessibility();
  const { currentLocation, isInsideSafeZone, distanceFromSafeZoneCenter, setSafeZone } =
    useLocationContext();

  const [radius, setRadius] = useState<number>(userProfile.safeZoneRadiusMeters || 50);

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

  const handleSetCurrentAsSafeCenter = () => {
    if (currentLocation) {
      setSafeZone(currentLocation.coords.latitude, currentLocation.coords.longitude, radius);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    updateUserProfile({ safeZoneRadiusMeters: newRadius });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: palette.primaryText }]}>🛡️ Guardian Monitor</Text>
          <Text style={[styles.statusText, { color: palette.secondaryText }]}>
            Monitoring: {userProfile.name || userProfile.fullName || 'Assisted User'}
          </Text>
        </View>

        {/* ASSISTED USER TELEMETRY CARD */}
        <View style={[styles.telemetryCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.telemetryHeader}>
            <Text style={[styles.cardTitle, { color: palette.accentTeal }]}>LIVE ASSISTED USER STATUS</Text>
            <View
              style={[
                styles.statusBadge,
                isInsideSafeZone
                  ? { backgroundColor: palette.accentLight }
                  : { backgroundColor: '#FEF2F2' },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isInsideSafeZone
                    ? { color: palette.accentTeal }
                    : { color: '#EF4444' },
                ]}
              >
                {isInsideSafeZone ? '✓ INSIDE SAFE ZONE' : '⚠️ OUT OF SAFE ZONE'}
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={[styles.metricBox, { backgroundColor: '#F4FBFB', borderColor: palette.border }]}>
              <Text style={[styles.metricLabel, { color: palette.secondaryText }]}>LATITUDE</Text>
              <Text style={[styles.metricValue, { color: palette.primaryText }]}>
                {currentLocation?.coords?.latitude?.toFixed(5) || '12.97160'}
              </Text>
            </View>

            <View style={[styles.metricBox, { backgroundColor: '#F4FBFB', borderColor: palette.border }]}>
              <Text style={[styles.metricLabel, { color: palette.secondaryText }]}>LONGITUDE</Text>
              <Text style={[styles.metricValue, { color: palette.primaryText }]}>
                {currentLocation?.coords?.longitude?.toFixed(5) || '77.59460'}
              </Text>
            </View>

            <View style={[styles.metricBox, { backgroundColor: '#F4FBFB', borderColor: palette.border }]}>
              <Text style={[styles.metricLabel, { color: palette.secondaryText }]}>DIST. FROM CENTER</Text>
              <Text style={[styles.metricValue, { color: palette.primaryText }]}>
                {distanceFromSafeZoneCenter !== null ? `${distanceFromSafeZoneCenter} m` : '0 m'}
              </Text>
            </View>

            <View style={[styles.metricBox, { backgroundColor: '#F4FBFB', borderColor: palette.border }]}>
              <Text style={[styles.metricLabel, { color: palette.secondaryText }]}>GPS ACCURACY</Text>
              <Text style={[styles.metricValue, { color: palette.primaryText }]}>
                ±{Math.round(currentLocation?.coords?.accuracy || 8)} m
              </Text>
            </View>
          </View>
        </View>

        {/* SAFE ZONE GEOFENCE CONFIGURATOR */}
        <View style={[styles.safeZoneCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.accentTeal }]}>CONFIGURABLE SAFE ZONE</Text>
          <Text style={[styles.cardSubtitle, { color: palette.secondaryText }]}>
            Alerts guardian immediately if user steps beyond the configured safe radius.
          </Text>

          <View style={styles.radiusSelector}>
            <Text style={[styles.radiusLabel, { color: palette.primaryText }]}>SAFE RADIUS: {radius} METERS</Text>
            <View style={styles.radiusChips}>
              {[30, 50, 100, 200, 500].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => handleRadiusChange(r)}
                  style={[
                    styles.radiusChip,
                    radius === r
                      ? { backgroundColor: palette.accentTeal, borderColor: palette.accentTeal }
                      : { backgroundColor: palette.background, borderColor: palette.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      { color: radius === r ? '#FFFFFF' : palette.primaryText },
                    ]}
                  >
                    {r}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <AccessibleButton
            title="📍 Set Current Location as Safe Center"
            variant="secondary"
            size="normal"
            onPress={handleSetCurrentAsSafeCenter}
          />
        </View>

        {/* EMERGENCY CONTACTS LIST */}
        <View style={[styles.contactsCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.accentTeal }]}>EMERGENCY SMS RECIPIENTS</Text>
          {(userProfile.emergencyContacts || [userProfile.emergencyContact]).map((contact, i) => (
            <View key={contact?.id || i} style={[styles.contactItem, { backgroundColor: '#F4FBFB', borderColor: palette.border }]}>
              <Text style={[styles.contactName, { color: palette.primaryText }]}>
                {contact?.name || 'Contact'} ({contact?.relation || contact?.relationship || 'Family'})
              </Text>
              <Text style={[styles.contactPhone, { color: palette.secondaryText }]}>
                {contact?.phone || contact?.phoneNumber || 'Not provided'}
              </Text>
            </View>
          ))}
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
              🔄 Switch Mode (Visual / Hearing)
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
  content: {
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
  telemetryCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#0F9D9A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cardSubtitle: {
    fontSize: 13,
    marginVertical: 6,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  safeZoneCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  radiusSelector: {
    marginVertical: 12,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  radiusChips: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  contactsCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  contactItem: {
    padding: 12,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
  },
  contactPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  switchModeButton: {
    marginTop: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  switchModeText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
