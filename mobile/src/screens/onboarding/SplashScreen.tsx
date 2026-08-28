import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

export const SplashScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>A+</Text>
        </View>
        <Text style={styles.title}>Access+</Text>
        <Text style={styles.subtitle}>Accessibility & Safety Companion</Text>
        <ActivityIndicator
          size="small"
          color={Colors.blindPrimary}
          style={styles.spinner}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.blindBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.blindPrimary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  spinner: {
    marginTop: Spacing.xxl,
  },
});
