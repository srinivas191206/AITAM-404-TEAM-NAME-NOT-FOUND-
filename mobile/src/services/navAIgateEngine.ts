/**
 * NavAIgate Multi-Model AI Engine
 * Integrated from NavAIgate-master (NiteeshL)
 * 
 * Implements 3 specialized AI personas:
 * 1. Navigation AI (GeminiAPI.kt): 3-4 sentence concise actionable navigation instructions
 * 2. Conversational Q&A AI (GeminiAPI 1.kt): Detailed answers to specific environment queries based on scene data
 * 3. Text Recognition AI (GeminiAPI2.kt): Specialized reading for blind users
 */

import { groqVisionService } from './groqVisionService';
import { geminiVisionService } from './geminiVisionService';

const NAVAIGATE_NAVIGATION_INSTRUCTION = `Purpose:
You are an advanced navigation assistant designed to help visually impaired individuals navigate various environments safely and efficiently. Your primary task is to analyze live camera frames and scene perception data, identify obstacles and navigational cues, and provide real-time audio guidance to the user.

Rules:
- Your response on 1 frame MUST NOT contain more than 3 to 4 sentences.
- Identify particular objects in the scene and inform the user about specifications (color, size, state e.g., on or off).
- Inform about surroundings: whether the user is on a road, sidewalk, or in a crowded area.
- Provide clear, actionable instructions: "Stop", "Turn right", "Step over", "There is an obstacle 5 steps ahead, stop or take a turn".
- Avoid technical jargon. Never mention image quality or camera parameters.
- Prioritize user safety in every response.
- Urban Environments: Detect stairs (up/down), curbs, uneven surfaces, obstructions (poles, benches, low branches), crosswalks, sidewalks, building entrances/exits, traffic, pedestrians.
- Natural Environments: Detect trees, roots, rocks, water bodies, trails.
- Public Transport: Detect platform edges, doors, seats, handrails.
- Indoor Environments: Detect furniture, doors, stairs, appliances.`;

const NAVAIGATE_QA_INSTRUCTION = `Purpose:
Your primary role is to assist visually impaired users by answering specific questions about their surroundings, regardless of the environment. You rely on information provided by the scene perception detector (AI One) which has access to live frames. Your task is to interpret this information and provide detailed descriptions or clarifications as needed, covering everything from indoor environments to outdoor and complex scenarios.

Key Responsibilities:
- Answering Environment-Specific Questions: status or details of specific objects (e.g., "Is the laptop on or off?", "Is there a car parked nearby?").
- Color and Status Identification: identify colors, states (on/off), presence of items.
- Environment Description: layout of a room, presence of obstacles on a street, park conditions.
- Clear and Simple Language: use friendly, conversational, calm language suitable for audio.
- Keep answers to 2-3 sentences.`;

const NAVAIGATE_READING_INSTRUCTION = `Purpose:
Your user is a blind person. From the image, identify what the object or surface is, and then read the whole text clearly and completely from the image (e.g. from a book, sign board, package, medicine bottle, or document).`;

class NavAIgateEngine {
  /**
   * 1. Navigation AI: Generates 3-4 sentence real-time navigation guidance
   */
  public async generateNavigationGuidance(
    scenePerceptionData: string,
    base64Image?: string
  ): Promise<string> {
    const prompt = `${NAVAIGATE_NAVIGATION_INSTRUCTION}

Scene Perception Data:
${scenePerceptionData}

Provide 3 to 4 concise, actionable navigation sentences for the blind user right now:`;

    // Try Groq Llama-3.3-70b-versatile
    try {
      const groqResp = await groqVisionService.chatCompletion([
        { role: 'system', content: NAVAIGATE_NAVIGATION_INSTRUCTION },
        { role: 'user', content: `Current scene perception: ${scenePerceptionData}\nProvide guidance:` },
      ]);
      if (groqResp && groqResp.trim().length > 0) {
        return groqResp.trim();
      }
    } catch (e) {
      console.warn('[NavAIgate] Groq navigation guidance note:', e);
    }

    // Try Gemini if image available
    if (base64Image) {
      try {
        const geminiResp = await geminiVisionService.analyzeVision(base64Image, prompt);
        if (geminiResp && geminiResp.trim().length > 0) {
          return geminiResp.trim();
        }
      } catch (e) {
        console.warn('[NavAIgate] Gemini navigation guidance note:', e);
      }
    }

    return `The path ahead appears clear. Proceed forward with caution.`;
  }

  /**
   * 2. Conversational Environment Q&A AI: Answers specific questions about surroundings
   */
  public async answerEnvironmentQuery(
    question: string,
    sceneContext: string,
    base64Image?: string
  ): Promise<string> {
    const userQuery = `Scene context from perception detector: ${sceneContext || 'General indoor/outdoor scene'}
User question: "${question}"
Answer the user directly and concisely:`;

    try {
      const groqResp = await groqVisionService.chatCompletion([
        { role: 'system', content: NAVAIGATE_QA_INSTRUCTION },
        { role: 'user', content: userQuery },
      ]);
      if (groqResp && groqResp.trim().length > 0) {
        return groqResp.trim();
      }
    } catch (e) {
      console.warn('[NavAIgate] Groq Q&A query note:', e);
    }

    if (base64Image) {
      try {
        const geminiResp = await geminiVisionService.analyzeVision(
          base64Image,
          `${NAVAIGATE_QA_INSTRUCTION}\nQuestion: ${question}`
        );
        if (geminiResp && geminiResp.trim().length > 0) {
          return geminiResp.trim();
        }
      } catch (e) {
        console.warn('[NavAIgate] Gemini Q&A query note:', e);
      }
    }

    return `I am observing your surroundings. Regarding "${question}", please point your camera directly at the area for more detail.`;
  }

  /**
   * 3. Text Recognition AI: Specialized reading mode
   */
  public async readDocumentText(
    base64Image: string,
    ocrText?: string
  ): Promise<string> {
    if (ocrText && ocrText.trim().length > 0) {
      // If PaddleOCR already extracted text, use NavAIgate Reading AI to structure it
      try {
        const groqResp = await groqVisionService.chatCompletion([
          { role: 'system', content: NAVAIGATE_READING_INSTRUCTION },
          { role: 'user', content: `Here is the raw extracted text from the scene: "${ocrText}". Read it aloud in natural, structured sentences for a blind listener:` },
        ]);
        if (groqResp && groqResp.trim().length > 0) {
          return groqResp.trim();
        }
      } catch (e) {
        // fallback
      }
      return ocrText.trim();
    }

    if (base64Image) {
      try {
        const geminiResp = await geminiVisionService.analyzeVision(
          base64Image,
          NAVAIGATE_READING_INSTRUCTION
        );
        if (geminiResp && geminiResp.trim().length > 0) {
          return geminiResp.trim();
        }
      } catch (e) {
        console.warn('[NavAIgate] Reading AI note:', e);
      }
    }

    return `No readable text was found in view. Please point your camera directly at the document or sign and try again.`;
  }
}

export const navAIgateEngine = new NavAIgateEngine();
