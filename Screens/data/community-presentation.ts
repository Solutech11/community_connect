export type CommunityGuideline = {
  title: string;
  description: string;
};

export const COMMUNITY_IMAGE_FALLBACKS = [
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=88',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=88',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=88',
  'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1200&q=88',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=88',
] as const;

export const DEFAULT_COMMUNITY_GUIDELINES: CommunityGuideline[] = [
  {
    title: 'Be Respectful',
    description: 'Treat every member with kindness. Harassment, hate speech, and discriminatory language are not tolerated.',
  },
  {
    title: 'Safety First',
    description: 'Follow organizer guidance, protect your personal information, and report unsafe activity promptly.',
  },
  {
    title: 'No Spam or Self-Promotion',
    description: 'Keep conversations relevant. Do not promote unrelated products, services, or events without permission.',
  },
  {
    title: 'Leave No Trace',
    description: 'Respect shared spaces, local communities, nature, and every venue used for a community activity.',
  },
];

export const DEFAULT_COMMUNITY_CONSEQUENCES = [
  'A formal warning from community administrators.',
  'Temporary suspension from community activities.',
  'Permanent removal from the community.',
] as const;

export function communityImage(imageUrl: string | undefined, seed = 0) {
  const value = imageUrl?.trim();
  return value || COMMUNITY_IMAGE_FALLBACKS[Math.abs(seed) % COMMUNITY_IMAGE_FALLBACKS.length];
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'CC';
}
