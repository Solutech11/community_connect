import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

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
  phone: string;
  capacity: string;
  activityType: string;
  audience: string;
  setting: "Indoor" | "Outdoor";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  tickets: CreateEventTicket[];
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
  CreateEventIntroduction: undefined;
  CreateEventDetails: { draft?: Partial<CreateEventDraft> } | undefined;
  CreateEventDateTime: { draft: CreateEventDraft };
  CreateEventTickets: { draft: CreateEventDraft };
  CreateEventReview: { draft: CreateEventDraft };
  TicketScanner: undefined;
  Notifications: undefined;
  Friends: undefined;
  ChatThread: {
    conversationId: string;
    name: string;
    image: string;
    online: boolean;
  };
  AIChat: undefined;
  UpdateProfile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  Wallet: undefined;
  Transactions: undefined;
  WalletTopUp: undefined;
  WalletWithdraw: undefined;
  WalletTransfer: undefined;
  WalletDispute: {
    transaction: {
      title: string;
      date: string;
      amount: string;
    };
  };
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
