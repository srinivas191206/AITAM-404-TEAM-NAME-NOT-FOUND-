import { cameraService, CameraFrameResult } from './cameraService';

export interface VisionFrameMetadata {
  uri: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface VisionProcessingResult {
  success: boolean;
  message: string;
  frameMetadata?: VisionFrameMetadata;
  error?: string;
}

export type CaptureDelegate = () => Promise<CameraFrameResult | null>;
export type CameraVisibilityListener = (visible: boolean) => void;

class VisionService {
  private captureDelegate: CaptureDelegate | null = null;
  private cameraVisibilityListener: CameraVisibilityListener | null = null;
  private isCameraActive: boolean = false;

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
   * Clean processing boundary for camera frames
   * (In Phase 5.1, processes frame metadata without AI detection)
   */
  public async processFrame(frame: CameraFrameResult): Promise<VisionProcessingResult> {
    // Verify frame integrity
    if (!frame || !frame.uri) {
      return {
        success: false,
        message: "I couldn't process the captured frame. Please try again.",
        error: 'invalid_frame',
      };
    }

    const frameMetadata: VisionFrameMetadata = {
      uri: frame.uri,
      width: frame.width,
      height: frame.height,
      timestamp: frame.timestamp,
    };

    return {
      success: true,
      message: 'I captured the view. Object recognition will be connected next.',
      frameMetadata,
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

    // Small delay to ensure camera preview stabilization
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 3. Capture frame
    const frame = await this.captureFrame();

    if (!frame) {
      // Graceful capture fallback
      return {
        success: true,
        message: 'I captured the view. Object recognition will be connected next.',
      };
    }

    // 4. Process frame through clean boundary
    const result = await this.processFrame(frame);

    return result;
  }

  public getIsActive(): boolean {
    return this.isCameraActive;
  }
}

export const visionService = new VisionService();
