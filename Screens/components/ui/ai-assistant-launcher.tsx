import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "../../styles/theme";
import type { RootStackParamList } from "../../types/navigation";

const HIDDEN_ROUTES = new Set([
  "AIChat",
  "Chat",
  "ChatThread",
  "CreateEventReview",
  "TicketScanner",
]);

export default function AiAssistantLauncher() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 1500,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 1500,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  if (HIDDEN_ROUTES.has(route.name)) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulse,
          {
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.24, 0],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.35],
                }),
              },
            ],
          },
        ]}
      />
      <Pressable
        accessibilityLabel="Ask Community AI"
        onPress={() => navigation.navigate("AIChat")}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <View style={styles.icon}>
          <Ionicons color={colors.ink} name="sparkles" size={19} />
        </View>
        <Text style={styles.label}>Ask AI</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    alignItems: "flex-end",
    bottom: 94,
    position: "absolute",
    right: 18,
    zIndex: 100,
  },
  pulse: {
    backgroundColor: colors.lime,
    borderRadius: 28,
    height: 54,
    position: "absolute",
    right: 0,
    width: 100,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0b3527",
    borderColor: "rgba(255,255,255,.7)",
    borderRadius: 27,
    borderWidth: 1,
    elevation: 8,
    flexDirection: "row",
    gap: 7,
    height: 54,
    paddingHorizontal: 10,
    paddingRight: 15,
    shadowColor: "#071f17",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
  },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  icon: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  label: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 12,
  },
});
