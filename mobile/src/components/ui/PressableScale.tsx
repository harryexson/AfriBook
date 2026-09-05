import React, { useRef } from "react";
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";

interface PressableScaleProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far it dips on press. Bigger surfaces need less. */
  scaleTo?: number;
}

/**
 * Press feedback for anything tappable.
 *
 * Everything in this app was a TouchableOpacity, which only dims — that reads
 * as a link, not a control. A short scale dip gives the same physical
 * "it moved because I touched it" response the reference interfaces have, and
 * it's the one interaction shared by every card, tile and chip so the whole
 * app feels like one surface.
 *
 * Uses the native driver so the animation runs off the JS thread and stays
 * smooth while a list is scrolling or a fetch is in flight.
 */
export default function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  ...props
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const to = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();

  return (
    <Pressable
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
