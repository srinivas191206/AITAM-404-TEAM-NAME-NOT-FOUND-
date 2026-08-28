import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

class TtsService {
  private isSpeaking = false;

  public async speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      language?: string;
      onDone?: () => void;
      interrupt?: boolean;
    }
  ): Promise<void> {
    try {
      if (options?.interrupt !== false) {
        await this.stop();
      }

      this.isSpeaking = true;

      Speech.speak(text, {
        language: options?.language || 'en-US',
        pitch: options?.pitch || 1.0,
        rate: options?.rate || (Platform.OS === 'android' ? 0.95 : 1.0),
        onDone: () => {
          this.isSpeaking = false;
          options?.onDone?.();
        },
        onError: (err) => {
          console.warn('[TTS Error]', err);
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      console.warn('[TTS Exception]', error);
      this.isSpeaking = false;
    }
  }

  public async stop(): Promise<void> {
    try {
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
      }
    } catch (e) {
      // Ignore stop errors
    } finally {
      this.isSpeaking = false;
    }
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }
}

export const ttsService = new TtsService();
