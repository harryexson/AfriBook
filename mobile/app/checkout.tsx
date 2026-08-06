import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../src/theme';
import Button from '../src/components/ui/Button';
import { API_BASE } from '../src/lib/api';
import * as SecureStore from 'expo-secure-store';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
  { id: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'cash', label: 'Pay with Cash', icon: '💵' },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const token = await SecureStore.getItemAsync('afribook-token');
      const response = await fetch(`${API_BASE}/api/payment/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: 5500,
          currency: 'NGN',
          countryCode: 'NG',
          method: selectedMethod,
          description: 'AfriBook checkout',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Payment failed');
      }

      router.replace('/(tabs)/bookings');
    } catch (err) {
      Alert.alert(
        'Payment failed',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Classic Haircut</Text>
            <Text style={styles.summaryValue}>NGN 5,000</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>NGN 500</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>NGN 5,500</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodRow,
                selectedMethod === method.id && styles.methodRowActive,
              ]}
              onPress={() => setSelectedMethod(method.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.methodIcon}>{method.icon}</Text>
              <Text style={styles.methodLabel}>{method.label}</Text>
              <View style={[styles.radio, selectedMethod === method.id && styles.radioActive]}>
                {selectedMethod === method.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Your payment is secured with 256-bit SSL encryption
          </Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Button
          title="Pay NGN 5,500"
          onPress={handlePay}
          loading={processing}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  backText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  methodRowActive: {
    backgroundColor: colors.primarySurface,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderBottomWidth: 0,
  },
  methodIcon: {
    fontSize: 22,
  },
  methodLabel: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: spacing['3xl'],
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
