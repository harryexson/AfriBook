import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { colors, borderRadius, spacing, typography } from '../theme';
import type { GeoPoint } from '../types';
import { decodePolyline } from '../lib/polyline';

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
  routePolyline,
  style,
  showsUserLocation = true,
  showsMyLocationButton = true,
  onPress,
}: MapViewProps) {
  const mapRegion: Region = useMemo(
    () => ({
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta ?? 0.05,
      longitudeDelta: region.longitudeDelta ?? 0.05,
    }),
    [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta],
  );

  const routeCoords = useMemo(
    () => (routePolyline ? decodePolyline(routePolyline) : []),
    [routePolyline],
  );

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={[styles.container, style]}
      region={mapRegion}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      showsCompass={false}
      showsScale={false}
      toolbarEnabled={false}
      onPress={(e) => {
        if (onPress) {
          onPress({ coordinate: e.nativeEvent.coordinate });
        }
      }}
    >
      {routeCoords.length > 1 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor={colors.primary}
          strokeWidth={4}
          lineDashPattern={[0]}
        />
      )}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.coordinate.latitude,
            longitude: marker.coordinate.longitude,
          }}
          title={marker.title}
          description={marker.subtitle}
          pinColor={marker.color ?? colors.primary}
        />
      ))}
    </MapView>
  );
}

// Re-export Marker for use in other components
export { Marker } from 'react-native-maps';

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
});
