import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../src/theme';
import Button from '../src/components/ui/Button';
import { api } from '../src/lib/api';
import { formatMoney } from '../src/lib/money';
import { useMarketStore } from '../src/stores/market-store';
import { useCartStore } from '../src/stores/cart-store';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
  { id: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'cash', label: 'Pay with Cash', icon: '💵' },
];

const DEFAULT_TOTAL = 5500;

const DEFAULT_SUMMARY = [
  { label: 'Classic Haircut', amount: 5000 },
  { label: 'Service Fee', amount: 500 },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const currencyCode = useMarketStore((s) => s.currencyCode());
  const countryCode = useMarketStore((s) => s.countryCode);
  const cartItems = useCartStore((s) => s.items);
  const cartSubtotal = useCartStore((s) => s.subtotal());
  const { clearCart } = useCartStore();
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCart = cartItems.length > 0;
  const totalAmount = hasCart ? cartSubtotal : DEFAULT_TOTAL;
  const summaryItems = hasCart
    ? cartItems.map((item) => ({
        label:
          item.type === 'menu'
            ? item.item.name
            : item.type === 'booking'
              ? item.service.name
              : item.product.name,
        amount:
          (item.type === 'menu'
            ? item.item.price
            : item.type === 'booking'
              ? item.service.price
              : item.product.price) * item.quantity,
      }))
    : DEFAULT_SUMMARY;
  const orderLabel = summaryItems[0]?.label ?? 'AfriBook Order';

  const handlePay = async () => {
    setProcessing(true);
    setError(null);

    try {
      if (selectedMethod === 'cash') {
        // Cash on delivery — no online payment intent needed.
        await new Promise((r) => setTimeout(r, 800));
        if (hasCart) clearCart();
        router.replace('/(tabs)/bookings');
        return;
      }

      const result = await api.post<{
        transactionId?: string;
        status?: string;
        redirectUrl?: string;
        error?: string;
      }>('/api/payment/intent', {
        amount: totalAmount,
        currency: currencyCode,
        countryCode,
        method: selectedMethod,
        description: orderLabel,
      });

      if (result.redirectUrl) {
        await Linking.openURL(result.redirectUrl);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      if (hasCart) clearCart();
      router.replace('/(tabs)/bookings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
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
          {summaryItems.map((item) => (
            <View key={item.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{formatMoney(item.amount, currencyCode)}</Text>
            </View>
          ))}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatMoney(totalAmount, currencyCode)}</Text>
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

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Button
          title={`Pay ${formatMoney(totalAmount, currencyCode)}`}
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
  error: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
    paddingVertical: spacing.md,
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
