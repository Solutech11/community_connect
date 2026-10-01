import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, fonts } from "../../styles/theme";

type Props = {
  callType: "voice" | "video";
  communityName: string;
  joining: boolean;
  onJoin: () => void;
  onDismiss: () => void;
};

export default function CommunityIncomingCall({
  callType,
  communityName,
  joining,
  onJoin,
  onDismiss,
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.55],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0],
  });

  return (
    <Modal
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.callIconWrap}>
            <Animated.View
              pointerEvents="none"
              style={[styles.pulse, { opacity, transform: [{ scale }] }]}
            />
            <View style={styles.callIcon}>
              <Ionicons
                color={colors.white}
                name={callType === "video" ? "videocam" : "call"}
                size={30}
              />
            </View>
          </View>
          <Text style={styles.eyebrow}>INCOMING COMMUNITY CALL</Text>
          <Text numberOfLines={2} style={styles.communityName}>
            {communityName || "Community"}
          </Text>
          <Text style={styles.description}>
            {callType === "video" ? "Video call" : "Voice call"} is ringing
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Dismiss incoming call"
              accessibilityRole="button"
              disabled={joining}
              onPress={onDismiss}
              style={[
                styles.action,
                styles.dismiss,
                joining && styles.disabled,
              ]}
            >
              <Ionicons color={colors.ink} name="close" size={19} />
              <Text style={styles.dismissText}>Not now</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Join incoming community call"
              accessibilityRole="button"
              accessibilityState={{ busy: joining, disabled: joining }}
              disabled={joining}
              onPress={onJoin}
              style={[styles.action, styles.join, joining && styles.disabled]}
            >
              <Ionicons
                color={colors.white}
                name={callType === "video" ? "videocam" : "call"}
                size={18}
              />
              <Text style={styles.joinText}>
                {joining ? "Joining..." : "Join call"}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.privacyNote}>Call details stay private.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(5, 18, 11, 0.62)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: "#e1eee5",
    borderRadius: 30,
    borderWidth: 1,
    maxWidth: 390,
    paddingHorizontal: 25,
    paddingTop: 31,
    paddingBottom: 22,
    width: "100%",
  },
  callIconWrap: {
    alignItems: "center",
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  pulse: {
    backgroundColor: "#bde8c9",
    borderRadius: 42,
    height: 84,
    position: "absolute",
    width: 84,
  },
  callIcon: {
    alignItems: "center",
    backgroundColor: colors.forest,
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  eyebrow: {
    color: colors.moss,
    fontFamily: fonts.extraBold,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 19,
  },
  communityName: {
    color: colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 23,
    marginTop: 8,
    textAlign: "center",
  },
  description: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 7,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 29, width: "100%" },
  action: {
    alignItems: "center",
    borderRadius: 24,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 49,
    paddingHorizontal: 10,
  },
  dismiss: { backgroundColor: "#e9f0eb" },
  join: { backgroundColor: colors.forest },
  disabled: { opacity: 0.55 },
  dismissText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 12 },
  joinText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12 },
  privacyNote: {
    color: "#89978f",
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 18,
  },
});
