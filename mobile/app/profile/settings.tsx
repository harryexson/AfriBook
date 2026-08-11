import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { useMarketStore } from '../../src/stores/market-store';

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const currencyCode = useMarketStore((s) => s.currencyCode());
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [sosEnabled, setSosEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.group}>
          <SettingRow
            icon="notifications"
            title="Push notifications"
            subtitle="Rides, orders, and bookings"
            right={
              <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: colors.primary }} />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="mail"
            title="Email notifications"
            subtitle="Receipts and offers"
            right={
              <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ true: colors.primary }} />
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Privacy & Safety</Text>
        <View style={styles.group}>
          <SettingRow
            icon="finger-print"
            title="Biometric login"
            subtitle="Unlock with Face ID / fingerprint"
            right={
              <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ true: colors.primary }} />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="shield-checkmark"
            title="Share trip status"
            subtitle="Emergency SOS & live location"
            right={
              <Switch value={sosEnabled} onValueChange={setSosEnabled} trackColor={{ true: colors.primary }} />
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Region & Language</Text>
        <View style={styles.group}>
          <SettingRow icon="globe" title="Language" subtitle="English" />
          <View style={styles.divider} />
          <SettingRow icon="cash" title="Currency" subtitle={`Pricing shown in ${currencyCode}`} />
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.group}>
          <SettingRow
            icon="person-circle"
            title="Edit profile"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="log-out"
            title="Log out"
            subtitle="Sign out of this device"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['5xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  group: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
