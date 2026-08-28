import { DetectionResult, BoundingBox } from './objectDetectionService';

export type HorizontalPosition = 'LEFT' | 'CENTER' | 'RIGHT';
export type VerticalPosition = 'UPPER' | 'MIDDLE' | 'LOWER';
export type ProximityZone = 'IMMEDIATE' | 'MID_RANGE' | 'FAR';

export interface SpatialObject {
  id: string;
  label: string;
  confidence: number;
  boundingBox: BoundingBox;
  horizontalPosition: HorizontalPosition;
  verticalPosition: VerticalPosition;
  proximityZone: ProximityZone;
  frameAreaRatio: number;
  priorityScore: number;
  naturalSpatialPhrase: string;
}

export interface SpatialAnalysisResult {
  hasDetections: boolean;
  totalDetections: number;
  primaryObjects: SpatialObject[];
  spokenSummary: string;
  hasMovementRelevantObstacle: boolean;
}

class SpatialAwarenessService {
  /**
   * Classify horizontal frame sector (0% to 100% width)
   * 0.00 - 0.33: LEFT
   * 0.33 - 0.67: CENTER
   * 0.67 - 1.00: RIGHT
   */
  public classifyHorizontal(centerX: number, imageWidth: number = 1000): HorizontalPosition {
    const ratio = centerX / imageWidth;
    if (ratio < 0.33) return 'LEFT';
    if (ratio > 0.67) return 'RIGHT';
    return 'CENTER';
  }

  /**
   * Classify vertical image sector (0% to 100% height)
   * 0.00 - 0.33: UPPER
   * 0.33 - 0.67: MIDDLE
   * 0.67 - 1.00: LOWER
   */
  public classifyVertical(centerY: number, imageHeight: number = 1000): VerticalPosition {
    const ratio = centerY / imageHeight;
    if (ratio < 0.33) return 'UPPER';
    if (ratio > 0.67) return 'LOWER';
    return 'MIDDLE';
  }

  /**
   * Calculate qualitative proximity zone based on bounding box proportion in frame
   * (Strictly on-screen bounding size, never fake physical metric distances)
   */
  public classifyProximity(boxAreaRatio: number): ProximityZone {
    if (boxAreaRatio > 0.25) return 'IMMEDIATE';
    if (boxAreaRatio > 0.06) return 'MID_RANGE';
    return 'FAR';
  }

  /**
   * Calculate priority weight based on accessibility relevance for blind mobility
   */
  public calculatePriority(label: string, confidence: number, horizontal: HorizontalPosition, areaRatio: number): number {
    let baseWeight = 1;
    const l = label.toLowerCase();

    // Priority 1: People
    if (l === 'person') baseWeight = 10;
    // Priority 2: Vehicles
    else if (['car', 'bus', 'truck', 'motorcycle', 'bicycle'].includes(l)) baseWeight = 9;
    // Priority 3: Large furniture / structural obstacles
    else if (['chair', 'couch', 'dining table', 'bench', 'bed', 'door', 'traffic light', 'stop sign'].includes(l)) baseWeight = 8;
    // Priority 4: Handheld everyday objects
    else if (['bottle', 'cup', 'cell phone', 'laptop', 'book', 'backpack', 'handbag', 'suitcase'].includes(l)) baseWeight = 6;
    // Priority 5: Animals
    else if (['dog', 'cat'].includes(l)) baseWeight = 5;

    // Center objects receive higher relevance for walking trajectory
    const centerBonus = horizontal === 'CENTER' ? 2 : 0;
    // Larger objects in frame receive prominence boost
    const sizeBonus = Math.min(3, areaRatio * 10);

    return baseWeight * 10 + centerBonus + sizeBonus + confidence * 2;
  }

  /**
   * Convert horizontal position to clear, natural assistive phrasing
   */
  public getNaturalPositionPhrase(horizontal: HorizontalPosition, label: string): string {
    const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
    const name = label === 'person' ? 'person' : label;

    switch (horizontal) {
      case 'LEFT':
        return `${article} ${name} slightly to your left`;
      case 'RIGHT':
        return `${article} ${name} slightly to your right`;
      case 'CENTER':
      default:
        return `${article} ${name} ahead of you`;
    }
  }

  /**
   * Perform comprehensive spatial analysis on raw detections
   */
  public analyzeSpatialScene(
    detections: DetectionResult[],
    imageWidth: number = 1080,
    imageHeight: number = 1920
  ): SpatialAnalysisResult {
    if (!detections || detections.length === 0) {
      return {
        hasDetections: false,
        totalDetections: 0,
        primaryObjects: [],
        spokenSummary: "I couldn't identify anything clearly. Please try again.",
        hasMovementRelevantObstacle: false,
      };
    }

    const totalFrameArea = imageWidth * imageHeight;

    // 1. Map to SpatialObjects with coordinates and priorities
    const spatialObjects: SpatialObject[] = detections.map((det) => {
      const boxArea = det.boundingBox.width * det.boundingBox.height;
      const frameAreaRatio = Math.min(1.0, boxArea / totalFrameArea);
      const horizontal = this.classifyHorizontal(det.centerX, imageWidth);
      const vertical = this.classifyVertical(det.centerY, imageHeight);
      const proximity = this.classifyProximity(frameAreaRatio);
      const priorityScore = this.calculatePriority(det.label, det.confidence, horizontal, frameAreaRatio);
      const naturalSpatialPhrase = this.getNaturalPositionPhrase(horizontal, det.label);

      return {
        id: det.id,
        label: det.label,
        confidence: det.confidence,
        boundingBox: det.boundingBox,
        horizontalPosition: horizontal,
        verticalPosition: vertical,
        proximityZone: proximity,
        frameAreaRatio,
        priorityScore,
        naturalSpatialPhrase,
      };
    });

    // 2. Sort by priority score descending
    spatialObjects.sort((a, b) => b.priorityScore - a.priorityScore);

    // 3. Limit to top 2-3 most useful objects to prevent auditory cognitive fatigue
    const primaryObjects = spatialObjects.slice(0, 3);

    // 4. Generate natural assistive sentence
    let spokenSummary = '';
    if (primaryObjects.length === 1) {
      spokenSummary = `There is ${primaryObjects[0].naturalSpatialPhrase}.`;
    } else if (primaryObjects.length === 2) {
      spokenSummary = `I see ${primaryObjects[0].naturalSpatialPhrase} and ${primaryObjects[1].naturalSpatialPhrase}.`;
    } else {
      spokenSummary = `I see ${primaryObjects[0].naturalSpatialPhrase}, ${primaryObjects[1].naturalSpatialPhrase}, and ${primaryObjects[2].naturalSpatialPhrase}.`;
    }

    // 5. Determine if high-priority movement-relevant object is present
    const hasMovementRelevantObstacle = primaryObjects.some(
      (obj) => ['person', 'car', 'bus', 'truck', 'motorcycle', 'bicycle', 'chair', 'couch', 'dining table'].includes(obj.label.toLowerCase())
    );

    return {
      hasDetections: true,
      totalDetections: detections.length,
      primaryObjects,
      spokenSummary,
      hasMovementRelevantObstacle,
    };
  }
}

export const spatialAwarenessService = new SpatialAwarenessService();
