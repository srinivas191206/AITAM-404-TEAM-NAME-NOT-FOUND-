import { LOCAL_GROQ_KEYS } from '../config/groqKeys.local';
import { geminiVisionService } from './geminiVisionService';
import { ttsService } from './ttsService';

class GroqVisionService {
  private keys: string[] = [];
  private currentKeyIndex = 0;
  private rateLimitedKeys: Set<string> = new Set();

  constructor() {
    this.keys = Array.isArray(LOCAL_GROQ_KEYS) ? LOCAL_GROQ_KEYS : [];
  }

  private getActiveKey(): string | null {
    if (this.keys.length === 0) return null;

    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentKeyIndex + i) % this.keys.length;
      const key = this.keys[idx];
      if (!this.rateLimitedKeys.has(key)) {
        this.currentKeyIndex = idx;
        return key;
      }
    }
    this.rateLimitedKeys.clear();
    return this.keys[0] || null;
  }

  private markKeyRateLimited(key: string) {
    console.warn(`[GroqVisionService] Rate limit / error on key ending ...${key.slice(-6)}. Rotating key.`);
    this.rateLimitedKeys.add(key);
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
  }

  public hasActiveKeys(): boolean {
    return this.keys.length > 0;
  }

  /**
   * Primary Vision Pipeline: Multi-Key Groq LLaMA 3.2 Vision
   * Fallback: Gemini 1.5 Flash Vision
   */
  public async analyzeWithVision(
    base64Image: string,
    prompt: string
  ): Promise<string | null> {
    if (!base64Image || this.keys.length === 0) {
      return await geminiVisionService.analyzeVision(base64Image, prompt);
    }

    const currentLang = ttsService.getLanguage().slice(0, 2);
    const systemPrompt =
      currentLang === 'te'
        ? 'నమస్కారం! జవాబును పూర్తిగా సరళమైన తెలుగు భాషలో అందించండి.'
        : currentLang === 'hi'
        ? 'नमस्ते! उत्तर पूरी तरह से सरल हिंदी भाषा में दें।'
        : 'Please respond clearly in simple English.';

    for (let attempt = 0; attempt < 3; attempt++) {
      const activeKey = this.getActiveKey();
      if (!activeKey) break;

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.2-11b-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: `${systemPrompt}\n${prompt}` },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            temperature: 0.2,
            max_tokens: 300,
          }),
        });

        if (response.status === 429 || response.status === 401 || response.status === 403) {
          this.markKeyRateLimited(activeKey);
          continue;
        }

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`[GroqVisionService] API Error (${response.status}):`, errBody);
          this.markKeyRateLimited(activeKey);
          continue;
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content && content.trim().length > 0) {
          return content.trim();
        }
      } catch (err) {
        console.warn(`[GroqVisionService] Request error:`, err);
        this.markKeyRateLimited(activeKey);
      }
    }

    // TIER 2: GEMINI 1.5 FLASH FALLBACK
    const geminiResult = await geminiVisionService.analyzeVision(base64Image, prompt);
    if (geminiResult) {
      return geminiResult;
    }

    return null;
  }

  public async describeScene(base64Image: string): Promise<string | null> {
    const prompt =
      'Describe the scene and key objects around the user clearly. Mention spatial positions (left, ahead, right) and whether indoors or outdoors.';
    return await this.analyzeWithVision(base64Image, prompt);
  }

  public async identifyCurrency(base64Image: string): Promise<string | null> {
    const prompt =
      'Identify the exact Indian Rupee (INR) currency note denomination shown in the photo (e.g. ₹500, ₹200, ₹100, ₹50, ₹20, ₹10, ₹2000). State only the denomination clearly like "This appears to be a five hundred rupee note." If no currency is visible, state "I couldn\'t identify the note clearly."';
    return await this.analyzeWithVision(base64Image, prompt);
  }

  public async readText(base64Image: string): Promise<string | null> {
    const prompt =
      'Read and recite all readable printed text from this image clearly and concisely.';
    return await this.analyzeWithVision(base64Image, prompt);
  }

  public async answerVisualQuery(base64Image: string, userQuestion: string): Promise<string | null> {
    return await this.analyzeWithVision(base64Image, userQuestion);
  }

  public async transcribeAudio(fileUri: string, langCode?: string): Promise<string | null> {
    if (!fileUri || this.keys.length === 0) return null;

    const targetLang = (langCode || ttsService.getLanguage()).slice(0, 2);

    for (let attempt = 0; attempt < 3; attempt++) {
      const activeKey = this.getActiveKey();
      if (!activeKey) break;

      try {
        const formData = new FormData();
        formData.append('file', {
          uri: fileUri,
          type: 'audio/m4a',
          name: 'audio.m4a',
        } as any);
        formData.append('model', 'whisper-large-v3');
        formData.append('temperature', '0.0');
        if (targetLang === 'te' || targetLang === 'hi' || targetLang === 'en') {
          formData.append('language', targetLang);
        }

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeKey}`,
          },
          body: formData,
        });

        if (response.status === 429 || response.status === 401 || response.status === 403) {
          this.markKeyRateLimited(activeKey);
          continue;
        }

        if (!response.ok) {
          this.markKeyRateLimited(activeKey);
          continue;
        }

        const data = await response.json();
        if (data?.text && data.text.trim().length > 0) {
          return data.text.trim();
        }
      } catch (err) {
        console.warn(`[GroqVisionService] Transcription error:`, err);
        this.markKeyRateLimited(activeKey);
      }
    }

    return null;
  }
}

export const groqVisionService = new GroqVisionService();
