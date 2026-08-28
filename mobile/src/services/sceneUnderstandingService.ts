export interface SceneDescriptionResult {
  status: 'placeholder' | 'ready';
  message: string;
}

class SceneUnderstandingService {
  public async describeScene(): Promise<SceneDescriptionResult> {
    return {
      status: 'placeholder',
      message: 'Describing your surroundings. Scene understanding is being prepared.',
    };
  }
}

export const sceneUnderstandingService = new SceneUnderstandingService();
