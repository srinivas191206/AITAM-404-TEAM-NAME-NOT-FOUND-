import React from 'react';
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
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  helperText,
  errorText,
  containerStyle,
  ...inputProps
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessible={true}
        accessibilityLabel={label}
        accessibilityHint={helperText}
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, errorText ? styles.inputError : null]}
        {...inputProps}
      />
      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textHighEmphasis,
    marginBottom: Spacing.xs + 2,
    letterSpacing: 0.3,
  },
  input: {
    minHeight: Spacing.minTouchTarget,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusMd,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textHighEmphasis,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
});
