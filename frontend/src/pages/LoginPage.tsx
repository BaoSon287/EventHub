import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, Info, User, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { authApi } from '../api/authApi';
import { Button } from '../components/Button';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUrl = searchParams.get('redirect') || '/';
  const urlMessage = searchParams.get('message') || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.login(username, password);
      
      // Dispatch storage update to notify navbar
      window.dispatchEvent(new Event('storage'));
      toast.success('Đăng nhập thành công');
      
      // Navigate to success target
      navigate(redirectUrl);
    } catch (err) {
      const message = getErrorMessage(err, 'Lỗi đăng nhập hệ thống.');
      setError(message);
      toast.error('Đăng nhập thất bại', message);
    } finally {
      setLoading(false);
    }
  };

  const autofillAs = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 flex items-center justify-center relative overflow-hidden">
      
      <div className="absolute -top-12 -right-12 w-96 h-96 bg-indigo-200/50 rounded-full filter blur-3xl opacity-20 z-0"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-200/50 rounded-full filter blur-3xl opacity-20 z-0 text-white"></div>

      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl p-8 space-y-6 relative z-10">
        
        {/* Header content */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-md">
            EH
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Chào mừng quay trở lại!</h2>
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

        {/* Inputs */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Tên đăng nhập</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập... (vd: user)"
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu... (vd: user123)"
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full justify-center py-2.5 font-bold shadow-md hover:shadow-lg transition-all"
          >
            Đăng nhập ngay
          </Button>
        </form>

        {/* Account help tags */}
        <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-xl space-y-2.5">
          <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Bảng tài khoản thử nghiệm nhanh
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => autofillAs('user', 'user123')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
            >
              Attendee
            </button>
            <button
              onClick={() => autofillAs('organizer', 'organizer123')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
            >
              Organizer
            </button>
            <button
              onClick={() => autofillAs('admin', 'admin123')}
              className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
            >
              Admin
            </button>
          </div>
          <p className="text-[9px] text-slate-400 leading-tight font-medium">Click để điền nhanh form và trải nghiệm các vai trò nghiệp vụ (Role).</p>
        </div>

        {/* Redirect toggle */}
        <div className="text-center">
          <p className="text-xs text-slate-400 font-semibold">
            Bán chưa có tài khoản?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline">
              Đăng ký tại đây
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
