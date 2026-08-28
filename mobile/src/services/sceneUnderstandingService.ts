import { CameraFrameResult } from './cameraService';
import {
  objectDetectionService,
  DetectionResult,
  DetectionPipelineResult,
} from './objectDetectionService';
import { SpatialAnalysisResult } from './spatialAwarenessService';

export type EnvironmentType =
  | 'INDOOR_ROOM'
  | 'OFFICE_SPACE'
  | 'CORRIDOR_HALLWAY'
  | 'OUTDOOR_AREA'
  | 'STREET_ENVIRONMENT'
  | 'GENERAL_ENVIRONMENT';

export interface SceneElement {
  name: string;
  horizontalSector: 'LEFT' | 'CENTER' | 'RIGHT';
  confidence: number;
}

export interface SceneResult {
  environmentType?: EnvironmentType;
  environmentDescription?: string;
  elements: SceneElement[];
  summary: string;
  spokenText: string;
  confidence: number;
}

export interface SceneProcessingResult {
  success: boolean;
  message: string;
  sceneResult?: SceneResult;
  inferenceTimeMs: number;
  error?: string;
}

class SceneUnderstandingService {
  private isProcessing: boolean = false;

  /**
   * Infer general environment context from detected object distribution
   */
  public inferEnvironment(detections: DetectionResult[]): {
    type: EnvironmentType;
    description: string;
  } | null {
    if (!detections || detections.length === 0) return null;

    const names = detections.map((d) => d.label.toLowerCase());

    const hasOfficeItems = names.some((n) =>
      ['laptop', 'keyboard', 'mouse', 'desk', 'tv', 'chair'].includes(n)
    );
    const hasOutdoorItems = names.some((n) =>
      ['car', 'bus', 'truck', 'traffic light', 'stop sign', 'bicycle', 'motorcycle'].includes(n)
    );
    const hasIndoorFurniture = names.some((n) =>
      ['couch', 'bed', 'dining table', 'refrigerator', 'potted plant'].includes(n)
    );

    if (hasOutdoorItems) {
      return {
        type: 'OUTDOOR_AREA',
        description: 'an outdoor area',
      };
    }

    if (hasOfficeItems && hasIndoorFurniture) {
      return {
        type: 'INDOOR_ROOM',
        description: 'an indoor room',
      };
    }

    if (hasOfficeItems) {
      return {
        type: 'OFFICE_SPACE',
        description: 'an office-like space',
      };
    }

    if (hasIndoorFurniture) {
      return {
        type: 'INDOOR_ROOM',
        description: 'an indoor room',
      };
    }

    return null;
  }

  /**
   * Synthesize concise 1-2 sentence scene description for blind user
   */
  public synthesizeSceneNarrative(
    detections: DetectionResult[],
    spatial: SpatialAnalysisResult | null,
    environment: { type: EnvironmentType; description: string } | null
  ): string {
    if (!detections || detections.length === 0) {
      return "I couldn't understand the scene clearly. Please try again.";
    }

    // Prioritize top elements
    const topDetections = detections.slice(0, 3);
    const leftItems = topDetections.filter((d) => d.position === 'LEFT');
    const centerItems = topDetections.filter((d) => d.position === 'CENTER');
    const rightItems = topDetections.filter((d) => d.position === 'RIGHT');

    const phrases: string[] = [];

    if (leftItems.length > 0) {
      const itemNames = leftItems
        .map((i) =>
          ['a', 'e', 'i', 'o', 'u'].includes(i.label[0].toLowerCase())
            ? `an ${i.label}`
            : `a ${i.label}`
        )
        .join(' and ');
      phrases.push(`${itemNames} on your left`);
    }

    if (centerItems.length > 0) {
      const itemNames = centerItems
        .map((i) =>
          ['a', 'e', 'i', 'o', 'u'].includes(i.label[0].toLowerCase())
            ? `an ${i.label}`
            : `a ${i.label}`
        )
        .join(' and ');
      phrases.push(`${itemNames} ahead`);
    }

    if (rightItems.length > 0) {
      const itemNames = rightItems
        .map((i) =>
          ['a', 'e', 'i', 'o', 'u'].includes(i.label[0].toLowerCase())
            ? `an ${i.label}`
            : `a ${i.label}`
        )
        .join(' and ');
      phrases.push(`${itemNames} on your right`);
    }

    let objectsSentence = '';
    if (phrases.length === 1) {
      objectsSentence = `I see ${phrases[0]}.`;
    } else if (phrases.length === 2) {
      objectsSentence = `I see ${phrases[0]}, with ${phrases[1]}.`;
    } else if (phrases.length >= 3) {
      objectsSentence = `I see ${phrases[0]}, ${phrases[1]}, and ${phrases[2]}.`;
    } else {
      objectsSentence = spatial ? spatial.spokenSummary : 'I see a clear space ahead.';
    }

    if (environment) {
      return `This looks like ${environment.description}. ${objectsSentence}`;
    }

    return objectsSentence;
  }

  /**
   * Execute on-device Scene Understanding on captured camera frame
   */
  public async describeScene(frame: CameraFrameResult): Promise<SceneProcessingResult> {
    const startTime = Date.now();

    if (!frame || !frame.uri) {
      return {
        success: false,
        message: "I couldn't analyze the view. Please try again.",
        inferenceTimeMs: 0,
        error: 'invalid_frame',
      };
    }

    try {
      this.isProcessing = true;

      // 1. Reuse existing On-Device Object Detection + Spatial Awareness (Phase 5)
      const detectionPipeline: DetectionPipelineResult =
        await objectDetectionService.detectObjects(frame);

      // 2. Infer environment context
      const environment = this.inferEnvironment(detectionPipeline.detections);

      // 3. Synthesize natural 1-2 sentence narrative
      const spokenText = this.synthesizeSceneNarrative(
        detectionPipeline.detections,
        detectionPipeline.spatialAnalysis,
        environment
      );

      const sceneElements: SceneElement[] = detectionPipeline.detections.map((d) => ({
        name: d.label,
        horizontalSector: d.position,
        confidence: d.confidence,
      }));

      const sceneResult: SceneResult = {
        environmentType: environment?.type,
        environmentDescription: environment?.description,
        elements: sceneElements,
        summary: spokenText,
        spokenText,
        confidence: 0.9,
      };

      const inferenceTimeMs = Date.now() - startTime;

      return {
        success: true,
        message: spokenText,
        sceneResult,
        inferenceTimeMs,
      };
    } catch (err) {
      console.error('[SceneUnderstandingService] Error:', err);
      return {
        success: false,
        message: "I couldn't analyze the view. Please try again.",
        inferenceTimeMs: Date.now() - startTime,
        error: String(err),
      };
    } finally {
      this.isProcessing = false;
    }
  }

  public getIsProcessing(): boolean {
    return this.isProcessing;
  }
}

export const sceneUnderstandingService = new SceneUnderstandingService();
