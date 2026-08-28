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
import { Spacing } from '../../theme/spacing';

interface ScenePerceptionScreenProps {
  initialTask?: VisionTaskType;
  onBack?: () => void;
}

export const ScenePerceptionScreen: React.FC<ScenePerceptionScreenProps> = ({
  initialTask = 'scene_description',
  onBack,
}) => {
  const [currentTask, setCurrentTask] = useState<VisionTaskType>(initialTask);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: palette.accentTeal }]}>← BACK</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.headerTitle, { color: palette.primaryText }]}>{getTaskDisplayName(currentTask)}</Text>
      </View>

      {/* TASK SWITCHER BAR */}
      <View style={[styles.taskSwitcher, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <TouchableOpacity
          onPress={() => setCurrentTask('scene_description')}
          style={[
            styles.taskChip,
            currentTask === 'scene_description'
              ? { backgroundColor: palette.accentTeal, borderColor: palette.accentTeal }
              : { backgroundColor: palette.background, borderColor: palette.border },
          ]}
        >
          <Text
            style={[
              styles.taskChipText,
              { color: currentTask === 'scene_description' ? '#FFFFFF' : palette.primaryText },
            ]}
          >
            🔍 Scene
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentTask('ocr_text')}
          style={[
            styles.taskChip,
            currentTask === 'ocr_text'
              ? { backgroundColor: palette.accentTeal, borderColor: palette.accentTeal }
              : { backgroundColor: palette.background, borderColor: palette.border },
          ]}
        >
          <Text
            style={[
              styles.taskChipText,
              { color: currentTask === 'ocr_text' ? '#FFFFFF' : palette.primaryText },
            ]}
          >
            📄 Read Text
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentTask('currency_recognition')}
          style={[
            styles.taskChip,
            currentTask === 'currency_recognition'
              ? { backgroundColor: palette.accentTeal, borderColor: palette.accentTeal }
              : { backgroundColor: palette.background, borderColor: palette.border },
          ]}
        >
          <Text
            style={[
              styles.taskChipText,
              { color: currentTask === 'currency_recognition' ? '#FFFFFF' : palette.primaryText },
            ]}
          >
            💵 Currency
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCurrentTask('obstacle_detection')}
          style={[
            styles.taskChip,
            currentTask === 'obstacle_detection'
              ? { backgroundColor: palette.accentTeal, borderColor: palette.accentTeal }
              : { backgroundColor: palette.background, borderColor: palette.border },
          ]}
        >
          <Text
            style={[
              styles.taskChipText,
              { color: currentTask === 'obstacle_detection' ? '#FFFFFF' : palette.primaryText },
            ]}
          >
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
      {result ? (
        <View style={[styles.resultCard, { backgroundColor: palette.card, borderTopColor: palette.accentTeal }]}>
          <ScrollView style={styles.resultScroll}>
            <Text style={[styles.resultHeader, { color: palette.accentTeal }]}>ANALYSIS RESULT</Text>
            <Text style={[styles.resultDescription, { color: palette.primaryText }]}>
              {result.primaryDescription}
            </Text>
          </ScrollView>

          <AccessibleButton
            title="🔊 Repeat Description"
            size="normal"
            variant="teal"
            onPress={() => outputService.announce(result.primaryDescription, 'high')}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontWeight: '800',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  taskSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  taskChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  taskChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cameraContainer: {
    flex: 1,
  },
  resultCard: {
    maxHeight: 220,
    borderTopWidth: 3,
    padding: 16,
  },
  resultScroll: {
    maxHeight: 120,
    marginBottom: 8,
  },
  resultHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
