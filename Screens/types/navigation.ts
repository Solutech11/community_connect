import type {
  NavigatorScreenParams,
  RouteProp,
} from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { EventSetting } from "./events";

export type CheckoutTicketSelection = {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
};

export type CreateEventTicket = {
  id: string;
  title: string;
  price: string;
  capacity: string;
};

export type CreateEventDraft = {
  title: string;
  coverImage: string;
  description: string;
  country: string;
  state: string;
  lga: string;
  venueName: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  capacity: string;
  activityType: string;
  audience: string;
  setting: EventSetting;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  tickets: CreateEventTicket[];
};
import type { RoommateCandidate } from "./roommates";
export type RootStackParamList = {
  RoommateIntro: undefined;
  RoommateSetup: undefined;
  RoommateDiscover: undefined;
  RoommateCandidate: { candidate: RoommateCandidate };
  RoommateConnections: undefined;
  RoommateConnection: { connectionId: string };
  RoommateBlocks: undefined;
  OnboardingWelcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string; purpose: "verify-email" | "reset-password" };
  PersonalizationTopics: undefined;
  InterestsSelection: undefined;
  PersonalizationForm: undefined;
  Preferences: undefined;
  Home: NavigatorScreenParams<MainTabParamList> | undefined;
  CommunityJoin: { communityId?: string };
  CommunityRoom: { communityId: string };
  CommunityCall: {
    communityId: string;
    callId: string;
    callType: "voice" | "video";
    communityName: string;
    participantToken: string;
    expiresAt: string;
    canEndCall: boolean;
  };
  CommunityProfile: { communityId: string };
  CommunityRules: { communityId: string };
  CommunityManagement: { communityId: string };
  EditCommunity: { communityId: string };
  CreateCommunity: undefined;
  MyEvents: undefined;
  MyCreatedEvents: { initialStatus?: "draft" } | undefined;
  ManageCreatedEvent: { eventId?: string } | undefined;
  EditTicketType: { eventId: string; ticketTypeId: string };
  CreateEventIntroduction: undefined;
  CreateEventDetails: { draft?: Partial<CreateEventDraft> } | undefined;
  CreateEventDateTime: { draft: CreateEventDraft };
  CreateEventTickets: { draft: CreateEventDraft };
  CreateEventReview: { draft: CreateEventDraft };
  TicketScanner: { eventId?: string } | undefined;
  Notifications: undefined;
  Friends: undefined;
  ChatThread: {
    conversationId: string;
    name: string;
    image: string;
    online: boolean;
  };
  AIChat: { sessionId?: string } | undefined;
  AISessions: undefined;
  UpdateProfile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  Wallet: undefined;
  Transactions: undefined;
  TransactionDetails: { transactionId: string };
  BankAccounts: undefined;
  WalletDispute: {
    transaction: {
      id?: string;
      title: string;
      date: string;
      amount: string;
    };
  };
  DisputeManagement: undefined;
  MyEventDetails: { orderNumber?: string; eventId: string };
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
export type MainTabParamList = {
  HomeTab: undefined;
  Community: undefined;
  Chat: undefined;
  Profile: undefined;
};
export type ProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Profile">,
  RootStackNavigationProp
>;
export type RootStackRouteProp<RouteName extends keyof RootStackParamList> =
  RouteProp<RootStackParamList, RouteName>;
