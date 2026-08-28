import { cameraService, CameraFrameResult } from './cameraService';
import {
  objectDetectionService,
  DetectionResult,
  DetectionPipelineResult,
} from './objectDetectionService';
import { SpatialAnalysisResult } from './spatialAwarenessService';
import { ocrService, OCRProcessingResult, OCRResult } from './ocrService';
import { currencyService, CurrencyProcessingResult, CurrencyResult } from './currencyService';
import {
  sceneUnderstandingService,
  SceneProcessingResult,
  SceneResult,
} from './sceneUnderstandingService';
import { geminiVisionService } from './geminiVisionService';

export interface VisionFrameMetadata {
  uri: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface VisionProcessingResult {
  success: boolean;
  message: string;
  detections?: DetectionResult[];
  spatialAnalysis?: SpatialAnalysisResult;
  ocrResult?: OCRResult;
  currencyResult?: CurrencyResult;
  sceneResult?: SceneResult;
  frameMetadata?: VisionFrameMetadata;
  inferenceTimeMs?: number;
  error?: string;
}

export type CaptureDelegate = () => Promise<CameraFrameResult | null>;
export type CameraVisibilityListener = (visible: boolean) => void;
export type DetectionListener = (detections: DetectionResult[]) => void;

class VisionService {
  private captureDelegate: CaptureDelegate | null = null;
  private cameraVisibilityListener: CameraVisibilityListener | null = null;
  private detectionListener: DetectionListener | null = null;
  private isCameraActive: boolean = false;
  private lastDetections: DetectionResult[] = [];
  private lastSpatialAnalysis: SpatialAnalysisResult | null = null;
  private lastOcrResult: OCRResult | null = null;
  private lastCurrencyResult: CurrencyResult | null = null;
  private lastSceneResult: SceneResult | null = null;

  public registerCaptureDelegate(delegate: CaptureDelegate | null): void {
    this.captureDelegate = delegate;
  }

  public registerVisibilityListener(listener: CameraVisibilityListener | null): void {
    this.cameraVisibilityListener = listener;
  }

  public registerDetectionListener(listener: DetectionListener | null): void {
    this.detectionListener = listener;
  }

  public async openCamera(): Promise<boolean> {
    const hasPermission = await this.ensurePermission();
    if (!hasPermission) return false;

    this.isCameraActive = true;
    if (this.cameraVisibilityListener) {
      this.cameraVisibilityListener(true);
    }
    return true;
  }

  public closeCamera(): void {
    this.isCameraActive = false;
    if (this.cameraVisibilityListener) {
      this.cameraVisibilityListener(false);
    }
    if (this.detectionListener) {
      this.detectionListener([]);
    }
  }

  public async ensurePermission(): Promise<boolean> {
    const status = await cameraService.getPermissionStatus();
    if (status === 'granted') {
      return true;
    }
    return await cameraService.requestCameraPermission();
  }

  public async captureFrame(): Promise<CameraFrameResult | null> {
    if (!this.captureDelegate) {
      console.warn('[VisionService] No capture delegate registered');
      return null;
    }
    return await this.captureDelegate();
  }

  /**
   * Process camera frame through on-device Object Detection & Spatial Awareness (Phase 5)
   */
  public async processFrame(frame: CameraFrameResult): Promise<VisionProcessingResult> {
    if (!frame || !frame.uri) {
      return {
        success: false,
        message: "I couldn't analyze the view. Please try again.",
        error: 'invalid_frame',
      };
    }

    const frameMetadata: VisionFrameMetadata = {
      uri: frame.uri,
      width: frame.width,
      height: frame.height,
      timestamp: frame.timestamp,
    };

    const detectionPipeline: DetectionPipelineResult =
      await objectDetectionService.detectObjects(frame);

    this.lastDetections = detectionPipeline.detections;
    this.lastSpatialAnalysis = detectionPipeline.spatialAnalysis;

    if (this.detectionListener) {
      this.detectionListener(detectionPipeline.detections);
    }

    return {
      success: detectionPipeline.success,
      message: detectionPipeline.spokenResponse,
      detections: detectionPipeline.detections,
      spatialAnalysis: detectionPipeline.spatialAnalysis,
      frameMetadata,
      inferenceTimeMs: detectionPipeline.inferenceTimeMs,
      error: detectionPipeline.error,
    };
  }

  /**
   * Primary vision query handler invoked by Command Router for VISION_QUERY (Phase 5)
   */
  public async queryVision(): Promise<VisionProcessingResult> {
    const permitted = await this.ensurePermission();
    if (!permitted) {
      return {
        success: false,
        message:
          "I can't access the camera. You can enable camera access in your phone settings.",
        error: 'permission_denied',
      };
    }

    await this.openCamera();
    await new Promise((resolve) => setTimeout(resolve, 350));
    const frame = await this.captureFrame();

    if (frame && frame.base64 && geminiVisionService.hasActiveKeys()) {
      try {
        const navaigatePrompt = `Purpose:
You're an advanced navigation and obstacle assistant designed to help visually impaired individuals. Analyze this live camera frame, identify all specific obstacles, items, their colors, sizes, and relative positions (left, ahead, right), and tell the user what to do safely. Keep your answer to 2 or 3 concise, actionable sentences suitable for text-to-speech. Speak directly to the user as their eyes.`;
        const geminiSpeech = await geminiVisionService.analyzeVision(frame.base64, navaigatePrompt);
        if (geminiSpeech && geminiSpeech.trim().length > 0) {
          // Also run detector in background for bounding boxes
          this.processFrame(frame).catch(() => {});
          return {
            success: true,
            message: geminiSpeech.trim(),
            frameMetadata: {
              uri: frame.uri,
              width: frame.width,
              height: frame.height,
              timestamp: frame.timestamp,
            },
          };
        }
      } catch (e) {
        console.warn('[VisionService] NavAIgate Gemini vision query note:', e);
      }
    }

    const targetFrame: CameraFrameResult = frame || {
      uri: 'file://simulated_vision_frame.jpg',
      width: 1080,
      height: 1920,
      timestamp: Date.now(),
    };

    return await this.processFrame(targetFrame);
  }

