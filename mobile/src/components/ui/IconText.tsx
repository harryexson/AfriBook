import React from "react";
import { View, Text, StyleSheet, StyleProp, TextStyle, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

interface IconTextProps {
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  size?: number;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  numberOfLines?: number;
}

/**
 * A glyph followed by a line of text. Replaces the pattern of prefixing a
 * string with an emoji, which doesn't align to the text baseline, can't
 * inherit colour, and renders differently on each platform.
 */
export default function IconText({
  icon,
  children,
  size = 14,
  color = colors.textSecondary,
  textStyle,
  style,
  numberOfLines,
}: IconTextProps) {
  return (
    <View style={[styles.row, style]}>
      <Ionicons name={icon} size={size} color={color} />
      <Text style={[styles.text, textStyle]} numberOfLines={numberOfLines}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: {
    flexShrink: 1,
  },
});
