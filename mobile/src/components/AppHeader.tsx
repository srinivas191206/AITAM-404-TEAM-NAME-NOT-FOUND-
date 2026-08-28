import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { hapticService } from '../services/hapticService';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  accentColor?: string;
  lightMode?: boolean;
}

const BackArrowIcon = ({ color = '#0F9D9A', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  rightElement,
  accentColor,
  lightMode = true,
}) => {
  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

  const textColor = accentColor || (lightMode ? palette.primaryText : Colors.textHighEmphasis);
  const tealColor = palette.accentTeal;

  const handleBack = async () => {
    if (onBack) {
      await hapticService.light();
      onBack();
    }
  };

  return (
    <View style={[styles.container, lightMode && { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.leftGroup}>
        {onBack ? (
          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowIcon color={tealColor} size={20} />
            <Text style={[styles.backText, { color: tealColor }]}>Back</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightGroup}>
        {rightElement ? rightElement : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
    minHeight: 56,
  },
  leftGroup: {
    minWidth: 70,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  backText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#0F9D9A',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    flex: 1,
  },
  rightGroup: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
});
