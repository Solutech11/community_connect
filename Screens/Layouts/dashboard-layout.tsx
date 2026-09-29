import type { ComponentType, ReactNode } from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";

import { colors } from "../styles/theme";
import AiAssistantLauncher from "../components/ui/ai-assistant-launcher";

type DashboardLayoutProps = {
  children: ReactNode;
  showAiAssistant?: boolean;
};

const ANDROID_DESIGN_WIDTH = 420;
const MIN_ANDROID_SCALE = 0.84;
const MAX_ANDROID_SCALE = 0.92;

/**
 * Fits dashboard routes to narrower Android viewports without changing the
 * deliberately larger iOS, auth, onboarding, or account-setup layouts.
 */
export default function DashboardLayout({
  children,
  showAiAssistant = true,
}: DashboardLayoutProps) {
  const { height, width } = useWindowDimensions();

  if (Platform.OS !== "android") {
    return (
      <View style={styles.appFrame}>
        {children}
        {showAiAssistant ? <AiAssistantLauncher /> : null}
      </View>
    );
  }

  const scale = Math.max(
    MIN_ANDROID_SCALE,
    Math.min(MAX_ANDROID_SCALE, width / ANDROID_DESIGN_WIDTH),
  );

  return (
    <View style={styles.viewport}>
      <View
        style={[
          styles.canvas,
          {
            height: height / scale,
            transform: [{ scale }],
            width: width / scale,
          },
        ]}
      >
        {children}
        {showAiAssistant ? <AiAssistantLauncher /> : null}
      </View>
    </View>
  );
}

export function withDashboardLayout<Props extends object>(
  Screen: ComponentType<Props>,
  options: { showAiAssistant?: boolean } = {},
) {
  function DashboardScreen(props: Props) {
    return (
      <DashboardLayout showAiAssistant={options.showAiAssistant}>
        <Screen {...props} />
      </DashboardLayout>
    );
  }

  DashboardScreen.displayName = `withDashboardLayout(${Screen.displayName ?? Screen.name ?? "Screen"})`;
  return DashboardScreen;
}

const styles = StyleSheet.create({
  appFrame: { backgroundColor: colors.paper, flex: 1 },
  viewport: {
    backgroundColor: colors.paper,
    flex: 1,
    overflow: "hidden",
  },
  canvas: {
    backgroundColor: colors.paper,
    left: 0,
    position: "absolute",
    top: 0,
    transformOrigin: "top left",
  },
});
