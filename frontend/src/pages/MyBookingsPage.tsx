import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Search, ArrowRight, ShieldAlert, Sparkles, QrCode, X } from 'lucide-react';
import { bookingApi } from '../api/bookingApi';
import { authApi } from '../api/authApi';
import { Booking, User } from '../api/mockDb';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';
import { formatCurrency, formatDate } from '../utils/formatters';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(authApi.getCurrentUser());
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  
  // Modal configurations for showing QR check-in
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?message=Vui lòng đăng nhập để xem danh sách vé đã đặt.');
      return;
    }

    bookingApi.getMyBookings()
      .then((res) => {
        setBookings(res.data);
      })
      .catch((err) => {
        toast.error('Không tải được vé', getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const triggerQRShow = (b: Booking) => {
    setSelectedBooking(b);
    setShowQRModal(true);
  };

  const handleCancel = async (bookingId: string) => {
    setCancelLoading(true);
    try {
      const res = await bookingApi.cancel(bookingId);
      const updatedBooking = res.data;
      if (updatedBooking) {
        setBookings((current) => current.map((item) => item.id === bookingId ? updatedBooking : item));
      }
      toast.success('Đã hủy booking', 'Vé đã được giải phóng khỏi đơn đặt chỗ này.');
      setCancelTargetId(null);
    } catch (err) {
      toast.error('Không thể hủy booking', getErrorMessage(err));
    } finally {
      setCancelLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return formatCurrency(price);
  };

  const formatTime = (isoString: string) => {
    return formatDate(isoString);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Head header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Ticket className="w-8 h-8 text-indigo-600 shrink-0" />
              Vé của tôi
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1.5 leading-relaxed">
              Quản lý toàn bộ danh sách vé, hóa đơn đặt chỗ và mã QR check-in sự kiện của bạn.
            </p>
          </div>
          
          <Link to="/events" className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition">
            Khám phá thêm sự kiện +
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-12 shadow-sm">
            <EmptyState
              title="Bạn chưa đặt vé nào"
              description="Hiện tại hòm vé của bạn đang trống rỗng. Hãy tham gia và đặt vé cho những sự kiện hấp dẫn nhất ngay hôm nay!"
              actionLabel="Khám phá Sự kiện"
              onAction={() => navigate('/events')}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden flex flex-col md:flex-row items-center gap-6 p-4.5 sm:p-6 hover:shadow-md transition-shadow"
              >
                {/* Event Cover Photo thumbnail */}
                <div className="aspect-video w-full md:w-44 rounded-xl overflow-hidden bg-slate-100 shrink-0 self-start md:self-center">
                  <img
                    src={booking.eventImage}
                    alt={booking.eventTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Main Middle section Details */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      booking.ticketType === 'vip' ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}>
                      {booking.ticketType.toUpperCase()} x {booking.quantity} Vé
                    </span>
                    <StatusBadge status={booking.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-850 hover:text-indigo-600 transition truncate">
                    <Link to={`/events/${booking.eventId}`}>{booking.eventTitle}</Link>
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-semibold">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{booking.eventDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{booking.eventLocation}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-semibold">Ngày đặt: {formatTime(booking.bookingDate)} • Đơn hàng: <span className="uppercase text-slate-500 font-bold">#{booking.id.slice(-6)}</span></p>
                </div>

                {/* Rightmost column Payment Statement & QR indicators */}
                <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-[0px] md:pl-6 w-full md:w-44 flex flex-row md:flex-col items-center justify-between md:justify-center md:items-end gap-3 self-end md:self-center shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-slate-400 font-semibold lowercase">Tổng số tiền</p>
                    <p className="text-base font-black text-slate-800">{formatPrice(booking.totalPrice)}</p>
                  </div>

                  <div className="w-auto md:w-full flex md:flex-col gap-2">
                    {booking.status === 'pending_payment' ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/payments/${booking.id}`)}
                          className="w-full justify-center text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Thanh toán ngay
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelTargetId(booking.id)}
                          className="w-full justify-center text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          Hủy booking
                        </Button>
                      </>
                    ) : booking.status === 'paid' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerQRShow(booking)}
                        leftIcon={<QrCode className="w-4 h-4 text-slate-500" />}
                        className="w-full justify-center text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50/50 cursor-pointer"
                      >
                        Mã vé Check-in
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider py-1.5">Đã bị hủy</span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* RETHINKING DESIGN CUSTOM POP-UP DIALOG (QR Modal view of Tickets) */}
      {showQRModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-100 shadow-2xl relative overflow-hidden flex flex-col">
            
            {/* Header modal controls */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center relative">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300">Mã Số Check-in Điện Tử</span>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1 cursor-pointer bg-white/10 hover:bg-white/20 rounded-md text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ticket body elements */}
            <div className="p-6 text-center space-y-6 flex-1 flex flex-col justify-center items-center">
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-md border border-rose-100 mb-1">
                  {selectedBooking.ticketType.toUpperCase()} TICKET
                </span>
                <h4 className="text-sm font-black text-slate-800 line-clamp-2 leading-snug px-3">
                  {selectedBooking.eventTitle}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">{selectedBooking.eventDate} • {selectedBooking.eventLocation}</p>
              </div>

              {/* Holographic simulated QR box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 shadow-inner">
                {/* Simulated QR block via simple SVG */}
                <svg className="w-40 h-40 mx-auto text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer border bars */}
                  <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                  {/* Center squares */}
                  <rect x="13" y="13" width="9" height="9" />
                  <rect x="13" y="78" width="9" height="9" />
                  <rect x="78" y="13" width="9" height="9" />
                  {/* Modern QR noise scatter points pattern */}
                  <rect x="40" y="10" width="5" height="15" />
                  <rect x="50" y="5" width="10" height="5" />
                  <rect x="45" y="25" width="15" height="5" />
                  <rect x="10" y="40" width="10" height="10" />
                  <rect x="25" y="45" width="15" height="15" />
                  <rect x="50" y="40" width="20" height="10" />
                  <rect x="5" y="60" width="10" height="5" />
                  <rect x="45" y="60" width="15" height="15" />
                  <rect x="70" y="45" width="20" height="10" />
                  <rect x="75" y="60" width="5" height="15" />
                  <rect x="70" y="80" width="15" height="5" />
                  <rect x="80" y="85" width="15" height="10" />
                </svg>

                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-4">
                  {selectedBooking.id.toUpperCase()}
                </p>
              </div>

              {/* Attendee indicators */}
              <div className="border-t border-slate-100 pt-4 w-full">
                <div className="grid grid-cols-2 text-xs font-semibold">
                  <div className="text-left">
                    <p className="text-[9px] text-slate-400">Khách hàng</p>
                    <p className="text-slate-800 font-extrabold truncate">{selectedBooking.userName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400">Số lượng</p>
                    <p className="text-slate-800 font-extrabold">{selectedBooking.quantity} vé</p>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-zinc-400 font-medium italic">Vui lòng trình diện giao diện vé điện tử này tại quầy bán vé của ban tổ chức để nhận vòng đeo tay check-in.</p>
            </div>

            {/* Close action */}
            <div className="border-t border-slate-50 p-4 shrink-0 bg-slate-50">
              <Button
                variant="primary"
                onClick={() => setShowQRModal(false)}
                className="w-full justify-center font-bold text-xs"
              >
                Đóng vé thông báo
              </Button>
            </div>

          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTargetId)}
        title="Cancel booking?"
        description="Are you sure you want to cancel this booking? This action will release your tickets."
        confirmText="Cancel booking"
        cancelText="Keep booking"
        variant="danger"
        isLoading={cancelLoading}
        onCancel={() => setCancelTargetId(null)}
        onConfirm={() => cancelTargetId && handleCancel(cancelTargetId)}
      />

    </div>
  );
};
