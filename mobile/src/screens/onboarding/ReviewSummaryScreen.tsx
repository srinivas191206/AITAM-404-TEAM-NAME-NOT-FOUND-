import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
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

const UserHeaderIcon = ({ color = '#0F9D9A', size = 18 }) => (
  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  </View>
);

const PhoneHeaderIcon = ({ color = '#0F9D9A', size = 18 }) => (
  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  </View>
);

const ShieldHeaderIcon = ({ color = '#0F9D9A', size = 18 }) => (
  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#D7F3F1', justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  </View>
);

const EditPenIcon = ({ color = '#0F9D9A', size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

export const ReviewSummaryScreen: React.FC<ReviewSummaryScreenProps> = ({
  userProfile,
  onEditSection,
  onConfirmComplete,
  onBack,
}) => {
  const primaryContact = userProfile.emergencyContact || userProfile.emergencyContacts?.[0];

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
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.card} />
      <AppHeader title="Review Profile" onBack={onBack} lightMode={true} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* STEP BADGE & INTRO */}
        <View style={styles.intro}>
          <View style={[styles.stepBadge, { backgroundColor: palette.accentLight }]}>
            <Text style={[styles.stepBadgeText, { color: palette.accentTeal }]}>STEP 4 OF 4</Text>
          </View>
          <Text style={[styles.title, { color: palette.primaryText }]}>Review Your Information</Text>
          <Text style={[styles.subtitle, { color: palette.secondaryText }]}>
            Please verify your personal and emergency details before completing setup.
          </Text>
        </View>

        {/* SECTION 1: PERSONAL DETAILS */}
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <UserHeaderIcon color={palette.accentTeal} />
              <Text style={[styles.cardTitle, { color: palette.accentTeal }]}>PERSONAL DETAILS</Text>
            </View>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Edit Personal Details"
              accessibilityRole="button"
              onPress={() => onEditSection('registration')}
              style={[styles.editOutlineBtn, { borderColor: palette.accentTeal }]}
            >
              <EditPenIcon color={palette.accentTeal} size={14} />
              <Text style={[styles.editOutlineText, { color: palette.accentTeal }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: palette.secondaryText }]}>Full Name:</Text>
            <Text style={[styles.value, { color: palette.primaryText }]}>{userProfile.fullName || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: palette.secondaryText }]}>Phone Number:</Text>
            <Text style={[styles.value, { color: palette.primaryText }]}>{userProfile.phoneNumber || userProfile.phone || '—'}</Text>
          </View>
          {userProfile.email ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: palette.secondaryText }]}>Email:</Text>
              <Text style={[styles.value, { color: palette.primaryText }]}>{userProfile.email}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={[styles.label, { color: palette.secondaryText }]}>Address:</Text>
            <Text style={[styles.value, { color: palette.primaryText }]}>{userProfile.address || '—'}</Text>
          </View>
        </View>

        {/* SECTION 2: EMERGENCY CONTACT */}
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <PhoneHeaderIcon color={palette.accentTeal} />
              <Text style={[styles.cardTitle, { color: palette.accentTeal }]}>EMERGENCY CONTACT</Text>
            </View>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Edit Emergency Contact"
              accessibilityRole="button"
              onPress={() => onEditSection('emergency_contact')}
              style={[styles.editOutlineBtn, { borderColor: palette.accentTeal }]}
            >
              <EditPenIcon color={palette.accentTeal} size={14} />
              <Text style={[styles.editOutlineText, { color: palette.accentTeal }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: palette.secondaryText }]}>Contact Name:</Text>
            <Text style={[styles.value, { color: palette.primaryText }]}>{primaryContact?.name || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: palette.secondaryText }]}>Contact Phone:</Text>
            <Text style={[styles.value, { color: palette.primaryText }]}>
              {primaryContact?.phoneNumber || primaryContact?.phone || '—'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: palette.secondaryText }]}>Relationship:</Text>
            <Text style={[styles.value, { color: palette.primaryText }]}>
              {primaryContact?.relationship || primaryContact?.relation || 'Family'}
            </Text>
          </View>
        </View>

        {/* SECTION 3: GUARDIAN SETUP */}
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ShieldHeaderIcon color={palette.accentTeal} />
              <Text style={[styles.cardTitle, { color: palette.accentTeal }]}>GUARDIAN SETUP</Text>
            </View>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Edit Guardian Setup"
              accessibilityRole="button"
              onPress={() => onEditSection('guardian_setup')}
              style={[styles.editOutlineBtn, { borderColor: palette.accentTeal }]}
            >
              <EditPenIcon color={palette.accentTeal} size={14} />
              <Text style={[styles.editOutlineText, { color: palette.accentTeal }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: palette.secondaryText }]}>Status:</Text>
            <Text style={[styles.value, { color: palette.primaryText }]}>
              {userProfile.guardian?.guardianLinked || userProfile.guardianLinked
                ? '✓ Guardian Linked'
                : 'Set Up Later'}
            </Text>
          </View>
          {userProfile.guardianPhone || userProfile.guardian?.phoneNumber ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: palette.secondaryText }]}>Guardian Phone:</Text>
              <Text style={[styles.value, { color: palette.primaryText }]}>
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
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    gap: 14,
  },
  intro: {
    marginBottom: Spacing.xs,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 10,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#0F9D9A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  editOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  editOutlineText: {
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  ctaGroup: {
    marginTop: Spacing.xs,
  },
});
