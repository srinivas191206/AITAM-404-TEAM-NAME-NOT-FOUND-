import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { hapticService } from '../services/hapticService';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  accentColor?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  rightElement,
  accentColor = Colors.textHighEmphasis,
}) => {
  const handleBack = async () => {
    if (onBack) {
      await hapticService.light();
      onBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {onBack ? (
          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={handleBack}
            style={styles.backButton}
          >
            <Text style={[styles.backText, { color: accentColor }]}>← BACK</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.title, { color: accentColor }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightElement ? <View style={styles.rightGroup}>{rightElement}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
    minHeight: 56,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceInteractive,
    borderRadius: Spacing.radiusSm,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  backText: {
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    flex: 1,
  },
  rightGroup: {
    marginLeft: Spacing.sm,
  },
});
