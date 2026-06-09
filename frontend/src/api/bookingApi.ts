import axiosClient from './axiosClient';
import { toNumberId, unwrap } from './apiUtils';
import { Booking } from '../types/domain';

type BackendBooking = {
  id: number;
  bookingCode: string;
  userId: number;
  eventId: number;
  eventTitle: string;
  quantity: number;
  totalPrice: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
};

type BookingPage = {
  content: BackendBooking[];
};

const toUiBooking = (booking: BackendBooking): Booking => ({
  id: String(booking.id),
  eventId: String(booking.eventId),
  eventTitle: booking.eventTitle,
  eventImage: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000',
  eventDate: booking.createdAt?.slice(0, 10) || '',
  eventLocation: '',
  userId: String(booking.userId),
  userEmail: '',
  userName: '',
  quantity: booking.quantity,
  totalPrice: Number(booking.totalPrice || 0),
  ticketType: 'standard',
  status: booking.status === 'CANCELLED'
    ? 'cancelled'
    : booking.paymentStatus === 'PAID'
      ? 'paid'
      : 'pending_payment',
  bookingDate: booking.createdAt || new Date().toISOString()
});

export const bookingApi = {
  create: async (bookingData: { eventId: string; quantity: number; ticketType: 'standard' | 'vip' }) => {
    if (bookingData.quantity <= 0) {
      throw new Error('Số lượng vé phải lớn hơn 0.');
    }

    const response = await axiosClient.post('/api/bookings', {
      eventId: toNumberId(bookingData.eventId),
      quantity: bookingData.quantity
    });
    return { data: toUiBooking(unwrap<BackendBooking>(response)) };
  },

  getMyBookings: async () => {
    const response = await axiosClient.get('/api/bookings/me');
    return { data: unwrap<BookingPage>(response).content.map(toUiBooking) };
  },

  getByEvent: async (eventId: string) => {
    const response = await axiosClient.get(`/api/bookings/event/${toNumberId(eventId)}`, {
      params: { size: 100 }
    });
    return { data: unwrap<BookingPage>(response).content.map(toUiBooking) };
  },

  getById: async (id: string) => {
    const response = await axiosClient.get(`/api/bookings/${toNumberId(id)}`);
    return { data: toUiBooking(unwrap<BackendBooking>(response)) };
  },

  cancel: async (id: string) => {
    const response = await axiosClient.patch(`/api/bookings/${toNumberId(id)}/cancel`);
    return { data: toUiBooking(unwrap<BackendBooking>(response)) };
  }
};
