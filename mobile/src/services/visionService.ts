export interface VisionQueryResult {
  status: 'placeholder' | 'ready';
  message: string;
}

class VisionService {
  public async queryVision(): Promise<VisionQueryResult> {
    return {
      status: 'placeholder',
      message: 'Checking what is in front of you. Camera vision is being prepared.',
    };
  }
}

export const visionService = new VisionService();
