import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, ArrowLeft, Image, Sparkles, AlertCircle } from 'lucide-react';
import { eventApi } from '../api/eventApi';
import { authApi } from '../api/authApi';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user] = useState(() => authApi.getCurrentUser());

  // Input States
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<'music' | 'tech' | 'art' | 'food' | 'sport'>('music');
  const [image, setImage] = useState<string>('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000');
  const [date, setDate] = useState<string>('2026-08-15');
  const [time, setTime] = useState<string>('18:00 - 22:00');
  const [location, setLocation] = useState<string>('White Palace Hoàng Văn Thụ, TP. Hồ Chí Minh');
  const [price, setPrice] = useState<number>(250000);
  const [capacity, setCapacity] = useState<number>(1000);
  const [status, setStatus] = useState<'upcoming' | 'ongoing'>('upcoming');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Preset gorgeous Unsplash assets to fill automatically for users
  const unsplashPresets: Record<'music' | 'tech' | 'art' | 'food' | 'sport', string> = {
    music: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1000',
    tech: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
    art: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1000',
    food: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1000',
    sport: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1000'
  };

  const handlePresetFill = (cat: typeof category) => {
    setCategory(cat);
    setImage(unsplashPresets[cat]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !content || !location || !date || !time) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await eventApi.create({
        title,
        description,
        content,
        category,
        image,
        date,
        time,
        location,
        price,
        capacity,
        status,
        featured: false
      });
      toast.success('Đã tạo sự kiện', 'Sự kiện mới đã được lưu vào dashboard.');
      navigate('/organizer/dashboard');
    } catch (err) {
      const message = getErrorMessage(err, 'Lỗi lưu trữ dữ liệu sự kiện.');
      setError(message);
      toast.error('Không thể tạo sự kiện', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      
      {/* Structural Sidebar */}
      <Sidebar />

      {/* Main core content wrapping */}
      <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-5xl overflow-y-auto">
        
        {/* Header pointer navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800">Tạo sự kiện mới</h1>
            <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Xuất bản sự kiện của bạn công khai lên EventHub</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-200 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Inputs Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6 font-semibold text-xs text-slate-600">
          
          {/* Title input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Tên sự kiện sự vụ <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên sự kiện thu hút người xem... (vd: Concert Vũ Cát Tường)"
              className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Core Categories and presetting choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Danh mục sự kiện</label>
              <select
                value={category}
                onChange={(e) => handlePresetFill(e.target.value as any)}
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer"
              >
                <option value="music">Âm nhạc (Music Festival / Concert)</option>
                <option value="tech">Công nghệ (TechSummit / Conference)</option>
                <option value="art">Nghệ thuật (Art Exhibition)</option>
                <option value="food">Ẩm thực (StreetFood Event)</option>
                <option value="sport">Thể thao (Marathon Run / Soccer)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Số lượng ghế mở bán (Capacity)</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Pricing description and visual links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Giá vé cơ bản (đ) (Nhập 0 nếu Miễn phí)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseInt(e.target.value))}
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Hình ảnh biểu banner URL</label>
              <div className="relative">
                <Image className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Paste URL hình ảnh banner vào đây..."
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cover option review visualization */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4.5">
            <img src={image} className="w-24 h-14 object-cover rounded-lg bg-white shrink-0 border border-slate-200" />
            <div className="space-y-1 text-slate-400">
              <p className="text-[10px] font-bold text-slate-600">Bản xem trước hình ảnh gốc</p>
              <p className="text-[9px] leading-tight font-medium">Bản ảnh được áp tối ưu tự động dựa trên Preset lúc chuyển danh mục. Bạn cũng có thể sửa URL ảnh thủ công.</p>
            </div>
          </div>

          {/* Short description details */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Mô tả ngắn gọn (Brief description) <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả tóm tắt hiển thị ngoài danh sách EventCard..."
              className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Date and locations details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Ngày diễn ra <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Thời gian buổi tiệc <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="vd: 19:00 - 22:30"
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 text-xs"
              />
            </div>
          </div>

          {/* Detailed locations */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Địa điểm tổ chức <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Vui lòng điền chi tiết số nhà, tên tòa nhà, tỉnh thành phố..."
              className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Rich Content markdown areas */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Nội dung bài viết chi tiết buổi lễ <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết mô tả lịch trình sự kiện, thông điệp, danh sách nghệ sĩ, yêu cầu check-in..."
              className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
            ></textarea>
          </div>

          {/* Submit triggers actions */}
          <div className="flex gap-4.5 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/organizer/dashboard')}
              className="font-bold border-slate-200 cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="font-extrabold cursor-pointer"
            >
              Phát hành sự kiện
            </Button>
          </div>

        </form>

      </main>

    </div>
  );
};
