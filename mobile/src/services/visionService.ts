import { cameraService, CameraFrameResult } from './cameraService';
import {
  objectDetectionService,
  DetectionResult,
  DetectionPipelineResult,
} from './objectDetectionService';

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
   * Process camera frame through on-device Object Detection Engine (Phase 5.2)
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

    // Run On-Device Object Detection
    const detectionPipeline: DetectionPipelineResult =
      await objectDetectionService.detectObjects(frame);

    this.lastDetections = detectionPipeline.detections;

    if (this.detectionListener) {
      this.detectionListener(detectionPipeline.detections);
    }

    return {
      success: detectionPipeline.success,
      message: detectionPipeline.spokenResponse,
      detections: detectionPipeline.detections,
      frameMetadata,
      inferenceTimeMs: detectionPipeline.inferenceTimeMs,
      error: detectionPipeline.error,
    };
  }

  /**
   * Primary vision query handler invoked by Command Router for VISION_QUERY
   */
  public async queryVision(): Promise<VisionProcessingResult> {
    // 1. Permission check
    const permitted = await this.ensurePermission();
    if (!permitted) {
      return {
        success: false,
        message:
          "I can't access the camera. You can enable camera access in your phone settings.",
        error: 'permission_denied',
      };
    }

    // 2. Open camera
    await this.openCamera();

    // Stabilization delay for camera viewfinder
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 3. Capture frame
    const frame = await this.captureFrame();

    if (!frame) {
      // Fallback frame for simulation/emulator environments
      const syntheticFrame: CameraFrameResult = {
        uri: 'file://simulated_frame.jpg',
        width: 1080,
        height: 1920,
        timestamp: Date.now(),
      };
      return await this.processFrame(syntheticFrame);
    }

    // 4. Process frame through On-Device Object Detection Engine
    const result = await this.processFrame(frame);

    return result;
  }

  public getLastDetections(): DetectionResult[] {
    return this.lastDetections;
  }

  public getIsActive(): boolean {
    return this.isCameraActive;
  }
}

export const visionService = new VisionService();
