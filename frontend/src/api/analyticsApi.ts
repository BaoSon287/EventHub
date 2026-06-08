import axiosClient from './axiosClient';
import { unwrap } from './apiUtils';
import { MockDatabase } from './mockDb';
import {
  buildDemoBookingsFromEvents,
  buildDemoPaymentsFromBookings,
  demoNotifications,
} from '../data/demoAnalytics';
import {
  calculateAdminStats,
  calculateOrganizerStats,
  countByStatus,
  groupBookingsByDay,
  groupRevenueByDay,
} from '../utils/analyticsUtils';

const safeRequest = async <T>(request: () => Promise<T>, fallback: T) => {
  try {
    return await request();
  } catch {
    return fallback;
  }
};

const getOrganizerFallback = (organizerId: string) => {
  const events = MockDatabase.getEvents().filter((event) => event.organizerId === organizerId);
  const bookings = MockDatabase.getBookings().filter((booking) => events.some((event) => event.id === booking.eventId));
  const analyticsBookings = bookings.length ? bookings : buildDemoBookingsFromEvents(events);
  const payments = buildDemoPaymentsFromBookings(analyticsBookings);

  return {
    stats: calculateOrganizerStats(events, analyticsBookings, payments),
    bookingsByDay: groupBookingsByDay(analyticsBookings),
    revenueByDay: groupRevenueByDay(payments),
    eventsByStatus: countByStatus(events, 'status'),
    paymentsByStatus: countByStatus(payments, 'status'),
    demo: bookings.length === 0,
  };
};

const getAdminFallback = () => {
  const users = MockDatabase.getUsers();
  const events = MockDatabase.getEvents();
  const bookings = MockDatabase.getBookings().length ? MockDatabase.getBookings() : buildDemoBookingsFromEvents(events);
  const payments = buildDemoPaymentsFromBookings(bookings);
  const notifications = MockDatabase.getNotifications().length ? MockDatabase.getNotifications() : demoNotifications;

  return {
    stats: calculateAdminStats(users, events, bookings, payments, notifications),
    bookingsByDay: groupBookingsByDay(bookings),
    revenueByDay: groupRevenueByDay(payments),
    eventsByStatus: countByStatus(events, 'status'),
    paymentsByStatus: countByStatus(payments, 'status'),
    usersByRole: countByStatus(users, 'role'),
    demo: true,
  };
};

export const analyticsApi = {
  getOrganizerEventAnalytics: async (organizerId: string) => (
    safeRequest(
      async () => unwrap(await axiosClient.get(`/api/events/analytics/organizer/${organizerId}`)),
      getOrganizerFallback(organizerId)
    )
  ),

  getAdminEventAnalytics: async () => (
    safeRequest(
      async () => unwrap(await axiosClient.get('/api/events/analytics/admin')),
      getAdminFallback()
    )
  ),

  getOrganizerBookingAnalytics: async (organizerId: string) => (
    safeRequest(
      async () => unwrap(await axiosClient.get(`/api/bookings/analytics/organizer/${organizerId}`)),
      getOrganizerFallback(organizerId)
    )
  ),

  getAdminBookingAnalytics: async () => (
    safeRequest(
      async () => unwrap(await axiosClient.get('/api/bookings/analytics/admin')),
      getAdminFallback()
    )
  ),

  getAdminPaymentAnalytics: async () => (
    safeRequest(
      async () => unwrap(await axiosClient.get('/api/payments/analytics/admin')),
      getAdminFallback()
    )
  ),

  getMyPaymentAnalytics: async () => (
    safeRequest(
      async () => unwrap(await axiosClient.get('/api/payments/analytics/me')),
      { totalPayments: 0, successPayments: 0, failedPayments: 0, pendingPayments: 0, totalPaid: 0 }
    )
  ),
};
