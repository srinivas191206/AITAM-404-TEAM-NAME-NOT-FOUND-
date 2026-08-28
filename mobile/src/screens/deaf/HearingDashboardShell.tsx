import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../../theme/colors';
import { BottomTabBar, TabItem } from '../../components/BottomTabBar';
import { LiveCaptionsScreen } from './LiveCaptionsScreen';
import { SoundAlertsScreen } from './SoundAlertsScreen';
import { DeafDashboardScreen } from './DeafDashboardScreen';

interface HearingDashboardShellProps {
  onOpenSettings: () => void;
}

const SpeechTabIcon = (color: string) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const BellTabIcon = (color: string) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const SosTabIcon = (color: string) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 8v4M12 16h.01" strokeWidth="3" />
  </Svg>
);

const SettingsTabIcon = (color: string) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

export const HearingDashboardShell: React.FC<HearingDashboardShellProps> = ({
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<string>('captions');

  const palette = Colors.tealSlate || {
    background: '#F7FAFA',
    card: '#FFFFFF',
    primaryText: '#102A2A',
    secondaryText: '#64748B',
    accentTeal: '#0F9D9A',
    accentLight: '#D7F3F1',
    border: '#E2E8F0',
  };

  const tabs: TabItem[] = [
    {
      id: 'captions',
      label: 'Live Captions',
      icon: SpeechTabIcon,
    },
    {
      id: 'alerts',
      label: 'Sound Radar',
      icon: BellTabIcon,
    },
    {
      id: 'sos',
      label: 'SOS Alert',
      icon: SosTabIcon,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsTabIcon,
    },
  ];

  const handleSelectTab = (tabId: string) => {
    if (tabId === 'settings') {
      onOpenSettings();
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.card} />

      {/* SCREEN CONTENT */}
      <View style={styles.screenContainer}>
        {activeTab === 'captions' ? (
          <LiveCaptionsScreen />
        ) : activeTab === 'alerts' ? (
          <SoundAlertsScreen />
        ) : (
          <DeafDashboardScreen
            onNavigateToCaptions={() => setActiveTab('captions')}
            onNavigateToAlerts={() => setActiveTab('alerts')}
          />
        )}
      </View>

      {/* BOTTOM TAB BAR */}
      <BottomTabBar
        activeTab={activeTab}
        tabs={tabs}
        onSelectTab={handleSelectTab}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
