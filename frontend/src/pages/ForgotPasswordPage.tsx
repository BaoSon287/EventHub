import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { authApi } from '../api/authApi';
import { Button } from '../components/Button';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';

export const ForgotPasswordPage: React.FC = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError('Vui lòng nhập email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Email không hợp lệ.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await authApi.forgotPassword(normalizedEmail);
      const successMessage = 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.';
      setMessage(successMessage);
      toast.success('Đã gửi yêu cầu', successMessage);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể gửi email đặt lại mật khẩu.');
      setError(errorMessage);
      toast.error('Gửi email thất bại', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-md">
            EH
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Quên mật khẩu</h2>
          <p className="text-xs font-semibold text-slate-400">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>

        {message && (
          <div className="px-3.5 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
            {message}
          </div>
        )}
        {error && (
          <div className="px-3.5 py-2.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400" htmlFor="forgot-email">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@gmail.com"
                className="w-full bg-slate-50 font-semibold border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                autoComplete="email"
              />
            </div>
          </div>

          <Button type="submit" isLoading={loading} className="w-full justify-center py-2.5 font-bold">
            Gửi liên kết đặt lại
          </Button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-xs font-semibold text-indigo-600 hover:underline">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
