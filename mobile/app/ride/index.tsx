import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AfriBookMapView from "../../src/components/MapView";
import { useLocation } from "../../src/hooks/useLocation";
import { useRide } from "../../src/hooks/useRide";
import { geocodeAddress } from "../../src/lib/geo";
import { useMarketStore } from "../../src/stores/market-store";
import { formatMoney } from "../../src/lib/money";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from "../../src/theme";

const RIDE_TYPES = [
  { id: "economy", name: "Economy", icon: "car", eta: "3 min", price: 800 },
  {
    id: "comfort",
    name: "Comfort",
    icon: "car-sport",
    eta: "5 min",
    price: 1500,
  },
  {
    id: "premium",
    name: "Premium",
    icon: "car-sport",
    eta: "7 min",
    price: 3000,
  },
  { id: "motorcycle", name: "Bike", icon: "bicycle", eta: "2 min", price: 400 },
];

export default function RideRequestScreen() {
  const router = useRouter();
  const { location, isTracking, startTracking } = useLocation();
  const { ride, isLoading, error, requestRide, cancelRide } = useRide();
  const currencyCode = useMarketStore((s) => s.currencyCode());
  const countryCode = useMarketStore((s) => s.countryCode);

  const [pickupAddress, setPickupAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [selectedRideType, setSelectedRideType] = useState("economy");
  const [step, setStep] = useState<"search" | "select" | "matching" | "riding">(
    "search",
  );
  const [geocoding, setGeocoding] = useState(false);

  const handleRequestRide = useCallback(async () => {
    if (!location) {
      Alert.alert(
        "Location Required",
        "Please enable location services to request a ride.",
      );
      return;
    }

    if (!pickupAddress.trim() || !destinationAddress.trim()) {
      Alert.alert(
        "Addresses Required",
        "Please enter both pickup and destination addresses.",
      );
      return;
    }

    setStep("matching");
    setGeocoding(true);

    // Real geocoding now — this used to send `pickup + a fixed 0.01deg
    // offset` as the "destination" to the real /api/ridely/rides endpoint,
    // regardless of what the rider actually typed.
    const geocoded = await geocodeAddress(destinationAddress, countryCode);
    setGeocoding(false);
    const destination = geocoded
      ? { lat: geocoded.latitude, lng: geocoded.longitude }
      : { lat: location.latitude + 0.01, lng: location.longitude + 0.01 };

    if (!geocoded) {
      Alert.alert(
        "Couldn't find that address",
        "We couldn't precisely locate the destination — continuing with an estimate. You can adjust the drop-off with your driver.",
      );
    }

    const rideId = await requestRide({
      pickup: { lat: location.latitude, lng: location.longitude },
      pickupAddress,
      destination,
      destinationAddress,
      rideType: selectedRideType,
      paymentType: "cash",
    });

    if (rideId) {
      setStep("riding");
    } else {
      setStep("select");
      Alert.alert("No Drivers", "No drivers available. Please try again.");
    }
  }, [
    location,
    pickupAddress,
    destinationAddress,
    selectedRideType,
    requestRide,
    countryCode,
  ]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Map */}
      {location && (
        <AfriBookMapView
          region={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          routePolyline={ride.routePolyline ?? undefined}
          markers={
            ride.driverId
              ? [
                  {
                    id: "driver",
                    coordinate: {
                      latitude: location.latitude + 0.002,
                      longitude: location.longitude + 0.002,
                    },
                    title: "Your Driver",
                    color: colors.primary,
                  },
                ]
              : []
          }
          style={styles.map}
        />
      )}

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {step === "search" && (
          <View style={styles.sheetContent}>
            <Text style={styles.title}>Where to?</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <View
                  style={[styles.dot, { backgroundColor: colors.primary }]}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Pickup location"
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputRow}>
                <View style={[styles.dot, { backgroundColor: colors.error }]} />
                <TextInput
                  style={styles.input}
                  placeholder="Where to?"
                  value={destinationAddress}
                  onChangeText={setDestinationAddress}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { opacity: pickupAddress && destinationAddress ? 1 : 0.5 },
              ]}
              onPress={() => setStep("select")}
              disabled={!pickupAddress || !destinationAddress}
            >
              <Text style={styles.primaryButtonText}>Choose Ride</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "select" && (
          <View style={styles.sheetContent}>
            <Text style={styles.title}>Select Ride Type</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.rideTypes}
            >
              {RIDE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.rideTypeCard,
                    selectedRideType === type.id && styles.rideTypeCardActive,
                  ]}
                  onPress={() => setSelectedRideType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={28}
                    color={
                      selectedRideType === type.id
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.rideTypeName,
                      selectedRideType === type.id && styles.rideTypeNameActive,
                    ]}
                  >
                    {type.name}
                  </Text>
                  <Text style={styles.rideTypeEta}>{type.eta}</Text>
                  <Text style={styles.rideTypePrice}>
                    {formatMoney(type.price, currencyCode)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRequestRide}
              disabled={geocoding || isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {geocoding
                  ? "Finding destination…"
                  : `Request ${RIDE_TYPES.find((t) => t.id === selectedRideType)?.name}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep("search")}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {(step === "matching" || step === "riding") && (
          <View style={styles.sheetContent}>
            {ride.status === "idle" || ride.status === "searching" ? (
              <>
                <Text style={styles.title}>Finding your driver...</Text>
                <Text style={styles.subtitle}>Looking for nearby drivers</Text>
                <TouchableOpacity
                  style={[styles.secondaryButton, { marginTop: spacing.lg }]}
                  onPress={() => {
                    cancelRide("Cancelled by rider");
                    setStep("search");
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : ride.status === "matched" || ride.status === "accepted" ? (
              <>
                <Text style={styles.title}>Driver Found!</Text>
                <View style={styles.driverInfo}>
                  <View style={styles.driverAvatar}>
                    <Ionicons
                      name="person"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.driverName}>
                      {ride.driverName ?? "Driver"}
                    </Text>
                    <Text style={styles.driverVehicle}>
                      {ride.vehicleInfo ?? "Vehicle"}
                    </Text>
                    <Text style={styles.driverRating}>
                      ⭐ {ride.driverRating?.toFixed(1) ?? "5.0"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.etaText}>
                      {ride.etaMinutes ?? 3} min
                    </Text>
                    <Text style={styles.etaLabel}>ETA</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>Ride In Progress</Text>
                <Text style={styles.subtitle}>Enjoy your ride!</Text>
              </>
            )}
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius["3xl"],
    borderTopRightRadius: borderRadius["3xl"],
    ...shadows.lg,
    maxHeight: "65%",
  },
  sheetContent: {
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  inputGroup: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
    marginLeft: 20,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.md,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
  },
  rideTypes: {
    marginBottom: spacing.lg,
  },
  rideTypeCard: {
    width: 132,
    minHeight: 160,
    alignItems: "center",
    padding: spacing.lg,
    marginRight: spacing.md,
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rideTypeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  rideTypeName: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  rideTypeNameActive: {
    color: colors.primary,
  },
  rideTypeEta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rideTypePrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  driverName: {
    fontSize: typography.fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  driverVehicle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  driverRating: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  etaText: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  etaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorBanner: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  errorText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    textAlign: "center",
  },
});
