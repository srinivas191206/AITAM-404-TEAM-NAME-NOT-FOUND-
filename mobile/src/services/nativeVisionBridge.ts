import { NativeModules, Platform } from 'react-native';

const { NativeVisionModule } = NativeModules;

export interface NativeOcrBlock {
  text: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  lines: string[];
}

export interface NativeOcrResult {
  text: string;
  blocks: NativeOcrBlock[];
}

export interface NativeDetectedObject {
  primaryLabel: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  labels: { text: string; confidence: number }[];
}

export class NativeVisionBridge {
  public static isAvailable(): boolean {
    return Platform.OS === 'android' && !!NativeVisionModule;
  }

  public static async recognizeText(imageUri: string): Promise<NativeOcrResult | null> {
    if (!this.isAvailable()) return null;
    try {
      return await NativeVisionModule.recognizeText(imageUri);
    } catch (e) {
      console.warn('[NativeVisionBridge] OCR Error:', e);
      return null;
    }
  }

  public static async detectObjects(imageUri: string): Promise<NativeDetectedObject[] | null> {
    if (!this.isAvailable()) return null;
    try {
      return await NativeVisionModule.detectObjects(imageUri);
    } catch (e) {
      console.warn('[NativeVisionBridge] Detection Error:', e);
      return null;
    }
  }
}
