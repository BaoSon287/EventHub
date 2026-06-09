import axiosClient from './axiosClient';
import { toNumberId, unwrap } from './apiUtils';

type BackendPayment = {
  id: number;
  paymentCode: string;
  bookingId: number;
  bookingCode?: string;
  amount: number;
  status: string;
  createdAt: string;
};

type PaymentPage = {
  content: BackendPayment[];
};

export type PaymentRecord = {
  id: string;
  bookingId: string;
  eventTitle: string;
  amount: number;
  status: string;
  createdAt: string;
};

const toPaymentRecord = (payment: BackendPayment): PaymentRecord => ({
  id: String(payment.id),
  bookingId: String(payment.bookingId),
  eventTitle: payment.bookingCode || `Booking #${payment.bookingId}`,
  amount: Number(payment.amount || 0),
  status: payment.status,
  createdAt: payment.createdAt
});

const toBackendMethod = (method: string) => {
  if (method === 'card') return 'STRIPE';
  if (method === 'banking' || method === 'momo') return 'VNPAY';
  return 'CASH';
};

export const paymentApi = {
  pay: async (paymentData: { bookingId: string; paymentMethod: string; amount: number }) => {
    const payment = unwrap<BackendPayment>(await axiosClient.post('/api/payments', {
      bookingId: toNumberId(paymentData.bookingId),
      method: toBackendMethod(paymentData.paymentMethod)
    }));
    return {
      data: {
        success: payment.status === 'SUCCESS',
        message: 'Giao dịch thanh toán đã được tạo và đang chờ xử lý.',
        transactionId: payment.paymentCode,
        booking: { id: String(payment.bookingId), status: payment.status === 'SUCCESS' ? 'paid' : 'pending_payment' }
      }
    };
  },

  getMyPayments: async () => {
    const response = await axiosClient.get('/api/payments/me', { params: { size: 100 } });
    return { data: unwrap<PaymentPage>(response).content.map(toPaymentRecord) };
  },

  getByBooking: async (bookingId: string) => {
    const response = await axiosClient.get(`/api/payments/booking/${toNumberId(bookingId)}`, {
      params: { size: 100 }
    });
    return { data: unwrap<PaymentPage>(response).content.map(toPaymentRecord) };
  }
};
