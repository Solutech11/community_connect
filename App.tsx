import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import AppLoadingScreen from './Screens/components/ui/app-loading-screen';
import { AppNotifierProvider, useNotifier } from './Screens/components/ui/app-notifier';
import { AuthProvider, useAuth } from './Screens/hooks/use-auth';
import { navigateFromNotification, navigationRef } from './Screens/navigation/navigation-ref';
import RootStackNavigator from './Screens/navigation/root-stack';

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
            <AppNavigation />
          </AuthProvider>
        </AppNotifierProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigation() {
  const { isAuthenticated, isRestoring } = useAuth();
  const { notify } = useNotifier();

  React.useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      if (!isAuthenticated) return;
      const content = notification.request.content;
      notify({
        title: content.title ?? 'New community update',
        message: content.body ?? undefined,
        tone: 'info',
        onPress: () => navigateFromNotification(content.data),
      });
    });
    return () => subscription.remove();
  }, [isAuthenticated, notify]);

  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!isAuthenticated) return;
      navigateFromNotification(response.notification.request.content.data);
    });
    return () => subscription.remove();
  }, [isAuthenticated]);

  if (isRestoring) {
    return <AppLoadingScreen message="Restoring your secure session" />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="dark" backgroundColor="#f7fbf9" />
      <RootStackNavigator
        key={isAuthenticated ? 'authenticated' : 'guest'}
        authenticated={isAuthenticated}
      />
    </NavigationContainer>
  );
}
