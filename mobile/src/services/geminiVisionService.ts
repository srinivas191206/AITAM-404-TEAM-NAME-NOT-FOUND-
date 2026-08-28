/**
 * Gemini 1.5 Flash Vision Fallback Service
 * Automatic Multi-Key Rotation across 10 Gemini API Keys
 */

import { LOCAL_GEMINI_KEYS } from '../config/geminiKeys.local';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

class GeminiVisionService {
  private keys: string[] = [...LOCAL_GEMINI_KEYS];
  private currentKeyIndex: number = 0;
  private keyCooldowns: Map<string, number> = new Map();

  constructor() {
    this.keys = [...LOCAL_GEMINI_KEYS];
  }

  public setKeys(newKeys: string[]) {
    this.keys = newKeys.filter((k) => typeof k === 'string' && k.trim().length > 10);
  }

  private getActiveKey(): string {
    if (this.keys.length === 0) return '';
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentKeyIndex + i) % this.keys.length;
      const key = this.keys[idx];
      const cooldownUntil = this.keyCooldowns.get(key) || 0;

      if (now > cooldownUntil) {
        this.currentKeyIndex = idx;
        return key;
      }
    }
    const fallbackKey = this.keys[this.currentKeyIndex] || '';
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    return fallbackKey;
  }

  private markKeyRateLimited(key: string) {
    console.warn(`[GeminiVisionService] Key rate limited. Rotating to next Gemini key in pool...`);
    this.keyCooldowns.set(key, Date.now() + 60000); // 1-minute cooldown
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
  }

  public async analyzeVision(
    base64Image: string,
    prompt: string,
    maxRetries: number = 5
  ): Promise<string | null> {
    if (!base64Image || this.keys.length === 0) return null;

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const activeKey = this.getActiveKey();
      if (!activeKey) break;

      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${activeKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${prompt} Answer in 1 or 2 concise, natural sentences suitable for a blind user listening to audio. Speak directly as if you are their eyes.`,
                  },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (response.status === 429 || response.status === 401 || response.status === 403) {
          this.markKeyRateLimited(activeKey);
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[GeminiVisionService] API Error (${response.status}):`, errText);
          this.markKeyRateLimited(activeKey);
          continue;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return text;
        }
      } catch (err) {
        console.warn(`[GeminiVisionService] Request error:`, err);
        this.markKeyRateLimited(activeKey);
      }
    }

    return null;
  }
}

export const geminiVisionService = new GeminiVisionService();
