import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { UserProfile } from '../../types';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { AppHeader } from '../../components/AppHeader';
import { AccessibleButton } from '../../components/AccessibleButton';

interface ReviewSummaryScreenProps {
  userProfile: UserProfile;
  onEditSection: (step: 'registration' | 'emergency_contact' | 'guardian_setup') => void;
  onConfirmComplete: () => Promise<void>;
  onBack: () => void;
}

export const ReviewSummaryScreen: React.FC<ReviewSummaryScreenProps> = ({
  userProfile,
  onEditSection,
  onConfirmComplete,
  onBack,
}) => {
  const primaryContact = userProfile.emergencyContact || userProfile.emergencyContacts?.[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.canvasPrimary} />
      <AppHeader title="Review Profile" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.stepLabel}>STEP 4 OF 4</Text>
          <Text style={styles.title}>Review Your Information</Text>
          <Text style={styles.subtitle}>
            Please verify your personal and emergency details before completing setup.
          </Text>
        </View>

        {/* SECTION 1: PERSONAL INFORMATION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>👤 PERSONAL DETAILS</Text>
            <AccessibleButton
              title="Edit"
              size="normal"
              variant="subtle"
              style={styles.editBtn}
              onPress={() => onEditSection('registration')}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.value}>{userProfile.fullName || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone Number:</Text>
            <Text style={styles.value}>{userProfile.phoneNumber || userProfile.phone || '—'}</Text>
          </View>
          {userProfile.email ? (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{userProfile.email}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{userProfile.address || '—'}</Text>
          </View>
        </View>

        {/* SECTION 2: EMERGENCY CONTACT */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🚨 EMERGENCY CONTACT</Text>
            <AccessibleButton
              title="Edit"
              size="normal"
              variant="subtle"
              style={styles.editBtn}
              onPress={() => onEditSection('emergency_contact')}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Contact Name:</Text>
            <Text style={styles.value}>{primaryContact?.name || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact Phone:</Text>
            <Text style={styles.value}>
              {primaryContact?.phoneNumber || primaryContact?.phone || '—'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Relationship:</Text>
            <Text style={styles.value}>
              {primaryContact?.relationship || primaryContact?.relation || 'Family'}
            </Text>
          </View>
        </View>

        {/* SECTION 3: GUARDIAN SETUP */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🛡️ GUARDIAN SETUP</Text>
            <AccessibleButton
              title="Edit"
              size="normal"
              variant="subtle"
              style={styles.editBtn}
              onPress={() => onEditSection('guardian_setup')}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>
              {userProfile.guardian?.guardianLinked || userProfile.guardianLinked
                ? '✓ Guardian Linked'
                : 'Set Up Later'}
            </Text>
          </View>
          {userProfile.guardianPhone || userProfile.guardian?.phoneNumber ? (
            <View style={styles.row}>
              <Text style={styles.label}>Guardian Phone:</Text>
              <Text style={styles.value}>
                {userProfile.guardianPhone || userProfile.guardian?.phoneNumber}
              </Text>
            </View>
          ) : null}
        </View>

        {/* COMPLETE REGISTRATION CTA */}
        <View style={styles.ctaGroup}>
          <AccessibleButton
            title="✓ Confirm & Complete Registration"
            size="large"
            variant="teal"
            accessibilityHint="Double tap to save profile and open dashboard"
            onPress={onConfirmComplete}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvasPrimary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  intro: {
    marginBottom: Spacing.xs,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.deafBorder,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textHighEmphasis,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMediumEmphasis,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.deafBorder,
    letterSpacing: 0.5,
  },
  editBtn: {
    paddingHorizontal: Spacing.md,
    minHeight: 36,
    marginVertical: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderColor: Colors.surfaceInteractive,
  },
  label: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  value: {
    fontSize: 15,
    color: Colors.textHighEmphasis,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  ctaGroup: {
    marginTop: Spacing.md,
  },
});
