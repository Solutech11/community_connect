import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "../../styles/theme";

type Props = { name: string; uri?: string; size?: number };

export default function PersonAvatar({ name, uri, size = 58 }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri, name]);

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
  const shape = { width: size, height: size, borderRadius: size / 2 };

  return uri && !failed ? (
    <Image
      accessibilityLabel={name + " profile photo"}
      onError={() => setFailed(true)}
      source={{ uri }}
      style={[styles.photo, shape]}
    />
  ) : (
    <View
      accessibilityLabel={name + " initials"}
      style={[styles.fallback, shape]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.3 }]}>
        {initials || "?"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { backgroundColor: colors.paleGreen },
  fallback: {
    alignItems: "center",
    backgroundColor: colors.paleGreen,
    justifyContent: "center",
  },
  initials: { color: colors.moss, fontFamily: fonts.extraBold },
});
