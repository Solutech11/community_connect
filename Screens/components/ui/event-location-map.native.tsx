import { Ionicons } from "@expo/vector-icons";
import Mapbox from "@rnmapbox/maps";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "../../styles/theme";
import type { EventLocationMapProps } from "./event-location-map.types";

const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
if (accessToken) Mapbox.setAccessToken(accessToken);

const COUNTRY_CENTERS: Record<string, [number, number]> = {
  Nigeria: [7.4951, 9.082],
  Ghana: [-1.0232, 7.9465],
  Kenya: [37.9062, 0.0236],
};

function readPointCoordinates(feature: unknown) {
  if (!feature || typeof feature !== "object" || !("geometry" in feature)) {
    return null;
  }
  const geometry = feature.geometry;
  if (
    !geometry ||
    typeof geometry !== "object" ||
    !("type" in geometry) ||
    !("coordinates" in geometry) ||
    geometry.type !== "Point"
  ) {
    return null;
  }
  const coordinates: unknown = geometry.coordinates;
  if (
    !Array.isArray(coordinates) ||
    typeof coordinates[0] !== "number" ||
    typeof coordinates[1] !== "number" ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1])
  ) {
    return null;
  }
  return [coordinates[0], coordinates[1]] as [number, number];
}

export default function EventLocationMap({
  country,
  coordinate,
  onCoordinateChange,
}: EventLocationMapProps) {
  const camera = useRef<Mapbox.Camera>(null);
  const center = useMemo<[number, number]>(
    () =>
      coordinate
        ? [coordinate.longitude, coordinate.latitude]
        : (COUNTRY_CENTERS[country] ?? COUNTRY_CENTERS.Nigeria),
    [coordinate?.latitude, coordinate?.longitude, country],
  );

  useEffect(() => {
    if (!coordinate) return;
    camera.current?.setCamera({
      centerCoordinate: center,
      zoomLevel: 15,
      animationDuration: 500,
      animationMode: "flyTo",
    });
  }, [center, coordinate]);

  if (!accessToken) {
    return (
      <View style={styles.unavailable}>
        <View style={styles.icon}>
          <Ionicons color="#078d45" name="map-outline" size={25} />
        </View>
        <Text style={styles.title}>Add a Mapbox public access token</Text>
        <Text style={styles.copy}>
          Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your local environment, then
          rebuild the development app.
        </Text>
      </View>
    );
  }

  const handleMapPress = (feature: unknown) => {
    const point = readPointCoordinates(feature);
    if (point) onCoordinateChange(point[0], point[1]);
  };

  const handleMarkerDrag = (feature: unknown) => {
    const point = readPointCoordinates(feature);
    if (point) onCoordinateChange(point[0], point[1]);
  };

  return (
    <Mapbox.MapView
      onPress={handleMapPress}
      scaleBarEnabled={false}
      style={styles.map}
      styleURL={Mapbox.StyleURL.Street}
    >
      <Mapbox.Camera
        defaultSettings={{
          centerCoordinate: center,
          zoomLevel: coordinate ? 15 : 5,
        }}
        ref={camera}
      />
      {coordinate ? (
        <Mapbox.PointAnnotation
          coordinate={center}
          draggable
          id="event-location-pin"
          onDragEnd={handleMarkerDrag}
        >
          <View style={styles.pin}>
            <Ionicons color="#ffffff" name="location" size={24} />
          </View>
        </Mapbox.PointAnnotation>
      ) : null}
    </Mapbox.MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  unavailable: {
    alignItems: "center",
    backgroundColor: "#eff8f2",
    borderRadius: 24,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  icon: {
    alignItems: "center",
    backgroundColor: "#def4e7",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginBottom: 12,
    width: 48,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 15,
    textAlign: "center",
  },
  copy: {
    color: "#64806f",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    textAlign: "center",
  },
  pin: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 18,
    borderWidth: 3,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
});
