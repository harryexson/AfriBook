import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';

const FAQS = [
  {
    q: 'How do I book a ride?',
    a: 'Open the Rides tab, enter your pickup and drop-off, then confirm your driver and pay securely in-app.',
  },
  {
    q: 'How do I track my order?',
    a: 'Head to the Bookings tab after ordering. You can follow your order status as it is prepared and delivered.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes — open the booking in the Bookings tab and tap Cancel. Policies may apply depending on the business.',
  },
  {
    q: 'How do refunds work?',
    a: 'Refunds are processed to your original payment method and usually appear within 3–5 business days.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need a hand? We&apos;re here 24/7.</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL('mailto:support@afribook.app')}
            >
              <Text style={styles.contactEmoji}>✉️</Text>
              <Text style={styles.contactLabel}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL('tel:+2340000000000')}
            >
              <Text style={styles.contactEmoji}>📞</Text>
              <Text style={styles.contactLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL('https://wa.me/2340000000000')}
            >
              <Text style={styles.contactEmoji}>💬</Text>
              <Text style={styles.contactLabel}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <TouchableOpacity
              key={faq.q}
              style={styles.faqRow}
              activeOpacity={0.8}
              onPress={() => setOpenIndex(isOpen ? null : index)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </View>
              {isOpen ? <Text style={styles.faqAnswer}>{faq.a}</Text> : null}
            </TouchableOpacity>
          );
        })}
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
  contactCard: {
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.sm,
  },
  contactTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contactButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  contactEmoji: {
    fontSize: 28,
  },
  contactLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  faqRow: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  faqAnswer: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal,
  },
});
