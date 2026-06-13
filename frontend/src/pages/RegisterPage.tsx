import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Building2 } from 'lucide-react';
import { authApi } from '../api/authApi';
import { Button } from '../components/Button';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'attendee' | 'organizer'>('attendee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    const normalizedFullName = fullName.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedFullName || !normalizedEmail || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin đăng ký.');
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setError('Email không hợp lệ.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.register({
        email: normalizedEmail,
        fullName: normalizedFullName,
        password,
        role
      });

      toast.success('Đăng ký thành công', 'Vui lòng kiểm tra email để xác thực tài khoản.');
      navigate('/login?message=Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.');
    } catch (err) {
      const message = getErrorMessage(err, 'Lỗi đăng ký tài khoản.');
      setError(message);
      toast.error('Đăng ký thất bại', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white border border-slate-100 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-md">
            EH
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Tạo tài khoản mới</h2>
          <p className="text-xs font-semibold text-slate-400">Tham gia EventHub để đặt vé hoặc tổ chức sự kiện</p>
        </div>

        {error && (
          <div className="px-3.5 py-2.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400" htmlFor="register-full-name">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="register-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyen Van A"
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400" htmlFor="register-email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400" htmlFor="register-password">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400" htmlFor="register-confirm-password">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="register-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Vai trò</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('attendee')}
                className={`flex items-center gap-3 p-3 border rounded-xl transition cursor-pointer select-none text-left ${
                  role === 'attendee' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
                aria-pressed={role === 'attendee'}
              >
                <div className={`p-1.5 rounded-lg ${role === 'attendee' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Người tham dự</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Đặt vé và quản lý vé</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('organizer')}
                className={`flex items-center gap-3 p-3 border rounded-xl transition cursor-pointer select-none text-left ${
                  role === 'organizer' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
                aria-pressed={role === 'organizer'}
              >
                <div className={`p-1.5 rounded-lg ${role === 'organizer' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Nhà tổ chức</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Tạo và bán vé sự kiện</p>
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
