import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { useAuthStore } from '../../src/stores/auth-store';
import { useAuth } from '../../src/hooks/useAuth';
import Avatar from '../../src/components/ui/Avatar';
import Button from '../../src/components/ui/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { signOut } = useAuth();

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyTitle}>Sign in to your account</Text>
          <Text style={styles.emptySubtitle}>
            Access your bookings, saved businesses, and more
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/(auth)/login')}
            fullWidth
          />
          <Button
            title="Create Account"
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  const menuItems = [
    { label: 'My Bookings', icon: '📋', onPress: () => router.push('/(tabs)/bookings') },
    { label: 'Saved Businesses', icon: '❤️', onPress: () => {} },
    { label: 'Payment Methods', icon: '💳', onPress: () => {} },
    { label: 'Notifications', icon: '🔔', onPress: () => {} },
    { label: 'Become a Vendor', icon: '🏪', onPress: () => router.push('/vendor') },
    { label: 'Drive with AfriBook', icon: '🚗', onPress: () => router.push('/driver') },
    { label: 'Settings', icon: '⚙️', onPress: () => {} },
    { label: 'Help & Support', icon: '❓', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Profile</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar uri={user.avatarUrl} name={user.name} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <View style={styles.signOutContainer}>
          <Button
            title="Sign Out"
            variant="danger"
            onPress={signOut}
            fullWidth
          />
        </View>

        <Text style={styles.version}>AfriBook v1.0.0</Text>
      </ScrollView>
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
    paddingBottom: spacing['5xl'],
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primaryDark,
    textTransform: 'capitalize',
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  menuChevron: {
    fontSize: typography.fontSize.xl,
    color: colors.textTertiary,
  },
  signOutContainer: {
    marginTop: spacing.xl,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xl,
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
