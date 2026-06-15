export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'organizer' | 'attendee';
  name: string;
  avatar: string;
  phone?: string;
  organization?: string;
}

export type EventStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface Event {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'music' | 'tech' | 'art' | 'food' | 'sport';
  image: string;
  date: string;
  time: string;
  startTime?: string;
  endTime?: string;
  location: string;
  address?: string;
  city?: string;
  price: number;
  capacity: number;
  booked: number;
  organizerId: string;
  organizerName: string;
  status: EventStatus;
  featured?: boolean;
}

export interface Booking {
  id: string;
  bookingCode: string;
  ticketCode: string;
  qrCodeContent: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventLocation: string;
  eventAddress?: string;
  eventCity?: string;
  userId: string;
  userEmail: string;
  userName: string;
  quantity: number;
  totalPrice: number;
  ticketType: 'standard' | 'vip';
  status: 'pending_payment' | 'paid' | 'cancelled';
  bookingStatus: string;
  paymentStatus: string;
  bookingDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  createdAt: string;
}
