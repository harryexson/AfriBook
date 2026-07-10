import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
} from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../theme';
import { COUNTRIES, CountryConfig } from '../constants/countries';

interface CountryPickerProps {
  selectedCode: string;
  onSelect: (country: CountryConfig) => void;
}

export default function CountryPicker({ selectedCode, onSelect }: CountryPickerProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const selected = COUNTRIES[selectedCode];

  const filtered = Object.values(COUNTRIES).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        activeOpacity={0.7}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.flag}>{selected?.flag ?? '🌍'}</Text>
        <Text style={styles.code}>{selected?.code ?? 'Select'}</Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>Select Country</Text>

            <TextInput
              style={styles.search}
              placeholder="Search countries..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.code === selectedCode && styles.optionActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                    setSearch('');
                  }}
                >
                  <Text style={styles.optionFlag}>{item.flag}</Text>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionName}>{item.name}</Text>
                    <Text style={styles.optionCurrency}>
                      {item.currency.symbol} {item.currency.code}
                    </Text>
                  </View>
                  {item.code === selectedCode && (
                    <Text style={styles.check}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setVisible(false);
                setSearch('');
              }}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flag: {
    fontSize: 22,
  },
  code: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginLeft: 'auto',
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '80%',
    padding: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  search: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  optionActive: {
    backgroundColor: colors.primarySurface,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  optionFlag: {
    fontSize: 28,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionCurrency: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  check: {
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  closeButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
