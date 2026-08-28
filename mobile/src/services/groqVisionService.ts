/**
 * Groq Vision & AI Service with Automatic Multi-Key Rotation and Failover
 * ZERO SECRETS IN CODE - Keys are loaded from local gitignored vault
 */

let KEY_POOL: string[] = [];

try {
  // Dynamic import of local untracked key config
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const localVault = require('../config/groqKeys.local');
  if (localVault && Array.isArray(localVault.LOCAL_GROQ_KEYS)) {
    KEY_POOL = localVault.LOCAL_GROQ_KEYS;
  }
} catch {
  // Key file is gitignored; gracefully falls back to on-device Google ML Kit models
  KEY_POOL = [];
}

class GroqVisionService {
  private keys: string[] = [];
  private currentKeyIndex: number = 0;
  private keyCooldowns: Map<string, number> = new Map();

  constructor() {
    this.keys = [...KEY_POOL];
  }

  public setKeys(newKeys: string[]) {
    this.keys = newKeys.filter((k) => typeof k === 'string' && k.trim().length > 10);
  }

  public hasActiveKeys(): boolean {
    return this.keys.length > 0;
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
    console.warn(`[GroqVisionService] Key rate limited. Rotating to next key in pool...`);
    this.keyCooldowns.set(key, Date.now() + 60000); // 1-minute cooldown
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
  }

  public async analyzeWithVision(
    base64Image: string,
    prompt: string,
    maxRetries: number = 3
  ): Promise<string | null> {
    if (!base64Image || this.keys.length === 0) return null;

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const activeKey = this.getActiveKey();
      if (!activeKey) break;

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.2-11b-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `${prompt} Answer in 1 or 2 concise, natural sentences suitable for a blind user listening to audio. Never mention you are an AI or describe photo quality. Speak directly as if you are their eyes.`,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${cleanBase64}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 150,
            temperature: 0.2,
          }),
        });

        if (response.status === 429 || response.status === 401 || response.status === 403) {
          this.markKeyRateLimited(activeKey);
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[GroqVisionService] API Error (${response.status}):`, errText);
          this.markKeyRateLimited(activeKey);
          continue;
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content?.trim();
        if (content) {
          return content;
        }
      } catch (err) {
        console.warn(`[GroqVisionService] Request error:`, err);
        this.markKeyRateLimited(activeKey);
      }
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
}

export const groqVisionService = new GroqVisionService();
