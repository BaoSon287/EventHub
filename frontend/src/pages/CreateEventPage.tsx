import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Image, MapPin } from 'lucide-react';
import { eventApi } from '../api/eventApi';
import { authApi } from '../api/authApi';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { ImageUpload } from '../components/ImageUpload';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';
import { defaultEventImages } from '../data/defaultImages';
import { buildGoogleMapsSearchUrl } from '../utils/googleMaps';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user] = useState(() => authApi.getCurrentUser());

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<'music' | 'tech' | 'art' | 'food' | 'sport'>('music');
  const [image, setImage] = useState<string>(defaultEventImages[0]);
  const [date, setDate] = useState<string>('2026-08-15');
  const [time, setTime] = useState<string>('18:00 - 22:00');
  const [location, setLocation] = useState<string>('White Palace Hoàng Văn Thụ');
  const [address, setAddress] = useState<string>('194 Hoàng Văn Thụ');
  const [city, setCity] = useState<string>('TP. Hồ Chí Minh');
  const [price, setPrice] = useState<number>(250000);
  const [capacity, setCapacity] = useState<number>(1000);
  const [status] = useState<'upcoming' | 'ongoing'>('upcoming');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const mapsPreviewUrl = buildGoogleMapsSearchUrl({ location, address, city });

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
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        category,
        image,
        date,
        time,
        location: location.trim(),
        address: address.trim(),
        city: city.trim(),
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="max-w-5xl flex-1 space-y-6 overflow-y-auto p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/organizer/dashboard')}
            className="rounded-lg p-1.5 transition hover:bg-slate-200"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800">Tạo sự kiện mới</h1>
            <p className="mt-0.5 text-[10px] font-semibold leading-none text-slate-400">
              Xuất bản sự kiện của bạn công khai lên EventHub
            </p>
          </div>
        </div>

        {error && (
          <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 text-xs font-semibold text-slate-600 shadow-xs sm:p-8">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Tên sự kiện <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên sự kiện thu hút người xem..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Danh mục sự kiện</label>
              <select
                value={category}
                onChange={(e) => handlePresetFill(e.target.value as typeof category)}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="music">Âm nhạc</option>
                <option value="tech">Công nghệ</option>
                <option value="art">Nghệ thuật</option>
                <option value="food">Ẩm thực</option>
                <option value="sport">Thể thao</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Số lượng ghế mở bán</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Giá vé cơ bản (đ)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value || 0))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Mô tả ngắn <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả tóm tắt hiển thị ngoài danh sách sự kiện..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Ngày diễn ra <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Thời gian <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="vd: 19:00 - 22:30"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div>
              <h2 className="text-sm font-black text-slate-800">Location</h2>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                These fields generate Google Maps links for attendees.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Venue / location <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Example: Van Mieu - Quoc Tu Giam"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Example: 58 Quoc Tu Giam"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Example: Ha Noi"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {mapsPreviewUrl && (
              <a
                href={mapsPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-50 sm:w-auto"
              >
                <MapPin className="h-4 w-4" />
                Preview on Google Maps
              </a>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Nội dung chi tiết <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết mô tả lịch trình sự kiện, thông điệp, danh sách nghệ sĩ, yêu cầu check-in..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-4.5">
            <Button type="button" variant="outline" onClick={() => navigate('/organizer/dashboard')} className="cursor-pointer border-slate-200 font-bold">
              Hủy bỏ
            </Button>
            <Button type="submit" isLoading={loading} className="cursor-pointer font-extrabold">
              Phát hành sự kiện
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
