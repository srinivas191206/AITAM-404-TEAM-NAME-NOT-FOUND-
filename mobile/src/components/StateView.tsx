import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { AccessibleButton } from './AccessibleButton';

interface StateViewProps {
  type: 'loading' | 'error' | 'empty' | 'success';
  title?: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const StateView: React.FC<StateViewProps> = ({
  type,
  title,
  message,
  actionTitle,
  onAction,
  style,
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case 'loading':
        return {
          icon: null,
          defaultTitle: 'Loading...',
          defaultMessage: 'Please wait a moment.',
          accentColor: Colors.blindPrimary,
        };
      case 'error':
        return {
          icon: '⚠️',
          defaultTitle: 'Something went wrong',
          defaultMessage: 'Please check your connection and try again.',
          accentColor: Colors.danger,
        };
      case 'empty':
        return {
          icon: '📭',
          defaultTitle: 'No items yet',
          defaultMessage: 'Information will appear here once available.',
          accentColor: Colors.textMuted,
        };
      case 'success':
        return {
          icon: '✓',
          defaultTitle: 'All set',
          defaultMessage: 'Your changes have been saved successfully.',
          accentColor: Colors.success,
        };
    }
  };

  const config = getDefaultContent();

  return (
    <View style={[styles.container, style]}>
      {type === 'loading' ? (
        <ActivityIndicator size="large" color={config.accentColor} style={styles.spinner} />
      ) : config.icon ? (
        <Text style={styles.icon}>{config.icon}</Text>
      ) : null}

      <Text style={styles.title}>{title || config.defaultTitle}</Text>
      <Text style={styles.message}>{message || config.defaultMessage}</Text>

      {actionTitle && onAction ? (
        <AccessibleButton
          title={actionTitle}
          onPress={onAction}
          variant="secondary"
          size="normal"
          style={styles.actionBtn}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginVertical: Spacing.md,
  },
  spinner: {
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 44,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '90%',
  },
  actionBtn: {
    marginTop: Spacing.lg,
    width: '100%',
  },
});
