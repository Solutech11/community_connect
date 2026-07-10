export type CommunityCategory = 'For You' | 'Hiking' | 'Tech' | 'Books' | 'Art';
export type CommunityAccessType = 'free' | 'paid' | 'access_key';

export type CommunityGuideline = {
  id: string;
  title: string;
  body: string;
  icon: 'shield-checkmark-outline' | 'leaf-outline' | 'megaphone-outline';
};

export type CommunityItem = {
  id: string;
  name: string;
  handle: string;
  description: string;
  membersLabel: string;
  eventsLabel: string;
  image: string;
  category: Exclude<CommunityCategory, 'For You'>;
  accessType: CommunityAccessType;
  accessFee?: string;
  accessFeeNote?: string;
  accessPrompt?: string;
  badgeLabel: string;
  guidelines: CommunityGuideline[];
};

export type JoinedCommunity = {
  id: string;
  name: string;
  image: string;
  membersLabel: string;
  online: boolean;
  adminsOnly: boolean;
};

export const communityCategories: CommunityCategory[] = ['For You', 'Hiking', 'Tech', 'Books', 'Art'];

export const myCommunities: JoinedCommunity[] = [
  {
    id: 'urban-hikers',
    name: 'Urban Hikers',
    image:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80',
    membersLabel: '142 Members',
    online: true,
    adminsOnly: false,
  },
  {
    id: 'sunday-readers',
    name: 'Book Lovers',
    image:
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=600&q=80',
    membersLabel: '86 Members',
    online: true,
    adminsOnly: true,
  },
  {
    id: 'dev-connect',
    name: 'Tech Talk',
    image:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
    membersLabel: '214 Members',
    online: false,
    adminsOnly: false,
  },
  {
    id: 'makers-gallery',
    name: 'Art Circle',
    image:
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80',
    membersLabel: '64 Members',
    online: true,
    adminsOnly: true,
  },
];

const defaultGuidelines: CommunityGuideline[] = [
  {
    id: 'respect',
    title: 'Respect Everyone',
    body: 'Kindness is mandatory. Personal attacks, harassment, hate speech, or discriminatory language will not be tolerated.',
    icon: 'megaphone-outline',
  },
  {
    id: 'safety',
    title: 'Safety First',
    body: 'Always stay with the group during hikes, bring adequate water, and communicate any physical limitations to guides.',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'care',
    title: 'Leave No Trace',
    body: 'Protect our urban nature spots. Pack out what you pack in, and stay on designated trails.',
    icon: 'leaf-outline',
  },
];

export const discoverCommunities: CommunityItem[] = [
  {
    id: 'urban-hikers',
    name: 'Urban Hikers',
    handle: '#HIKING',
    description: 'Escape the concrete jungle without leaving the city limits. We are a community of weekend warriors exploring hidden nature trails, urban parks, and local preserves. Join us for weekly group hikes, fitness challenges, and post-hike socials!',
    membersLabel: '2.4k',
    eventsLabel: '12',
    category: 'Hiking',
    accessType: 'free',
    badgeLabel: 'Outdoor & Fitness',
    image:
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1400&q=80',
    guidelines: defaultGuidelines,
  },
  {
    id: 'dev-connect',
    name: 'Dev Connect',
    handle: '#TECH',
    description: 'A community for developers to share knowledge, code, and collaborate on open ideas. Join weekly office hours, peer reviews, and founder sessions.',
    membersLabel: '1.8k',
    eventsLabel: '18',
    category: 'Tech',
    accessType: 'access_key',
    accessPrompt: "Don't have a code? Request Access",
    badgeLabel: 'Technology & Startups',
    image:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80',
    guidelines: [
      {
        id: 'respect',
        title: 'Build Respectfully',
        body: 'Debate ideas, not people. We keep feedback constructive and supportive across all skill levels.',
        icon: 'megaphone-outline',
      },
      {
        id: 'privacy',
        title: 'Protect Shared Work',
        body: 'Do not repost private demos, screenshots, or code samples outside the group without clear permission.',
        icon: 'shield-checkmark-outline',
      },
      {
        id: 'contribute',
        title: 'Support Learning',
        body: 'Ask thoughtful questions, share resources, and help others unblock when you can.',
        icon: 'leaf-outline',
      },
    ],
  },
  {
    id: 'sunday-readers',
    name: 'Sunday Readers',
    handle: '#BOOKS',
    description: 'Weekly book discussions and monthly meetups at local cafes. Current read: The Alchemist. Expect curated sessions, author chats, and member-only reading guides.',
    membersLabel: '850',
    eventsLabel: '9',
    category: 'Books',
    accessType: 'paid',
    accessFee: '$20.00',
    accessFeeNote: 'One-time lifetime access',
    badgeLabel: 'Books & Conversations',
    image:
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=80',
    guidelines: [
      {
        id: 'respect',
        title: 'Respect Every Opinion',
        body: 'Reading tastes differ. Discuss books and ideas generously, even when you strongly disagree.',
        icon: 'megaphone-outline',
      },
      {
        id: 'participate',
        title: 'Show Up Curious',
        body: 'Come prepared to listen, reflect, and contribute meaningfully to each session.',
        icon: 'shield-checkmark-outline',
      },
      {
        id: 'space',
        title: 'Protect the Space',
        body: 'Help keep our gatherings warm, inclusive, and distraction-free for every member.',
        icon: 'leaf-outline',
      },
    ],
  },
  {
    id: 'makers-gallery',
    name: 'Makers Gallery',
    handle: '#ART',
    description: 'Meet visual artists, makers, and curators for gallery walks, workshops, and critiques.',
    membersLabel: '1.1k',
    eventsLabel: '14',
    category: 'Art',
    accessType: 'free',
    badgeLabel: 'Art & Culture',
    image:
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1400&q=80',
    guidelines: defaultGuidelines,
  },
];

export function getCommunityById(id: string) {
  return discoverCommunities.find((item) => item.id === id);
}

export function getJoinedCommunityById(id: string) {
  return myCommunities.find((item) => item.id === id);
}