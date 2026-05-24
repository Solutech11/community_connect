import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

import ForgotPasswordScreen from './Screens/auth/forgot-password';
import LoginScreen from './Screens/auth/login';
import RegistrationScreen from './Screens/auth/registration';
import VerifyEmailScreen from './Screens/auth/verify-email';
import HomeScreen from './Screens/home';
import type { RootStackParamList } from './Screens/navigation';
import OnboardingWelcomeScreen from './Screens/onboarding/welcome';
import PersonalizationFormScreen from './Screens/personalization/form';
import InterestsSelectionScreen from './Screens/personalization/interests-selection';
import PreferencesScreen from './Screens/personalization/preferences';
import PersonalizationTopicsScreen from './Screens/personalization/topics';

const Stack = createNativeStackNavigator<RootStackParamList>();

enableScreens();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" backgroundColor="#f7fbf9" />
          <Stack.Navigator
            initialRouteName="OnboardingWelcome"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: '#071f17' },
            }}
          >
            <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegistrationScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ animation: 'fade' }} />
            <Stack.Screen
              name="PersonalizationTopics"
              component={PersonalizationTopicsScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="InterestsSelection"
              component={InterestsSelectionScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="PersonalizationForm"
              component={PersonalizationFormScreen}
              options={{ animation: 'fade' }}
            />
            <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
