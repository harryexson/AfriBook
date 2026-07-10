import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, borderRadius, typography, spacing } from '../../theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export default function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: size * 0.38 },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceTertiary,
  },
  fallback: {
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
