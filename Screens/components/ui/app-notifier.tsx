import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts } from "../../styles/theme";

export type NotifierTone = "success" | "error" | "warning" | "info";
export type NotifierOptions = {
  title: string;
  message?: string;
  tone?: NotifierTone;
  duration?: number;
  onPress?: () => void;
};

type NotifierItem = NotifierOptions & { id: number };
type NotifierContextValue = {
  notify: (options: NotifierOptions) => void;
  dismissNotifier: () => void;
};

const NotifierContext = createContext<NotifierContextValue | null>(null);
const toneDesign: Record<NotifierTone, { icon: keyof typeof Ionicons.glyphMap; accent: string; glow: string }> = {
  success: { icon: "checkmark-circle", accent: colors.lime, glow: "#123f2d" },
  error: { icon: "alert-circle", accent: "#ff8585", glow: "#461f26" },
  warning: { icon: "warning", accent: "#ffd166", glow: "#4b3a17" },
  info: { icon: "notifications", accent: "#79c7ff", glow: "#17394b" },
};

export function AppNotifierProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<NotifierItem[]>([]);
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const closing = useRef(false);
  const nextId = useRef(1);
  const current = queue[0];

  const dismissNotifier = useCallback(() => {
    if (!current || closing.current) return;
    closing.current = true;
    progress.stopAnimation();
    Animated.parallel([
      Animated.timing(translateY, { duration: 220, easing: Easing.in(Easing.cubic), toValue: -150, useNativeDriver: true }),
      Animated.timing(opacity, { duration: 180, toValue: 0, useNativeDriver: true }),
    ]).start(() => {
      setQueue((items) => items.slice(1));
      closing.current = false;
    });
  }, [current, opacity, progress, translateY]);

  const notify = useCallback((options: NotifierOptions) => {
    const item: NotifierItem = {
      ...options,
      duration: Math.max(1800, options.duration ?? 4500),
      id: nextId.current++,
      tone: options.tone ?? "info",
    };
    setQueue((items) => [...items, item].slice(0, 4));
  }, []);

  useEffect(() => {
    if (!current) return;
    closing.current = false;
    translateY.setValue(-150);
    opacity.setValue(0);
    progress.setValue(1);
    Animated.parallel([
      Animated.spring(translateY, { damping: 17, mass: 0.8, stiffness: 180, toValue: 0, useNativeDriver: true }),
      Animated.timing(opacity, { duration: 220, toValue: 1, useNativeDriver: true }),
    ]).start();

    const progressAnimation = Animated.timing(progress, {
      duration: current.duration,
      easing: Easing.linear,
      toValue: 0,
      useNativeDriver: true,
    });
    progressAnimation.start(({ finished }) => { if (finished) dismissNotifier(); });
    return () => progressAnimation.stop();
  }, [current, dismissNotifier, opacity, progress, translateY]);

  const value = useMemo(() => ({ dismissNotifier, notify }), [dismissNotifier, notify]);

  return (
    <NotifierContext.Provider value={value}>
      {children}
      <NotifierCard item={current} onDismiss={dismissNotifier} opacity={opacity} progress={progress} translateY={translateY} />
    </NotifierContext.Provider>
  );
}

export function useNotifier() {
  const value = useContext(NotifierContext);
  if (!value) throw new Error("useNotifier must be used inside AppNotifierProvider");
  return value;
}

function NotifierCard({
  item,
  onDismiss,
  opacity,
  progress,
  translateY,
}: {
  item?: NotifierItem;
  onDismiss: () => void;
  opacity: Animated.Value;
  progress: Animated.Value;
  translateY: Animated.Value;
}) {
  const insets = useSafeAreaInsets();
  if (!item) return null;
  const design = toneDesign[item.tone ?? "info"];
  const open = () => { item.onPress?.(); onDismiss(); };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.host, { opacity, paddingTop: Math.max(insets.top, 12), transform: [{ translateY }] }]}>
        <Pressable accessibilityRole="alert" onPress={open} style={styles.card}>
          <LinearGradient colors={["#0a281d", design.glow]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.gradient}>
            <View style={[styles.icon, { backgroundColor: design.accent + "22" }]}>
              <Ionicons color={design.accent} name={design.icon} size={22} />
            </View>
            <View style={styles.copy}>
              <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
              {item.message ? <Text numberOfLines={2} style={styles.message}>{item.message}</Text> : null}
            </View>
            <Pressable accessibilityLabel="Dismiss notification" hitSlop={10} onPress={onDismiss} style={styles.close}>
              <Ionicons color="rgba(255,255,255,0.62)" name="close" size={18} />
            </Pressable>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progress, { backgroundColor: design.accent, transform: [{ scaleX: progress }] }]} />
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { left: 14, position: "absolute", right: 14, top: 0, zIndex: 9999 },
  card: { borderRadius: 23, elevation: 14, overflow: "hidden", shadowColor: "#00150c", shadowOffset: { height: 10, width: 0 }, shadowOpacity: 0.32, shadowRadius: 22 },
  gradient: { alignItems: "center", borderColor: "rgba(255,255,255,0.09)", borderRadius: 23, borderWidth: 1, flexDirection: "row", minHeight: 78, overflow: "hidden", paddingBottom: 12, paddingHorizontal: 14, paddingTop: 12 },
  icon: { alignItems: "center", borderRadius: 19, height: 42, justifyContent: "center", width: 42 },
  copy: { flex: 1, marginLeft: 11, marginRight: 8 },
  title: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
  message: { color: "rgba(231,244,237,0.68)", fontFamily: fonts.medium, fontSize: 10, lineHeight: 15, marginTop: 3 },
  close: { alignItems: "center", height: 30, justifyContent: "center", width: 30 },
  progressTrack: { backgroundColor: "rgba(255,255,255,0.06)", bottom: 0, height: 3, left: 0, position: "absolute", right: 0 },
  progress: { height: 3, width: "100%" },
});
