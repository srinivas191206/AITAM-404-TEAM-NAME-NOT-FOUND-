import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface AccessibleInputProps extends TextInputProps {
  label: string;
  helperText?: string;
  errorText?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  lightMode?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  helperText,
  errorText,
  containerStyle,
  leftIcon,
  rightIcon,
  lightMode = true,
  ...inputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

  const labelColor = lightMode ? palette.primaryText : Colors.textHighEmphasis;
  const inputBg = lightMode ? palette.card : Colors.surfaceElevated;
  const textColor = lightMode ? palette.primaryText : Colors.textHighEmphasis;
  const placeholderColor = lightMode ? '#94A3B8' : Colors.textMuted;
  const borderColor = errorText
    ? Colors.danger
    : isFocused
    ? palette.accentTeal
    : lightMode
    ? palette.border
    : Colors.borderSubtle;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: inputBg,
            borderColor: borderColor,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon ? <View style={styles.leftIconWrapper}>{leftIcon}</View> : null}
        <TextInput
          accessible={true}
          accessibilityLabel={label}
          accessibilityHint={helperText}
          placeholderTextColor={placeholderColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, { color: textColor }]}
          {...inputProps}
        />
        {rightIcon ? <View style={styles.rightIconWrapper}>{rightIcon}</View> : null}
      </View>
      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: lightMode ? palette.secondaryText : Colors.textMuted }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#0F9D9A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 12,
  },
  leftIconWrapper: {
    marginRight: 12,
  },
  rightIconWrapper: {
    marginLeft: 12,
  },
  helperText: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '400',
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    marginTop: 4,
    fontWeight: '600',
  },
});
