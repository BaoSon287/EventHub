import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserCheck, Building2 } from 'lucide-react';
import { authApi } from '../api/authApi';
import { Button } from '../components/Button';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'attendee' | 'organizer'>('attendee');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!username.trim() || !email.trim() || !name.trim() || !password) {
      setError('Vui lòng điền đầy đủ tất cả thông tin đăng ký.');
      return;
    }
    if (!emailPattern.test(email)) {
      setError('Email không hợp lệ.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.register({
        username: username.trim(),
        email: email.trim(),
        name: name.trim(),
        password,
        role
      });

      toast.success('Đăng ký thành công', 'Vui lòng đăng nhập để bắt đầu sử dụng EventHub.');
      navigate('/login?message=Đăng ký thành công. Vui lòng đăng nhập.');
    } catch (err) {
      const message = getErrorMessage(err, 'Lỗi đăng ký tài khoản.');
      setError(message);
      toast.error('Đăng ký thất bại', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute -top-12 -left-12 w-96 h-96 bg-indigo-200/40 rounded-full filter blur-3xl opacity-25 z-0"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-200/30 rounded-full filter blur-3xl opacity-25 z-0 text-white"></div>

      <div className="w-full max-w-lg bg-white border border-slate-100 rounded-2xl shadow-xl p-8 space-y-6 relative z-10">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-md">
            EH
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tạo tài khoản mới</h2>
          <p className="text-xs font-semibold text-slate-400">Tham gia hệ thống quản lý sự kiện thông minh</p>
        </div>

        {error && (
          <div className="px-3.5 py-2.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="vd: khachhang1"
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vd: user@gmail.com"
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Họ và Tên</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Vai trò của bạn</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('attendee')}
                className={`flex items-center gap-3 p-3 border rounded-xl transition cursor-pointer select-none text-left ${
                  role === 'attendee' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${role === 'attendee' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Người mua vé</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Đặt vé và lưu QR</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('organizer')}
                className={`flex items-center gap-3 p-3 border rounded-xl transition cursor-pointer select-none text-left ${
                  role === 'organizer' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${role === 'organizer' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Nhà tổ chức</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Quản lý và bán vé online</p>
                </div>
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full justify-center py-2.5 font-extrabold shadow-md hover:shadow-lg mt-4"
          >
            Đăng ký tài khoản
          </Button>
        </form>

        <div className="border-t border-slate-100"></div>

        <div className="text-center">
          <p className="text-xs text-slate-400 font-semibold">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
