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
    const isSuccess = payment.status === 'SUCCESS';

    return {
      data: {
        success: isSuccess,
        message: isSuccess
          ? 'Demo payment completed. Demo accounts have unlimited balance.'
          : 'Payment transaction was created and is waiting for processing.',
        transactionId: payment.paymentCode,
        booking: { id: String(payment.bookingId), status: isSuccess ? 'paid' : 'pending_payment' }
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
