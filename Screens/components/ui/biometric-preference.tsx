import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BiometricKind } from "../../services/storage/biometric-credentials.storage";
import { colors, fonts } from "../../styles/theme";
import AppIcon from "./app-icon";

type BiometricPreferenceProps = {
  checked: boolean;
  kind: BiometricKind;
  onPress: () => void;
  description?: string;
};

export default function BiometricPreference({
  checked,
  kind,
  onPress,
  description = "Your login is encrypted and protected by this device.",
}: BiometricPreferenceProps) {
  const label = kind === "face" ? "Face ID" : "Fingerprint";

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.icon}>
        <AppIcon
          name={kind === "face" ? "scan-outline" : "finger-print"}
          color="#168a4a"
          size={20}
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Use {label} next time</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={[styles.toggle, checked && styles.toggleActive]}>
        <View style={[styles.thumb, checked && styles.thumbActive]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#edf9f2",
    borderColor: "#d4eddd",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  copy: { flex: 1 },
  title: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  description: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  toggle: {
    backgroundColor: colors.line,
    borderRadius: 14,
    height: 27,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 46,
  },
  toggleActive: { backgroundColor: colors.lime },
  thumb: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 11,
    height: 21,
    width: 21,
  },
  thumbActive: { alignSelf: "flex-end" },
});
