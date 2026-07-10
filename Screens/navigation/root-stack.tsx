import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { withDashboardLayout } from '../layouts/dashboard-layout';
import ForgotPasswordScreen from '../pages/auth/forgot-password';
import LoginScreen from '../pages/auth/login';
import RegistrationScreen from '../pages/auth/registration';
import VerifyEmailScreen from '../pages/auth/verify-email';
import CheckoutScreen from '../pages/dashboard/checkout';
import EventDetailsScreen from '../pages/dashboard/event-details';
import MyEventsScreen from '../pages/dashboard/my-events';
import MyEventDetailsScreen from '../pages/dashboard/my-event-details';
import PaymentSuccessScreen from '../pages/dashboard/payment-success';
import TicketSelectionScreen from '../pages/dashboard/ticket-selection';
import OnboardingWelcomeScreen from '../pages/onboarding/welcome';
import PersonalizationFormScreen from '../pages/personalization/form';
import InterestsSelectionScreen from '../pages/personalization/interests-selection';
import PreferencesScreen from '../pages/personalization/preferences';
import PersonalizationTopicsScreen from '../pages/personalization/topics';
import CommunityJoinScreen from '../pages/tabs/community-join';
import CommunityProfileScreen from '../pages/tabs/community-profile';
import CommunityRoomScreen from '../pages/tabs/community-room';
import CreateCommunityScreen from '../pages/tabs/create-community';
import type { RootStackParamList } from '../types/navigation';
import MainTabs from './main-tabs';

const Stack = createNativeStackNavigator<RootStackParamList>();

const DashboardCommunityJoin = withDashboardLayout(CommunityJoinScreen);
const DashboardCommunityRoom = withDashboardLayout(CommunityRoomScreen);
const DashboardCommunityProfile = withDashboardLayout(CommunityProfileScreen);
const DashboardCreateCommunity = withDashboardLayout(CreateCommunityScreen);
const DashboardMyEvents = withDashboardLayout(MyEventsScreen);
const DashboardMyEventDetails = withDashboardLayout(MyEventDetailsScreen);
const DashboardEventDetails = withDashboardLayout(EventDetailsScreen);
const DashboardTicketSelection = withDashboardLayout(TicketSelectionScreen);
const DashboardCheckout = withDashboardLayout(CheckoutScreen);
const DashboardPaymentSuccess = withDashboardLayout(PaymentSuccessScreen);

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
      <Stack.Screen name="PersonalizationTopics" component={PersonalizationTopicsScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="InterestsSelection" component={InterestsSelectionScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="PersonalizationForm" component={PersonalizationFormScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Home" component={MainTabs} />
      <Stack.Screen name="CommunityJoin" component={DashboardCommunityJoin} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen
        name="CommunityRoom"
        component={DashboardCommunityRoom}
        options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: '#f7fbf9' } }}
      />
      <Stack.Screen
        name="CommunityProfile"
        component={DashboardCommunityProfile}
        options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: '#f7fbf9' } }}
      />
      <Stack.Screen name="CreateCommunity" component={DashboardCreateCommunity} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="MyEvents" component={DashboardMyEvents} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="MyEventDetails" component={DashboardMyEventDetails} options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: '#f7fbf9' } }} />
      <Stack.Screen name="EventDetails" component={DashboardEventDetails} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen
        name="TicketSelection"
        component={DashboardTicketSelection}
        options={{ animation: 'fade_from_bottom', presentation: 'transparentModal', contentStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen name="Checkout" component={DashboardCheckout} options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: '#f7fbf9' } }} />
      <Stack.Screen name="PaymentSuccess" component={DashboardPaymentSuccess} options={{ animation: 'fade_from_bottom', contentStyle: { backgroundColor: '#f7fbf9' } }} />
    </Stack.Navigator>
  );
}