import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { withDashboardLayout } from "../Layouts/dashboard-layout";
import ForgotPasswordScreen from "../pages/auth/forgot-password-connected";
import LoginScreen from "../pages/auth/login-connected";
import RegistrationScreen from "../pages/auth/registration-connected";
import VerifyEmailScreen from "../pages/auth/verify-email-connected";
import CheckoutScreen from "../pages/dashboard/checkout-connected";
import EventDetailsScreen from "../pages/dashboard/event-details-connected";
import MyEventsScreen from "../pages/dashboard/my-events-connected";
import MyCreatedEventsScreen from "../pages/tabs/my-created-events";
import ManageCreatedEventScreen from "../pages/tabs/manage-created-event-connected";
import EditTicketTypeScreen from "../pages/tabs/edit-ticket-type";
import CreateEventIntroductionScreen from "../pages/tabs/create-event-introduction";
import CreateEventDetailsScreen from "../pages/tabs/create-event-details";
import CreateEventDateTimeScreen from "../pages/tabs/create-event-date-time";
import CreateEventTicketsScreen from "../pages/tabs/create-event-tickets";
import CreateEventReviewScreen from "../pages/tabs/create-event-review";
import TicketScannerScreen from "../pages/tabs/ticket-scanner";
import NotificationsScreen from "../pages/tabs/notifications-connected";
import FriendsScreen from "../pages/tabs/friends-connected";
import RoommateIntro from "../pages/roommates/intro";
import RoommateSetup from "../pages/roommates/setup";
import RoommateDiscover from "../pages/roommates/discover";
import RoommateCandidate from "../pages/roommates/candidate";
import RoommateConnections from "../pages/roommates/connections";
import RoommateConnection from "../pages/roommates/connection";
import RoommateBlocks from "../pages/roommates/blocks";
import ChatThreadScreen from "../pages/tabs/chat-thread-connected";
import AIChatScreen from "../pages/tabs/ai-chat-connected";
import AISessionsScreen from "../pages/tabs/ai-sessions";
import SettingsScreen from "../pages/tabs/settings";
import ChangePasswordScreen from "../pages/tabs/change-password";
import DeleteAccountScreen from "../pages/tabs/delete-account-connected";
import PrivacyPolicyScreen from "../pages/tabs/privacy-policy";
import TermsConditionsScreen from "../pages/tabs/terms-conditions";
import UpdateProfileScreen from "../pages/tabs/update-profile-connected";
import WalletScreen from "../pages/tabs/wallet-connected";
import TransactionsScreen from "../pages/tabs/transactions-connected";
import WalletDisputeScreen from "../pages/tabs/wallet-dispute-connected";
import BankAccountsScreen from "../pages/tabs/bank-accounts";
import TransactionDetailsScreen from "../pages/tabs/transaction-details";
import DisputeManagementScreen from "../pages/tabs/dispute-management";
import MyEventDetailsScreen from "../pages/dashboard/my-event-details-connected";
import PaymentSuccessScreen from "../pages/dashboard/payment-success-connected";
import TicketSelectionScreen from "../pages/dashboard/ticket-selection-connected";
import OnboardingWelcomeScreen from "../pages/onboarding/welcome";
import PersonalizationFormScreen from "../pages/personalization/form";
import InterestsSelectionScreen from "../pages/personalization/interests-selection";
import PreferencesScreen from "../pages/personalization/preferences";
import PersonalizationTopicsScreen from "../pages/personalization/topics";
import CommunityJoinScreen from "../pages/tabs/community-join-connected";
import CommunityProfileScreen from "../pages/tabs/community-profile-connected";
import CommunityRulesScreen from "../pages/tabs/community-rules";
import CommunityManagementScreen from "../pages/tabs/community-management";
import EditCommunityScreen from "../pages/tabs/edit-community";
import CommunityRoomScreen from "../pages/tabs/community-room-connected";
import CommunityCallScreen from "../pages/tabs/community-call";
import CreateCommunityScreen from "../pages/tabs/create-community-connected";
import type {
  AuthenticatedStartRoute,
  UnauthenticatedStartRoute,
} from "../hooks/use-auth";
import type { RootStackParamList } from "../types/navigation";
import MainTabs from "./main-tabs";

const Stack = createNativeStackNavigator<RootStackParamList>();

