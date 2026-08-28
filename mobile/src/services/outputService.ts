import { ttsService } from './ttsService';
import { hapticService } from './hapticService';
import { AlertSeverity } from '../types';

export interface VisualAlertPayload {
  title: string;
  message: string;
  severity: AlertSeverity;
  category?: string;
  timestamp: string;
}

type AlertListener = (alert: VisualAlertPayload) => void;

class OutputService {
  private alertListeners: Set<AlertListener> = new Set();

  /**
   * Adaptive speech announcement (Visual Assistance Primary)
   */
  public async announce(text: string, priority: 'normal' | 'high' | 'urgent' = 'normal'): Promise<void> {
    if (priority === 'urgent') {
      await ttsService.speak(text, { pitch: 1.1, rate: 1.05, interrupt: true });
    } else {
      await ttsService.speak(text, { interrupt: priority === 'high' });
    }
  }

  /**
   * Adaptive haptic trigger based on severity
   */
  public async triggerHaptic(severity: AlertSeverity): Promise<void> {
    switch (severity) {
      case 'info':
        await hapticService.light();
        break;
      case 'warning':
        await hapticService.warning();
        break;
      case 'danger':
        hapticService.danger();
        break;
      case 'critical':
        hapticService.startSosPulse();
        break;
      default:
        await hapticService.medium();
    }
  }

  /**
   * Visual alert broadcast (Hearing Assistance Primary)
   */
  public broadcastVisualAlert(alert: VisualAlertPayload): void {
    this.alertListeners.forEach((listener) => listener(alert));
    this.triggerHaptic(alert.severity);
  }

  public subscribeVisualAlerts(listener: AlertListener): () => void {
    this.alertListeners.add(listener);
    return () => {
      this.alertListeners.delete(listener);
    };
  }

  /**
   * Stop all active speech & haptic vibrations
   */
  public async stopAll(): Promise<void> {
    await ttsService.stop();
    hapticService.stopVibration();
  }
}

export const outputService = new OutputService();
