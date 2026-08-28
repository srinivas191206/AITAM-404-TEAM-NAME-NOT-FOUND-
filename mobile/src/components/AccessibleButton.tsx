import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
} from 'react-native';
import { hapticService } from '../services/hapticService';
import { Colors } from '../theme/colors';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'teal' | 'subtle';
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'normal' | 'large' | 'massive';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  accessibilityHint,
  accessibilityRole = 'button',
  style,
  textStyle,
  size = 'normal',
}) => {
  const handlePress = async () => {
    if (variant === 'danger') {
      await hapticService.heavy();
    } else {
      await hapticService.medium();
    }
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'danger':
        return styles.danger;
      case 'warning':
        return styles.warning;
      case 'secondary':
        return styles.secondary;
      case 'teal':
        return styles.teal;
      case 'subtle':
        return styles.subtle;
      default:
        return styles.primary;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'massive':
        return styles.massiveSize;
      case 'large':
        return styles.largeSize;
      default:
        return styles.normalSize;
    }
  };

  const getTextColorStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
      case 'warning':
        return styles.darkText;
      case 'teal':
        return styles.whiteText;
      case 'danger':
        return styles.whiteText;
      case 'secondary':
      case 'subtle':
        return styles.lightText;
      default:
        return styles.darkText;
    }
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.base, getContainerStyle(), getSizeStyle(), style]}
    >
      <Text style={[styles.text, getTextColorStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    marginVertical: 6,
  },
  normalSize: {
    minHeight: 60,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  largeSize: {
    minHeight: 76,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  massiveSize: {
    minHeight: 110,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 22,
  },
  primary: {
    backgroundColor: Colors.blindPrimary, // Warm Amber Gold
    borderColor: Colors.blindBorder,
  },
  secondary: {
    backgroundColor: Colors.surfaceInteractive,
    borderColor: Colors.borderSubtle,
  },
  danger: {
    backgroundColor: Colors.danger,
    borderColor: '#B91C1C',
  },
  warning: {
    backgroundColor: Colors.warning,
    borderColor: '#B45309',
  },
  teal: {
    backgroundColor: Colors.tealSlate ? Colors.tealSlate.accentTeal : '#0F9D9A',
    borderColor: Colors.tealSlate ? Colors.tealSlate.accentTeal : '#0F9D9A',
  },
  subtle: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderSubtle,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  darkText: {
    color: '#121110',
    fontWeight: '800',
  },
  whiteText: {
    color: '#FAF7F2',
    fontWeight: '800',
  },
  lightText: {
    color: Colors.textHighEmphasis,
    fontWeight: '700',
  },
});
