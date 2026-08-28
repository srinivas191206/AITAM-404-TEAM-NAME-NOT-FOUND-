import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { ModeSelectScreen } from '../screens/ModeSelectScreen';
import { BlindDashboardScreen } from '../screens/blind/BlindDashboardScreen';
import { ScenePerceptionScreen } from '../screens/blind/ScenePerceptionScreen';
import { VoiceNavigationScreen } from '../screens/blind/VoiceNavigationScreen';
import { DeafDashboardScreen } from '../screens/deaf/DeafDashboardScreen';
import { LiveCaptionsScreen } from '../screens/deaf/LiveCaptionsScreen';
import { SoundAlertsScreen } from '../screens/deaf/SoundAlertsScreen';
import { GuardianDashboardScreen } from '../screens/guardian/GuardianDashboardScreen';
import { SosCountdownModal } from '../components/SosCountdownModal';
import { VisionTaskType } from '../services/aiVisionService';
import { useFallDetection } from '../hooks/useFallDetection';

export const AppNavigator: React.FC = () => {
  const { mode, setMode } = useAccessibility();
  useFallDetection(); // Active fall detection loop

  // Blind mode screen stack state
  const [blindScreen, setBlindScreen] = useState<'dashboard' | 'camera' | 'navigation'>('dashboard');
  const [activeVisionTask, setActiveVisionTask] = useState<VisionTaskType>('scene_description');

  // Deaf mode screen stack state
  const [deafScreen, setDeafScreen] = useState<'dashboard' | 'captions' | 'sound_alerts'>('dashboard');

  const handleResetToModeSelect = () => {
    setMode(null);
    setBlindScreen('dashboard');
    setDeafScreen('dashboard');
  };

  const renderContent = () => {
    if (!mode) {
      return <ModeSelectScreen />;
    }

    if (mode === 'blind') {
      if (blindScreen === 'camera') {
        return (
          <ScenePerceptionScreen
            initialTask={activeVisionTask}
            onBack={() => setBlindScreen('dashboard')}
          />
        );
      }
      if (blindScreen === 'navigation') {
        return (
          <VoiceNavigationScreen
            onBack={() => setBlindScreen('dashboard')}
            onOpenObstacleCamera={() => {
              setActiveVisionTask('obstacle_detection');
              setBlindScreen('camera');
            }}
          />
        );
      }
      return (
        <BlindDashboardScreen
          onNavigateToCamera={(task) => {
            setActiveVisionTask(task);
            setBlindScreen('camera');
          }}
          onNavigateToNavigation={() => setBlindScreen('navigation')}
          onSwitchMode={handleResetToModeSelect}
        />
      );
    }

    if (mode === 'deaf') {
      if (deafScreen === 'captions') {
        return <LiveCaptionsScreen onBack={() => setDeafScreen('dashboard')} />;
      }
      if (deafScreen === 'sound_alerts') {
        return <SoundAlertsScreen onBack={() => setDeafScreen('dashboard')} />;
      }
      return (
        <DeafDashboardScreen
          onNavigateToCaptions={() => setDeafScreen('captions')}
          onNavigateToSoundAlerts={() => setDeafScreen('sound_alerts')}
          onSwitchMode={handleResetToModeSelect}
        />
      );
    }

    if (mode === 'guardian') {
      return <GuardianDashboardScreen onSwitchMode={handleResetToModeSelect} />;
    }

    return <ModeSelectScreen />;
  };

  return (
    <View style={styles.root}>
      {renderContent()}
      <SosCountdownModal />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0E17',
  },
});
