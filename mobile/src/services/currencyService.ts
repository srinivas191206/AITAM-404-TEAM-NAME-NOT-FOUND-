import { CameraFrameResult } from './cameraService';
import { imageAnalyzer, ColorHistogram } from '../utils/imageAnalyzer';
import { NativeVisionBridge } from './nativeVisionBridge';
import { groqVisionService } from './groqVisionService';

export type CurrencyDenomination = 10 | 20 | 50 | 100 | 200 | 500 | 2000;

export interface CurrencyVisualProfile {
  denomination: CurrencyDenomination;
  name: string;
  spokenName: string;
  baseColor: string;
  motif: string;
  widthMm: number;
  heightMm: number;
}

export interface CurrencyResult {
  currency: 'INR';
  denomination: CurrencyDenomination | null;
  confidence: number;
  detectedType: 'NOTE' | 'COIN' | 'UNKNOWN';
  spokenText: string;
  detectedColor?: string;
  detectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface CurrencyProcessingResult {
  success: boolean;
  message: string;
  currencyResult?: CurrencyResult;
  inferenceTimeMs: number;
  error?: string;
}

export const INR_DENOMINATIONS: Record<CurrencyDenomination, CurrencyVisualProfile> = {
  10: {
    denomination: 10,
    name: '₹10',
    spokenName: 'ten rupee note',
    baseColor: 'Chocolate Brown',
    motif: 'Sun Temple, Konark',
    widthMm: 123,
    heightMm: 63,
  },
  20: {
    denomination: 20,
    name: '₹20',
    spokenName: 'twenty rupee note',
    baseColor: 'Greenish Yellow',
    motif: 'Ellora Caves',
    widthMm: 129,
    heightMm: 63,
  },
  50: {
    denomination: 50,
    name: '₹50',
    spokenName: 'fifty rupee note',
    baseColor: 'Fluorescent Blue',
    motif: 'Hampi with Chariot',
    widthMm: 135,
    heightMm: 66,
  },
  100: {
    denomination: 100,
    name: '₹100',
    spokenName: 'one hundred rupee note',
    baseColor: 'Lavender',
    motif: 'Rani ki Vav',
    widthMm: 142,
    heightMm: 66,
  },
  200: {
    denomination: 200,
    name: '₹200',
    spokenName: 'two hundred rupee note',
    baseColor: 'Bright Yellow',
    motif: 'Sanchi Stupa',
    widthMm: 146,
    heightMm: 66,
  },
  500: {
    denomination: 500,
    name: '₹500',
    spokenName: 'five hundred rupee note',
    baseColor: 'Stone Grey',
    motif: 'Red Fort',
    widthMm: 150,
    heightMm: 66,
  },
  2000: {
    denomination: 2000,
    name: '₹2000',
    spokenName: 'two thousand rupee note',
    baseColor: 'Magenta',
    motif: 'Mangalyaan',
    widthMm: 166,
    heightMm: 66,
  },
};

class CurrencyService {
  private confidenceThreshold: number = 0.5;
  private isProcessing: boolean = false;

