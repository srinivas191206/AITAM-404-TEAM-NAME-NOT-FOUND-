import { Platform, PermissionsAndroid } from 'react-native';
import { Audio } from 'expo-av';
import { groqVisionService } from './groqVisionService';

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
    return true;
  }

  /**
   * Request microphone permission explicitly via both Expo Audio and Android Native Permissions
   */
  public async requestPermission(): Promise<MicPermissionStatus> {
    try {
      // 1. Request via Expo Audio
      const expoRes = await Audio.requestPermissionsAsync();

      // 2. Request via Android Permissions API if Android
      if (Platform.OS === 'android') {
        try {
          const androidRes = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission Needed',
              message: 'Access+ needs microphone access to hear your voice commands.',
              buttonPositive: 'Allow Microphone',
              buttonNegative: 'Deny',
            }
          );
          if (androidRes === PermissionsAndroid.RESULTS.GRANTED && expoRes.granted) {
            return 'granted';
          }
        } catch {
          // If Android Permissions API falls back, rely on Expo Audio
        }
      }

      if (expoRes.granted) return 'granted';
      return expoRes.canAskAgain ? 'denied' : 'permanently_denied';
    } catch (error) {
      console.warn('[SpeechRecognitionService] Permission Request Error:', error);
      return 'denied';
    }
  }

  /**
   * Check current microphone permission status
   */
  public async checkPermission(): Promise<boolean> {
    try {
      const expoStatus = await Audio.getPermissionsAsync();
      if (!expoStatus.granted) return false;

      if (Platform.OS === 'android') {
        const androidStatus = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return androidStatus;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Start a live audio recording session from physical microphone
   */
  public async startListening(callbacks: SpeechRecognitionCallbacks): Promise<boolean> {
    try {
      // 1. Always request permission if not granted
      let hasPermission = await this.checkPermission();
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
        hasPermission = true;
      }

      // 2. Clean previous session
      await this.stopListening();

      this.callbacks = callbacks;
      this.isListening = true;

      // 3. Audio session mode setup for active microphone recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // 4. Create native recording instance to capture microphone input
      try {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        this.recordingInstance = recording;
      } catch (recErr) {
        console.warn('[SpeechRecognitionService] Audio recording init note:', recErr);
      }

      this.callbacks.onStart?.();

      // 5. Silence / Max speech timer (6 seconds window for voice command)
      this.clearSilenceTimer();
      this.silenceTimer = setTimeout(async () => {
        if (this.isListening) {
          await this.stopListeningAndTranscribe();
        }
      }, 6000);

      return true;
    } catch (error) {
      console.warn('[SpeechRecognitionService] Audio recording init error:', error);
      callbacks.onError('start_failed');
      await this.stopListening();
      return false;
    }
  }

  /**
   * Stop recording and transcribe real voice with Groq Whisper Large V3
   */
  public async stopListeningAndTranscribe(): Promise<void> {
    this.clearSilenceTimer();
    this.isListening = false;
    const cb = this.callbacks;

    let recordedUri: string | null = null;

    if (this.recordingInstance) {
      try {
        await this.recordingInstance.stopAndUnloadAsync();
        recordedUri = this.recordingInstance.getURI();
      } catch (err) {
        console.warn('[SpeechRecognitionService] Stop error:', err);
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
      // ignore
    }

    if (recordedUri && cb) {
      try {
        // Transcribe physical microphone recording using Whisper Large V3
        const transcript = await groqVisionService.transcribeAudio(recordedUri);
        const alphanumeric = (transcript || '').replace(/[^a-zA-Z0-9]/g, '').trim();
        if (transcript && alphanumeric.length >= 2) {
          cb.onResult(transcript.trim());
          return;
        }
      } catch (sttErr) {
        console.warn('[SpeechRecognitionService] Transcription failure:', sttErr);
      }
    }

    if (cb) {
      cb.onError('no_speech_detected');
    }
  }

  /**
   * Stop active listening session immediately
   */
  public async stopListening(): Promise<void> {
    this.clearSilenceTimer();
    this.isListening = false;

    if (this.recordingInstance) {
      try {
        await this.recordingInstance.stopAndUnloadAsync();
      } catch {
        // ignore
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
      // ignore
    }
  }

  /**
   * Handle speech recognition result
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
