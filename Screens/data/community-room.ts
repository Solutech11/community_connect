export type CommunityRoomMessage = {
  id: string;
  sender: string;
  avatar: string;
  time: string;
  role?: 'admin';
  side: 'left' | 'right';
  type: 'text' | 'file';
  text?: string;
  fileName?: string;
  fileSize?: string;
  previewImage?: string;
};

export const communityRoomMessages: Record<string, CommunityRoomMessage[]> = {
  'urban-hikers': [
    {
      id: '1',
      sender: 'Sarah',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      time: '10:02 AM',
      side: 'left',
      type: 'text',
      text: 'Is everyone meeting at the trailhead by 10 AM?',
    },
    {
      id: '2',
      sender: 'Mike',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      time: '10:03 AM',
      role: 'admin',
      side: 'left',
      type: 'text',
      text: "Yes! The map link is pinned above. Don't forget your water bottles.",
    },
    {
      id: '3',
      sender: 'Mike',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      time: '10:03 AM',
      role: 'admin',
      side: 'left',
      type: 'file',
      fileName: 'Trail Map.pdf',
      fileSize: '2.4 MB',
      previewImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: '4',
      sender: 'You',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      time: '10:05 AM',
      side: 'right',
      type: 'text',
      text: "Perfect. I'm running about 5 minutes late but I'll be there!",
    },
  ],
  'sunday-readers': [
    {
      id: '1',
      sender: 'Amara',
      avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
      time: '08:24 PM',
      side: 'left',
      type: 'text',
      text: 'Tomorrow we are reading chapters 5 to 7 before the meetup.',
    },
    {
      id: '2',
      sender: 'Grace',
      avatar: 'https://randomuser.me/api/portraits/women/52.jpg',
      time: '08:31 PM',
      role: 'admin',
      side: 'left',
      type: 'text',
      text: 'Please drop your favorite quotes in the thread. Only admins can post in the main room tonight.',
    },
  ],
  'dev-connect': [
    {
      id: '1',
      sender: 'David',
      avatar: 'https://randomuser.me/api/portraits/men/41.jpg',
      time: '02:12 PM',
      side: 'left',
      type: 'text',
      text: 'Anyone going for the product demo tomorrow?',
    },
    {
      id: '2',
      sender: 'You',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      time: '02:15 PM',
      side: 'right',
      type: 'text',
      text: 'Yes, I already registered. I can share my notes after.',
    },
  ],
  'makers-gallery': [
    {
      id: '1',
      sender: 'Nina',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      time: '06:42 PM',
      side: 'left',
      type: 'text',
      text: 'The gallery walk starts exactly at 7. Please arrive 10 minutes early.',
    },
  ],
};