const DashboardCommunityJoin = withDashboardLayout(CommunityJoinScreen);
const DashboardCommunityProfile = withDashboardLayout(CommunityProfileScreen);
const DashboardCommunityRules = withDashboardLayout(CommunityRulesScreen);
const DashboardCommunityManagement = withDashboardLayout(
  CommunityManagementScreen,
);
const DashboardEditCommunity = withDashboardLayout(EditCommunityScreen);
const DashboardCreateCommunity = withDashboardLayout(CreateCommunityScreen);
const DashboardMyEvents = withDashboardLayout(MyEventsScreen);
const DashboardMyCreatedEvents = withDashboardLayout(MyCreatedEventsScreen);
const DashboardManageCreatedEvent = withDashboardLayout(
  ManageCreatedEventScreen,
);
const DashboardEditTicketType = withDashboardLayout(EditTicketTypeScreen);
const DashboardCreateEventIntroduction = withDashboardLayout(
  CreateEventIntroductionScreen,
);
const DashboardCreateEventDetails = withDashboardLayout(
  CreateEventDetailsScreen,
);
const DashboardCreateEventDateTime = withDashboardLayout(
  CreateEventDateTimeScreen,
);
const DashboardCreateEventTickets = withDashboardLayout(
  CreateEventTicketsScreen,
);
const DashboardCreateEventReview = withDashboardLayout(CreateEventReviewScreen);
const DashboardTicketScanner = withDashboardLayout(TicketScannerScreen);
const DashboardNotifications = withDashboardLayout(NotificationsScreen);
const DashboardFriends = withDashboardLayout(FriendsScreen);
const DashboardRoommateIntro = withDashboardLayout(RoommateIntro, { showAiAssistant: false });
const DashboardRoommateSetup = withDashboardLayout(RoommateSetup, { showAiAssistant: false });
const DashboardRoommateDiscover = withDashboardLayout(RoommateDiscover, { showAiAssistant: false });
const DashboardRoommateCandidate = withDashboardLayout(RoommateCandidate, { showAiAssistant: false });
const DashboardRoommateConnections = withDashboardLayout(RoommateConnections, { showAiAssistant: false });
const DashboardRoommateConnection = withDashboardLayout(RoommateConnection, { showAiAssistant: false });
const DashboardRoommateBlocks = withDashboardLayout(RoommateBlocks, { showAiAssistant: false });
const DashboardChatThread = withDashboardLayout(ChatThreadScreen, {
  showAiAssistant: false,
  scaleAndroid: false,
});
const DashboardAISessions = withDashboardLayout(AISessionsScreen);
const DashboardSettings = withDashboardLayout(SettingsScreen);
const DashboardChangePassword = withDashboardLayout(ChangePasswordScreen);
const DashboardDeleteAccount = withDashboardLayout(DeleteAccountScreen);
const DashboardPrivacyPolicy = withDashboardLayout(PrivacyPolicyScreen);
const DashboardTermsConditions = withDashboardLayout(TermsConditionsScreen);
const DashboardUpdateProfile = withDashboardLayout(UpdateProfileScreen);
const DashboardWallet = withDashboardLayout(WalletScreen);
const DashboardTransactions = withDashboardLayout(TransactionsScreen);
const DashboardWalletDispute = withDashboardLayout(WalletDisputeScreen);
const DashboardBankAccounts = withDashboardLayout(BankAccountsScreen);
const DashboardTransactionDetails = withDashboardLayout(
  TransactionDetailsScreen,
);
const DashboardDisputeManagement = withDashboardLayout(DisputeManagementScreen);
const DashboardEventDetails = withDashboardLayout(EventDetailsScreen);
const DashboardCheckout = withDashboardLayout(CheckoutScreen);
const DashboardPaymentSuccess = withDashboardLayout(PaymentSuccessScreen);

