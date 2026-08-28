import { useState, useCallback } from 'react';
import { outputService } from '../services/outputService';

export interface VoiceCommandResult {
  rawTranscript: string;
  intent:
    | 'describe_scene'
    | 'read_text'
    | 'check_currency'
    | 'navigate_to'
    | 'where_am_i'
    | 'emergency_sos'
    | 'help'
    | 'unknown';
  parameter?: string;
}

export function useVoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');

  /**
   * Parse speech transcript into deterministic accessibility actions
   */
  const parseCommand = (text: string): VoiceCommandResult => {
    const clean = text.toLowerCase().trim();

    if (
      clean.includes("what's in front") ||
      clean.includes('what is in front') ||
      clean.includes('describe') ||
      clean.includes('look') ||
      clean.includes('see')
    ) {
      return { rawTranscript: text, intent: 'describe_scene' };
    }

    if (
      clean.includes('read') ||
      clean.includes('text') ||
      clean.includes('sign') ||
      clean.includes('document') ||
      clean.includes('label')
    ) {
      return { rawTranscript: text, intent: 'read_text' };
    }

    if (
      clean.includes('money') ||
      clean.includes('currency') ||
      clean.includes('rupee') ||
      clean.includes('cash') ||
      clean.includes('note')
    ) {
      return { rawTranscript: text, intent: 'check_currency' };
    }

    if (clean.includes('navigate') || clean.includes('take me to') || clean.includes('go to') || clean.includes('walk to')) {
      const match = clean.replace(/^(navigate to|take me to|go to|walk to)/, '').trim();
      return {
        rawTranscript: text,
        intent: 'navigate_to',
        parameter: match || 'nearest hospital',
      };
    }

    if (clean.includes('where am i') || clean.includes('location') || clean.includes('my address')) {
      return { rawTranscript: text, intent: 'where_am_i' };
    }

    if (clean.includes('sos') || clean.includes('emergency') || clean.includes('help me')) {
      return { rawTranscript: text, intent: 'emergency_sos' };
    }

    if (clean.includes('help') || clean.includes('options') || clean.includes('commands')) {
      return { rawTranscript: text, intent: 'help' };
    }

    return { rawTranscript: text, intent: 'unknown' };
  };

  const startListening = useCallback(async (onResult: (res: VoiceCommandResult) => void) => {
    setIsListening(true);
    await outputService.triggerHaptic('info');

    // Simulate mobile speech recognizer listening window or microphone input
    console.log('[VoiceAssistant] Listening for command...');
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const simulateVoiceCommand = useCallback((transcript: string, onResult: (res: VoiceCommandResult) => void) => {
    setLastTranscript(transcript);
    const parsed = parseCommand(transcript);
    onResult(parsed);
  }, []);

  return {
    isListening,
    lastTranscript,
    startListening,
    stopListening,
    simulateVoiceCommand,
    parseCommand,
  };
}
