import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLocationContext } from '../context/LocationContext';
import { backendService } from '../services/backendService';
import { outputService } from '../services/outputService';
import { Colors } from '../theme/colors';

export const SosCountdownModal: React.FC = () => {
  const { sosCountdown, cancelSos, userProfile, mode } = useAccessibility();
  const { currentLocation } = useLocationContext();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (sosCountdown !== null) {
      setSecondsRemaining(5);

      outputService.triggerHaptic('critical');

      const interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            dispatchFinalSos();
            return 0;
          }
          outputService.announce(`${prev - 1}`, 'urgent');
          outputService.triggerHaptic('danger');
          return prev - 1;
        });
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      return () => clearInterval(interval);
    }
  }, [sosCountdown]);

  const dispatchFinalSos = async () => {
    outputService.announce('Emergency SOS triggered. Sending location to emergency contacts and guardians.', 'urgent');
    outputService.stopAll();

    const lat = currentLocation?.coords?.latitude || 12.9716;
    const lon = currentLocation?.coords?.longitude || 77.5946;

    await backendService.triggerEmergencySos({
      userId: userProfile.id,
      userName: userProfile.fullName || userProfile.name || 'Assisted User',
      mode: mode,
      latitude: lat,
      longitude: lon,
      triggerType: 'sensor_fall',
      emergencyContacts: userProfile.emergencyContacts || [userProfile.emergencyContact],
      timestamp: new Date().toISOString(),
    });

    cancelSos();
  };

  if (sosCountdown === null) {
    return null;
  }

  return (
    <Modal visible={true} transparent={false} animationType="fade">
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.warningTitle}>⚠️ EMERGENCY DETECTED</Text>
          <Text style={styles.subtitle}>
            Impact sensor triggered. Sending SOS in:
          </Text>

          <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.timerNumber}>{secondsRemaining}</Text>
            <Text style={styles.timerLabel}>SECONDS</Text>
          </Animated.View>

          <Text style={styles.instructions}>
            Tap anywhere on the bar below to CANCEL if you are safe.
          </Text>

          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Cancel Emergency SOS"
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={cancelSos}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>🛑 TAP TO CANCEL SOS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B0707', // Deep Warm Emergency Crimson
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FEF08A',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textHighEmphasis,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: '500',
  },
  timerCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: Colors.danger,
    borderWidth: 4,
    borderColor: '#FEF08A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FAF7F2',
    lineHeight: 88,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: 1.5,
  },
  instructions: {
    fontSize: 16,
    color: '#FEE2E2',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  cancelButton: {
    width: '100%',
    minHeight: 96,
    backgroundColor: '#121110',
    borderColor: '#FEF08A',
    borderWidth: 3,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#FAF7F2',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
