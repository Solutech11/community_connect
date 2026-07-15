export type ChatConversation = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  image: string;
  community?: string;
};

export type ChatMessage = {
  id: string;
  text: string;
  time: string;
  mine: boolean;
};

export const CHAT_CONVERSATIONS: ChatConversation[] = [
  {
    id: "alex",
    name: "Alex Rivera",
    preview: "The garden meetup was amazing! Are you joining Saturday?",
    time: "9:42 AM",
    unread: 2,
    online: true,
    community: "Urban Garden Club",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=85",
  },
  {
    id: "jordan",
    name: "Jordan Smith",
    preview: "I shared the route for tomorrow's community run.",
    time: "8:10 AM",
    unread: 0,
    online: true,
    community: "Morning Runners",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=220&q=85",
  },
  {
    id: "mia",
    name: "Mia Wong",
    preview: "Can you send me the ticket details?",
    time: "Yesterday",
    unread: 1,
    online: false,
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=220&q=85",
  },
  {
    id: "noah",
    name: "Noah Williams",
    preview: "Thanks for accepting my request!",
    time: "Mon",
    unread: 0,
    online: false,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=220&q=85",
  },
];

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  alex: [
    {
      id: "1",
      text: "Hey! Are you going to the Urban Garden workshop?",
      time: "9:30 AM",
      mine: false,
    },
    {
      id: "2",
      text: "Yes, I already saved my spot. It looks really useful.",
      time: "9:34 AM",
      mine: true,
    },
    {
      id: "3",
      text: "The garden meetup was amazing! Are you joining Saturday?",
      time: "9:42 AM",
      mine: false,
    },
  ],
  jordan: [
    {
      id: "1",
      text: "I shared the route for tomorrow's community run.",
      time: "8:10 AM",
      mine: false,
    },
  ],
  mia: [
    {
      id: "1",
      text: "Can you send me the ticket details?",
      time: "Yesterday",
      mine: false,
    },
  ],
  noah: [
    {
      id: "1",
      text: "Thanks for accepting my request!",
      time: "Monday",
      mine: false,
    },
  ],
};

const AI_RESPONSES = [
  {
    terms: ["event", "weekend", "near", "recommend"],
    response:
      "Based on your interests in community, wellness, and technology, I recommend Morning Yoga Park, Urban Garden Workshop, and the Code Mixer. I can help you compare them or plan your weekend.",
  },
  {
    terms: ["create", "host", "organize"],
    response:
      "I can help you create a stronger event. Start with a clear outcome, choose an accessible time and location, then offer one simple ticket tier. Tap Create Event and I will guide you through each step.",
  },
  {
    terms: ["ticket", "booking", "book"],
    response:
      "You can find your purchased tickets under Profile → My Tickets. For a new booking, open an event, choose a ticket tier, and complete checkout securely.",
  },
  {
    terms: ["wallet", "spending", "budget", "money"],
    response:
      "Your wallet can help you budget for events and community activities. I can explain recent spending, estimate an event budget, or guide you to transfer, withdraw, top up, and transaction history.",
  },
  {
    terms: ["withdraw", "bank"],
    response:
      "Open Profile → My Wallet → Withdraw. Enter an amount, choose your bank, and verify the account number. I will run a safety check before the withdrawal is submitted.",
  },
  {
    terms: ["transfer", "send money"],
    response:
      "Open Profile → My Wallet → Transfer. Choose a recent recipient or enter a CommunityConnect ID, set the amount, and review the AI safety result before confirming.",
  },
  {
    terms: ["dispute", "wrong charge", "report transaction"],
    response:
      "Open the transaction in Wallet or Transaction History and choose Report a problem. The AI dispute assistant can organize the payment details, draft your explanation, and attach evidence.",
  },
  {
    terms: ["community", "group", "join"],
    response:
      "I found communities that match your activity: Urban Garden Club, Lagos Tech Circle, and Morning Runners. Tell me which topic you prefer and I will narrow it down.",
  },
  {
    terms: ["friend", "people", "connect"],
    response:
      "Your strongest connection suggestions are people who share communities and recent events with you. Open Friends to review mutual interests and send a connection request.",
  },
];

export async function generateCommunityAiReply(prompt: string) {
  await new Promise((resolve) => setTimeout(resolve, 850));
  const normalized = prompt.toLowerCase();
  const match = AI_RESPONSES.find((item) =>
    item.terms.some((term) => normalized.includes(term)),
  );

  return (
    match?.response ??
    "I can help you discover events, find communities, plan an event, understand tickets, or connect with people nearby. What would you like to do?"
  );
}
