import axiosClient, { getApiMode } from './axiosClient';
import { toNumberId, unwrap } from './apiUtils';
import { MockDatabase } from './mockDb';

type PaymentResponse = {
  id: number;
  paymentCode: string;
  bookingId: number;
  status: string;
};

export const paymentApi = {
  pay: async (paymentData: { bookingId: string; paymentMethod: string; amount: number }) => {
    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Update booking status in simulation
      const updatedBooking = MockDatabase.updateBookingStatus(paymentData.bookingId, 'paid');
      if (updatedBooking) {
        return { 
          data: { 
            success: true, 
            message: 'Thanh toán thành công qua cổng EventPay!',
            transactionId: `txn-${Date.now()}`,
            booking: updatedBooking 
          } 
        };
      }
      throw new Error('Đơn đặt vé không hợp lệ hoặc đã thanh toán trước đó.');
    }

    const created = unwrap<PaymentResponse>(await axiosClient.post('/api/payments', {
      bookingId: toNumberId(paymentData.bookingId),
      method: 'MOCK'
    }));
    const paid = unwrap<PaymentResponse>(await axiosClient.patch(`/api/payments/${created.id}/mock-success`));
    return {
      data: {
        success: paid.status === 'SUCCESS',
        message: 'Thanh toán thành công qua EventHub.',
        transactionId: paid.paymentCode,
        booking: { id: String(paid.bookingId), status: 'paid' }
      }
    };
  }
};
