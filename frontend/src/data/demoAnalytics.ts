import { Booking, Event, Notification, User } from '../api/mockDb';

export interface DemoPayment {
  id: string;
  bookingId: string;
  eventTitle: string;
  amount: number;
  status: 'PAID' | 'UNPAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const demoRecentBookings: Booking[] = [
  {
    id: 'demo-book-1',
    eventId: 'event-1',
    eventTitle: 'Ravolution Music Festival 2026',
    eventImage: '',
    eventDate: '2026-07-25',
    eventLocation: 'TP. Ho Chi Minh',
    userId: 'user-1',
    userEmail: 'user@eventhub.vn',
    userName: 'Nguyen Van A',
    quantity: 3,
    totalPrice: 1350000,
    ticketType: 'standard',
    status: 'paid',
    bookingDate: daysAgo(1),
  },
  {
    id: 'demo-book-2',
    eventId: 'event-2',
    eventTitle: 'Vietnam Tech Summit 2026',
    eventImage: '',
    eventDate: '2026-06-30',
    eventLocation: 'Ha Noi',
    userId: 'user-4',
    userEmail: 'guest@eventhub.vn',
    userName: 'Demo Guest',
    quantity: 2,
    totalPrice: 600000,
    ticketType: 'vip',
    status: 'pending_payment',
    bookingDate: daysAgo(2),
  },
  {
    id: 'demo-book-3',
    eventId: 'event-4',
    eventTitle: 'Saigon Street Food 2026',
    eventImage: '',
    eventDate: '2026-06-20',
    eventLocation: 'TP. Ho Chi Minh',
    userId: 'user-5',
    userEmail: 'foodie@eventhub.vn',
    userName: 'Foodie Demo',
    quantity: 5,
    totalPrice: 250000,
    ticketType: 'standard',
    status: 'paid',
    bookingDate: daysAgo(4),
  },
  {
    id: 'demo-book-4',
    eventId: 'event-3',
    eventTitle: 'Contemporary Art Exhibition',
    eventImage: '',
    eventDate: '2026-08-10',
    eventLocation: 'TP. Ho Chi Minh',
    userId: 'user-6',
    userEmail: 'art@eventhub.vn',
    userName: 'Art Demo',
    quantity: 1,
    totalPrice: 120000,
    ticketType: 'standard',
    status: 'cancelled',
    bookingDate: daysAgo(6),
  },
];

export const demoRecentPayments: DemoPayment[] = [
  { id: 'pay-demo-1', bookingId: 'demo-book-1', eventTitle: 'Ravolution Music Festival 2026', amount: 1350000, status: 'PAID', createdAt: daysAgo(1) },
  { id: 'pay-demo-2', bookingId: 'demo-book-2', eventTitle: 'Vietnam Tech Summit 2026', amount: 600000, status: 'UNPAID', createdAt: daysAgo(2) },
  { id: 'pay-demo-3', bookingId: 'demo-book-3', eventTitle: 'Saigon Street Food 2026', amount: 250000, status: 'PAID', createdAt: daysAgo(4) },
  { id: 'pay-demo-4', bookingId: 'demo-book-4', eventTitle: 'Contemporary Art Exhibition', amount: 120000, status: 'FAILED', createdAt: daysAgo(6) },
];

export const demoNotifications: Notification[] = [
  { id: 'notif-demo-1', userId: 'user-1', title: 'Payment success', message: 'Demo notification', type: 'success', read: true, createdAt: daysAgo(1) },
  { id: 'notif-demo-2', userId: 'user-2', title: 'Booking created', message: 'Demo notification', type: 'info', read: false, createdAt: daysAgo(2) },
  { id: 'notif-demo-3', userId: 'user-3', title: 'Payment failed', message: 'Demo notification', type: 'alert', read: false, createdAt: daysAgo(3) },
];

export const buildDemoBookingsFromEvents = (events: Event[]) => {
  const generated = events.slice(0, 8).map((event, index): Booking => {
    const quantity = Math.max(1, Math.min(6, Math.round(event.booked / Math.max(1, events.length * 600))));
    return {
      id: `generated-book-${event.id}`,
      eventId: event.id,
      eventTitle: event.title,
      eventImage: event.image,
      eventDate: event.date,
      eventLocation: event.location,
      userId: `demo-user-${index + 1}`,
      userEmail: `demo${index + 1}@eventhub.vn`,
      userName: `Demo Buyer ${index + 1}`,
      quantity,
      totalPrice: quantity * event.price,
      ticketType: index % 3 === 0 ? 'vip' : 'standard',
      status: index % 5 === 0 ? 'pending_payment' : 'paid',
      bookingDate: daysAgo(index + 1),
    };
  });

  return generated.length ? generated : demoRecentBookings;
};

export const buildDemoPaymentsFromBookings = (bookings: Booking[]): DemoPayment[] => (
  bookings.map((booking, index) => ({
    id: `generated-pay-${booking.id}`,
    bookingId: booking.id,
    eventTitle: booking.eventTitle,
    amount: booking.totalPrice,
    status: booking.status === 'paid' ? 'PAID' : booking.status === 'cancelled' ? 'REFUNDED' : index % 4 === 0 ? 'FAILED' : 'UNPAID',
    createdAt: booking.bookingDate,
  }))
);

export const fallbackUsers: User[] = [
  { id: 'user-1', username: 'user', email: 'user@eventhub.vn', role: 'attendee', name: 'Demo User', avatar: '' },
  { id: 'user-2', username: 'organizer', email: 'organizer@eventhub.vn', role: 'organizer', name: 'Demo Organizer', avatar: '' },
  { id: 'user-3', username: 'admin', email: 'admin@eventhub.vn', role: 'admin', name: 'Demo Admin', avatar: '' },
];
