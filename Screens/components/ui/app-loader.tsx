import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "../../styles/theme";

type AppLoaderProps = {
  accessibilityLabel?: string;
  color?: string;
  size?: "small" | "large" | number;
  style?: StyleProp<ViewStyle>;
};

export default function AppLoader({
  accessibilityLabel = "Loading",
  color = colors.lime,
  size = "small",
  style,
}: AppLoaderProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const diameter = typeof size === "number" ? size : size === "large" ? 36 : 20;
  const strokeWidth = diameter >= 30 ? 3 : 2;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        duration: 760,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={[styles.frame, { height: diameter, width: diameter }, style]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.track,
          {
            borderColor: color,
            borderWidth: strokeWidth,
            height: diameter,
            opacity: 0.16,
            width: diameter,
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.arc,
          {
            borderTopColor: color,
            borderRightColor: color,
            borderWidth: strokeWidth,
            height: diameter,
            transform: [{ rotate: spin }],
            width: diameter,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.core,
          {
            backgroundColor: color,
            height: Math.max(3, diameter * 0.18),
            width: Math.max(3, diameter * 0.18),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: "center", justifyContent: "center" },
  track: { borderRadius: 999, position: "absolute" },
  arc: {
    borderColor: "transparent",
    borderRadius: 999,
    position: "absolute",
  },
  core: { borderRadius: 999 },
});