  public setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0.2, Math.min(0.95, threshold));
  }

  public getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  public extractDenominationFromText(rawText: string): CurrencyDenomination | null {
    if (!rawText) return null;
    const text = rawText.toUpperCase();

    if (/\b2000\b/.test(text) || text.includes('TWO THOUSAND')) return 2000;
    if (/\b500\b/.test(text) || text.includes('FIVE HUNDRED')) return 500;
    if (/\b200\b/.test(text) || text.includes('TWO HUNDRED')) return 200;
    if (/\b100\b/.test(text) || text.includes('ONE HUNDRED')) return 100;
    if (/\b50\b/.test(text) || text.includes('FIFTY')) return 50;
    if (/\b20\b/.test(text) || text.includes('TWENTY')) return 20;
    if (/\b10\b/.test(text) || text.includes('TEN')) return 10;

    return null;
  }

  public classifyNoteFromHistogram(hist: ColorHistogram): {
    denomination: CurrencyDenomination | null;
    confidence: number;
  } {
    const { avgHue, avgSaturation, avgLightness, avgRed, avgGreen, avgBlue } = hist;

    if (avgLightness < 0.12 || avgLightness > 0.92) {
      return { denomination: null, confidence: 0.1 };
    }

    if (avgSaturation < 0.22 && avgLightness >= 0.25 && avgLightness <= 0.78) {
      const diffRG = Math.abs(avgRed - avgGreen);
      const diffGB = Math.abs(avgGreen - avgBlue);
      if (diffRG < 35 && diffGB < 35) {
        return { denomination: 500, confidence: 0.93 };
      }
    }

    if (avgHue >= 230 && avgHue <= 290 && avgSaturation > 0.15) {
      return { denomination: 100, confidence: 0.91 };
    }

    if (avgHue >= 170 && avgHue < 230 && avgSaturation > 0.15) {
      return { denomination: 50, confidence: 0.92 };
    }

    if (avgHue >= 42 && avgHue <= 65 && avgSaturation > 0.25) {
      return { denomination: 200, confidence: 0.89 };
    }

    if (avgHue > 65 && avgHue <= 130 && avgSaturation > 0.15) {
      return { denomination: 20, confidence: 0.88 };
    }

    if (avgHue >= 10 && avgHue < 42 && avgRed > avgBlue) {
      return { denomination: 10, confidence: 0.90 };
    }

    if (avgHue >= 295 && avgHue <= 355 && avgSaturation > 0.20) {
      return { denomination: 2000, confidence: 0.87 };
    }

    if (avgSaturation < 0.25) {
      return { denomination: 500, confidence: 0.75 };
    }

    return { denomination: null, confidence: 0.3 };
  }

  public generateSpokenResponse(
    denomination: CurrencyDenomination | null,
    confidence: number
  ): string {
    if (!denomination || confidence < this.confidenceThreshold) {
      return "I couldn't identify the note clearly. Please reposition the note and try again.";
    }

    const profile = INR_DENOMINATIONS[denomination];
    if (!profile) {
      return "I couldn't identify the note clearly. Please try again.";
    }

    return `This appears to be a ${profile.spokenName}.`;
  }

  /**
   * Multi-Model Currency Recognition: Groq LLaMA-3.2 Vision + Native ML Kit OCR + Spectral Colorimeter
   */
  public async identifyCurrency(frame: CameraFrameResult): Promise<CurrencyProcessingResult> {
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

      // 1. Try Ultra-Fast Groq Vision with 10-Key Auto-Rotation
      if (frame.base64) {
        const groqResult = await groqVisionService.identifyCurrency(frame.base64);
        if (groqResult && !groqResult.includes("couldn't identify")) {
          const denomination = this.extractDenominationFromText(groqResult);
          if (denomination) {
            const spokenText = this.generateSpokenResponse(denomination, 0.99);
            return {
              success: true,
              message: spokenText,
              currencyResult: {
                currency: 'INR',
                denomination,
                confidence: 0.99,
                detectedType: 'NOTE',
                spokenText,
              },
              inferenceTimeMs: Date.now() - startTime,
            };
          }
        }
      }

      // 2. On-Device Fallback: Native ML Kit OCR Numeral Extraction
      let ocrDenomination: CurrencyDenomination | null = null;
      let rawDetectedText = '';

      const nativeOcr = await NativeVisionBridge.recognizeText(frame.uri);
      if (nativeOcr && nativeOcr.text) {
        rawDetectedText = nativeOcr.text;
        ocrDenomination = this.extractDenominationFromText(nativeOcr.text);
      }

      // 3. Multi-Spectral Color & Pixel Histogram Analysis
      const analysis = imageAnalyzer.analyzeBase64(frame.base64 || '');
      const colorClassification = this.classifyNoteFromHistogram(analysis.histogram);

      // FUSION
      let finalDenomination: CurrencyDenomination | null = null;
      let finalConfidence = 0.0;

      if (ocrDenomination && colorClassification.denomination) {
        if (ocrDenomination === colorClassification.denomination) {
          finalDenomination = ocrDenomination;
          finalConfidence = 0.99;
        } else {
          finalDenomination = ocrDenomination;
          finalConfidence = 0.94;
        }
      } else if (ocrDenomination) {
        finalDenomination = ocrDenomination;
        finalConfidence = 0.95;
      } else if (colorClassification.denomination) {
        finalDenomination = colorClassification.denomination;
        finalConfidence = colorClassification.confidence;
      }

      if (!finalDenomination || finalConfidence < this.confidenceThreshold) {
        return {
          success: false,
          message:
            "I couldn't identify the note clearly. Please reposition the note and try again.",
          inferenceTimeMs: Date.now() - startTime,
          error: 'low_confidence',
        };
      }

      const spokenText = this.generateSpokenResponse(finalDenomination, finalConfidence);

      const currencyResult: CurrencyResult = {
        currency: 'INR',
        denomination: finalDenomination,
        confidence: finalConfidence,
        detectedType: 'NOTE',
        spokenText,
        detectedColor: analysis.histogram.dominantColor,
        detectedText: rawDetectedText,
      };

      const inferenceTimeMs = Date.now() - startTime;

      return {
        success: true,
        message: spokenText,
        currencyResult,
        inferenceTimeMs,
      };
    } catch (err) {
      console.error('[CurrencyService] Currency identification error:', err);
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

export const currencyService = new CurrencyService();
