import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { NavigationContainer } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";

import AppLoadingScreen from "./Screens/components/ui/app-loading-screen";
import {
  AppNotifierProvider,
  useNotifier,
} from "./Screens/components/ui/app-notifier";
import { AuthProvider, useAuth } from "./Screens/hooks/use-auth";
import { PersonalizationProvider } from "./Screens/hooks/use-personalization";
import {
  navigateFromNotification,
  navigationRef,
} from "./Screens/navigation/navigation-ref";
import RootStackNavigator from "./Screens/navigation/root-stack";

enableScreens();

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <AppLoadingScreen message="Loading fonts and finishing touches" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNotifierProvider>
          <AuthProvider>
            <PersonalizationProvider>
              <AppNavigation />
            </PersonalizationProvider>
          </AuthProvider>
        </AppNotifierProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigation() {
  const {
    authenticatedStartRoute,
    isAuthenticated,
    isRestoring,
    unauthenticatedStartRoute,
  } = useAuth();
  const { notify } = useNotifier();
  const [navigationReady, setNavigationReady] = React.useState(false);
  const lastNavigationTarget = React.useRef<string | null>(null);
  const [pendingNotificationResponse, setPendingNotificationResponse] =
    React.useState<Notifications.NotificationResponse | null>(null);
  const lastHandledNotificationId = React.useRef<string | null>(null);

  React.useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (!isAuthenticated) return;
        const content = notification.request.content;
        notify({
          title: content.title ?? "New community update",
          message: content.body ?? undefined,
          tone: "info",
          onPress: () => navigateFromNotification(content.data),
        });
      },
    );
    return () => subscription.remove();
  }, [isAuthenticated, notify]);

  React.useEffect(() => {
    let active = true;
    const subscription = Notifications.addNotificationResponseReceivedListener(
      setPendingNotificationResponse,
    );
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (active && response) setPendingNotificationResponse(response);
      })
      .catch(() => {
        // The live response listener remains available if cold-start lookup fails.
      });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  React.useEffect(() => {
    if (isRestoring || !navigationReady || !navigationRef.isReady()) {
      return;
    }

    const targetRoute = isAuthenticated
      ? authenticatedStartRoute
      : unauthenticatedStartRoute;
    const targetKey =
      (isAuthenticated ? "authenticated:" : "guest:") + targetRoute;
    if (lastNavigationTarget.current === targetKey) {
      return;
    }

    lastNavigationTarget.current = targetKey;
    navigationRef.resetRoot({
      index: 0,
      routes: [{ name: targetRoute }],
    });
  }, [
    authenticatedStartRoute,
    isAuthenticated,
    isRestoring,
    navigationReady,
    unauthenticatedStartRoute,
  ]);

  React.useEffect(() => {
    if (
      !pendingNotificationResponse ||
      !isAuthenticated ||
      !navigationReady ||
      !navigationRef.isReady()
    ) {
      return;
    }

    const notificationId =
      pendingNotificationResponse.notification.request.identifier;
    if (lastHandledNotificationId.current !== notificationId) {
      lastHandledNotificationId.current = notificationId;
      navigateFromNotification(
        pendingNotificationResponse.notification.request.content.data,
      );
    }
    setPendingNotificationResponse(null);
    void Notifications.clearLastNotificationResponseAsync().catch(() => {
      // Clearing the OS response is best-effort after routing has completed.
    });
  }, [isAuthenticated, navigationReady, pendingNotificationResponse]);
  if (isRestoring) {
    return <AppLoadingScreen message="Restoring your secure session" />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setNavigationReady(true)}
    >
      <StatusBar style="dark" backgroundColor="#f7fbf9" />
      <RootStackNavigator
        authenticated={isAuthenticated}
        authenticatedStartRoute={authenticatedStartRoute}
        unauthenticatedStartRoute={unauthenticatedStartRoute}
      />
    </NavigationContainer>
  );
}
