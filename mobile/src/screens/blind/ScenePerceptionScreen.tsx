import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CameraViewfinder } from '../../components/CameraViewfinder';
import { aiVisionService, VisionTaskType, VisionAnalysisResult } from '../../services/aiVisionService';
import { outputService } from '../../services/outputService';
import { AccessibleButton } from '../../components/AccessibleButton';
import { Colors } from '../../theme/colors';

interface ScenePerceptionScreenProps {
  initialTask?: VisionTaskType;
  onBack: () => void;
}

export const ScenePerceptionScreen: React.FC<ScenePerceptionScreenProps> = ({
  initialTask = 'scene_description',
  onBack,
}) => {
  const [currentTask, setCurrentTask] = useState<VisionTaskType>(initialTask);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);

  useEffect(() => {
    outputService.announce(
      `Camera active for ${getTaskDisplayName(currentTask)}. Tap shutter to analyze.`,
      'high'
    );
  }, [currentTask]);

  const getTaskDisplayName = (task: VisionTaskType) => {
    switch (task) {
      case 'scene_description':
        return 'Scene Understanding';
      case 'ocr_text':
        return 'Text & Document Reading';
      case 'currency_recognition':
        return 'Currency Recognition';
      case 'obstacle_detection':
        return 'Obstacle Detection';
      case 'signboard_reading':
        return 'Signboard Reading';
    }
  };

  const handleCaptureFrame = async (base64: string) => {
    setIsProcessing(true);
    outputService.announce('Analyzing image. Please hold steady.');

    const analysis = await aiVisionService.analyzeImage(base64, currentTask);
    setResult(analysis);
    setIsProcessing(false);

    outputService.announce(analysis.primaryDescription, 'urgent');

    if (analysis.safeToWalk === false) {
      outputService.triggerHaptic('warning');
    } else {
      outputService.triggerHaptic('info');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          accessible={true}
          accessibilityLabel="Back to Dashboard"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTaskDisplayName(currentTask)}</Text>
      </View>

      {/* TASK SWITCHER BAR */}
      <View style={styles.taskSwitcher}>
        <TouchableOpacity
          onPress={() => setCurrentTask('scene_description')}
          style={[styles.taskChip, currentTask === 'scene_description' && styles.taskChipActive]}
        >
          <Text style={[styles.taskChipText, currentTask === 'scene_description' && styles.taskChipTextActive]}>
            🔍 Scene
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentTask('ocr_text')}
          style={[styles.taskChip, currentTask === 'ocr_text' && styles.taskChipActive]}
        >
          <Text style={[styles.taskChipText, currentTask === 'ocr_text' && styles.taskChipTextActive]}>
            📄 Read Text
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentTask('currency_recognition')}
          style={[styles.taskChip, currentTask === 'currency_recognition' && styles.taskChipActive]}
        >
          <Text style={[styles.taskChipText, currentTask === 'currency_recognition' && styles.taskChipTextActive]}>
            💵 Currency
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentTask('obstacle_detection')}
          style={[styles.taskChip, currentTask === 'obstacle_detection' && styles.taskChipActive]}
        >
          <Text style={[styles.taskChipText, currentTask === 'obstacle_detection' && styles.taskChipTextActive]}>
            ⚠️ Obstacles
          </Text>
        </TouchableOpacity>
      </View>

      {/* SHARED CAMERA VIEW */}
      <View style={styles.cameraContainer}>
        <CameraViewfinder
          onCaptureFrame={handleCaptureFrame}
          isProcessing={isProcessing}
          instructionText={`Tap shutter below to analyze ${getTaskDisplayName(currentTask)}`}
        />
      </View>

      {/* RESULT CARD */}
      {result && (
        <View style={styles.resultCard}>
          <ScrollView style={styles.resultScroll}>
            <Text style={styles.resultHeader}>ANALYSIS RESULT</Text>
            <Text style={styles.resultDescription}>{result.primaryDescription}</Text>
          </ScrollView>

          <AccessibleButton
            title="🔊 Repeat Description"
            size="normal"
            variant="primary"
            onPress={() => outputService.announce(result.primaryDescription, 'high')}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceInteractive,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  backButtonText: {
    color: Colors.blindPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    flex: 1,
  },
  taskSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.surfaceInteractive,
    gap: 8,
  },
  taskChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  taskChipActive: {
    backgroundColor: Colors.blindPrimary,
    borderColor: Colors.blindBorder,
  },
  taskChipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  taskChipTextActive: {
    color: '#121110',
  },
  cameraContainer: {
    flex: 1,
  },
  resultCard: {
    maxHeight: 220,
    backgroundColor: Colors.surfaceElevated,
    borderTopWidth: 3,
    borderColor: Colors.blindPrimary,
    padding: 16,
  },
  resultScroll: {
    maxHeight: 120,
    marginBottom: 8,
  },
  resultHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.blindPrimary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textHighEmphasis,
    lineHeight: 24,
  },
});
