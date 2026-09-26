import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES } from '../constants/countries';
import { useMarketStore } from '../stores/market-store';
import { colors, spacing, borderRadius, typography } from '../theme';

/**
 * States plainly when the user is browsing a market other than the one they're
 * physically in, offers one tap back, and — when the currencies actually
 * differ — an opt-in toggle to see an estimate in the viewer's own currency.
 *
 * Booking across borders is legitimate — sending food to family, arranging a
 * service before you land — so this doesn't block or nag. The prices,
 * currency, availability and payment methods on screen are the destination
 * country's and are what's actually charged, matching how Uber, Airbnb, Bolt
 * and Jumia all price a listing in its own market's currency by default. The
 * estimate toggle is opt-in only, mirroring Airbnb's guest-initiated 'pay in
 * your currency' switch — never something turned on automatically from
 * device location. It renders nothing when browsing at home.
 */
export default function CountryNotice() {
  const countryCode = useMarketStore((s) => s.countryCode);
  const detected = useMarketStore((s) => s.detectedCountry);
  const setCountry = useMarketStore((s) => s.setCountry);
  const showCurrencyEstimate = useMarketStore((s) => s.showCurrencyEstimate);
  const setShowCurrencyEstimate = useMarketStore((s) => s.setShowCurrencyEstimate);

  if (!detected || detected === countryCode) return null;

  const viewing = COUNTRIES[countryCode];
  const home = COUNTRIES[detected];
  if (!viewing || !home) return null;

  const sameCurrency = viewing.currency.code === home.currency.code;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <View style={styles.row}>
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
      {!sameCurrency && (
        <Text
          style={styles.estimateToggle}
          onPress={() => setShowCurrencyEstimate(!showCurrencyEstimate)}
          accessibilityRole="button"
          accessibilityState={{ selected: showCurrencyEstimate }}
        >
          {showCurrencyEstimate
            ? `Hide ${home.currency.code} estimate`
            : `Show estimate in ${home.currency.code}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  estimateToggle: {
    alignSelf: 'flex-start',
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
