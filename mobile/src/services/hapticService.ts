import * as Haptics from 'expo-haptics';
import { Vibration, Platform } from 'react-native';

class HapticService {
  /**
   * Light haptic feedback for user taps & navigation steps
   */
  public async light(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Vibration.vibrate(40);
    }
  }

  /**
   * Medium haptic feedback for mode confirmations & menu items
   */
  public async medium(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Vibration.vibrate(80);
    }
  }

  /**
   * Heavy haptic feedback for alerts & obstacles
   */
  public async heavy(): Promise<void> {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      Vibration.vibrate(150);
    }
  }

  /**
   * Success feedback pattern (Short double tap)
   */
  public async success(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Vibration.vibrate([0, 50, 50, 50]);
    }
  }

  /**
   * Error feedback pattern (Distinct short haptic buzz)
   */
  public async error(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      Vibration.vibrate([0, 100, 50, 100]);
    }
  }

  /**
   * Warning / Obstacle Pattern: Double medium buzz
   */
  public async warning(): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      Vibration.vibrate([0, 150, 100, 150]);
    }
  }

  /**
   * Danger / Siren Pattern: Continuous urgent pulsing
   */
  public danger(): void {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 250, 100, 250, 100, 400], false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  /**
   * SOS Emergency Pattern: Continuous heartbeat pulse
   */
  public startSosPulse(): void {
    Vibration.vibrate([0, 400, 200, 400, 200, 800], true);
  }

  public stopVibration(): void {
    Vibration.cancel();
  }
}

export const hapticService = new HapticService();
