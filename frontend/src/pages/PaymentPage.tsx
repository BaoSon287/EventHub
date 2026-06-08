import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, Wallet, Banknote, ShieldAlert, CheckCircle, RefreshCw, Smartphone, QrCode, ClipboardList } from 'lucide-react';
import { bookingApi } from '../api/bookingApi';
import { paymentApi } from '../api/paymentApi';
import { authApi } from '../api/authApi';
import { Booking } from '../api/mockDb';
import { Loading } from '../components/Loading';
import { Button } from '../components/Button';
import { useToast } from '../components/ui/ToastProvider';
import { DetailSkeleton } from '../components/ui/Skeleton';
import { getErrorMessage } from '../utils/getErrorMessage';
import { formatCurrency } from '../utils/formatters';

export const PaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('momo');
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    bookingApi.getById(bookingId)
      .then((res) => {
        setBooking(res.data);
        if (res.data.status === 'paid') {
          setPaymentSuccess(true);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Phiếu đăng ký đặt vé không tồn tại hoặc đã bị hủy.');
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handlePayment = async () => {
    if (!bookingId || !booking) return;
    setPaymentLoading(true);
    try {
      await paymentApi.pay({
        bookingId,
        paymentMethod,
        amount: booking.totalPrice
      });
      setPaymentSuccess(true);
      toast.success('Thanh toán thành công', 'Vé của bạn đã sẵn sàng trong mục My Tickets.');
    } catch (err) {
      toast.error('Thanh toán thất bại', getErrorMessage(err));
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{error || 'Hóa đơn không hợp lệ'}</h2>
        <Link to="/my-bookings" className="inline-flex text-indigo-600 font-bold text-xs hover:underline">
          Trở lại danh sách vé của tôi
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Payment Main column */}
        <div className="lg:col-span-8 space-y-6">
          {paymentSuccess ? (
            /* Successful payment transition message */
            <div className="bg-white border border-slate-100 rounded-2xl shadow-lg p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Thanh toán Thành công!</h2>
                <p className="text-xs font-semibold text-slate-400 mt-1 leading-relaxed">
                  Cảm ơn bạn! Hóa đơn đặt vé đã được thanh toán thành công qua cổng thanh toán{' '}
                  <span className="text-slate-800 font-bold uppercase">{paymentMethod}</span>.
                </p>
              </div>

              {/* Digital voucher brief description */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left max-w-md mx-auto space-y-3 font-semibold text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sự kiện</span>
                  <span className="text-slate-800 font-bold max-w-[200px] truncate text-right">{booking.eventTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã đơn vé</span>
                  <span className="text-slate-800 uppercase font-black">#{booking.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hạng vé</span>
                  <span className="text-slate-800 uppercase">{booking.ticketType} x {booking.quantity}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Tổng thanh toán</span>
                  <span className="text-indigo-600 font-black text-sm">{formatCurrency(booking.totalPrice)}</span>
                </div>
              </div>

              <div className="flex gap-4 p-4 justify-center">
                <Link to="/my-bookings">
                  <Button variant="primary" className="font-bold cursor-pointer">
                    Xem vé QR Check-In
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="secondary" className="font-bold cursor-pointer">
                    Về Trang chủ
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Choose Payment Vendors cards */
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-800">Chọn phương thức thanh toán</h2>
                <p className="text-xs text-slate-400 font-semibold">Tự động xử lý bảo mật đa kênh</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`p-4 border rounded-xl flex sm:flex-col items-center gap-3 transition cursor-pointer select-none text-left sm:text-center ${
                    paymentMethod === 'momo'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 bg-rose-50 rounded-lg text-rose-600 font-black text-xs shrink-0">
                    MoMo
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800">Ví MoMo</span>
                    <span className="block text-[10px] text-slate-400 font-medium">Quét QR MoMo App</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('banking')}
                  className={`p-4 border rounded-xl flex sm:flex-col items-center gap-3 transition cursor-pointer select-none text-left sm:text-center ${
                    paymentMethod === 'banking'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800">VietQR Banking</span>
                    <span className="block text-[10px] text-slate-400 font-medium">Chuyển khoản liên ngân hàng</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border rounded-xl flex sm:flex-col items-center gap-3 transition cursor-pointer select-none text-left sm:text-center ${
                    paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-600 shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800">Thẻ Quốc Tế</span>
                    <span className="block text-[10px] text-slate-400 font-medium">Visa, Mastercard, JCB</span>
                  </div>
                </button>
              </div>

              {/* Method Dynamic Details rendering */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                {paymentMethod === 'momo' && (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="bg-white border rounded-xl p-3 shadow-xs">
                      <svg className="w-28 h-28 text-slate-850" viewBox="0 0 100 100" fill="currentColor">
                        <rect x="5" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                        <rect x="5" y="75" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                        <rect x="75" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />
                        <rect x="11" y="11" width="8" height="8" />
                        <rect x="11" y="81" width="8" height="8" />
                        <rect x="81" y="11" width="8" height="8" />
                        <rect x="35" y="15" width="10" height="15" />
                        <rect x="50" y="30" width="15" height="15" />
                        <rect x="75" y="50" width="10" height="25" />
                        <rect x="20" y="45" width="15" height="15" />
                      </svg>
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left font-semibold text-xs leading-relaxed text-slate-500">
                      <p className="font-bold text-slate-800">Quét mã QR MoMo của bạn</p>
                      <p>1. Mở ứng dụng MoMo trên điện thoại</p>
                      <p>2. Chọn quét mã QR Code và đưa camera quét hình ảnh kề bên</p>
                      <p>3. Chọn Xác nhận thanh toán hóa đơn</p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'banking' && (
                  <div className="space-y-3 text-xs text-slate-600 font-semibold">
                    <p className="font-bold text-slate-800">Thông tin chuyển khoản ngân hàng (VietQR)</p>
                    <div className="grid grid-cols-2 gap-2 bg-white rounded-xl p-4 border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400">Ngân hàng</p>
                        <p className="font-bold text-slate-850">Military Bank (MB Bank)</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Số tài khoản</p>
                        <p className="font-bold text-slate-850">9704229202611032</p>
                      </div>
                      <div className="col-span-2 border-t border-slate-100 pt-2">
                        <p className="text-[10px] text-slate-400">Nội dung chuyển khoản</p>
                        <p className="font-black text-indigo-600">EVPAY {booking.id.toUpperCase().slice(-8)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-3 font-semibold text-xs">
                    <p className="font-bold text-slate-850 mb-1">Mẫu điền số thẻ Visa/Mastercard (Mô phỏng)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Số thẻ 16 chữ số..."
                          className="w-full bg-white font-bold border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="CVC"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 security-dots focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit triggers action */}
              <Button
                variant="primary"
                onClick={handlePayment}
                isLoading={paymentLoading}
                className="w-full justify-center py-3 font-extrabold text-sm shadow-md cursor-pointer"
              >
                Xác nhận thanh toán : {formatCurrency(booking.totalPrice)}
              </Button>
            </div>
          )}
        </div>

        {/* Invoice Brief column */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Tóm tắt đơn đặt vé</h3>
          
          <div className="space-y-3 pb-4 border-b border-slate-100 font-semibold text-xs text-slate-600">
            <div className="flex gap-3">
              <img src={booking.eventImage} className="w-16 h-12 rounded-lg object-cover shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-slate-850 truncate leading-snug">{booking.eventTitle}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{booking.eventDate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pb-4 border-b border-slate-100 font-semibold text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Hạng vé</span>
              <span className="text-slate-800 uppercase font-black">{booking.ticketType} Ticket</span>
            </div>
            <div className="flex justify-between">
              <span>Đơn giá</span>
              <span className="text-slate-800 font-bold">{formatCurrency(booking.totalPrice / booking.quantity)}</span>
            </div>
            <div className="flex justify-between">
              <span>Số lượng</span>
              <span className="text-slate-800 font-bold">x {booking.quantity}</span>
            </div>
          </div>

          <div className="flex justify-between font-extrabold text-slate-800">
            <span className="text-sm">Tổng đặt vé</span>
            <span className="text-base text-indigo-600 font-black">{formatCurrency(booking.totalPrice)}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
