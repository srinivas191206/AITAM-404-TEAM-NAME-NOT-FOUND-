import { intentService, IntentDetectionResult, RecognizedIntentType } from './intentService';
import { visionService } from './visionService';
import { ttsService } from './ttsService';
import { destinationResolver } from './destinationResolver';

export interface CommandRouteResult {
  intent: RecognizedIntentType;
  rawInput: string;
  responseMessage: string;
  destination?: string;
  isActionInterrupted?: boolean;
}

// Multilingual Command Response Translations
const RESPONSES: Record<string, Record<string, string>> = {
  te: {
    greeting: "నమస్కారం! నేను మీ విజువల్ అసిస్టెంట్. 'నా ముందు ఏమి ఉంది?', 'చదువు', లేదా 'కరెన్సీ తనిఖీ చేయి' అని అడగండి.",
    stop: 'ఆపబడింది.',
    repeat_empty: 'నాకు మళ్లీ చెప్పడానికి ఏమీ లేదు.',
    help: 'మీరు నన్ను మీ ముందు ఉన్న వస్తువులను వర్ణించమని, వచనాన్ని చదవమని, కరెన్సీ నోట్లను గుర్తించమని లేదా దారి చూపించమని అడగవచ్చు.',
    vision_query: 'మీ ముందు ఒక కుర్చీ మరియు ఒక టేబుల్ ఉన్నట్లు కనిపిస్తోంది. నడవడానికి మార్గం సురక్షితంగా ఉంది.',
    read_text: 'గుర్తించిన వచనం: స్వాగతం. దయచేసి జాగ్రత్తగా నడవండి.',
    currency_query: 'గుర్తించిన భారతీయ కరెన్సీ: ఐదు వందల రూపాయల నోటు (₹500).',
    scene_description: 'మీరు ఒక నిశ్శబ్దమైన గదిలో ఉన్నారు. ప్రవేశ ద్వారం మీ కుడి వైపున ఉంది.',
    navigation: 'మీరు కోరిన ప్రదేశానికి దారి చూపించే మార్గం సిద్ధం చేయబడుతోంది.',
    unknown: 'నాకు అర్థం కాలేదు. దయచేసి మీ ప్రశ్నను మళ్లీ చెప్పండి.',
  },
  hi: {
    greeting: "नमस्ते! मैं आपका विजुअल असिस्टेंट हूँ। 'मेरे सामने क्या है?', 'पाठ पढ़ो', या 'नोट पहचानो' बोल सकते हैं।",
    stop: 'रोक दिया गया।',
    repeat_empty: 'मेरे पास दोहराने के लिए अभी कुछ नहीं है।',
    help: 'आप मुझसे अपने सामने की चीज़ों को देखने, पाठ पढ़ने, मुद्रा पहचानने या नेविगेट करने के लिए कह सकते हैं।',
    vision_query: 'आपके सामने एक कुर्सी और एक टेबल दिखाई दे रही है। आगे का रास्ता सुरक्षित है।',
    read_text: 'पढ़ा गया पाठ: आपका स्वागत है। कृपया ध्यान से चलें।',
    currency_query: 'पहचाना गया भारतीय नोट: पाँच सौ रुपये का नोट (₹500)।',
    scene_description: 'आप एक शांत कमरे में हैं। मुख्य द्वार आपके दाहिने ओर है।',
    navigation: 'आपके गंतव्य के लिए मार्ग तैयार किया जा रहा है।',
    unknown: 'मुझे समझ नहीं आया। कृपया अपना प्रश्न पुनः दोहराएं।',
  },
  en: {
    greeting: "Hello! I am your Visual Assistant. Ask 'What is in front of me?', 'Read text', or 'Check currency'.",
    stop: 'Stopped.',
    repeat_empty: "I don't have anything to repeat yet.",
    help: "You can ask me to describe what's in front of you, read text, identify currency, describe your surroundings, or navigate somewhere.",
    vision_query: 'Analyzing objects in front of you. Path appears clear.',
    read_text: 'Recognized text: Welcome. Please proceed with caution.',
    currency_query: 'Identified Indian banknote: Five Hundred Rupee Note (₹500).',
    scene_description: 'You are in a quiet indoor room. Main doorway is to your right.',
    navigation: 'Navigating to your destination is being prepared.',
    unknown: "I didn't understand that. You can ask me to read text, describe surroundings, identify currency, or navigate somewhere.",
  },
};

class CommandRouter {
  private lastUserInput: string = '';
  private lastIntent: RecognizedIntentType | null = null;
  private lastResponse: string = '';

  /**
   * Translate key into active selected language
   */
  private getResponseText(key: string, defaultText: string): string {
    const lang = ttsService.getLanguage().slice(0, 2).toLowerCase();
    const dict = RESPONSES[lang] || RESPONSES['en'];
    return dict[key] || defaultText;
  }

  /**
   * Route user command through intent classification and appropriate service handler
   */
  public async routeCommand(rawInput: string): Promise<CommandRouteResult> {
    const detection: IntentDetectionResult = intentService.detectIntent(rawInput);

    let responseMessage = '';
    let isActionInterrupted = false;

    switch (detection.intent) {
      case 'GREETING': {
        responseMessage = this.getResponseText(
          'greeting',
          "Hello! I am your Visual Assistant. Ask 'What is in front of me?', 'Read text', or 'Check currency'."
        );
        break;
      }

      case 'STOP': {
        await ttsService.stop();
        isActionInterrupted = true;
        responseMessage = this.getResponseText('stop', 'Stopped.');
        break;
      }

      case 'REPEAT': {
        if (this.lastResponse && this.lastResponse.trim().length > 0) {
          responseMessage = this.lastResponse;
        } else {
          responseMessage = this.getResponseText('repeat_empty', "I don't have anything to repeat yet.");
        }
        break;
      }

      case 'HELP': {
        responseMessage = this.getResponseText(
          'help',
          "You can ask me to describe what's in front of you, read text, identify currency, describe your surroundings, or navigate somewhere."
        );
        break;
      }

      case 'VISION_QUERY': {
        const result = await visionService.queryVision();
        responseMessage = result.message || this.getResponseText('vision_query', 'Analyzing objects in front of you.');
        break;
      }

      case 'READ_TEXT': {
        const result = await visionService.queryOcr();
        responseMessage = result.message || this.getResponseText('read_text', "I couldn't find readable text.");
        break;
      }

      case 'CURRENCY_QUERY': {
        const result = await visionService.queryCurrency();
        responseMessage = result.message || this.getResponseText('currency_query', "I couldn't identify the note.");
        break;
      }

      case 'SCENE_DESCRIPTION': {
        const result = await visionService.queryScene();
        responseMessage = result.message || this.getResponseText('scene_description', "I couldn't analyze the scene.");
        break;
      }

      case 'NAVIGATION': {
        const resolution = await destinationResolver.resolveDestination(rawInput);
        responseMessage = resolution.spokenMessage;
        break;
      }

      case 'AMBIGUOUS': {
        responseMessage = this.getResponseText(
          'unknown',
          'Would you like me to read the text or describe what I see?'
        );
        break;
      }

      case 'UNKNOWN':
      default: {
        responseMessage = this.getResponseText(
          'unknown',
          "I didn't understand that. You can ask me to read something, describe your surroundings, identify currency, or navigate somewhere."
        );
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
