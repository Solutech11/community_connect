import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, fonts } from "../../styles/theme";

type Props = {
  visible: boolean;
};

export default function AiValidationModal({ visible }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      pulse.setValue(0);
      scan.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const scanLoop = Animated.loop(
      Animated.timing(scan, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    pulseLoop.start();
    scanLoop.start();

    return () => {
      pulseLoop.stop();
      scanLoop.stop();
    };
  }, [pulse, scan, visible]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.38, 0.08],
  });
  const scanOffset = scan.interpolate({
    inputRange: [0, 1],
    outputRange: [-42, 42],
  });

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => undefined}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.illustration}>
            <Animated.View
              style={[
                styles.pulseRing,
                { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
              ]}
            />
            <View style={styles.scanWindow}>
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanOffset }] },
                ]}
              />
              <View style={styles.aiCore}>
                <Ionicons color={colors.ink} name="sparkles" size={40} />
              </View>
              <View style={[styles.sparkle, styles.sparkleTop]}>
                <Ionicons color="#08b957" name="sparkles" size={15} />
              </View>
              <View style={[styles.sparkle, styles.sparkleSide]}>
                <Ionicons color="#08b957" name="sparkles" size={12} />
              </View>
            </View>
          </View>
          <View style={styles.statusRow}>
            <ActivityIndicator color="#08b957" size="small" />
            <Text style={styles.statusText}>AI REVIEW IN PROGRESS</Text>
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.title}>
            AI is validating your event
          </Text>
          <Text style={styles.message}>
            Checking your event details and ticket tiers. This may take a
            moment.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(8, 26, 18, 0.55)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 30,
    maxWidth: 360,
    paddingHorizontal: 26,
    paddingVertical: 28,
    width: "100%",
  },
  illustration: {
    alignItems: "center",
    height: 150,
    justifyContent: "center",
    marginBottom: 14,
    width: 150,
  },
  pulseRing: {
    backgroundColor: "#9ff0bf",
    borderRadius: 70,
    height: 112,
    position: "absolute",
    width: 112,
  },
  scanWindow: {
    alignItems: "center",
    backgroundColor: "#eaf9f0",
    borderColor: "#ccebd9",
    borderRadius: 58,
    borderWidth: 1,
    height: 116,
    justifyContent: "center",
    overflow: "hidden",
    width: 116,
  },
  scanLine: {
    backgroundColor: "rgba(8, 185, 87, 0.28)",
    height: 2,
    left: 10,
    position: "absolute",
    right: 10,
    top: 56,
  },
  aiCore: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderColor: colors.white,
    borderRadius: 26,
    borderWidth: 4,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  sparkle: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 26,
    justifyContent: "center",
    position: "absolute",
    width: 26,
  },
  sparkleTop: { right: 11, top: 11 },
  sparkleSide: { bottom: 18, left: 7 },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  statusText: {
    color: "#16864b",
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  title: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    marginTop: 13,
    textAlign: "center",
  },
  message: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});
