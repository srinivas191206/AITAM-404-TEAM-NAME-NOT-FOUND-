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

interface GuardianDashboardProps {
  onSwitchMode: () => void;
}

export const GuardianDashboardScreen: React.FC<GuardianDashboardProps> = ({ onSwitchMode }) => {
  const { userProfile, updateUserProfile } = useAccessibility();
  const { currentLocation, isInsideSafeZone, distanceFromSafeZoneCenter, setSafeZone } =
    useLocationContext();

  const [radius, setRadius] = useState<number>(userProfile.safeZoneRadiusMeters || 50);

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛡️ Guardian Monitor</Text>
          <Text style={styles.statusText}>Monitoring: {userProfile.name}</Text>
        </View>

        {/* ASSISTED USER TELEMETRY CARD */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <Text style={styles.cardTitle}>LIVE ASSISTED USER STATUS</Text>
            <View
              style={[
                styles.statusBadge,
                isInsideSafeZone ? styles.statusBadgeSafe : styles.statusBadgeBreach,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isInsideSafeZone ? styles.textSafe : styles.textBreach,
                ]}
              >
                {isInsideSafeZone ? '✓ INSIDE SAFE ZONE' : '⚠️ OUT OF SAFE ZONE'}
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>LATITUDE</Text>
              <Text style={styles.metricValue}>
                {currentLocation?.coords?.latitude?.toFixed(5) || '12.97160'}
              </Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>LONGITUDE</Text>
              <Text style={styles.metricValue}>
                {currentLocation?.coords?.longitude?.toFixed(5) || '77.59460'}
              </Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>DIST. FROM CENTER</Text>
              <Text style={styles.metricValue}>
                {distanceFromSafeZoneCenter !== null ? `${distanceFromSafeZoneCenter} m` : '0 m'}
              </Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>GPS ACCURACY</Text>
              <Text style={styles.metricValue}>
                ±{Math.round(currentLocation?.coords?.accuracy || 8)} m
              </Text>
            </View>
          </View>
        </View>

        {/* SAFE ZONE GEOFENCE CONFIGURATOR */}
        <View style={styles.safeZoneCard}>
          <Text style={styles.cardTitle}>CONFIGURABLE SAFE ZONE</Text>
          <Text style={styles.cardSubtitle}>
            Alerts guardian immediately if user steps beyond the configured safe radius.
          </Text>

          <View style={styles.radiusSelector}>
            <Text style={styles.radiusLabel}>SAFE RADIUS: {radius} METERS</Text>
            <View style={styles.radiusChips}>
              {[30, 50, 100, 200, 500].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => handleRadiusChange(r)}
                  style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
                >
                  <Text style={[styles.radiusChipText, radius === r && styles.radiusChipTextActive]}>
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
        <View style={styles.contactsCard}>
          <Text style={styles.cardTitle}>EMERGENCY SMS RECIPIENTS</Text>
          {(userProfile.emergencyContacts || [userProfile.emergencyContact]).map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <Text style={styles.contactName}>{contact.name} ({contact.relation || 'Contact'})</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
          ))}
        </View>

        {/* FOOTER SWITCH MODE */}
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Switch Accessibility Mode"
          accessibilityRole="button"
          onPress={onSwitchMode}
          style={styles.switchModeButton}
        >
          <Text style={styles.switchModeText}>🔄 Switch to Blind / Deaf User Mode</Text>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  telemetryCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: Colors.textHighEmphasis,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginVertical: 6,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeSafe: {
    backgroundColor: '#143820',
  },
  statusBadgeBreach: {
    backgroundColor: '#450A0A',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textSafe: {
    color: '#86EFAC',
  },
  textBreach: {
    color: '#FECACA',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surfaceInteractive,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  metricValue: {
    color: Colors.textHighEmphasis,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  safeZoneCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  radiusSelector: {
    marginVertical: 12,
  },
  radiusLabel: {
    color: Colors.textHighEmphasis,
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
    backgroundColor: Colors.surfaceInteractive,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  radiusChipActive: {
    backgroundColor: Colors.blindPrimary,
    borderColor: Colors.blindBorder,
  },
  radiusChipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  radiusChipTextActive: {
    color: '#121110',
    fontWeight: '800',
  },
  contactsCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  contactItem: {
    backgroundColor: Colors.surfaceInteractive,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  contactName: {
    color: Colors.textHighEmphasis,
    fontSize: 15,
    fontWeight: '700',
  },
  contactPhone: {
    color: Colors.textMediumEmphasis,
    fontSize: 13,
    marginTop: 2,
  },
  switchModeButton: {
    marginTop: 10,
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