export default function RootStackNavigator({
  authenticated,
  authenticatedStartRoute,
  unauthenticatedStartRoute,
}: {
  authenticated: boolean;
  authenticatedStartRoute: AuthenticatedStartRoute;
  unauthenticatedStartRoute: UnauthenticatedStartRoute;
}) {
  return (
    <Stack.Navigator
      initialRouteName={
        authenticated ? authenticatedStartRoute : unauthenticatedStartRoute
      }
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#071f17" },
      }}
    >
      {!authenticated ? (
        <>
          <Stack.Screen
            name="OnboardingWelcome"
            component={OnboardingWelcomeScreen}
          />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="Register"
            component={RegistrationScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen
            name="VerifyEmail"
            component={VerifyEmailScreen}
            options={{ animation: "fade" }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="PersonalizationTopics"
            component={PersonalizationTopicsScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name="InterestsSelection"
            component={InterestsSelectionScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name="PersonalizationForm"
            component={PersonalizationFormScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name="Preferences"
            component={PreferencesScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen name="Home" component={MainTabs} />
          <Stack.Screen
            name="CommunityJoin"
            component={DashboardCommunityJoin}
            options={{ animation: "fade_from_bottom" }}
          />
          <Stack.Screen
            name="CommunityRoom"
            component={CommunityRoomScreen}
            options={{
              animation: "slide_from_right",
              contentStyle: { backgroundColor: "#f7fbf9" },
            }}
          />
          <Stack.Screen
            name="CommunityCall"
            component={CommunityCallScreen}
            options={{
              animation: "slide_from_bottom",
              contentStyle: { backgroundColor: "#06170f" },
            }}
          />
          <Stack.Screen
            name="CommunityProfile"
            component={DashboardCommunityProfile}
            options={{
              animation: "slide_from_right",
              contentStyle: { backgroundColor: "#f7fbf9" },
            }}
          />
          <Stack.Screen
            name="CommunityRules"
            component={DashboardCommunityRules}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="CommunityManagement"
            component={DashboardCommunityManagement}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="EditCommunity"
            component={DashboardEditCommunity}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="CreateCommunity"
            component={DashboardCreateCommunity}
            options={{ animation: "fade_from_bottom" }}
          />
          <Stack.Screen
            name="MyEvents"
            component={DashboardMyEvents}
            options={{ animation: "fade_from_bottom" }}
          />
          <Stack.Screen
            name="MyCreatedEvents"
            component={DashboardMyCreatedEvents}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="ManageCreatedEvent"
            component={DashboardManageCreatedEvent}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="CreateEventIntroduction"
            component={DashboardCreateEventIntroduction}
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="CreateEventDetails"
            component={DashboardCreateEventDetails}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="CreateEventDateTime"
            component={DashboardCreateEventDateTime}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="CreateEventTickets"
            component={DashboardCreateEventTickets}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="CreateEventReview"
            component={DashboardCreateEventReview}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="TicketScanner"
            component={DashboardTicketScanner}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Notifications"
            component={DashboardNotifications}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen name="RoommateIntro" component={DashboardRoommateIntro} />
          <Stack.Screen name="RoommateSetup" component={DashboardRoommateSetup} />
          <Stack.Screen name="RoommateDiscover" component={DashboardRoommateDiscover} />
          <Stack.Screen name="RoommateCandidate" component={DashboardRoommateCandidate} />
          <Stack.Screen name="RoommateConnections" component={DashboardRoommateConnections} />
          <Stack.Screen name="RoommateConnection" component={DashboardRoommateConnection} />
          <Stack.Screen name="RoommateBlocks" component={DashboardRoommateBlocks} />
          <Stack.Screen
            name="Friends"
            component={DashboardFriends}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="ChatThread"
            component={DashboardChatThread}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="AIChat"
            component={AIChatScreen}
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="UpdateProfile"
            component={DashboardUpdateProfile}
            options={{
              animation: "slide_from_right",
              contentStyle: { backgroundColor: "#f7fbf9" },
            }}
          />
          <Stack.Screen
            name="Settings"
            component={DashboardSettings}
            options={{
              animation: "slide_from_right",
              contentStyle: { backgroundColor: "#f7fbf9" },
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={DashboardChangePassword}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="DeleteAccount"
            component={DashboardDeleteAccount}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={DashboardPrivacyPolicy}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="TermsConditions"
            component={DashboardTermsConditions}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Wallet"
            component={DashboardWallet}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Transactions"
            component={DashboardTransactions}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="WalletDispute"
            component={DashboardWalletDispute}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="MyEventDetails"
            component={MyEventDetailsScreen}
            options={{
              animation: "slide_from_right",
              contentStyle: { backgroundColor: "#f7fbf9" },
            }}
          />
          <Stack.Screen
            name="EventDetails"
            component={DashboardEventDetails}
            options={{ animation: "fade_from_bottom" }}
          />
          <Stack.Screen
            name="TicketSelection"
            component={TicketSelectionScreen}
            options={{
              animation: "fade_from_bottom",
              presentation: "transparentModal",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen
            name="Checkout"
            component={DashboardCheckout}
            options={{
              animation: "slide_from_right",
              contentStyle: { backgroundColor: "#f7fbf9" },
            }}
          />
          <Stack.Screen
            name="PaymentSuccess"
            component={DashboardPaymentSuccess}
            options={{
              animation: "fade_from_bottom",
              contentStyle: { backgroundColor: "#f7fbf9" },
            }}
          />
          <Stack.Screen name="AISessions" component={DashboardAISessions} />
          <Stack.Screen name="BankAccounts" component={DashboardBankAccounts} />
          <Stack.Screen
            name="TransactionDetails"
            component={DashboardTransactionDetails}
          />
          <Stack.Screen
            name="EditTicketType"
            component={DashboardEditTicketType}
          />
          <Stack.Screen
            name="DisputeManagement"
            component={DashboardDisputeManagement}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
