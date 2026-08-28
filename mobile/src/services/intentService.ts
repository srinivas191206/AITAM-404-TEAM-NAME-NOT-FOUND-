export type RecognizedIntentType =
  | 'GREETING'
  | 'VISION_QUERY'
  | 'READ_TEXT'
  | 'SCENE_DESCRIPTION'
  | 'CURRENCY_QUERY'
  | 'NAVIGATION'
  | 'HELP'
  | 'STOP'
  | 'REPEAT'
  | 'AMBIGUOUS'
  | 'UNKNOWN';

export interface IntentDetectionResult {
  intent: RecognizedIntentType;
  confidence: number;
  rawInput: string;
  normalizedInput: string;
  parameters?: {
    destination?: string;
    clarificationPrompt?: string;
  };
}

class IntentService {
  /**
   * Normalizes speech-recognition input while preserving semantic parameters
   */
  public normalizeInput(rawInput: string): string {
    if (!rawInput) return '';

    let cleaned = rawInput.trim().toLowerCase();

    // Standardize common contractions
    cleaned = cleaned.replace(/what's/g, 'whats');
    cleaned = cleaned.replace(/i'm/g, 'im');
    cleaned = cleaned.replace(/how's/g, 'hows');
    cleaned = cleaned.replace(/can't/g, 'cant');
    cleaned = cleaned.replace(/don't/g, 'dont');

    // Remove punctuation cleanly
    cleaned = cleaned.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Detects intent from raw speech string using hybrid rule & pattern matching
   */
  public detectIntent(rawInput: string): IntentDetectionResult {
    if (!rawInput || rawInput.trim().length === 0) {
      return {
        intent: 'UNKNOWN',
        confidence: 0,
        rawInput: rawInput || '',
        normalizedInput: '',
      };
    }

    const normalized = this.normalizeInput(rawInput);
    const originalTrimmed = rawInput.trim();

    // 1. STOP / CANCEL (Highest Priority)
    if (this.isStopIntent(normalized)) {
      return {
        intent: 'STOP',
        confidence: 1.0,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 2. GREETINGS (HEY HI / HELLO / NAMASTE)
    if (this.isGreetingIntent(normalized)) {
      return {
        intent: 'GREETING',
        confidence: 0.99,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 3. REPEAT / SAY THAT AGAIN
    if (this.isRepeatIntent(normalized)) {
      return {
        intent: 'REPEAT',
        confidence: 0.98,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 4. HELP
    if (this.isHelpIntent(normalized)) {
      return {
        intent: 'HELP',
        confidence: 0.98,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 5. NAVIGATION WITH DESTINATION EXTRACTION
    const navResult = this.checkNavigationIntent(rawInput, normalized);
    if (navResult) {
      return navResult;
    }

    // 6. CURRENCY QUERY
    if (this.isCurrencyIntent(normalized)) {
      return {
        intent: 'CURRENCY_QUERY',
        confidence: 0.95,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 7. READ TEXT / OCR QUERY
    if (this.isReadTextIntent(normalized)) {
      return {
        intent: 'READ_TEXT',
        confidence: 0.95,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 8. SCENE DESCRIPTION / SURROUNDINGS
    if (this.isSceneDescriptionIntent(normalized)) {
      return {
        intent: 'SCENE_DESCRIPTION',
        confidence: 0.95,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 9. VISION QUERY (WHAT'S IN FRONT / AHEAD)
    if (this.isVisionQueryIntent(normalized)) {
      return {
        intent: 'VISION_QUERY',
        confidence: 0.95,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 10. AMBIGUOUS QUERIES
    if (this.isAmbiguousIntent(normalized)) {
      return {
        intent: 'AMBIGUOUS',
        confidence: 0.6,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
        parameters: {
          clarificationPrompt: 'Would you like me to read the text or describe what I see?',
        },
      };
    }

    // 11. UNKNOWN
    return {
      intent: 'UNKNOWN',
      confidence: 0.1,
      rawInput: originalTrimmed,
      normalizedInput: normalized,
    };
  }

  // --- INTENT PATTERN DETECTORS ---

  private isGreetingIntent(text: string): boolean {
    const patterns = [
      '^hi$',
      '^hey$',
      '^hello$',
      '^hey hi$',
      '^hey hello$',
      '^hey siri$',
      '^namaste$',
      '^namaskaram$',
      'నమస్కారం',
      'नमस्ते',
    ];
    return (
      patterns.some((p) => new RegExp(p, 'i').test(text)) ||
      /^(hi|hey|hello|namaste|namaskaram)\b/i.test(text)
    );
  }

  private isStopIntent(text: string): boolean {
    if (text === 'stop' || text === 'cancel' || text === 'nevermind') return true;
    const patterns = [
      '^stop$',
      '^cancel$',
      '^never mind$',
      '^nevermind$',
      '^stop that$',
      '^stop listening$',
      '^quit$',
      '^abort$',
      '^shut up$',
      '^quiet$',
    ];
    return patterns.some((p) => new RegExp(p, 'i').test(text)) || /^stop\b/i.test(text);
  }

  private isRepeatIntent(text: string): boolean {
    if (text === 'repeat') return true;
    const patterns = [
      '^repeat$',
      '^repeat that$',
      '^repeat what you said$',
      '^say that again$',
      '^say again$',
      '^can you say that again$',
      '^can you repeat that$',
      '^what did you say$',
      '^come again$',
    ];
    return patterns.some((p) => new RegExp(p, 'i').test(text)) || /^repeat\b/i.test(text);
  }

  private isHelpIntent(text: string): boolean {
    if (text === 'help' || text === 'options') return true;
    const patterns = [
      '^help$',
      '^help me$',
      '^what can you do$',
      '^how to use$',
      '^instructions$',
      '^options$',
      '^commands$',
    ];
    return patterns.some((p) => new RegExp(p, 'i').test(text)) || /^help\b/i.test(text);
  }

  private checkNavigationIntent(rawInput: string, normalized: string): IntentDetectionResult | null {
    const navKeywords = [
      'navigate to',
      'take me to',
      'directions to',
      'how to get to',
      'route to',
      'find way to',
      'go to',
      'where is',
    ];

    for (const kw of navKeywords) {
      if (normalized.includes(kw)) {
        const parts = normalized.split(kw);
        const destination = parts.length > 1 ? parts[1].trim() : '';

        if (destination.length > 0) {
          return {
            intent: 'NAVIGATION',
            confidence: 0.95,
            rawInput,
            normalizedInput: normalized,
            parameters: {
              destination,
            },
          };
        }
      }
    }

    if (
      normalized.startsWith('navigate') ||
      normalized.startsWith('direction') ||
      normalized.startsWith('directions')
    ) {
      return {
        intent: 'NAVIGATION',
        confidence: 0.85,
        rawInput,
        normalizedInput: normalized,
      };
    }

    return null;
  }

  private isCurrencyIntent(text: string): boolean {
    const patterns = [
      'currency',
      'money',
      'rupee',
      'rupees',
      'note',
      'cash',
      'how much money',
      'what note',
      'check currency',
      'read currency',
      'identify currency',
      'count money',
      'కరెన్సీ',
      'రూపాయలు',
      'नोट',
      'रुपये',
    ];
    return patterns.some((p) => text.includes(p));
  }

  private isReadTextIntent(text: string): boolean {
    const patterns = [
      'read text',
      'read this',
      'read document',
      'read sign',
      'read signboard',
      'what does it say',
      'read text in front',
      'ocr',
      'scan text',
      'చదువు',
      'పాఠం',
      'पढ़ो',
      'पाठ',
    ];
    return patterns.some((p) => text.includes(p));
  }

  private isSceneDescriptionIntent(text: string): boolean {
    const patterns = [
      'describe scene',
      'describe surroundings',
      'describe environment',
      'where am i',
      'what is around me',
      'whats around me',
      'room description',
      'tell me about this place',
      'వాతావరణం',
      'చుట్టుపక్కల',
      'कमरा',
      'आसपास',
    ];
    return patterns.some((p) => text.includes(p));
  }

  private isVisionQueryIntent(text: string): boolean {
    const patterns = [
      'what is in front',
      'whats in front',
      'what is ahead',
      'whats ahead',
      'what do you see',
      'describe what you see',
      'look ahead',
      'any obstacle',
      'obstacles',
      'front of me',
      'ఏముంది',
      'నా ముందు',
      'सामने क्या है',
    ];
    return patterns.some((p) => text.includes(p));
  }

  private isAmbiguousIntent(text: string): boolean {
    const ambiguousPatterns = ['what is this', 'look at this', 'tell me about this', 'check this'];
    return ambiguousPatterns.some((p) => text === p || text.startsWith(p));
  }
}

export const intentService = new IntentService();
