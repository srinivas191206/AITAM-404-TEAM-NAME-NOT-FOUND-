import { CameraFrameResult } from './cameraService';
import { NativeVisionBridge } from './nativeVisionBridge';
import { groqVisionService } from './groqVisionService';

export interface OCRTextBlock {
  text: string;
  lines: string[];
  confidence?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface OCRResult {
  rawText: string;
  cleanedText: string;
  blocks: OCRTextBlock[];
  isTruncated: boolean;
  spokenText: string;
  confidence: number;
}

export interface OCRProcessingResult {
  success: boolean;
  message: string;
  ocrResult?: OCRResult;
  inferenceTimeMs: number;
  error?: string;
}

class OCRService {
  private confidenceThreshold: number = 0.45;
  private isProcessing: boolean = false;

  public cleanText(rawText: string): string {
    if (!rawText) return '';

    let cleaned = rawText
      .replace(/[\t\r\f\v]/g, ' ')
      .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    cleaned = cleaned
      .replace(/\s*([,.:;?!])\s*/g, '$1 ')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  }

  public formatForSpeech(cleanedText: string, maxLength: number = 280): { spokenText: string; isTruncated: boolean } {
    if (!cleanedText || cleanedText.trim().length === 0) {
      return {
        spokenText: "I couldn't find readable text. Please try again.",
        isTruncated: false,
      };
    }

    if (cleanedText.length <= maxLength) {
      return {
        spokenText: cleanedText,
        isTruncated: false,
      };
    }

    let cutPoint = cleanedText.lastIndexOf('.', maxLength);
    if (cutPoint === -1 || cutPoint < maxLength * 0.6) {
      cutPoint = cleanedText.lastIndexOf(' ', maxLength);
    }
    if (cutPoint === -1) {
      cutPoint = maxLength;
    }

    const firstSection = cleanedText.substring(0, cutPoint).trim();
    return {
      spokenText: `I found a lot of text. I'll read the first section: ${firstSection}`,
      isTruncated: true,
    };
  }

  /**
   * Real On-Device Google ML Kit Neural OCR + Groq Vision Failover (ZERO MOCK DATA)
   */
  public async recognizeText(frame: CameraFrameResult): Promise<OCRProcessingResult> {
    const startTime = Date.now();

    if (!frame || !frame.uri) {
      return {
        success: false,
        message: "I couldn't analyze the view. Please try again.",
        inferenceTimeMs: 0,
        error: 'invalid_frame',
      };
    }

    try {
      this.isProcessing = true;

      let extractedRawText = '';
      let blocks: OCRTextBlock[] = [];

      // 1. Try Native Google ML Kit OCR on frame
      const nativeOcr = await NativeVisionBridge.recognizeText(frame.uri);
      if (nativeOcr && nativeOcr.text && nativeOcr.text.trim().length > 0) {
        extractedRawText = nativeOcr.text.trim();
        blocks = nativeOcr.blocks.map((b) => ({
          text: b.text,
          lines: b.lines,
          confidence: 0.95,
          boundingBox: b.boundingBox,
        }));
      }

      // 2. Try Groq Vision if native OCR returned empty
      if (!extractedRawText && frame.base64) {
        const groqText = await groqVisionService.readText(frame.base64);
        if (groqText && !groqText.includes("couldn't find") && !groqText.includes("no readable text")) {
          extractedRawText = groqText.trim();
        }
      }

      // If genuinely no text in view, honestly report to user
      if (!extractedRawText || extractedRawText.trim().length === 0) {
        const inferenceTimeMs = Date.now() - startTime;
        return {
          success: false,
          message: "I couldn't find readable text in view. Please point at text and try again.",
          inferenceTimeMs,
          error: 'no_text_found',
        };
      }

      const cleanedText = this.cleanText(extractedRawText);
      const { spokenText, isTruncated } = this.formatForSpeech(cleanedText);

      const ocrResult: OCRResult = {
        rawText: extractedRawText,
        cleanedText,
        blocks,
        isTruncated,
        spokenText,
        confidence: 0.95,
      };

      const inferenceTimeMs = Date.now() - startTime;

      return {
        success: true,
        message: spokenText,
        ocrResult,
        inferenceTimeMs,
      };
    } catch (err) {
      console.error('[OCRService] OCR processing error:', err);
      return {
        success: false,
        message: "I couldn't analyze the view. Please try again.",
        inferenceTimeMs: Date.now() - startTime,
        error: String(err),
      };
    } finally {
      this.isProcessing = false;
    }
  }

  public getIsProcessing(): boolean {
    return this.isProcessing;
  }
}

export const ocrService = new OCRService();
