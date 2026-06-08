import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, Image as ImageIcon, Save, Upload } from 'lucide-react';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { User } from '../api/mockDb';
import { Button } from '../components/Button';

const LOCAL_AVATAR_FILES = [
  ...Array.from({ length: 49 }, (_, index) => `avatar-${String(index + 1).padStart(2, '0')}.jpg`)
];

const SYSTEM_AVATARS = [
  'https://api.dicebear.com/8.x/adventurer/svg?seed=EventHub-01',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=EventHub-02',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=EventHub-03',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=EventHub-04',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=EventHub-05',
  'https://api.dicebear.com/8.x/adventurer/svg?seed=EventHub-06',
  'https://api.dicebear.com/8.x/initials/svg?seed=Organizer',
  'https://api.dicebear.com/8.x/initials/svg?seed=EventHub',
  ...LOCAL_AVATAR_FILES.map((file) => `/avatars/${encodeURIComponent(file)}`)
];

const MAX_AVATAR_BYTES = 350 * 1024;

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<User | null>(() => authApi.getCurrentUser());

  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '0901234567');
  const [organization, setOrganization] = useState<string>(user?.organization || 'Tự do');
  const [avatar, setAvatar] = useState<string>(user?.avatar || SYSTEM_AVATARS[0]);

  const [updating, setUpdating] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showAllAvatars, setShowAllAvatars] = useState<boolean>(false);

  const visibleAvatars = showAllAvatars ? SYSTEM_AVATARS : SYSTEM_AVATARS.slice(0, 12);

  React.useEffect(() => {
    if (!user) {
      navigate('/login?message=Vui lòng đăng nhập để xem thông tin cá nhân.');
    }
  }, [user, navigate]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSuccess(false);
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh.');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError('Ảnh đại diện nên nhỏ hơn 350KB để lưu ổn định trong môi trường demo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.onerror = () => setError('Không đọc được file ảnh này.');
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setUpdating(true);
    setSuccess(false);
    setError('');

    try {
      const updatedUser = await userApi.updateCurrentProfile({
        ...user,
        name,
        phone,
        organization,
        avatar
      });
      setUser(updatedUser);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Lỗi cập nhật thông tin cá nhân.');
    } finally {
      setUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Trang cá nhân</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Cấu hình thông tin tài khoản, ảnh đại diện và vai trò phân quyền trên EventHub.
          </p>
        </div>

        {success && (
          <div className="p-3.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Cập nhật thông tin thành công.
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          <aside className="lg:col-span-4 bg-slate-900 p-8 text-white space-y-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <img
                  src={avatar}
                  alt={name}
                  className="w-28 h-28 rounded-full border-4 border-slate-700 object-cover bg-slate-800 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-0 bottom-1 w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 flex items-center justify-center shadow-sm transition"
                  title="Tải ảnh đại diện lên"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="font-extrabold text-sm truncate max-w-56">{name}</h3>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{user.role}</p>
              </div>

              <span className="inline-block px-2 py-0.5 text-[10px] bg-indigo-600 rounded-md font-bold tracking-wider uppercase text-indigo-100">
                {user.username}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Chọn ảnh hệ thống
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  {visibleAvatars.length}/{SYSTEM_AVATARS.length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {visibleAvatars.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAvatar(item)}
                    className={`aspect-square rounded-xl border p-1 transition ${
                      avatar === item
                        ? 'border-indigo-400 bg-indigo-500/20'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                    }`}
                    title="Chọn avatar"
                  >
                    <img src={item} alt="Avatar hệ thống" className="w-full h-full rounded-lg object-cover bg-white" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowAllAvatars((current) => !current)}
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-indigo-200 hover:bg-slate-800 transition"
              >
                {showAllAvatars ? 'Thu gọn' : 'Xem thêm'}
              </button>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                <Upload className="w-4 h-4" />
                Upload ảnh từ máy
              </button>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                Hỗ trợ ảnh JPG, PNG, WEBP. Trong bản demo ảnh được lưu dạng data URL.
              </p>
            </div>
          </aside>

          <form onSubmit={handleUpdate} className="lg:col-span-8 p-6 space-y-4 text-xs font-semibold text-slate-600">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Địa chỉ Email</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-slate-100 font-semibold border border-slate-200 text-slate-400 rounded-xl px-4 py-2 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Đơn vị / Tổ chức</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(event) => setOrganization(event.target.value)}
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Ảnh đại diện hiện tại</p>
              <div className="flex items-center gap-3">
                <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover border border-slate-200 bg-white" />
                <div>
                  <p className="text-xs font-extrabold text-slate-800">{name}</p>
                  <p className="text-[10px] text-slate-400">Ảnh này sẽ hiển thị trên navbar, sidebar và dashboard.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-4 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center bg-slate-50/50 -mx-6 -mb-6 p-4.5">
              <Link to="/my-bookings" className="text-indigo-600 hover:underline">
                Xem vé đã đặt
              </Link>
              <Button
                type="submit"
                isLoading={updating}
                leftIcon={<Save className="w-4 h-4" />}
                className="font-bold cursor-pointer"
              >
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
