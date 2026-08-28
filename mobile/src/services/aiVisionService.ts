import { geminiVisionService } from './geminiVisionService';
import { groqVisionService } from './groqVisionService';
import { ocrService } from './ocrService';
import { currencyService } from './currencyService';
import { objectDetectionService } from './objectDetectionService';
import { CameraFrameResult } from './cameraService';

export type VisionTaskType =
  | 'scene_description'
  | 'ocr_text'
  | 'currency_recognition'
  | 'obstacle_detection'
  | 'signboard_reading';

export interface VisionAnalysisResult {
  task: VisionTaskType;
  primaryDescription: string;
  detailedText?: string;
  confidence: number;
  tags?: string[];
  safeToWalk?: boolean;
}

class AiVisionService {
  public async analyzeImage(
    base64Image: string,
    task: VisionTaskType
  ): Promise<VisionAnalysisResult> {
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const frame: CameraFrameResult = {
      uri: `data:image/jpeg;base64,${cleanBase64}`,
      width: 1080,
      height: 1920,
      timestamp: Date.now(),
      base64: cleanBase64,
    };

    // 1. Specialized Task: OCR Text Reading
    if (task === 'ocr_text') {
      try {
        const ocrRes = await ocrService.recognizeText(frame);
        if (ocrRes.success && ocrRes.ocrResult && ocrRes.ocrResult.spokenText) {
          return {
            task,
            primaryDescription: ocrRes.ocrResult.spokenText,
            detailedText: ocrRes.ocrResult.cleanedText,
            confidence: ocrRes.ocrResult.confidence || 0.95,
            safeToWalk: true,
          };
        }
      } catch (e) {
        console.warn('[AiVisionService] OCR service error:', e);
      }
    }

    // 2. Specialized Task: Indian Currency Recognition
    if (task === 'currency_recognition') {
      try {
        const currRes = await currencyService.recognizeCurrency(frame);
        if (currRes.success && currRes.currencyResult && currRes.currencyResult.spokenText) {
          return {
            task,
            primaryDescription: currRes.currencyResult.spokenText,
            detailedText: currRes.currencyResult.spokenText,
            confidence: currRes.currencyResult.confidence || 0.95,
            safeToWalk: true,
          };
        }
      } catch (e) {
        console.warn('[AiVisionService] Currency service error:', e);
      }
    }

    // 3. Specialized Task: Obstacle Detection
    if (task === 'obstacle_detection') {
      try {
        const detRes = await objectDetectionService.detectObjects(frame);
        if (detRes.success && detRes.spokenResponse) {
          const safe =
            !detRes.spokenResponse.toLowerCase().includes('directly ahead') &&
            !detRes.spokenResponse.toLowerCase().includes('caution');
          return {
            task,
            primaryDescription: detRes.spokenResponse,
            detailedText: detRes.spokenResponse,
            confidence: 0.92,
            safeToWalk: safe,
          };
        }
      } catch (e) {
        console.warn('[AiVisionService] Detection service error:', e);
      }
    }

    // 4. Primary Visual Intelligence: Gemini 3.6 Flash Multi-Key Rotation
    const prompt = this.getPromptForTask(task);
    if (geminiVisionService.hasActiveKeys()) {
      try {
        const geminiText = await geminiVisionService.analyzeVision(cleanBase64, prompt);
        if (geminiText && geminiText.trim().length > 0) {
          const safe =
            !geminiText.toLowerCase().includes('danger') &&
            !geminiText.toLowerCase().includes('hazard') &&
            !geminiText.toLowerCase().includes('blocked');
          return {
            task,
            primaryDescription: geminiText.trim(),
            detailedText: geminiText.trim(),
            confidence: 0.96,
            safeToWalk: safe,
          };
        }
      } catch (err) {
        console.warn('[AiVisionService] Gemini vision error:', err);
      }
    }

    // 5. Secondary Multimodal Intelligence: Groq Vision
    try {
      const groqText = await groqVisionService.analyzeWithVision(cleanBase64, prompt);
      if (groqText && groqText.trim().length > 0) {
        return {
          task,
          primaryDescription: groqText.trim(),
          detailedText: groqText.trim(),
          confidence: 0.92,
          safeToWalk: true,
        };
      }
    } catch (err) {
      console.warn('[AiVisionService] Groq vision error:', err);
    }

    // Fallback if completely offline
    return {
      task,
      primaryDescription: 'Image captured. Please ensure network connectivity or point camera closer to the object.',
      confidence: 0.5,
      safeToWalk: true,
    };
  }

  private getPromptForTask(task: VisionTaskType): string {
    switch (task) {
      case 'scene_description':
        return 'You are an AI visual assistant for a blind person. Describe the immediate scene in front of the camera in 2 concise, clear sentences. Focus on prominent objects, open paths, people, and safety hazards.';
      case 'ocr_text':
        return 'Read all visible text, signs, document lines, or labels in this image accurately and clearly. State the text directly.';
      case 'currency_recognition':
        return 'Identify any Indian currency banknotes (₹10, ₹20, ₹50, ₹100, ₹200, ₹500) or other currency in this image. State the denomination clearly.';
      case 'obstacle_detection':
        return 'Identify any immediate obstacles directly in the walking path in front of the camera (stairs, curbs, chairs, poles, vehicles, holes). State if the path is clear or blocked.';
      case 'signboard_reading':
        return 'Read the main signboard, storefront name, or directional arrow in this image concisely.';
      default:
        return 'Describe what is in front of the camera concisely for a visually impaired user.';
    }
  }
}

export const aiVisionService = new AiVisionService();
