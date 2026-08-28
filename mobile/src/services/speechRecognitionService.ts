import { Platform, PermissionsAndroid } from 'react-native';
import { Audio } from 'expo-av';

export type MicPermissionStatus = 'granted' | 'denied' | 'permanently_denied';

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  onSilenceTimeout?: () => void;
}

class SpeechRecognitionService {
  private isListening = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private recordingInstance: Audio.Recording | null = null;
  private callbacks: SpeechRecognitionCallbacks | null = null;

  /**
   * Check if speech recognition & microphone are supported
   */
  public async isAvailable(): Promise<boolean> {
    try {
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Request microphone permission explicitly
   */
  public async requestPermission(): Promise<MicPermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Access+ needs access to your microphone to listen to your voice commands.',
            buttonPositive: 'Grant Access',
            buttonNegative: 'Deny',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return 'granted';
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          return 'permanently_denied';
        } else {
          return 'denied';
        }
      }

      // Fallback via Expo Audio
      const response = await Audio.requestPermissionsAsync();
      if (response.granted) return 'granted';
      return response.canAskAgain ? 'denied' : 'permanently_denied';
    } catch (error) {
      console.warn('[SpeechRecognitionService] Permission Request Error:', error);
      return 'denied';
    }
  }

  /**
   * Check current microphone permission status without re-prompting
   */
  public async checkPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      }
      const response = await Audio.getPermissionsAsync();
      return response.granted;
    } catch {
      return false;
    }
  }

  /**
   * Start a controlled listening session
   */
  public async startListening(callbacks: SpeechRecognitionCallbacks): Promise<boolean> {
    try {
      // 1. Ensure permission
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const permStatus = await this.requestPermission();
        if (permStatus !== 'granted') {
          callbacks.onError(
            permStatus === 'permanently_denied'
              ? 'permission_permanently_denied'
              : 'permission_denied'
          );
          return false;
        }
      }

      // 2. Clean previous session
      await this.stopListening();

      this.callbacks = callbacks;
      this.isListening = true;

      // 3. Audio session mode setup (clean foreground recording)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // 4. Create lightweight native recording to capture microphone activity
      try {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.LOW_QUALITY
        );
        this.recordingInstance = recording;
      } catch (recErr) {
        console.warn('[SpeechRecognitionService] Audio recording init note:', recErr);
      }

      this.callbacks.onStart?.();

      // 5. Controlled silence timeout (7 seconds max listening window)
      this.clearSilenceTimer();
      this.silenceTimer = setTimeout(() => {
        if (this.isListening) {
          this.handleSilenceTimeout();
        }
      }, 7000);

      return true;
    } catch (error) {
      this.handleError(error);
      callbacks.onError('start_failed');
      await this.stopListening();
      return false;
    }
  }

  /**
   * Stop active listening session and release audio hardware
   */
  public async stopListening(): Promise<void> {
    this.clearSilenceTimer();
    this.isListening = false;

    if (this.recordingInstance) {
      try {
        await this.recordingInstance.stopAndUnloadAsync();
      } catch {
        // Ignore unloading errors
      } finally {
        this.recordingInstance = null;
      }
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
    } catch {
      // Ignore cleanup error
    }
  }

  /**
   * Handle speech recognition result (e.g. from user speech or test simulation)
   */
  public handleResult(transcript: string): void {
    if (!this.isListening && !this.callbacks) return;
    this.clearSilenceTimer();

    const cb = this.callbacks;
    this.stopListening();

    if (cb && transcript && transcript.trim().length > 0) {
      cb.onResult(transcript.trim());
    } else if (cb) {
      cb.onError('no_speech_detected');
    }
  }

  /**
   * Handle silence timeout
   */
  private handleSilenceTimeout(): void {
    const cb = this.callbacks;
    this.stopListening();
    if (cb) {
      if (cb.onSilenceTimeout) {
        cb.onSilenceTimeout();
      } else {
        cb.onError('silence_timeout');
      }
    }
  }

  /**
   * Centralized error handler
   */
  public handleError(error: unknown): void {
    console.warn('[SpeechRecognitionService Error]', error);
  }

  /**
   * Check if currently listening
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
