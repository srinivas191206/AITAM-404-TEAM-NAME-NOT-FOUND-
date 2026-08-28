import { cameraService, CameraFrameResult } from './cameraService';
import {
  objectDetectionService,
  DetectionResult,
  DetectionPipelineResult,
} from './objectDetectionService';
import { SpatialAnalysisResult } from './spatialAwarenessService';
import { ocrService, OCRProcessingResult, OCRResult } from './ocrService';
import { currencyService, CurrencyProcessingResult, CurrencyResult } from './currencyService';

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

  /**
   * Register the active CameraView capture delegate
   */
  public registerCaptureDelegate(delegate: CaptureDelegate | null): void {
    this.captureDelegate = delegate;
  }

  /**
   * Register listener for camera preview visibility requests
   */
  public registerVisibilityListener(listener: CameraVisibilityListener | null): void {
    this.cameraVisibilityListener = listener;
  }

  /**
   * Register listener for visual debugging bounding boxes
   */
  public registerDetectionListener(listener: DetectionListener | null): void {
    this.detectionListener = listener;
  }

  /**
   * Open / activate the camera module
   */
  public async openCamera(): Promise<boolean> {
    const hasPermission = await this.ensurePermission();
    if (!hasPermission) return false;

    this.isCameraActive = true;
    if (this.cameraVisibilityListener) {
      this.cameraVisibilityListener(true);
    }
    return true;
  }

  /**
   * Close / deactivate the camera module and release resources
   */
  public closeCamera(): void {
    this.isCameraActive = false;
    if (this.cameraVisibilityListener) {
      this.cameraVisibilityListener(false);
    }
    if (this.detectionListener) {
      this.detectionListener([]);
    }
  }

  /**
   * Request / ensure camera permissions on demand
   */
  public async ensurePermission(): Promise<boolean> {
    const status = await cameraService.getPermissionStatus();
    if (status === 'granted') {
      return true;
    }
    return await cameraService.requestCameraPermission();
  }

  /**
   * Capture frame on-demand from the active camera
   */
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

    // Run On-Device Object Detection + Spatial Awareness Pipeline
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
   * Primary vision query handler invoked by Command Router for VISION_QUERY
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
    await new Promise((resolve) => setTimeout(resolve, 300));
    const frame = await this.captureFrame();

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

  public getIsActive(): boolean {
    return this.isCameraActive;
  }
}

export const visionService = new VisionService();
