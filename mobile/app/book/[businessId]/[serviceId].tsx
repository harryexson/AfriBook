import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../../src/theme';
import Button from '../../../src/components/ui/Button';
import { useMarketStore } from '../../../src/stores/market-store';
import { formatMoney } from '../../../src/lib/money';
import type { Service } from '../../../src/types';

const MOCK_SERVICE: Service = {
  id: 's1',
  businessId: '1',
  name: 'Classic Haircut',
  description: 'Traditional haircut with clippers and scissors',
  duration: 30,
  price: 5000,
  currencyCode: 'NGN',
  category: 'Hair',
  available: true,
  maxCapacityPerSlot: 3,
  paddingMinutes: 10,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
];

function getNext7Days() {
  const days = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      full: d.toISOString().split('T')[0],
    });
  }
  return days;
}

export default function BookServiceScreen() {
  const { businessId, serviceId } = useLocalSearchParams<{ businessId: string; serviceId: string }>();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const service = MOCK_SERVICE;
  const days = getNext7Days();
  const currencyCode = useMarketStore((s) => s.currencyCode());

  const canProceed = selectedDate && selectedTime;

  const handleContinue = () => {
    if (!canProceed) return;
    router.push('/checkout');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Service</Text>
        </View>

        {/* Service Summary */}
        <View style={styles.serviceCard}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>
          <View style={styles.serviceMeta}>
            <Text style={styles.serviceDuration}>⏱ {service.duration} min</Text>
            <Text style={styles.servicePrice}>
              {formatMoney(service.price, currencyCode)}
            </Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesRow}>
            {days.map((day) => (
              <TouchableOpacity
                key={day.full}
                style={[styles.dateChip, selectedDate === day.full && styles.dateChipActive]}
                onPress={() => setSelectedDate(day.full)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateLabel, selectedDate === day.full && styles.dateLabelActive]}>
                  {day.label}
                </Text>
                <Text style={[styles.dateDay, selectedDate === day.full && styles.dateDayActive]}>
                  {day.day}
                </Text>
                <Text style={[styles.dateMonth, selectedDate === day.full && styles.dateMonthActive]}>
                  {day.month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.timeChip, selectedTime === slot && styles.timeChipActive]}
                onPress={() => setSelectedTime(slot)}
                activeOpacity={0.7}
              >
                <Text style={[styles.timeText, selectedTime === slot && styles.timeTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (optional)</Text>
          <View style={styles.notesInput}>
            <Text style={styles.notesPlaceholder}>
              Any special requests or preferences...
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>
            {formatMoney(service.price, currencyCode)}
          </Text>
        </View>
        <Button
          title="Continue to Checkout"
          onPress={handleContinue}
          disabled={!canProceed}
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
  serviceCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  serviceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  serviceDuration: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  servicePrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  datesRow: {
    gap: spacing.sm,
  },
  dateChip: {
    width: 68,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dateChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  dateLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  dateLabelActive: {
    color: colors.textInverse,
  },
  dateDay: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dateDayActive: {
    color: colors.textInverse,
  },
  dateMonth: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  dateMonthActive: {
    color: colors.textInverse,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  timeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timeTextActive: {
    color: colors.textInverse,
  },
  notesInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    minHeight: 80,
  },
  notesPlaceholder: {
    fontSize: typography.fontSize.md,
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
});
