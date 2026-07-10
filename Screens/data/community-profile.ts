export type CommunityMember = {
  id: string;
  name: string;
  avatar: string;
  subtitle: string;
  isAdmin?: boolean;
};

export type CommunityProfileData = {
  id: string;
  coverImage: string;
  avatarImage: string;
  visibilityLabel: string;
  joinedLabel: string;
  about: string;
  aboutHighlights?: Array<{ icon: 'calendar-outline' | 'location-outline' | 'heart-outline'; title: string; body: string }>;
  rules?: Array<{ title: string; body: string }>;
  rulesIntroTitle: string;
  rulesIntroBody: string;
  consequences: string[];
  members: CommunityMember[];
};

export const communityProfiles: Record<string, CommunityProfileData> = {
  'urban-hikers': {
    id: 'urban-hikers',
    coverImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1400&q=80',
    avatarImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=700&q=80',
    visibilityLabel: 'Private Group',
    joinedLabel: 'Joined',
    about:
      "Welcome to Urban Hikers! We are a community of outdoor enthusiasts who love exploring the hidden trails and green spaces within our city. Whether you're a beginner or an experienced trekker, join us for weekly meetups, gear swaps, and good vibes. Let's touch grass together!",
    aboutHighlights: [
      { icon: 'calendar-outline', title: 'Weekly adventures', body: 'Saturday morning walks, monthly day hikes, and seasonal trail challenges.' },
      { icon: 'location-outline', title: 'Local and accessible', body: 'Routes rotate across city parks, riverside paths, and nearby nature reserves.' },
      { icon: 'heart-outline', title: 'Everyone is welcome', body: 'Beginner-friendly pacing, shared gear advice, and supportive hike leaders.' },
    ],
    rules: [
      { title: 'Respect every member', body: 'Be welcoming, avoid harassment, and respect personal boundaries on and off the trail.' },
      { title: 'Put safety first', body: 'Follow the hike leader, stay with the group, and share relevant health concerns privately before a hike.' },
      { title: 'Leave no trace', body: 'Carry out your waste, protect wildlife, and leave natural spaces better than you found them.' },
      { title: 'Keep plans reliable', body: 'RSVP honestly and cancel early when plans change so waitlisted members can attend.' },
      { title: 'Protect community privacy', body: 'Ask permission before posting member photos or sharing meeting details outside the group.' },
    ],
    rulesIntroTitle: 'Urban Hikers Guidelines',
    rulesIntroBody: 'To ensure everyone has a safe and enjoyable time, please adhere to these community rules.',
    consequences: [
      'A formal warning from group administrators.',
      'Temporary suspension from participating in events.',
      'Permanent ban from the Urban Hikers community.',
    ],
    members: [
      { id: 'mike', name: 'Mike', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', subtitle: 'Group Organizer', isAdmin: true },
      { id: 'sarah', name: 'Sarah', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', subtitle: 'Joined 2 days ago' },
      { id: 'david', name: 'David Chen', avatar: 'https://randomuser.me/api/portraits/men/41.jpg', subtitle: 'Joined 1 week ago' },
      { id: 'jenny', name: 'Jenny Lawrence', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', subtitle: 'Joined 2 weeks ago' },
      { id: 'daniel', name: 'Daniel Reed', avatar: 'https://randomuser.me/api/portraits/men/46.jpg', subtitle: 'Joined 1 month ago' },
      { id: 'amina', name: 'Amina Yusuf', avatar: 'https://randomuser.me/api/portraits/women/24.jpg', subtitle: 'Joined 3 days ago' },
      { id: 'isaac', name: 'Isaac Cole', avatar: 'https://randomuser.me/api/portraits/men/52.jpg', subtitle: 'Joined 5 days ago' },
      { id: 'zoe', name: 'Zoe Martinez', avatar: 'https://randomuser.me/api/portraits/women/29.jpg', subtitle: 'Joined 1 week ago' },
      { id: 'noah', name: 'Noah Brooks', avatar: 'https://randomuser.me/api/portraits/men/58.jpg', subtitle: 'Joined 2 weeks ago' },
      { id: 'lila', name: 'Lila Grant', avatar: 'https://randomuser.me/api/portraits/women/35.jpg', subtitle: 'Joined 2 weeks ago' },
      { id: 'ethan', name: 'Ethan Ross', avatar: 'https://randomuser.me/api/portraits/men/61.jpg', subtitle: 'Joined 3 weeks ago' },
      { id: 'maya', name: 'Maya Singh', avatar: 'https://randomuser.me/api/portraits/women/31.jpg', subtitle: 'Joined 1 month ago' },
      { id: 'caleb', name: 'Caleb Turner', avatar: 'https://randomuser.me/api/portraits/men/23.jpg', subtitle: 'Joined 1 month ago' },
      { id: 'nora', name: 'Nora Blake', avatar: 'https://randomuser.me/api/portraits/women/49.jpg', subtitle: 'Joined 6 weeks ago' },
      { id: 'leo', name: 'Leo Parker', avatar: 'https://randomuser.me/api/portraits/men/36.jpg', subtitle: 'Joined 2 months ago' },
    ],
  },
  'sunday-readers': {
    id: 'sunday-readers',
    coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=80',
    avatarImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=80',
    visibilityLabel: 'Private Group',
    joinedLabel: 'Joined',
    about: 'A cozy reading space for weekly discussions, thoughtful reflections, and offline cafe meetups.',
    rulesIntroTitle: 'Sunday Readers Guidelines',
    rulesIntroBody: 'Bring curiosity, kindness, and respect for every voice in the room.',
    consequences: ['Gentle warning from admins.', 'Temporary mute from the room.', 'Removal from the group for repeated violations.'],
    members: [
      { id: 'grace', name: 'Grace Obi', avatar: 'https://randomuser.me/api/portraits/women/52.jpg', subtitle: 'Book Club Host', isAdmin: true },
      { id: 'amara', name: 'Amara Cole', avatar: 'https://randomuser.me/api/portraits/women/28.jpg', subtitle: 'Joined 3 days ago' },
      { id: 'femi', name: 'Femi Adebayo', avatar: 'https://randomuser.me/api/portraits/men/55.jpg', subtitle: 'Joined 1 week ago' },
      { id: 'ruth', name: 'Ruth James', avatar: 'https://randomuser.me/api/portraits/women/47.jpg', subtitle: 'Joined 2 weeks ago' },
      { id: 'paul', name: 'Paul Mensah', avatar: 'https://randomuser.me/api/portraits/men/34.jpg', subtitle: 'Joined 1 month ago' },
      { id: 'ada', name: 'Ada Nwosu', avatar: 'https://randomuser.me/api/portraits/women/14.jpg', subtitle: 'Joined 6 weeks ago' },
    ],
  },
  'dev-connect': {
    id: 'dev-connect',
    coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80',
    avatarImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80',
    visibilityLabel: 'Private Group',
    joinedLabel: 'Joined',
    about: 'Developers sharing ideas, feedback, demos, and practical resources in one focused space.',
    rulesIntroTitle: 'Dev Connect Guidelines',
    rulesIntroBody: 'Keep feedback constructive and protect the privacy of shared work.',
    consequences: ['Admin warning.', 'Posting restrictions.', 'Removal for repeated abuse.'],
    members: [
      { id: 'tobi', name: 'Tobi Aluko', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', subtitle: 'Community Lead', isAdmin: true },
      { id: 'ella', name: 'Ella Wong', avatar: 'https://randomuser.me/api/portraits/women/22.jpg', subtitle: 'Joined 2 days ago' },
      { id: 'sam', name: 'Sam Rivera', avatar: 'https://randomuser.me/api/portraits/men/43.jpg', subtitle: 'Joined 5 days ago' },
      { id: 'nina', name: 'Nina Ford', avatar: 'https://randomuser.me/api/portraits/women/63.jpg', subtitle: 'Joined 2 weeks ago' },
      { id: 'josh', name: 'Josh Kim', avatar: 'https://randomuser.me/api/portraits/men/49.jpg', subtitle: 'Joined 1 month ago' },
      { id: 'ivy', name: 'Ivy Chen', avatar: 'https://randomuser.me/api/portraits/women/58.jpg', subtitle: 'Joined 2 months ago' },
    ],
  },
  'makers-gallery': {
    id: 'makers-gallery',
    coverImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1400&q=80',
    avatarImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80',
    visibilityLabel: 'Private Group',
    joinedLabel: 'Joined',
    about: 'A compact creative hub for artists, curators, workshops, and exhibition updates.',
    rulesIntroTitle: 'Makers Gallery Guidelines',
    rulesIntroBody: 'Respect the creative process and keep the space welcoming to all members.',
    consequences: ['Admin warning.', 'Temporary suspension.', 'Removal from community access.'],
    members: [
      { id: 'nina-art', name: 'Nina Hart', avatar: 'https://randomuser.me/api/portraits/women/65.jpg', subtitle: 'Curator', isAdmin: true },
      { id: 'omar', name: 'Omar Blake', avatar: 'https://randomuser.me/api/portraits/men/40.jpg', subtitle: 'Joined 4 days ago' },
      { id: 'chloe', name: 'Chloe Reed', avatar: 'https://randomuser.me/api/portraits/women/54.jpg', subtitle: 'Joined 1 week ago' },
      { id: 'marco', name: 'Marco Silva', avatar: 'https://randomuser.me/api/portraits/men/66.jpg', subtitle: 'Joined 3 weeks ago' },
      { id: 'kira', name: 'Kira Bell', avatar: 'https://randomuser.me/api/portraits/women/39.jpg', subtitle: 'Joined 1 month ago' },
      { id: 'jude', name: 'Jude Carter', avatar: 'https://randomuser.me/api/portraits/men/53.jpg', subtitle: 'Joined 2 months ago' },
    ],
  },
};

export function getCommunityProfileById(id: string) {
  return communityProfiles[id];
}