import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Info, User, Lock, Sparkles } from 'lucide-react';
import { authApi } from '../api/authApi';
import { Button } from '../components/Button';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUrl = searchParams.get('redirect') || '/';
  const urlMessage = searchParams.get('message') || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Email không hợp lệ.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.login(normalizedEmail, password);
      window.dispatchEvent(new Event('storage'));
      toast.success('Đăng nhập thành công');
      navigate(redirectUrl);
    } catch (err) {
      const message = getErrorMessage(err, 'Lỗi đăng nhập hệ thống.');
      setError(message);
      toast.error('Đăng nhập thất bại', message);
    } finally {
      setLoading(false);
    }
  };

  const autofillAs = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-md">
            EH
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Chào mừng quay lại</h2>
          <p className="text-xs font-semibold text-slate-400">Đăng nhập tài khoản EventHub của bạn</p>
        </div>

        {urlMessage && (
          <div className="px-3.5 py-2.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 flex gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{urlMessage}</span>
          </div>
        )}

        {error && (
          <div className="px-3.5 py-2.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400" htmlFor="login-email">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400" htmlFor="login-password">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full justify-center py-2.5 font-bold shadow-md hover:shadow-lg transition-all"
          >
            Đăng nhập
          </Button>
        </form>

        <div className="text-right -mt-2">
          <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>

        <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-xl space-y-2.5">
          <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Tài khoản thử nghiệm
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => autofillAs('user@example.com', 'Password123')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
            >
              Attendee
            </button>
            <button
              type="button"
              onClick={() => autofillAs('organizer@example.com', 'Password123')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
            >
              Organizer
            </button>
            <button
              type="button"
              onClick={() => autofillAs('admin@example.com', 'Password123')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-400 font-semibold">
            Bạn chưa có tài khoản?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline">
              Đăng ký tại đây
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
