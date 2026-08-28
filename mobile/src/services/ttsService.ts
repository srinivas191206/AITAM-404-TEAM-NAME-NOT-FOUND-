import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface TtsOptions {
  rate?: number;
  pitch?: number;
  language?: string;
  onDone?: () => void;
  onError?: (error: Error | string) => void;
  interrupt?: boolean;
}

class TTSService {
  private isSpeaking = false;
  private currentLanguage = 'en-US';

  /**
   * Set default language for spoken output
   */
  public setLanguage(langCode: string): void {
    if (!langCode) return;
    if (langCode === 'en') this.currentLanguage = 'en-US';
    else if (langCode === 'te') this.currentLanguage = 'te-IN';
    else if (langCode === 'hi') this.currentLanguage = 'hi-IN';
    else if (langCode === 'ta') this.currentLanguage = 'ta-IN';
    else if (langCode === 'es') this.currentLanguage = 'es-ES';
    else if (langCode === 'fr') this.currentLanguage = 'fr-FR';
    else this.currentLanguage = langCode;
  }

  /**
   * Check if native TTS engine is available
   */
  public async isAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return typeof window !== 'undefined' && 'speechSynthesis' in window;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Speak text aloud using native speech synthesis
   */
  public async speak(text: string, options?: TtsOptions): Promise<void> {
    if (!text || text.trim().length === 0) return;

    try {
      if (options?.interrupt !== false) {
        await this.stop();
      }

      this.isSpeaking = true;
      const targetLang = options?.language || this.currentLanguage;

      Speech.speak(text, {
        language: targetLang,
        pitch: options?.pitch || 1.0,
        rate: options?.rate || (Platform.OS === 'android' ? 0.95 : 1.0),
        onDone: () => {
          this.isSpeaking = false;
          options?.onDone?.();
        },
        onError: (err) => {
          this.isSpeaking = false;
          this.handleError(err);
          options?.onError?.(err);
        },
        onStopped: () => {
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      this.isSpeaking = false;
      this.handleError(error);
      options?.onError?.(error instanceof Error ? error : String(error));
    }
  }

  /**
   * Stop any active speech immediately
   */
  public async stop(): Promise<void> {
    try {
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
      }
    } catch (e) {
      // Ignore stop exceptions
    } finally {
      this.isSpeaking = false;
    }
  }

  /**
   * Get current speaking activity state
   */
  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }

  /**
   * Centralized error logger
   */
  public handleError(error: unknown): void {
    console.warn('[TTSService Error]', error);
  }
}

export const ttsService = new TTSService();
