export interface OcrQueryResult {
  status: 'placeholder' | 'ready';
  message: string;
}

class OCRService {
  public async readText(): Promise<OcrQueryResult> {
    return {
      status: 'placeholder',
      message: 'Reading text and document content. OCR reading is being prepared.',
    };
  }
}

export const ocrService = new OCRService();
