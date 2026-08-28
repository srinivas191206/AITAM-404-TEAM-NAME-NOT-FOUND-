export type RecognizedIntentType =
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

    // 1. STOP / CANCEL / NEVER MIND (Highest Priority - Immediate Interaction Control)
    if (this.isStopIntent(normalized)) {
      return {
        intent: 'STOP',
        confidence: 1.0,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 2. REPEAT / SAY THAT AGAIN
    if (this.isRepeatIntent(normalized)) {
      return {
        intent: 'REPEAT',
        confidence: 0.98,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 3. HELP
    if (this.isHelpIntent(normalized)) {
      return {
        intent: 'HELP',
        confidence: 0.98,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 4. NAVIGATION WITH DESTINATION EXTRACTION
    const navResult = this.checkNavigationIntent(rawInput, normalized);
    if (navResult) {
      return navResult;
    }

    // 5. CURRENCY QUERY
    if (this.isCurrencyIntent(normalized)) {
      return {
        intent: 'CURRENCY_QUERY',
        confidence: 0.95,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 6. READ TEXT / OCR QUERY
    if (this.isReadTextIntent(normalized)) {
      return {
        intent: 'READ_TEXT',
        confidence: 0.95,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 7. SCENE DESCRIPTION / SURROUNDINGS
    if (this.isSceneDescriptionIntent(normalized)) {
      return {
        intent: 'SCENE_DESCRIPTION',
        confidence: 0.95,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 8. VISION QUERY (WHAT'S IN FRONT / AHEAD)
    if (this.isVisionQueryIntent(normalized)) {
      return {
        intent: 'VISION_QUERY',
        confidence: 0.95,
        rawInput: originalTrimmed,
        normalizedInput: normalized,
      };
    }

    // 9. AMBIGUOUS QUERIES (Need clarification before taking action)
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

    // 10. UNKNOWN / UNSUPPORTED
    return {
      intent: 'UNKNOWN',
      confidence: 0.1,
      rawInput: originalTrimmed,
      normalizedInput: normalized,
    };
  }

  // --- INTENT PATTERN DETECTORS ---

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
      '^i need help$',
      '^what can you do$',
      '^what are the commands$',
      '^list commands$',
      '^how does this work$',
      '^how do i use this$',
      '^options$',
    ];
    return patterns.some((p) => new RegExp(p, 'i').test(text)) || /^help\b/i.test(text);
  }

  private isVisionQueryIntent(text: string): boolean {
    const phrases = [
      'whats in front of me',
      "what's in front of me",
      'what is in front of me',
      'whats ahead of me',
      "what's ahead of me",
      'what is ahead of me',
      'what is ahead',
      'whats ahead',
      "what's ahead",
      'what do i have in front',
      'what do i have in front of me',
      'can you tell me what is in front',
      'can you tell me whats in front',
      "can you tell me what's in front",
      'look ahead',
      'check in front',
      'whats right in front of me',
      "what's right in front of me",
      'describe what is in front',
      'detect obstacles in front',
      'what do you see in front',
    ];
    return phrases.some((p) => text.includes(p)) || /in front of me|what is ahead|whats ahead/.test(text);
  }

  private isReadTextIntent(text: string): boolean {
    const phrases = [
      'read this',
      'read the text',
      'what does this say',
      'can you read this',
      'read what is written here',
      'read whats written here',
      "read what's written here",
      'tell me what this says',
      'read sign',
      'read document',
      'read letter',
      'read page',
      'read note',
      'read words',
      'read the sign',
      'read the label',
      'ocr',
    ];
    return phrases.some((p) => text.includes(p)) || (/^read\b/.test(text) && !text.includes('around'));
  }

  private isSceneDescriptionIntent(text: string): boolean {
    const phrases = [
      'describe my surroundings',
      'describe surroundings',
      'whats around me',
      "what's around me",
      'what is around me',
      'tell me about my surroundings',
      'describe whats around me',
      "describe what's around me",
      'describe what is around me',
      'look around',
      'describe the room',
      'describe the environment',
      'where am i',
      'what is around',
      'whats around',
      "what's around",
    ];
    return phrases.some((p) => text.includes(p)) || /around me|surroundings|look around/.test(text);
  }

  private isCurrencyIntent(text: string): boolean {
    const phrases = [
      'what currency is this',
      'identify this money',
      'what note is this',
      'how much money is this',
      'identify currency',
      'check currency',
      'what rupee is this',
      'count money',
      'how many rupees',
      'is this money',
      'recognize currency',
      'can you identify this note',
      'which rupee note is this',
      'what denomination is this',
    ];
    return phrases.some((p) => text.includes(p)) || /currency|money note|rupee note|how much cash/.test(text);
  }

  private checkNavigationIntent(raw: string, normalized: string): IntentDetectionResult | null {
    const navPatterns = [
      /take me to(?: the)?\s+(.+)/i,
      /navigate to(?: the)?\s+(.+)/i,
      /how do i get to(?: the)?\s+(.+)/i,
      /directions to(?: the)?\s+(.+)/i,
      /route to(?: the)?\s+(.+)/i,
      /guide me to(?: the)?\s+(.+)/i,
      /walk to(?: the)?\s+(.+)/i,
      /go to(?: the)?\s+(.+)/i,
    ];

    for (const pattern of navPatterns) {
      const match = raw.match(pattern);
      if (match && match[1]) {
        let dest = match[1].trim();
        // Remove trailing punctuation or conversational filler
        dest = dest.replace(/[.?!\s]+$/, '');
        if (dest.length > 0) {
          return {
            intent: 'NAVIGATION',
            confidence: 0.95,
            rawInput: raw.trim(),
            normalizedInput: normalized,
            parameters: {
              destination: dest,
            },
          };
        }
      }
    }

    // Direct keyword check with safe fallback
    if (normalized.startsWith('navigate') || normalized.startsWith('navigation')) {
      const parts = normalized.split(/\s+/);
      const dest = parts.slice(1).join(' ').trim();
      return {
        intent: 'NAVIGATION',
        confidence: 0.85,
        rawInput: raw.trim(),
        normalizedInput: normalized,
        parameters: {
          destination: dest || 'destination',
        },
      };
    }

    return null;
  }

  private isAmbiguousIntent(text: string): boolean {
    const ambiguousPatterns = [
      '^tell me about this$',
      '^what is this$',
      '^check this$',
      '^look at this$',
      '^what am i looking at$',
      '^explain this$',
    ];
    return ambiguousPatterns.some((p) => new RegExp(p, 'i').test(text));
  }
}

export const intentService = new IntentService();
