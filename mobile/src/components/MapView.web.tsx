import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { borderRadius } from '../theme';
import type { GeoPoint } from '../types';

// react-native-maps has no web renderer, and Expo's web bundle pulls in
// every screen expo-router can route to — including screens that import
// the native AfriBookMapView (MapView.tsx) — so bundling for web fails
// entirely without a web-specific stub. Metro picks this file over
// MapView.tsx automatically for the web platform (the `.web.tsx` suffix
// convention), so MapView.tsx itself needs no changes for iOS/Android.
//
// This mirrors the web app's own keyless OpenStreetMap iframe embed
// (src/components/shared/MapEmbed.tsx) rather than a static placeholder,
// so mobile-web gets a real, working map instead of a dead end.
interface MapViewProps {
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  markers?: Array<{
    id: string;
    coordinate: GeoPoint;
    title?: string;
    subtitle?: string;
    color?: string;
  }>;
  routePolyline?: string;
  style?: object;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  onPress?: (event: { coordinate: { latitude: number; longitude: number } }) => void;
}

export default function AfriBookMapView({
  region = { latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.05, longitudeDelta: 0.05 },
  markers = [],
  style,
}: MapViewProps) {
  const lat = markers[0]?.coordinate.latitude ?? region.latitude;
  const lng = markers[0]?.coordinate.longitude ?? region.longitude;
  const span = Math.max(region.latitudeDelta ?? 0.05, 0.01);

  const src = useMemo(() => {
    const minLat = lat - span;
    const maxLat = lat + span;
    const minLng = lng - span;
    const maxLng = lng + span;
    return (
      `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}` +
      `&layer=mapnik&marker=${lat},${lng}`
    );
  }, [lat, lng, span]);

  return (
    <View style={[styles.container, style]}>
      {/* Raw DOM element — valid here because Expo web renders .web.tsx
          files through react-dom, not the native View/Text renderer. */}
      <iframe src={src} style={webStyles.iframe} loading="lazy" title="Map" />
    </View>
  );
}

export function Marker() {
  return null;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
});

const webStyles = { iframe: { width: '100%', height: '100%', border: 0 } } as const;
