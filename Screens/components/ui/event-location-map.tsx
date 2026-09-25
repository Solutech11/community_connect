import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "../../styles/theme";
import type { EventLocationMapProps } from "./event-location-map.types";

export type { MapCoordinate } from "./event-location-map.types";

export default function EventLocationMap({ country }: EventLocationMapProps) {
  return (
    <View style={styles.unavailable}>
      <View style={styles.icon}>
        <Ionicons color="#078d45" name="map-outline" size={25} />
      </View>
      <Text style={styles.title}>
        Map preview is available in the mobile app
      </Text>
      <Text style={styles.copy}>
        Search for a venue above to select its location. The selected country is
        {` ${country}`}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
