import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ShieldAlert, ArrowLeft, Sparkles } from 'lucide-react';
import { eventApi } from '../api/eventApi';
import { bookingApi } from '../api/bookingApi';
import { authApi } from '../api/authApi';
import { Event, User } from '../types/domain';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { EventImage } from '../components/EventImage';
import { DetailSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';
import { formatCurrency } from '../utils/formatters';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useState<User | null>(authApi.getCurrentUser());
  
  // Custom Booking configurations
  const [ticketType, setTicketType] = useState<'standard' | 'vip'>('standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    eventApi.getById(id)
      .then((res) => {
        setEvent(res.data);
      })
      .catch((err) => {
        setError(getErrorMessage(err, 'Sự kiện không tồn tại hoặc đã bị ẩn.'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{error || 'Có lỗi xảy ra'}</h2>
        <p className="text-slate-500 text-xs">Sự kiện bạn đang chọn không có sẵn trên hệ thống vào lúc này.</p>
        <Link to="/events" className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs hover:underline">
          <ArrowLeft className="w-4 h-4" /> Về danh sách sự kiện
        </Link>
      </div>
    );
  }

  // Calculate prices
  const priceFactor = ticketType === 'vip' ? 1.5 : 1.0;
  const unitPrice = Math.round(event.price * priceFactor);
  const totalPrice = unitPrice * quantity;
  const availableTickets = Math.max(0, event.capacity - event.booked);
  const maxQuantity = Math.max(1, Math.min(10, availableTickets));
  const isSoldOut = availableTickets <= 0;

  const handleBooking = async () => {
    if (!user) {
      // Guide profile login with redirect back URL
      toast.info('Vui lòng đăng nhập', 'Bạn cần đăng nhập trước khi đặt vé.');
      navigate(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`);
      return;
    }

    if (quantity > availableTickets) {
      toast.error('Không đủ vé', 'Số lượng vé bạn chọn vượt quá số vé còn lại.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await bookingApi.create({
        eventId: event.id,
        quantity,
        ticketType
      });
      // Redirect to simulated payments page
      toast.success('Đặt vé thành công', 'Bạn có thể hoàn tất thanh toán ở bước tiếp theo.');
      navigate(`/payments/${res.data.id}`);
    } catch (err) {
      toast.error('Không thể đặt vé', getErrorMessage(err));
    } finally {
      setBookingLoading(false);
    }
  };

  const categoryLabels: Record<Event['category'], string> = {
    music: 'Âm nhạc',
    tech: 'Công nghệ',
    art: 'Nghệ thuật',
    food: 'Ẩm thực',
    sport: 'Thể thao'
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Visual Cover Banner with back pointer */}
      <div className="relative h-96 w-full bg-slate-900 overflow-hidden">
        <EventImage
          src={event.image}
          alt={event.title}
          variant="banner"
          className="h-full w-full opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
        
        <div className="absolute top-6 left-6 z-10">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 text-xs font-bold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>
        </div>

        <div className="absolute bottom-8 left-0 right-0 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                {categoryLabels[event.category]}
              </span>
              <StatusBadge status={event.status} />
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Descriptions, dates */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl shadow-xs p-6 sm:p-8 space-y-8">
          
          {/* Calendar, Location metadata bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
            <div className="flex gap-3.5">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl max-h-12">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời gian diễn ra</p>
                <p className="text-sm font-black text-slate-800">{event.date}</p>
                <p className="text-xs text-slate-500 font-semibold">{event.time}</p>
              </div>
            </div>

            <div className="flex gap-3.5">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl max-h-12">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Địa điểm tổ chức</p>
                <p className="text-sm font-black text-slate-800">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Organizer card */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100/50 rounded-full flex items-center justify-center font-bold text-indigo-700">
                {event.organizerName.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Nhà tổ chức</p>
                <p className="text-xs font-bold text-slate-700">{event.organizerName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-semibold">
                Sức chứa {event.capacity} người ({event.booked} đã đặt)
              </span>
            </div>
          </div>

          {/* Rich Content article */}
          <div className="prose max-w-none text-slate-600 font-medium leading-relaxed space-y-4">
            <h3 className="text-lg font-black text-slate-800 mb-3">Chi tiết Sự kiện</h3>
            <p className="whitespace-pre-line text-sm text-slate-600 leading-relaxed font-semibold">
              {event.content}
            </p>
          </div>

          {/* Terms info banner */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 flex gap-3 text-amber-700">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div className="text-xs leading-relaxed font-semibold">
              <p className="font-bold mb-1">Chính sách hủy/Đổi vé</p>
              <li>Vé đã mua không thể quy đổi thành tiền mặt hay hoàn phí trừ trường hợp sự kiện bị trì hoãn hoặc hủy bỏ từ ban tổ chức.</li>
              <li>Mang theo mã QR code được cấp trong email hoặc mục vé để thực hiện check-in trực tiếp tại quầy kiểm soát.</li>
            </div>
          </div>
        </div>

        {/* Right Column: Ticket Box Booking */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 bg-white border border-slate-100 rounded-2xl shadow-md p-6 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 mb-2">Đăng ký đặt vé</h3>
              <p className="text-xs text-slate-400 font-semibold">Chọn loại vé và điền số lượng mong muốn</p>
            </div>

            <div className="border-t border-slate-100"></div>

            {/* Ticket type switches */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hạng vé</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTicketType('standard')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer select-none ${
                    ticketType === 'standard'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-extrabold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <p className="text-xs">Standard</p>
                  <p className="text-sm font-black mt-1">{formatCurrency(event.price)}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTicketType('vip')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer select-none ${
                    ticketType === 'vip'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-extrabold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <p className="text-xs flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} /> VIP
                  </p>
                  <p className="text-sm font-black mt-1">{formatCurrency(event.price * 1.5)}</p>
                </button>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Số lượng vé</label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold border-r border-slate-200 transition"
                >
                  -
                </button>
                <span className="px-5 text-sm font-bold text-slate-700">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                  className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold border-l border-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100"></div>

            {/* Summary Price statement */}
            <div className="flex items-center justify-between bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Tổng cộng</p>
                <p className="text-lg font-black text-indigo-700">{formatCurrency(totalPrice)}</p>
              </div>
              <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-100/55 uppercase rounded-sm">
                Sẵn sàng
              </span>
            </div>

            {/* Checkout Action Button */}
            {isSoldOut ? (
              <Button variant="outline" className="w-full cursor-not-allowed justify-center" disabled>
                Đã hết vé sự kiện
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleBooking}
                isLoading={bookingLoading}
                className="w-full justify-center py-3 font-extrabold shadow-md hover:shadow-lg transition-transform"
              >
                {user ? 'Đăng ký Đặt vé ngay' : 'Đăng nhập để Đặt vé'}
              </Button>
            )}

            {/* Additional info hints */}
            <p className="text-[10px] text-slate-400 text-center font-semibold leading-relaxed">
              Mã vé QR CODE duy nhất chứa định danh tài khoản cá nhân sẽ gửi về màn hình <strong>Vé của tôi</strong> ngay sau khi đặt thành công.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
