import { intentService, IntentDetectionResult, RecognizedIntentType } from './intentService';
import { visionService } from './visionService';
import { sceneUnderstandingService } from './sceneUnderstandingService';
import { ttsService } from './ttsService';

export interface CommandRouteResult {
  intent: RecognizedIntentType;
  rawInput: string;
  responseMessage: string;
  destination?: string;
  isActionInterrupted?: boolean;
}

class CommandRouter {
  private lastUserInput: string = '';
  private lastIntent: RecognizedIntentType | null = null;
  private lastResponse: string = '';

  /**
   * Route user command through intent classification and appropriate service handler
   */
  public async routeCommand(rawInput: string): Promise<CommandRouteResult> {
    const detection: IntentDetectionResult = intentService.detectIntent(rawInput);

    let responseMessage = '';
    let isActionInterrupted = false;

    switch (detection.intent) {
      case 'STOP': {
        await ttsService.stop();
        isActionInterrupted = true;
        responseMessage = 'Stopped.';
        break;
      }

      case 'REPEAT': {
        if (this.lastResponse && this.lastResponse.trim().length > 0) {
          responseMessage = this.lastResponse;
        } else {
          responseMessage = "I don't have anything to repeat yet.";
        }
        break;
      }

      case 'HELP': {
        responseMessage =
          "You can ask me to describe what's in front of you, read text, identify currency, describe your surroundings, or navigate somewhere.";
        break;
      }

      case 'VISION_QUERY': {
        const result = await visionService.queryVision();
        responseMessage = result.message;
        break;
      }

      case 'READ_TEXT': {
        const result = await visionService.queryOcr();
        responseMessage = result.message;
        break;
      }

      case 'CURRENCY_QUERY': {
        const result = await visionService.queryCurrency();
        responseMessage = result.message;
        break;
      }

      case 'SCENE_DESCRIPTION': {
        const result = await sceneUnderstandingService.describeScene();
        responseMessage = result.message;
        break;
      }

      case 'NAVIGATION': {
        const dest = detection.parameters?.destination || 'your destination';
        responseMessage = `Navigating to ${dest} is being prepared.`;
        break;
      }

      case 'AMBIGUOUS': {
        responseMessage =
          detection.parameters?.clarificationPrompt ||
          'Would you like me to read the text or describe what I see?';
        break;
      }

      case 'UNKNOWN':
      default: {
        responseMessage =
          "I didn't understand that. You can ask me to read something, describe your surroundings, identify currency, or navigate somewhere.";
        break;
      }
    }

    // Preserve latest interaction state in memory for REPEAT capability
    if (detection.intent !== 'REPEAT' && detection.intent !== 'STOP') {
      this.lastUserInput = rawInput;
      this.lastIntent = detection.intent;
      this.lastResponse = responseMessage;
    }

    return {
      intent: detection.intent,
      rawInput,
      responseMessage,
      destination: detection.parameters?.destination,
      isActionInterrupted,
    };
  }

  public getLastResponse(): string {
    return this.lastResponse;
  }

  public getLastIntent(): RecognizedIntentType | null {
    return this.lastIntent;
  }

  public getLastUserInput(): string {
    return this.lastUserInput;
  }

  public clearHistory(): void {
    this.lastUserInput = '';
    this.lastIntent = null;
    this.lastResponse = '';
  }
}

export const commandRouter = new CommandRouter();
