import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '../utils/getErrorMessage';

export const VerifyEmailResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? 'Đang xác thực email...' : 'Liên kết xác thực không hợp lệ.');

  useEffect(() => {
    if (!token) {
      return;
    }

    let mounted = true;
    authApi.verifyEmail(token)
      .then(() => {
        if (!mounted) return;
        setStatus('success');
        setMessage('Email đã được xác thực. Bạn có thể đăng nhập EventHub.');
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus('error');
        setMessage(getErrorMessage(err, 'Không thể xác thực email.'));
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const isSuccess = status === 'success';

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-2xl shadow-xl p-8 space-y-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-slate-100">
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          ) : (
            <XCircle className={`w-8 h-8 ${status === 'loading' ? 'text-slate-400' : 'text-red-600'}`} />
          )}
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {status === 'loading' ? 'Đang xác thực' : isSuccess ? 'Xác thực thành công' : 'Xác thực thất bại'}
          </h2>
          <p className="text-sm font-semibold text-slate-500">{message}</p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
        >
          Về trang đăng nhập
        </Link>
      </div>
    </div>
  );
};
