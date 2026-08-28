import { Platform } from 'react-native';
import { CameraFrameResult } from './cameraService';

export type CurrencyDenomination = 10 | 20 | 50 | 100 | 200 | 500 | 2000;

export interface CurrencyVisualProfile {
  denomination: CurrencyDenomination;
  name: string;
  spokenName: string;
  baseColor: string;
}

export interface CurrencyResult {
  currency: 'INR';
  denomination: CurrencyDenomination | null;
  confidence: number;
  detectedType: 'NOTE' | 'COIN' | 'UNKNOWN';
  spokenText: string;
  model: string;
}

export interface CurrencyProcessingResult {
  success: boolean;
  message: string;
  currencyResult?: CurrencyResult;
  inferenceTimeMs: number;
  error?: string;
}

export const INR_DENOMINATIONS: Record<CurrencyDenomination, CurrencyVisualProfile> = {
  10: {
    denomination: 10,
    name: '₹10',
    spokenName: 'ten rupee note',
    baseColor: 'Chocolate Brown',
  },
  20: {
    denomination: 20,
    name: '₹20',
    spokenName: 'twenty rupee note',
    baseColor: 'Greenish Yellow',
  },
  50: {
    denomination: 50,
    name: '₹50',
    spokenName: 'fifty rupee note',
    baseColor: 'Fluorescent Blue',
  },
  100: {
    denomination: 100,
    name: '₹100',
    spokenName: 'one hundred rupee note',
    baseColor: 'Lavender',
  },
  200: {
    denomination: 200,
    name: '₹200',
    spokenName: 'two hundred rupee note',
    baseColor: 'Bright Yellow',
  },
  500: {
    denomination: 500,
    name: '₹500',
    spokenName: 'five hundred rupee note',
    baseColor: 'Stone Grey',
  },
  2000: {
    denomination: 2000,
    name: '₹2000',
    spokenName: 'two thousand rupee note',
    baseColor: 'Magenta',
  },
};

/**
 * Currency Recognition Service powered EXCLUSIVELY by Rathnavelu/indian-currency-cnn-yolo
 * MobileNetV3-Small CNN (100% test accuracy) + YOLOv8-nano (98.28% mAP@50)
 */
class CurrencyService {
  private isProcessing: boolean = false;

  private getCurrencyServiceUrl(): string {
    const host = Platform.OS === 'android' ? '10.0.2.2' : '10.204.134.150';
    return `http://${host}:5001/currency`;
  }

  /**
   * Primary inference using Rathnavelu/indian-currency-cnn-yolo
   */
  public async recognizeCurrency(frame: CameraFrameResult): Promise<CurrencyProcessingResult> {
    const startTime = Date.now();

    if (!frame || !frame.base64) {
      return {
        success: false,
        message: "I couldn't capture the note clearly. Please point your camera directly at the currency and try again.",
        inferenceTimeMs: 0,
        error: 'invalid_frame',
      };
    }

    try {
      this.isProcessing = true;

      const endpoints = [
        'http://10.204.134.150:5001/currency',
        'http://10.0.2.2:5001/currency',
        'http://localhost:5001/currency',
      ];

      let data: any = null;
      for (const ep of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const response = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: frame.base64 }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (epErr) {
          // try next
        }
      }

      if (!data) {
        throw new Error('Currency service endpoints unreachable');
      }

      const inferenceTimeMs = Date.now() - startTime;

      if (data && data.success && data.detected && data.value) {
        const val = data.value as CurrencyDenomination;
        const profile = INR_DENOMINATIONS[val];
        const spoken = profile ? profile.spokenName : `${val} rupee note`;
        const spokenText = `Identified Indian currency note: ${data.denomination || `₹${val}`} (${spoken}).`;

        const currencyResult: CurrencyResult = {
          currency: 'INR',
          denomination: val,
          confidence: data.confidence || 0.95,
          detectedType: 'NOTE',
          spokenText,
          model: 'Rathnavelu/indian-currency-cnn-yolo',
        };

        return {
          success: true,
          message: spokenText,
          currencyResult,
          inferenceTimeMs,
        };
      }

      const notFoundMessage = data.message || "I couldn't identify any Indian currency note in view. Please point directly at the note.";
      return {
        success: false,
        message: notFoundMessage,
        inferenceTimeMs,
        error: 'currency_not_detected',
      };
    } catch (err) {
      console.error('[CurrencyService] Rathnavelu model error:', err);
      const inferenceTimeMs = Date.now() - startTime;
      return {
        success: false,
        message: "I couldn't recognize the currency note. Please ensure good lighting and try again.",
        inferenceTimeMs,
        error: String(err),
      };
    } finally {
      this.isProcessing = false;
    }
  }

  public async identifyCurrency(frame: CameraFrameResult): Promise<CurrencyProcessingResult> {
    return this.recognizeCurrency(frame);
  }

  public getIsProcessing(): boolean {
    return this.isProcessing;
  }
}

export const currencyService = new CurrencyService();
