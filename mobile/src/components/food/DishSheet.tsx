import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography, shadows } from "../../theme";
import { dishPhotoFor } from "../../lib/images";
import Chip from "../ui/Chip";
import Button from "../ui/Button";
import { formatMoney } from "../../lib/money";
import type { MenuItem } from "../../types";

interface DishSheetProps {
  item: MenuItem | null;
  prepTime: number;
  onClose: () => void;
  onAdd: (item: MenuItem, quantity: number, notes?: string) => void;
}

/**
 * Dish configurator, adapted from the staged pizza-builder reference: the
 * running total and the estimated prep time both respond live to what you
 * choose, and the commit button carries the price so you never have to look
 * elsewhere to know what you're about to pay.
 *
 * Deliberately built only on fields that actually exist on MenuItem
 * (quantity, notes, price, prepTime, allergens, dietaryTags). The reference
 * also offers size and crust; this menu model has no variants or add-ons, and
 * inventing them would put fake choices in front of a real checkout.
 */
export default function DishSheet({ item, prepTime, onClose, onAdd }: DishSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const slide = useRef(new Animated.Value(0)).current;
  const visible = Boolean(item);

  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setNotes("");
      slide.setValue(0);
      Animated.timing(slide, {
        toValue: 1,
        duration: 260,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slide]);

  const total = useMemo(() => (item ? item.price * quantity : 0), [item, quantity]);

  if (!item) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Image
            source={{ uri: dishPhotoFor(item.id, item.name, item.image, 320) }}
            style={styles.image}
          />

          <Text style={styles.name}>{item.name}</Text>

          <View style={styles.metaRow}>
            <Chip
              label={`${prepTime}-${prepTime + 10} min`}
              icon={<Ionicons name="time-outline" size={12} color={colors.textSecondary} />}
            />
            {item.dietaryTags?.includes("vegetarian") ? (
              <Chip
                label="Vegetarian"
                icon={<Ionicons name="leaf-outline" size={12} color={colors.success} />}
              />
            ) : null}
            {item.allergens?.length ? (
              <Chip
                label={`Contains ${item.allergens.length}`}
                icon={<Ionicons name="alert-circle-outline" size={12} color={colors.textSecondary} />}
              />
            ) : null}
          </View>

          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

          {item.allergens?.length ? (
            <Text style={styles.allergens}>Allergens: {item.allergens.join(", ")}</Text>
          ) : null}

          <Text style={styles.label}>Special instructions</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="No onions, extra spicy…"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            multiline
          />

          <View style={styles.quantityRow}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity === 1}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color={quantity === 1 ? colors.textTertiary : colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepButton}
                onPress={() => setQuantity((q) => q + 1)}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Commit bar — price lives on the button, as in the reference. */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Button
            title={`Add · ${formatMoney(total, item.currencyCode)}`}
            variant="ink"
            style={styles.addButton}
            onPress={() => {
              onAdd(item, quantity, notes.trim() || undefined);
              onClose();
            }}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 20, 22, 0.45)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    backgroundColor: colors.canvas,
    borderTopLeftRadius: borderRadius["3xl"],
    borderTopRightRadius: borderRadius["3xl"],
    ...shadows.premium,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: spacing.md,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: borderRadius["2xl"],
    backgroundColor: colors.surfaceTertiary,
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: 23,
    marginTop: spacing.lg,
  },
  allergens: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    minHeight: 76,
    textAlignVertical: "top",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: 4,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    minWidth: 28,
    textAlign: "center",
    fontSize: typography.fontSize.md,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing["2xl"],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    flex: 1,
  },
});
