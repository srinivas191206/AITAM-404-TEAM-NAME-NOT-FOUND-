import { Camera, CameraView } from 'expo-camera';
import { Platform } from 'react-native';

export interface CameraFrameResult {
  uri: string;
  width: number;
  height: number;
  timestamp: number;
}

export type CameraPermissionStatus = 'granted' | 'denied' | 'undetermined';

class CameraService {
  private isCameraReady: boolean = false;

  /**
   * Check current camera permission status
   */
  public async getPermissionStatus(): Promise<CameraPermissionStatus> {
    try {
      const permission = await Camera.getCameraPermissionsAsync();
      if (permission.granted) return 'granted';
      if (permission.canAskAgain) return 'undetermined';
      return 'denied';
    } catch (err) {
      console.warn('[CameraService] Permission check error:', err);
      return 'undetermined';
    }
  }

  /**
   * Request camera permission on-demand when vision feature is invoked
   */
  public async requestCameraPermission(): Promise<boolean> {
    try {
      const response = await Camera.requestCameraPermissionsAsync();
      return response.granted;
    } catch (err) {
      console.warn('[CameraService] Permission request error:', err);
      return false;
    }
  }

  /**
   * Capture a single frame on-demand for vision processing
   * Optimized for fast on-device perception (0.6 quality, skip processing)
   */
  public async captureFrameFromRef(
    cameraRef: React.RefObject<CameraView> | { current: CameraView | null }
  ): Promise<CameraFrameResult | null> {
    if (!cameraRef.current) {
      console.warn('[CameraService] Camera ref is null during capture');
      return null;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
        shutterSound: false,
      });

      if (!photo || !photo.uri) {
        return null;
      }

      return {
        uri: photo.uri,
        width: photo.width || 1280,
        height: photo.height || 720,
        timestamp: Date.now(),
      };
    } catch (err) {
      console.error('[CameraService] Error taking picture:', err);
      return null;
    }
  }

  public setCameraReady(ready: boolean): void {
    this.isCameraReady = ready;
  }

  public getIsCameraReady(): boolean {
    return this.isCameraReady;
  }
}

export const cameraService = new CameraService();
