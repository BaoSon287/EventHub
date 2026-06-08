import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, ArrowLeft, Image, Sparkles, AlertCircle } from 'lucide-react';
import { eventApi } from '../api/eventApi';
import { authApi } from '../api/authApi';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { ImageUpload } from '../components/ImageUpload';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';
import { defaultEventImages } from '../data/defaultImages';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user] = useState(() => authApi.getCurrentUser());

  // Input States
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<'music' | 'tech' | 'art' | 'food' | 'sport'>('music');
  const [image, setImage] = useState<string>(defaultEventImages[0]);
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
    music: defaultEventImages[1],
    tech: defaultEventImages[0],
    art: defaultEventImages[2],
    food: defaultEventImages[3],
    sport: defaultEventImages[4]
  };

  const handlePresetFill = (cat: typeof category) => {
    setCategory(cat);
    setImage(unsplashPresets[cat]);
  };

  const getTimeRange = () => {
    const [start = '', end = ''] = time.split('-').map((part) => part.trim());
    return { start, end };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { start, end } = getTimeRange();
    if (!title.trim() || !description.trim() || !content.trim() || !location.trim() || !date || !start || !end) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    if (capacity < 0 || price < 0 || Number.isNaN(capacity) || Number.isNaN(price)) {
      setError('Số lượng vé và giá vé không được âm.');
      return;
    }
    if (`${date}T${start}:00` >= `${date}T${end}:00`) {
      setError('Thời gian bắt đầu phải trước thời gian kết thúc.');
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
                onChange={(e) => setCapacity(Number(e.target.value || 0))}
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div>
              <h2 className="text-sm font-black text-slate-800">Media</h2>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                Upload an event image or paste an image URL. The selected image is saved as event imageUrl.
              </p>
            </div>
            <ImageUpload
              value={image}
              onChange={setImage}
              uploadFn={eventApi.uploadEventImage}
              label="Upload event image"
              helperText="JPG, PNG or WEBP up to 5MB. You can also paste an image URL below."
              fallbackImage={unsplashPresets[category]}
            />
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Optional image URL</label>
              <div className="relative">
                <Image className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Paste image URL here..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Giá vé cơ bản (đ) (Nhập 0 nếu Miễn phí)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value || 0))}
              className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
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
