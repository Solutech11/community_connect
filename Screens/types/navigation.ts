import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type CheckoutTicketSelection = {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
};

export type RootStackParamList = {
  OnboardingWelcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: undefined;
  PersonalizationTopics: undefined;
  InterestsSelection: undefined;
  PersonalizationForm: undefined;
  Preferences: undefined;
  Home: undefined;
  CommunityJoin: { communityId: string };
  CommunityRoom: { communityId: string };
  CommunityProfile: { communityId: string };
  CreateCommunity: undefined;
  MyEvents: undefined;
  MyCreatedEvents: undefined;
  ManageCreatedEvent: undefined;
  TicketScanner: undefined;
  UpdateProfile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  Wallet: undefined;
  Transactions: undefined;
  WalletTopUp: undefined;
  MyEventDetails: { eventId: string };
  EventDetails: { eventId: string };
  TicketSelection: { eventId: string };
  Checkout: {
    eventId: string;
    quantity: number;
    subtotal: number;
    serviceFee: number;
    total: number;
    tickets: CheckoutTicketSelection[];
  };
  PaymentSuccess: {
    eventId: string;
    quantity: number;
    total: number;
  };
};
export type RootStackNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;
export type RootStackRouteProp<RouteName extends keyof RootStackParamList> =
  RouteProp<RootStackParamList, RouteName>;
