export type TicketOption = {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  note?: string;
  accent?: 'default' | 'featured';
  initialQuantity?: number;
  star?: boolean;
};

const defaultTickets: TicketOption[] = [
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Limited availability, entry only before 9 PM.',
    price: 10,
    originalPrice: 15,
    badge: 'BEST VALUE',
    note: 'Sold out soon',
    initialQuantity: 0,
  },
  {
    id: 'general',
    title: 'General Admission',
    description: 'Standard entry. Access to main hall and outdoor area.',
    price: 15,
    accent: 'featured',
    initialQuantity: 2,
  },
  {
    id: 'vip',
    title: 'VIP Pass',
    description: 'Skip the line entry + 1 free premium drink voucher.',
    price: 30,
    star: true,
    initialQuantity: 1,
  },
];

export function getTicketsForEventId(_eventId: string) {
  return defaultTickets;
}