  /**
   * Primary OCR query handler invoked by Command Router for READ_TEXT (Phase 6.1)
   */
  public async queryOcr(): Promise<VisionProcessingResult> {
    const permitted = await this.ensurePermission();
    if (!permitted) {
      return {
        success: false,
        message:
          "I can't access the camera. You can enable camera access in your phone settings.",
        error: 'permission_denied',
      };
    }

    await this.openCamera();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const frame = await this.captureFrame();

    const targetFrame: CameraFrameResult = frame || {
      uri: 'file://simulated_ocr_frame.jpg',
      width: 1080,
      height: 1920,
      timestamp: Date.now(),
    };

    const ocrProcessing: OCRProcessingResult = await ocrService.recognizeText(targetFrame);
    this.lastOcrResult = ocrProcessing.ocrResult || null;

    const frameMetadata: VisionFrameMetadata = {
      uri: targetFrame.uri,
      width: targetFrame.width,
      height: targetFrame.height,
      timestamp: targetFrame.timestamp,
    };

    return {
      success: ocrProcessing.success,
      message: ocrProcessing.message,
      ocrResult: ocrProcessing.ocrResult,
      frameMetadata,
      inferenceTimeMs: ocrProcessing.inferenceTimeMs,
      error: ocrProcessing.error,
    };
  }

  /**
   * Primary Currency query handler invoked by Command Router for CURRENCY_QUERY (Phase 6.2)
   */
  public async queryCurrency(): Promise<VisionProcessingResult> {
    const permitted = await this.ensurePermission();
    if (!permitted) {
      return {
        success: false,
        message:
          "I can't access the camera. You can enable camera access in your phone settings.",
        error: 'permission_denied',
      };
    }

    await this.openCamera();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const frame = await this.captureFrame();

    const targetFrame: CameraFrameResult = frame || {
      uri: 'file://simulated_currency_frame.jpg',
      width: 1080,
      height: 1920,
      timestamp: Date.now(),
    };

    const currencyProcessing: CurrencyProcessingResult =
      await currencyService.identifyCurrency(targetFrame);
    this.lastCurrencyResult = currencyProcessing.currencyResult || null;

    const frameMetadata: VisionFrameMetadata = {
      uri: targetFrame.uri,
      width: targetFrame.width,
      height: targetFrame.height,
      timestamp: targetFrame.timestamp,
    };

    return {
      success: currencyProcessing.success,
      message: currencyProcessing.message,
      currencyResult: currencyProcessing.currencyResult,
      frameMetadata,
      inferenceTimeMs: currencyProcessing.inferenceTimeMs,
      error: currencyProcessing.error,
    };
  }

  /**
   * Primary Scene query handler invoked by Command Router for SCENE_DESCRIPTION (Phase 6.3)
   */
  public async queryScene(): Promise<VisionProcessingResult> {
    const permitted = await this.ensurePermission();
    if (!permitted) {
      return {
        success: false,
        message:
          "I can't access the camera. You can enable camera access in your phone settings.",
        error: 'permission_denied',
      };
    }

    await this.openCamera();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const frame = await this.captureFrame();

    const targetFrame: CameraFrameResult = frame || {
      uri: 'file://simulated_scene_frame.jpg',
      width: 1080,
      height: 1920,
      timestamp: Date.now(),
    };

    const sceneProcessing: SceneProcessingResult =
      await sceneUnderstandingService.describeScene(targetFrame);
    this.lastSceneResult = sceneProcessing.sceneResult || null;

    const frameMetadata: VisionFrameMetadata = {
      uri: targetFrame.uri,
      width: targetFrame.width,
      height: targetFrame.height,
      timestamp: targetFrame.timestamp,
    };

    return {
      success: sceneProcessing.success,
      message: sceneProcessing.message,
      sceneResult: sceneProcessing.sceneResult,
      frameMetadata,
      inferenceTimeMs: sceneProcessing.inferenceTimeMs,
      error: sceneProcessing.error,
    };
  }

  public getLastDetections(): DetectionResult[] {
    return this.lastDetections;
  }

  public getLastSpatialAnalysis(): SpatialAnalysisResult | null {
    return this.lastSpatialAnalysis;
  }

  public getLastOcrResult(): OCRResult | null {
    return this.lastOcrResult;
  }

  public getLastCurrencyResult(): CurrencyResult | null {
    return this.lastCurrencyResult;
  }

  public getLastSceneResult(): SceneResult | null {
    return this.lastSceneResult;
  }

  public getIsActive(): boolean {
    return this.isCameraActive;
  }
}

export const visionService = new VisionService();
