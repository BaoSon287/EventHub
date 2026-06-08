import { Booking, Event, Notification, User } from '../api/mockDb';
import { DemoPayment } from '../data/demoAnalytics';

export interface DayMetric {
  date: string;
  bookings?: number;
  revenue?: number;
}

export interface StatusMetric {
  name: string;
  value: number;
}

const toDay = (value?: string) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
};

const normalizeStatus = (value?: string) => String(value || 'UNKNOWN').toUpperCase();

export const groupBookingsByDay = (bookings: Booking[]): Array<{ date: string; bookings: number }> => {
  const map = new Map<string, number>();
  bookings.forEach((booking) => {
    const date = toDay(booking.bookingDate);
    map.set(date, (map.get(date) || 0) + booking.quantity);
  });

  return Array.from(map.entries())
    .map(([date, bookings]) => ({ date, bookings }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const groupRevenueByDay = (items: Array<Booking | DemoPayment>): Array<{ date: string; revenue: number }> => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const isPayment = 'amount' in item;
    const status = normalizeStatus(isPayment ? item.status : item.status);
    const paid = status === 'PAID' || status === 'SUCCESS';
    if (!paid) return;

    const date = toDay(isPayment ? item.createdAt : item.bookingDate);
    const revenue = Number(isPayment ? item.amount : item.totalPrice) || 0;
    map.set(date, (map.get(date) || 0) + revenue);
  });

  return Array.from(map.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const countByStatus = <T extends Record<string, any>>(items: T[], fieldName: keyof T): StatusMetric[] => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const status = normalizeStatus(String(item[fieldName] ?? 'UNKNOWN'));
    map.set(status, (map.get(status) || 0) + 1);
  });

  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
};

export const calculateOrganizerStats = (events: Event[], bookings: Booking[], payments: DemoPayment[] = []) => {
  const paidBookings = bookings.filter((booking) => booking.status === 'paid');
  const paidPayments = payments.filter((payment) => payment.status === 'PAID');

  return {
    totalEvents: events.length,
    publishedEvents: events.filter((event) => event.status === 'upcoming' || event.status === 'ongoing').length,
    draftEvents: events.filter((event) => normalizeStatus(event.status) === 'DRAFT').length,
    cancelledEvents: events.filter((event) => event.status === 'cancelled').length,
    totalBookings: bookings.reduce((sum, booking) => sum + booking.quantity, 0),
    totalRevenue: bookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0),
    paidRevenue: paidPayments.length
      ? paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      : paidBookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0),
    availableTickets: events.reduce((sum, event) => sum + Math.max(0, event.capacity - event.booked), 0),
  };
};

export const calculateAdminStats = (
  users: User[],
  events: Event[],
  bookings: Booking[],
  payments: DemoPayment[],
  notifications: Notification[]
) => ({
  totalUsers: users.length,
  totalEvents: events.length,
  totalBookings: bookings.reduce((sum, booking) => sum + booking.quantity, 0),
  totalPayments: payments.length,
  totalRevenue: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  paidPayments: payments.filter((payment) => payment.status === 'PAID').length,
  failedPayments: payments.filter((payment) => payment.status === 'FAILED').length,
  totalNotifications: notifications.length,
});

export const buildTopEvents = (events: Event[]) => (
  [...events]
    .map((event) => {
      const ticketsSold = Number(event.booked || 0);
      return {
        id: event.id,
        title: event.title,
        city: event.location.split(',').pop()?.trim() || event.location,
        status: event.status,
        ticketsSold,
        revenue: ticketsSold * Number(event.price || 0),
        availableTickets: Math.max(0, event.capacity - ticketsSold),
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
);
