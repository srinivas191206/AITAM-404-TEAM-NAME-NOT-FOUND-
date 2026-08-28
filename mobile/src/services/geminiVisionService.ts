/**
 * Gemini 1.5 Flash Vision Fallback Service
 * Uses Google Gemini 1.5 Flash REST API for vision analysis fallback
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

class GeminiVisionService {
  private apiKey: string = '';

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public async analyzeVision(base64Image: string, prompt: string): Promise<string | null> {
    if (!base64Image || !this.apiKey) return null;

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
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

      if (!response.ok) {
        console.warn(`[GeminiVisionService] API Error status ${response.status}`);
        return null;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return text || null;
    } catch (err) {
      console.warn(`[GeminiVisionService] Request error:`, err);
      return null;
    }
  }
}

export const geminiVisionService = new GeminiVisionService();
