import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES } from '../constants/countries';
import { useMarketStore } from '../stores/market-store';
import { colors, spacing, borderRadius, typography } from '../theme';

/**
 * States plainly when the user is browsing a market other than the one they're
 * physically in, and offers one tap back.
 *
 * Booking across borders is legitimate — sending food to family, arranging a
 * service before you land — so this doesn't block or nag. But the prices,
 * currency, availability and payment methods on screen are the destination
 * country's, and a user who doesn't realise they've switched can get a long way
 * into a booking on wrong assumptions. Naming it once, quietly, is the whole
 * job. It renders nothing when browsing at home.
 */
export default function CountryNotice() {
  const countryCode = useMarketStore((s) => s.countryCode);
  const detected = useMarketStore((s) => s.detectedCountry);
  const setCountry = useMarketStore((s) => s.setCountry);

  if (!detected || detected === countryCode) return null;

  const viewing = COUNTRIES[countryCode];
  const home = COUNTRIES[detected];
  if (!viewing || !home) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
      <Text style={styles.text}>
        Browsing <Text style={styles.strong}>{viewing.name}</Text>. Prices in{' '}
        <Text style={styles.strong}>{viewing.currency.code}</Text>.
      </Text>
      <Text
        style={styles.action}
        onPress={() => setCountry(detected)}
        accessibilityRole="button"
      >
        {home.code}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  text: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  strong: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  action: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
