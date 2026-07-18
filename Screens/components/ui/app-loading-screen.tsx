import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { colors } from "../../styles/theme";

export default function AppLoadingScreen({ message = "Preparing your community experience" }: { message?: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(Animated.timing(spin, { duration: 7200, easing: Easing.linear, toValue: 1, useNativeDriver: true }));
    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { duration: 1300, easing: Easing.inOut(Easing.quad), toValue: 1, useNativeDriver: true }),
      Animated.timing(pulse, { duration: 1300, easing: Easing.inOut(Easing.quad), toValue: 0, useNativeDriver: true }),
    ]));
    const progressLoop = Animated.loop(Animated.sequence([
      Animated.timing(progress, { duration: 1500, easing: Easing.inOut(Easing.cubic), toValue: 1, useNativeDriver: true }),
      Animated.timing(progress, { duration: 450, toValue: 0, useNativeDriver: true }),
    ]));
    spinLoop.start(); pulseLoop.start(); progressLoop.start();
    return () => { spinLoop.stop(); pulseLoop.stop(); progressLoop.stop(); };
  }, [progress, pulse, spin]);

  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.62] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.12] });
  const driftY = pulse.interpolate({ inputRange: [0, 1], outputRange: [-7, 7] });
  const progressX = progress.interpolate({ inputRange: [0, 1], outputRange: [-118, 118] });

  return (
    <LinearGradient colors={["#03150e", colors.forest, "#0a3525"]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.screen}>
      <StatusBar style="light" backgroundColor="#03150e" />
      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientBottom} />
      <Animated.View style={[styles.stage, { transform: [{ translateY: driftY }] }]}>
        <Animated.View style={[styles.pulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
        <Animated.View style={[styles.orbit, { transform: [{ rotate: rotation }] }]}>
          <View style={[styles.node, styles.nodeOne]} />
          <View style={[styles.node, styles.nodeTwo]} />
          <View style={[styles.node, styles.nodeThree]} />
        </Animated.View>
        <LinearGradient colors={[colors.lime, colors.mint]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.mark}>
          <View style={styles.markInset}><Ionicons color={colors.ink} name="people" size={44} /></View>
        </LinearGradient>
      </Animated.View>
      <View style={styles.copy}>
        <View style={styles.eyebrow}><View style={styles.liveDot} /><Text style={styles.eyebrowText}>COMMUNITY CONNECT</Text></View>
        <Text style={styles.title}>People. Moments.{"\n"}One community.</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.progressTrack}><Animated.View style={[styles.progressGlow, { transform: [{ translateX: progressX }] }]} /></View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: "center", flex: 1, justifyContent: "center", overflow: "hidden", paddingHorizontal: 30 },
  ambientTop: { backgroundColor: "rgba(20, 232, 111, 0.08)", borderRadius: 170, height: 340, position: "absolute", right: -185, top: -115, transform: [{ rotate: "18deg" }], width: 340 },
  ambientBottom: { backgroundColor: "rgba(122, 242, 170, 0.05)", borderRadius: 150, bottom: -160, height: 300, left: -125, position: "absolute", width: 300 },
  stage: { alignItems: "center", height: 220, justifyContent: "center", width: 220 },
  pulse: { backgroundColor: colors.lime, borderRadius: 76, height: 152, position: "absolute", width: 152 },
  orbit: { borderColor: "rgba(122, 242, 170, 0.3)", borderRadius: 98, borderStyle: "dashed", borderWidth: 1, height: 196, position: "absolute", width: 196 },
  node: { backgroundColor: colors.lime, borderColor: "#0a3525", borderRadius: 8, borderWidth: 4, height: 16, position: "absolute", width: 16 },
  nodeOne: { left: 19, top: 18 }, nodeTwo: { right: -8, top: 84 }, nodeThree: { bottom: 4, left: 45 },
  mark: { alignItems: "center", borderRadius: 49, elevation: 12, height: 98, justifyContent: "center", shadowColor: colors.lime, shadowOffset: { height: 12, width: 0 }, shadowOpacity: 0.32, shadowRadius: 26, width: 98 },
  markInset: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,0.3)", borderRadius: 40, borderWidth: 1, height: 80, justifyContent: "center", width: 80 },
  copy: { alignItems: "center", marginTop: 12 },
  eyebrow: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.08)", borderRadius: 20, borderWidth: 1, flexDirection: "row", paddingHorizontal: 12, paddingVertical: 7 },
  liveDot: { backgroundColor: colors.lime, borderRadius: 4, height: 7, marginRight: 8, width: 7 },
  eyebrowText: { color: colors.mint, fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  title: { color: colors.white, fontSize: 31, fontWeight: "800", letterSpacing: -1.3, lineHeight: 38, marginTop: 20, textAlign: "center" },
  message: { color: "rgba(224, 241, 232, 0.62)", fontSize: 12, fontWeight: "500", letterSpacing: 0.15, marginTop: 14, textAlign: "center" },
  progressTrack: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, bottom: 58, height: 4, overflow: "hidden", position: "absolute", width: 118 },
  progressGlow: { backgroundColor: colors.lime, borderRadius: 3, height: 4, shadowColor: colors.lime, shadowOpacity: 0.9, shadowRadius: 7, width: 54 },
});
