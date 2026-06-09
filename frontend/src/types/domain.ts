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

export interface Event {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'music' | 'tech' | 'art' | 'food' | 'sport';
  image: string;
  date: string;
  time: string;
  location: string;
  price: number;
  capacity: number;
  booked: number;
  organizerId: string;
  organizerName: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured?: boolean;
}

export interface Booking {
  id: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  eventLocation: string;
  userId: string;
  userEmail: string;
  userName: string;
  quantity: number;
  totalPrice: number;
  ticketType: 'standard' | 'vip';
  status: 'pending_payment' | 'paid' | 'cancelled';
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
