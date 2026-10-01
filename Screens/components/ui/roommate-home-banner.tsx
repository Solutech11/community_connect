import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { roomieHomeImage } from "../../data/roommate-design";
import { colors, fonts } from "../../styles/theme";

type RoommateHomeBannerProps = {
  onPress: () => void;
};

export default function RoommateHomeBanner({
  onPress,
}: RoommateHomeBannerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Find your roomie"
      accessibilityHint="Explore people with compatible housing plans and living habits"
      onPress={onPress}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
    >
      <View style={styles.copy}>
        <View style={styles.eyebrowRow}>
          <Ionicons name="home-outline" size={13} color={colors.forest} />
          <Text style={styles.eyebrow}>ROOMIE</Text>
        </View>
        <Text style={styles.title}>Your people.{"\n"}Your place.</Text>
        <Text style={styles.description}>
          Find someone who shares your lifestyle and living plans.
        </Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Find your roomie</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.forest} />
        </View>
      </View>
      <View style={styles.photoWrap}>
        <Image
          source={{ uri: roomieHomeImage }}
          style={StyleSheet.absoluteFill}
          accessibilityIgnoresInvertColors
        />
        <LinearGradient
          colors={["transparent", "rgba(7,31,23,0.7)"]}
          style={styles.photoShade}
        >
          <View style={styles.homeMark}>
            <Ionicons name="home-outline" size={18} color={colors.white} />
          </View>
          <Text style={styles.photoLabel}>FEEL AT HOME</Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: colors.paleGreen,
    borderColor: "#d2e9dc",
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  pressed: { opacity: 0.82 },
  copy: { flex: 1, minWidth: 0, alignItems: "flex-start", gap: 9 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eyebrow: {
    color: colors.forest,
    fontFamily: fonts.extraBold,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  title: {
    color: colors.forest,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.9,
  },
  description: {
    color: "#587366",
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.lime,
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 12,
    minHeight: 44,
    marginTop: 4,
    maxWidth: "100%",
  },
  ctaText: {
    color: colors.forest,
    fontFamily: fonts.bold,
    fontSize: 11,
    flexShrink: 1,
  },
  photoWrap: {
    width: "31%",
    maxWidth: 125,
    borderRadius: 17,
    backgroundColor: colors.forest,
    overflow: "hidden",
  },
  photoShade: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 8,
    paddingBottom: 12,
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 7,
  },
  homeMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.4)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoLabel: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 7,
    lineHeight: 11,
    letterSpacing: 0.7,
    textAlign: "center",
  },
});
