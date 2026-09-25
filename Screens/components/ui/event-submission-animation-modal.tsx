import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, Modal, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "../../styles/theme";

type Props = {
  visible: boolean;
};

export default function EventSubmissionAnimationModal({ visible }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const secondPulse = useRef(new Animated.Value(0)).current;
  const rocketLift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      pulse.stopAnimation();
      secondPulse.stopAnimation();
      rocketLift.stopAnimation();
      pulse.setValue(0);
      secondPulse.setValue(0);
      rocketLift.setValue(0);
      return;
    }

    const firstPulseLoop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    const secondPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(720),
        Animated.timing(secondPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(secondPulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const rocketLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rocketLift, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rocketLift, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    firstPulseLoop.start();
    secondPulseLoop.start();
    rocketLoop.start();

    return () => {
      firstPulseLoop.stop();
      secondPulseLoop.stop();
      rocketLoop.stop();
    };
  }, [pulse, rocketLift, secondPulse, visible]);

  const firstRingStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 0],
    }),
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.75, 1.75],
        }),
      },
    ],
  };
  const progressOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.72, 1, 0.72],
  });
  const secondRingStyle = {
    opacity: secondPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.45, 0],
    }),
    transform: [
      {
        scale: secondPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.75, 1.75],
        }),
      },
    ],
  };
  const rocketStyle = {
    transform: [
      {
        translateX: rocketLift.interpolate({
          inputRange: [0, 1],
          outputRange: [-3, 4],
        }),
      },
      {
        translateY: rocketLift.interpolate({
          inputRange: [0, 1],
          outputRange: [5, -9],
        }),
      },
      {
        rotate: rocketLift.interpolate({
          inputRange: [0, 1],
          outputRange: ["-16deg", "-28deg"],
        }),
      },
      {
        scale: rocketLift.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1.08],
        }),
      },
    ],
  };

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
            <Animated.View style={[styles.pulseRing, firstRingStyle]} />
            <Animated.View style={[styles.pulseRing, secondRingStyle]} />
            <View style={styles.rocketBadge}>
              <Animated.View style={rocketStyle}>
                <Ionicons color={colors.white} name="rocket" size={34} />
              </Animated.View>
            </View>
            <View style={styles.sparkleTop}>
              <Ionicons color="#f0c95d" name="sparkles" size={18} />
            </View>
            <View style={styles.sparkleBottom}>
              <Ionicons color="#9bddb8" name="sparkles" size={14} />
            </View>
          </View>
          <Text style={styles.title}>Sending your event for review</Text>
          <Text style={styles.message}>
            Creating your event, adding ticket tiers, and getting it ready for
            approval.
          </Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { opacity: progressOpacity }]}
            />
          </View>
          <Text style={styles.waitText}>This may take a few moments</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(5, 25, 16, 0.58)",
    flex: 1,
    justifyContent: "center",
    padding: 28,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: "#d7f0e1",
    borderRadius: 30,
    borderWidth: 1,
    maxWidth: 360,
    paddingHorizontal: 27,
    paddingTop: 28,
    paddingBottom: 24,
    width: "100%",
  },
  illustration: {
    alignItems: "center",
    height: 132,
    justifyContent: "center",
    marginBottom: 10,
    width: 132,
  },
  pulseRing: {
    backgroundColor: "#65d495",
    borderRadius: 54,
    height: 108,
    position: "absolute",
    width: 108,
  },
  rocketBadge: {
    alignItems: "center",
    backgroundColor: "#08ad54",
    borderColor: "#dff7e9",
    borderRadius: 38,
    borderWidth: 6,
    elevation: 5,
    height: 76,
    justifyContent: "center",
    shadowColor: "#078d45",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    width: 76,
  },
  sparkleTop: { position: "absolute", right: 6, top: 12 },
  sparkleBottom: { bottom: 14, left: 5, position: "absolute" },
  title: {
    color: colors.ink,
    fontFamily: fonts.bold,
    fontSize: 17,
    textAlign: "center",
  },
  message: {
    color: "#668071",
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 270,
    textAlign: "center",
  },
  progressTrack: {
    backgroundColor: "#e7f5ec",
    borderRadius: 5,
    height: 6,
    marginTop: 23,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    backgroundColor: "#08bd58",
    borderRadius: 5,
    height: "100%",
    width: "42%",
  },
  waitText: {
    color: "#8a9d90",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 10,
  },
});
