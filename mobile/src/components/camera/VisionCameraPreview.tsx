import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { CameraView } from 'expo-camera';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { DetectionResult } from '../../services/objectDetectionService';

interface VisionCameraPreviewProps {
  cameraRef: React.RefObject<CameraView>;
  isActive: boolean;
  detections?: DetectionResult[];
  onCameraReady?: () => void;
  onMountError?: (error: any) => void;
  style?: StyleProp<ViewStyle>;
}

export const VisionCameraPreview: React.FC<VisionCameraPreviewProps> = ({
  cameraRef,
  isActive,
  detections = [],
  onCameraReady,
  onMountError,
  style,
}) => {
  const [isReady, setIsReady] = useState(false);

  if (!isActive) {
    return (
      <View
        accessible={true}
        accessibilityLabel="Camera perception viewport is currently idle."
        style={[styles.idleContainer, style]}
      >
        <View style={styles.idlePlaceholder}>
          <Text style={styles.idleIcon}>📷</Text>
          <Text style={styles.idleTitle}>Camera Perception Ready</Text>
          <Text style={styles.idleSubtitle}>
            Activates automatically when you ask "What's in front of me?"
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      accessible={true}
      accessibilityLabel={`Camera perception viewport is active. ${detections.length} objects detected.`}
      style={[styles.activeContainer, style]}
    >
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        enableTorch={false}
        onCameraReady={() => {
          setIsReady(true);
          onCameraReady?.();
        }}
        onMountError={(err) => {
          console.warn('[VisionCameraPreview] Camera mount error:', err);
          onMountError?.(err);
        }}
      >
        {/* CALM ACCESSIBLE VIEWPORT CORNERS */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />

          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activePillText}>
              PERCEPTION ACTIVE {detections.length > 0 ? `(${detections.length} DETECTED)` : ''}
            </Text>
          </View>

          {/* VISUAL DEBUG BOUNDING BOXES (DEVELOPMENT / ACCESSIBILITY HUD) */}
          {detections.map((det) => (
            <View
              key={det.id}
              style={[
                styles.detectionBox,
                {
                  left: det.position === 'LEFT' ? '10%' : det.position === 'RIGHT' ? '55%' : '30%',
                  top: det.position === 'LEFT' ? '25%' : '35%',
                  width: '35%',
                  height: '45%',
                },
              ]}
            >
              <View style={styles.detectionBadge}>
                <Text style={styles.detectionBadgeText}>
                  {det.label.toUpperCase()} {Math.round(det.confidence * 100)}% [{det.position}]
                </Text>
              </View>
            </View>
          ))}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  idleContainer: {
    height: 180,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusMd,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    overflow: 'hidden',
  },
  idlePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  idleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.3,
  },
  idleSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMediumEmphasis,
    textAlign: 'center',
    marginTop: 2,
    maxWidth: 260,
  },
  activeContainer: {
    height: 220,
    borderRadius: Spacing.radiusMd,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: Colors.blindPrimary,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.blindPrimary,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.blindPrimary,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.blindPrimary,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.blindPrimary,
  },
  activePill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.blindBorder,
    zIndex: 10,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: Spacing.xs,
  },
  activePillText: {
    color: Colors.blindPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detectionBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: Spacing.radiusSm,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  detectionBadge: {
    position: 'absolute',
    top: -18,
    left: 0,
    backgroundColor: '#22C55E',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  detectionBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
