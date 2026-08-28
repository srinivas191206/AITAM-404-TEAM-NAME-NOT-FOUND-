import { Camera, CameraView } from 'expo-camera';
import { Platform } from 'react-native';

export interface CameraFrameResult {
  uri: string;
  width: number;
  height: number;
  timestamp: number;
  base64?: string;
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
   * Capture a single frame on-demand for vision processing with real Base64 image payload
   */
  public async captureFrameFromRef(
    cameraRef: React.RefObject<CameraView> | { current: CameraView | null }
  ): Promise<CameraFrameResult | null> {
    // Wait up to 1200ms if ref is attaching
    let attempts = 0;
    while (!cameraRef.current && attempts < 12) {
      await new Promise((r) => setTimeout(r, 100));
      attempts++;
    }

    if (!cameraRef.current) {
      console.warn('[CameraService] Camera ref remained null during capture');
      return null;
    }

    for (let tryCount = 0; tryCount < 2; tryCount++) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6,
          base64: true,
          skipProcessing: false,
          shutterSound: false,
        });

        if (photo && photo.uri) {
          return {
            uri: photo.uri,
            width: photo.width || 1280,
            height: photo.height || 720,
            timestamp: Date.now(),
            base64: photo.base64,
          };
        }
      } catch (err) {
        console.warn(`[CameraService] Capture attempt ${tryCount + 1} note:`, err);
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    return null;
  }

  public setCameraReady(ready: boolean): void {
    this.isCameraReady = ready;
  }

  public getIsCameraReady(): boolean {
    return this.isCameraReady;
  }
}

export const cameraService = new CameraService();
