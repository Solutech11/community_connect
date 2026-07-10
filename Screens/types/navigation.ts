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