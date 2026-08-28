import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';

export interface TabItem {
  id: string;
  label: string;
  icon: (color: string) => React.ReactNode;
}

interface BottomTabBarProps {
  activeTab: string;
  tabs: TabItem[];
  onSelectTab: (tabId: string) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  tabs,
  onSelectTab,
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

  return (
    <View style={[styles.container, { backgroundColor: palette.card, borderColor: palette.border }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const activeColor = palette.accentTeal;
        const inactiveColor = palette.secondaryText;

        return (
          <TouchableOpacity
            key={tab.id}
            accessible={true}
            accessibilityLabel={`${tab.label} tab`}
            accessibilityState={{ selected: isActive }}
            accessibilityRole="tab"
            activeOpacity={0.7}
            onPress={() => onSelectTab(tab.id)}
            style={styles.tabBtn}
          >
            <View
              style={[
                styles.iconWrapper,
                isActive ? { backgroundColor: palette.accentLight } : null,
              ]}
            >
              {tab.icon(isActive ? activeColor : inactiveColor)}
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? activeColor : inactiveColor },
                isActive ? styles.tabLabelActive : null,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    shadowColor: '#0F9D9A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    fontWeight: '800',
  },
});
