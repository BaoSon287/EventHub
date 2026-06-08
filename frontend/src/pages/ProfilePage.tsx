import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserCheck, Mail, ShieldAlert, Sparkles, Building2, Smartphone, Save } from 'lucide-react';
import { authApi } from '../api/authApi';
import { User } from '../api/mockDb';
import { Button } from '../components/Button';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => authApi.getCurrentUser());

  // Local update fields
  const [name, setName] = useState<string>(user?.name || '');
  const [phone, setPhone] = useState<string>(user?.phone || '0901234567');
  const [organization, setOrganization] = useState<string>(user?.organization || 'Tự do');
  
  const [updating, setUpdating] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    if (!user) {
      navigate('/login?message=Vui lòng đăng nhập để xem thông tin cá nhân.');
    }
  }, [user, navigate]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setSuccess(false);

    setTimeout(() => {
      const updatedUser: User = {
        ...user,
        name,
        phone,
        organization
      };
      
      localStorage.setItem('eventhub_current_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setUpdating(false);
      setSuccess(true);
      
      // Notify other components
      window.dispatchEvent(new Event('storage'));
    }, 600);
  };

  if (!user) return null;

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Trang cá nhân</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Cấu hình thông tin tài khoản cá nhân, vai trò phân quyền trên EventHub.</p>
        </div>

        {success && (
          <div className="p-3.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
            Cập nhật cấu hình thông tin thành công! Dữ liệu đã được đồng bộ hóa.
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
          
          {/* Avatar side */}
          <div className="md:col-span-4 bg-slate-900 p-8 flex flex-col items-center text-center justify-center text-white space-y-4">
            <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-slate-700 object-cover shadow-md" />
            <div>
              <h3 className="font-extrabold text-sm truncate w-40">{user.name}</h3>
              <p className="text-[10px] text-slate-400 capitalize mt-0.5">{user.role}</p>
            </div>
            
            <span className="inline-block px-2 py-0.5 text-[10px] bg-indigo-600 rounded-md font-bold tracking-wider uppercase text-indigo-100">
              {user.username}
            </span>
          </div>

          {/* Form details side */}
          <form onSubmit={handleUpdate} className="md:col-span-8 p-6 space-y-4 text-xs font-semibold text-slate-600">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Địa chỉ Email</label>
              <input
                type="email"
                disabled
                title="Email không cho phép thay đổi dể bảo toàn định dạng đăng kí"
                value={user.email}
                className="w-full bg-slate-100 font-semibold border border-slate-200 text-slate-400 rounded-xl px-4 py-2 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Đơn vị / Tổ chức</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl px-4 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-50 pt-4 flex justify-between items-center bg-slate-50/50 -mx-6 -mb-6 p-4.5">
              <Link to="/my-bookings" className="text-indigo-600 hover:underline">
                Xem vé đã đặt →
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
