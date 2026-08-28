import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import { LocationProvider } from './src/context/LocationContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AppProvider>
      <AccessibilityProvider>
        <LocationProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </LocationProvider>
      </AccessibilityProvider>
    </AppProvider>
  );
}
