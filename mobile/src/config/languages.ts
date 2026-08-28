import { LanguageCode, LanguageOption } from '../types';

export interface LanguageConfig {
  defaultLanguage: LanguageCode;
  supportedLanguages: LanguageOption[];
}

export const LanguageRegistry: LanguageConfig = {
  defaultLanguage: 'en',
  supportedLanguages: [
    {
      code: 'en',
      label: 'English',
      nativeLabel: 'English (Default)',
      isAvailable: true,
    },
    {
      code: 'te',
      label: 'Telugu',
      nativeLabel: 'తెలుగు (Telugu)',
      isAvailable: true,
    },
    {
      code: 'hi',
      label: 'Hindi',
      nativeLabel: 'हिन्दी (Hindi)',
      isAvailable: true,
    },
    {
      code: 'ta',
      label: 'Tamil',
      nativeLabel: 'தமிழ் (Tamil)',
      isAvailable: true,
    },
    {
      code: 'es',
      label: 'Spanish',
      nativeLabel: 'Español (Spanish)',
      isAvailable: true,
    },
    {
      code: 'fr',
      label: 'French',
      nativeLabel: 'Français (French)',
      isAvailable: true,
    },
  ],
};

export const getLanguageLabel = (code: LanguageCode): string => {
  const found = LanguageRegistry.supportedLanguages.find((l) => l.code === code);
  return found ? found.label : 'English';
};
