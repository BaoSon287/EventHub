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

export type TicketAssetStatus =
  | 'OWNED'
  | 'LISTED_FOR_SALE'
  | 'SOLD'
  | 'TRANSFERRED'
  | 'USED'
  | 'CANCELLED';

export interface TicketAsset {
  id: string;
  ticketId: string;
  eventId: string;
  eventName: string;
  eventImage: string;
  eventDate?: string;
  eventLocation?: string;
  ticketType: 'standard' | 'vip';
  status: TicketAssetStatus;
  qrCode?: string;
  purchasePrice: number;
  activeListingId?: string;
}

export interface ResaleTicket {
  listingId: string;
  eventName: string;
  eventDate?: string;
  location?: string;
  price: number;
  sellerName: string;
}

export interface ResaleTicketDetail extends ResaleTicket {
  eventId?: string;
  seat?: string;
  status?: string;
  eventImage?: string;
}

export interface TicketTransferHistory {
  id: string;
  ticketAssetId: string;
  fromUserId?: string;
  toUserId?: string;
  action: 'LISTED' | 'PURCHASED' | 'TRANSFERRED' | 'CANCELLED';
  createdAt?: string;
}
