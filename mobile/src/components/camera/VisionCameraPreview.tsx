import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { CameraView } from 'expo-camera';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

interface VisionCameraPreviewProps {
  cameraRef: React.RefObject<CameraView>;
  isActive: boolean;
  onCameraReady?: () => void;
  onMountError?: (error: any) => void;
  style?: StyleProp<ViewStyle>;
}

export const VisionCameraPreview: React.FC<VisionCameraPreviewProps> = ({
  cameraRef,
  isActive,
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
      accessibilityLabel="Camera perception viewport is active and capturing frames."
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
        <View style={styles.overlay}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />

          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activePillText}>PERCEPTION ACTIVE</Text>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.blindBorder,
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
});
