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

// Multilingual Translation Dictionary for Assistant Spoken Feedback
const TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    ready: 'वॉयस असिस्टेंट तैयार है। बोलने के लिए माइक्रोफोन दबाएं।',
    listening: 'सुन रहा हूँ...',
    analyzing: 'जाँच कर रहा हूँ...',
    front_query: 'आपके सामने की वस्तुओं का विश्लेषण कर रहा हूँ।',
    ocr_query: 'आपके सामने लिखे हुए पाठ को पढ़ने का प्रयास कर रहा हूँ।',
    currency_query: 'भारतीय मुद्रा नोट की पहचान की जा रही है।',
    scene_query: 'आस-पास के वातावरण को समझने का प्रयास कर रहा हूँ।',
    silence_timeout: 'मुझे कुछ सुनाई नहीं दिया। कृपया पुनः प्रयास करें।',
    error_mic: 'माइक्रोफ़ोन एक्सेस उपलब्ध नहीं है।',
    error_unknown: 'क्षमा करें, मैं समझ नहीं पाया। कृपया पुनः प्रयास करें।',
  },
  te: {
    ready: 'వాయిస్ అసిస్టెంట్ సిద్ధంగా ఉంది. మాట్లాడటానికి మైక్రోఫోన్ నొక్కండి.',
    listening: 'వింటున్నాను...',
    analyzing: 'పరిశీలిస్తున్నాను...',
    front_query: 'మీ ముందు ఉన్న వస్తువులను విశ్లేషిస్తున్నాను.',
    ocr_query: 'మీ ముందు ఉన్న వచనాన్ని చదవడానికి ప్రయత్నిస్తున్నాను.',
    currency_query: 'భారతీయ కరెన్సీ నోటును గుర్తిస్తున్నాను.',
    scene_query: 'చుట్టుపక్కల వాతావరణాన్ని పరిశీలిస్తున్నాను.',
    silence_timeout: 'నాకు ఏమి వినిపించలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.',
    error_mic: 'మైక్రోఫోన్ అనుమతి అందుబాటులో లేదు.',
    error_unknown: 'క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.',
  },
  en: {
    ready: 'Voice assistant ready. Tap microphone to speak.',
    listening: 'Listening...',
    analyzing: 'Analyzing...',
    front_query: 'Analyzing objects in front of you.',
    ocr_query: 'Reading text in front of you.',
    currency_query: 'Identifying Indian Rupee banknote.',
    scene_query: 'Analyzing your surrounding environment.',
    silence_timeout: "I didn't hear anything. Please try again.",
    error_mic: 'Microphone access is unavailable.',
    error_unknown: "I couldn't understand that. Please try again.",
  },
};

class TTSService {
  private isSpeaking = false;
  private currentLanguage = 'en-IN'; // Default to Indian English Accent!

  /**
   * Set default language for spoken output with Indian locale mappings
   */
  public setLanguage(langCode: string): void {
    if (!langCode) return;
    const lower = langCode.toLowerCase();
    if (lower === 'en' || lower === 'en-in' || lower === 'en-us') this.currentLanguage = 'en-IN';
    else if (lower === 'te' || lower === 'te-in') this.currentLanguage = 'te-IN';
    else if (lower === 'hi' || lower === 'hi-in') this.currentLanguage = 'hi-IN';
    else if (lower === 'ta' || lower === 'ta-in') this.currentLanguage = 'ta-IN';
    else this.currentLanguage = langCode;
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Translate system feedback key to target language
   */
  public translateKey(key: string, langCode?: string): string {
    const lang = (langCode || this.currentLanguage).slice(0, 2);
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    return dict[key] || TRANSLATIONS['en'][key] || key;
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
   * Speak text aloud using native speech synthesis in Indian accent / native voice
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
        rate: options?.rate || (Platform.OS === 'android' ? 0.92 : 0.98), // Natural Indian cadence
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
