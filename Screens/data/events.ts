export type EventStatus = 'Upcoming' | 'Past';

export type EventItem = {
  id: string;
  title: string;
  dateMonth: string;
  dateDay: string;
  time: string;
  location: string;
  image: string;
  attendeeAvatars: string[];
  extraCount?: string;
  status: EventStatus;
  price?: string;
  about?: string;
  schedule?: string;
  startTime?: string;
  endTime?: string;
  venueTitle?: string;
  venueSubtitle?: string;
  activityType?: string;
  eventFor?: string;
  position?: string;
  maxPeople?: string;
  lga?: string;
  state?: string;
};

export const events: EventItem[] = [
  {
    id: 'sunset-yoga',
    title: 'Sunset Yoga',
    dateMonth: 'OCT',
    dateDay: '12',
    time: '05:30 PM - 07:00 PM',
    location: 'Central Park, New York',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80',
    attendeeAvatars: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    ],
    extraCount: '+12',
    status: 'Upcoming',
    price: '$15.00',
    about:
      "Join us for a rejuvenating evening session as the sun sets over the city. This all-level yoga class is designed to help you unwind, stretch, and find your inner peace amidst nature. Don't forget to bring your own mat and a water bottle!",
    schedule: 'Sat, Oct 12 - Sun, Oct 13',
    startTime: '05:30 PM',
    endTime: '07:00 PM',
    venueTitle: 'Central Park, North Lawn',
    venueSubtitle: 'New York, NY 10024, USA',
    activityType: 'Fitness',
    eventFor: 'All Ages',
    position: 'Outdoor',
    maxPeople: '50',
    lga: 'Manhattan',
    state: 'New York',
  },
  {
    id: 'creative-tech',
    title: 'Creative Tech Mixer',
    dateMonth: 'NOV',
    dateDay: '02',
    time: '7:00 PM - 10:00 PM',
    location: 'Skyline Lounge, Westside',
    image:
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=80',
    attendeeAvatars: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    ],
    extraCount: '+5',
    status: 'Upcoming',
    price: '$25.00',
    about:
      'An energetic evening for makers, founders, and creatives to connect, exchange ideas, and discover new collaborations in a laid-back social setting.',
    schedule: 'Sat, Nov 02',
    startTime: '07:00 PM',
    endTime: '10:00 PM',
    venueTitle: 'Skyline Lounge, Westside',
    venueSubtitle: 'New York, NY 10019, USA',
    activityType: 'Networking',
    eventFor: 'Adults',
    position: 'Indoor',
    maxPeople: '120',
    lga: 'Manhattan',
    state: 'New York',
  },
  {
    id: 'design-retreat',
    title: 'Design Systems Retreat',
    dateMonth: 'SEP',
    dateDay: '14',
    time: '9:00 AM - 1:00 PM',
    location: 'Studio Hall, Midtown',
    image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80',
    attendeeAvatars: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80',
    ],
    extraCount: '+7',
    status: 'Past',
  },
];

export function getEventById(eventId: string) {
  return events.find((event) => event.id === eventId);
}
