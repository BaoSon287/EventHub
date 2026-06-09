import axiosClient from './axiosClient';
import { unwrap } from './apiUtils';

const emptyAnalytics = {
  stats: {},
  bookingsByDay: [],
  revenueByDay: [],
  eventsByStatus: [],
  paymentsByStatus: [],
  usersByRole: [],
};

const safeRequest = async <T>(request: () => Promise<T>, fallback: T) => {
  try {
    return await request();
  } catch {
    return fallback;
  }
};

export const analyticsApi = {
  getOrganizerEventAnalytics: async (organizerId: string) => (
    safeRequest(
      async () => unwrap(await axiosClient.get(`/api/events/analytics/organizer/${organizerId}`)),
      emptyAnalytics
    )
  ),

  getAdminEventAnalytics: async () => (
    safeRequest(
      async () => unwrap(await axiosClient.get('/api/events/analytics/admin')),
      emptyAnalytics
    )
  ),

  getOrganizerBookingAnalytics: async (organizerId: string) => (
    safeRequest(
      async () => unwrap(await axiosClient.get(`/api/bookings/analytics/organizer/${organizerId}`)),
      emptyAnalytics
    )
  ),

  getAdminBookingAnalytics: async () => (
    safeRequest(
      async () => unwrap(await axiosClient.get('/api/bookings/analytics/admin')),
      emptyAnalytics
    )
  ),

  getAdminPaymentAnalytics: async () => (
    safeRequest(
      async () => unwrap(await axiosClient.get('/api/payments/analytics/admin')),
      emptyAnalytics
    )
  ),

  getMyPaymentAnalytics: async () => (
    safeRequest(
      async () => unwrap(await axiosClient.get('/api/payments/analytics/me')),
      { totalPayments: 0, successPayments: 0, failedPayments: 0, pendingPayments: 0, totalPaid: 0 }
    )
  ),
};
