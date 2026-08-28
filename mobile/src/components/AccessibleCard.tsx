import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { hapticService } from '../services/hapticService';

interface AccessibleCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: string;
  onPress?: () => void;
  accessibilityHint?: string;
  variant?: 'default' | 'amber' | 'teal' | 'danger';
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const AccessibleCard: React.FC<AccessibleCardProps> = ({
  title,
  subtitle,
  badge,
  icon,
  onPress,
  accessibilityHint,
  variant = 'default',
  style,
  children,
}) => {
  const handlePress = async () => {
    if (onPress) {
      await hapticService.medium();
      onPress();
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'amber':
        return styles.amberCard;
      case 'teal':
        return styles.tealCard;
      case 'danger':
        return styles.dangerCard;
      default:
        return styles.defaultCard;
    }
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      accessible={true}
      accessibilityLabel={`${title}. ${subtitle || ''}`}
      accessibilityHint={accessibilityHint}
      accessibilityRole={onPress ? 'button' : 'summary'}
      activeOpacity={0.8}
      onPress={onPress ? handlePress : undefined}
      style={[styles.base, getVariantStyle(), style]}
    >
      <View style={styles.headerRow}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
  },
  defaultCard: {
    borderColor: Colors.borderSubtle,
  },
  amberCard: {
    borderColor: Colors.blindBorder,
    backgroundColor: Colors.blindSurface,
  },
  tealCard: {
    borderColor: Colors.deafBorder,
    backgroundColor: Colors.deafSurface,
  },
  dangerCard: {
    borderColor: Colors.danger,
    backgroundColor: Colors.emergencySurface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMediumEmphasis,
    marginTop: 3,
    fontWeight: '500',
    lineHeight: 20,
  },
  badge: {
    backgroundColor: Colors.surfaceInteractive,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Spacing.radiusSm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  badgeText: {
    color: Colors.textHighEmphasis,
    fontSize: 12,
    fontWeight: '700',
  },
});
