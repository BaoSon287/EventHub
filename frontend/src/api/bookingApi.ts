import axiosClient, { getApiMode } from './axiosClient';
import { toNumberId, unwrap } from './apiUtils';
import { MockDatabase, Booking } from './mockDb';

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
    const userStr = localStorage.getItem('eventhub_current_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || 'anonymous';
    const userEmail = user?.email || '';
    const userName = user?.name || '';

    // fetch event to calculate prices and get image/title
    const event = MockDatabase.getEventById(bookingData.eventId);
    if (!event) {
      throw new Error('Sự kiện đặt vé không tồn tại.');
    }

    const priceFactor = bookingData.ticketType === 'vip' ? 1.5 : 1.0;
    const unitPrice = Math.round(event.price * priceFactor);
    const totalPrice = unitPrice * bookingData.quantity;

    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const booking = MockDatabase.createBooking({
        eventId: bookingData.eventId,
        eventTitle: event.title,
        eventImage: event.image,
        eventDate: event.date,
        eventLocation: event.location,
        userId,
        userEmail,
        userName,
        quantity: bookingData.quantity,
        totalPrice,
        ticketType: bookingData.ticketType,
      });
      return { data: booking };
    }

    const response = await axiosClient.post('/api/bookings', {
      eventId: toNumberId(bookingData.eventId),
      quantity: bookingData.quantity
    });
    return { data: toUiBooking(unwrap<BackendBooking>(response)) };
  },

  getMyBookings: async () => {
    const userStr = localStorage.getItem('eventhub_current_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id || '';

    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const bookings = MockDatabase.getBookings().filter(b => b.userId === userId);
      return { data: bookings };
    }

    const response = await axiosClient.get('/api/bookings/me');
    return { data: unwrap<BookingPage>(response).content.map(toUiBooking) };
  },

  getById: async (id: string) => {
    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const booking = MockDatabase.getBookingById(id);
      if (booking) {
        return { data: booking };
      }
      throw new Error(`Không tìm thấy đơn hàng với ID ${id}`);
    }

    const response = await axiosClient.get(`/api/bookings/${toNumberId(id)}`);
    return { data: toUiBooking(unwrap<BackendBooking>(response)) };
  },

  cancel: async (id: string) => {
    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const booking = MockDatabase.updateBookingStatus(id, 'cancelled');
      return { data: booking };
    }

    const response = await axiosClient.patch(`/api/bookings/${toNumberId(id)}/cancel`);
    return { data: toUiBooking(unwrap<BackendBooking>(response)) };
  }
};
