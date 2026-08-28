import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { hapticService } from '../services/hapticService';

interface CameraViewfinderProps {
  onCaptureFrame: (base64: string) => void;
  isProcessing?: boolean;
  instructionText?: string;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onCaptureFrame,
  isProcessing = false,
  instructionText = 'Point camera forward and tap capture',
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.permissionText}>Loading camera status...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          Access+ requires camera access to recognize scenes, obstacles, currency, and text.
        </Text>
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Grant Camera Permission"
          style={styles.grantButton}
          onPress={requestPermission}
        >
          <Text style={styles.grantButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (cameraRef.current && !isCapturing && !isProcessing) {
      try {
        setIsCapturing(true);
        await hapticService.medium();

        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.6, // Optimal for fast mobile multimodal upload
          skipProcessing: true,
        });

        if (photo?.base64) {
          onCaptureFrame(photo.base64);
        }
      } catch (err) {
        console.warn('Camera snapshot error:', err);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.overlay}>
          <View style={styles.instructionBanner}>
            <Text style={styles.instructionText}>{instructionText}</Text>
          </View>

          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Capture frame for visual analysis"
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={handleCapture}
            disabled={isCapturing || isProcessing}
            style={[styles.shutterButton, (isCapturing || isProcessing) && styles.disabledShutter]}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color="#000000" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  instructionBanner: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD700',
    marginTop: 10,
  },
  instructionText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  shutterButton: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    marginBottom: 20,
    elevation: 8,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6C200',
  },
  disabledShutter: {
    opacity: 0.6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E17',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  grantButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  grantButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
  },
});
