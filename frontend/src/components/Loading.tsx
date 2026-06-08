import React from 'react';

interface LoadingProps {
  fullPage?: boolean;
  message?: string;
  id?: string;
}

export const Loading: React.FC<LoadingProps> = ({ fullPage = false, message = 'Đang tải dữ liệu...', id }) => {
  const containerStyle = fullPage
    ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center'
    : 'w-full py-12 flex flex-col items-center justify-center';

  return (
    <div id={id} className={containerStyle}>
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
        <div className="absolute w-6 h-6 rounded-full bg-indigo-100 animate-ping"></div>
      </div>
      {message && (
        <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">{message}</p>
      )}
    </div>
  );
};
