import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ForgotPasswordScreen from '../pages/auth/forgot-password';
import LoginScreen from '../pages/auth/login';
import RegistrationScreen from '../pages/auth/registration';
import VerifyEmailScreen from '../pages/auth/verify-email';
import OnboardingWelcomeScreen from '../pages/onboarding/welcome';
import PersonalizationFormScreen from '../pages/personalization/form';
import InterestsSelectionScreen from '../pages/personalization/interests-selection';
import PreferencesScreen from '../pages/personalization/preferences';
import PersonalizationTopicsScreen from '../pages/personalization/topics';
import type { RootStackParamList } from '../types/navigation';
import MainTabs from './main-tabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  return (
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
      <Stack.Screen name="Home" component={MainTabs} />
    </Stack.Navigator>
  );
}
