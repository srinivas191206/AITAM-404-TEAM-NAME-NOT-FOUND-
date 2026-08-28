import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography: Record<string, TextStyle> = {
  displayLarge: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.5,
  },
  displayMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.5,
  },
  headingLarge: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.25,
  },
  headingMedium: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.textHighEmphasis,
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: Colors.textHighEmphasis,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    color: Colors.textMediumEmphasis,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.textMuted,
  },
};
