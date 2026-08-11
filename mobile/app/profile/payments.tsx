import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { useMarketStore } from '../../src/stores/market-store';
import { COUNTRIES } from '../../src/constants/countries';

const METHOD_ICONS: Record<string, string> = {
  paystack: '💰',
  flutterwave: '💳',
  stripe: '💳',
  mpesa: '📱',
  airtel_money: '📱',
  mtn_momo: '📱',
  mobile_money: '📱',
  bank_transfer: '🏦',
  cash: '💵',
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const countryCode = useMarketStore((s) => s.countryCode);
  const country = COUNTRIES[countryCode];
  const methods = country?.paymentMethods ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.countryCard}>
          <Text style={styles.countryFlag}>{country?.flag}</Text>
          <View>
            <Text style={styles.countryName}>{country?.name}</Text>
            <Text style={styles.countrySub}>
              {country?.currency?.name} ({country?.currency?.symbol})
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Available in {country?.name}</Text>

        {methods.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No payment methods configured yet</Text>
            <Text style={styles.emptySubtitle}>
              We support card and mobile money payments at checkout.
            </Text>
          </View>
        )}

        {methods.map((method) => (
          <View key={method.id} style={styles.methodRow}>
            <Text style={styles.methodIcon}>{METHOD_ICONS[method.id] ?? '💳'}</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodStatus}>Connected</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          </View>
        ))}

        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Payments are processed securely through your country&apos;s payment providers.
          </Text>
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
  countryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  countryFlag: {
    fontSize: 32,
  },
  countryName: {
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countrySub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  methodIcon: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  methodStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
  },
  emptyCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    flexShrink: 1,
  },
});
