import { hapticService } from './hapticService';

export interface VoiceConfirmationResult {
  isConfirmed: boolean | null; // true for YES, false for NO, null for UNKNOWN
  rawTranscript: string;
}

class VoiceInputService {
  private isListening: boolean = false;
  private onTranscriptCallback: ((transcript: string) => void) | null = null;

  /**
   * Start listening for voice input
   */
  public async startListening(onTranscript: (transcript: string) => void): Promise<void> {
    this.isListening = true;
    this.onTranscriptCallback = onTranscript;
    await hapticService.light();
  }

  /**
   * Stop listening
   */
  public stopListening(): void {
    this.isListening = false;
    this.onTranscriptCallback = null;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Parse natural speech for "I heard..." confirmation
   * Supports: "yes", "yeah", "yep", "correct", "that's right", "sure", "ok" vs "no", "nope", "wrong", "incorrect", "retry"
   */
  public parseConfirmation(text: string): VoiceConfirmationResult {
    const clean = text.toLowerCase().trim();

    // Affirmative intents
    const yesMatches = [
      'yes',
      'yeah',
      'yep',
      'correct',
      'right',
      'that is right',
      "that's right",
      'sure',
      'ok',
      'okay',
      'confirm',
      'fine',
      'save',
    ];

    // Negative intents
    const noMatches = [
      'no',
      'nope',
      'wrong',
      'incorrect',
      'not right',
      'change',
      'retry',
      'cancel',
      'again',
    ];

    if (yesMatches.some((w) => clean === w || clean.startsWith(w + ' ') || clean.endsWith(' ' + w))) {
      return { isConfirmed: true, rawTranscript: text };
    }

    if (noMatches.some((w) => clean === w || clean.startsWith(w + ' ') || clean.endsWith(' ' + w))) {
      return { isConfirmed: false, rawTranscript: text };
    }

    return { isConfirmed: null, rawTranscript: text };
  }

  /**
   * Normalize spoken phone numbers (removes spaces, letters, handles word numbers like "nine eight seven")
   */
  public normalizePhoneNumber(spokenText: string): string {
    const wordToDigit: Record<string, string> = {
      zero: '0',
      one: '1',
      two: '2',
      three: '3',
      four: '4',
      five: '5',
      six: '6',
      seven: '7',
      eight: '8',
      nine: '9',
      double: '',
      triple: '',
    };

    let result = spokenText.toLowerCase();

    // Replace word digits
    Object.keys(wordToDigit).forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      result = result.replace(regex, wordToDigit[word]);
    });

    // Extract all numeric characters
    const digitsOnly = result.replace(/[^\d+]/g, '');
    return digitsOnly || spokenText.replace(/[^\d]/g, '');
  }

  /**
   * Simulate user voice input during interactive voice registration
   */
  public submitSpokenInput(transcript: string): void {
    if (this.onTranscriptCallback) {
      this.onTranscriptCallback(transcript);
    }
  }
}

export const voiceInputService = new VoiceInputService();
