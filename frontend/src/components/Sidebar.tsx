import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarPlus, CalendarDays, Key, Users, Home, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/authApi';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const user = authApi.getCurrentUser();

  const isOrganizer = user?.role === 'organizer';
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-[calc(100vh-4rem)] flex flex-col p-4 shadow-xl shrink-0">
      <div className="mb-6 px-2">
        <p className="text-xs font-black uppercase text-indigo-400 tracking-widest">Khu vực quản lý</p>
        <p className="text-sm font-semibold truncate text-slate-300 capitalize">{user?.name || 'Chưa xác định'}</p>
      </div>

      <nav className="flex-1 space-y-1">
        {/* Organizer Options */}
        {(isOrganizer || isAdmin) && (
          <>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 px-2 py-1.5 mt-2">
              Nhà tổ chức
            </div>
            
            <Link
              to="/organizer/dashboard"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-150 ${
                location.pathname === '/organizer/dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Tổng quan Dashboard
            </Link>

            <Link
              to="/organizer/events/create"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-150 ${
                location.pathname === '/organizer/events/create'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CalendarPlus className="w-4 h-4" />
              Tạo sự kiện mới
            </Link>
          </>
        )}

        {/* Admin System Options */}
        {isAdmin && (
          <>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 px-2 py-1.5 mt-4">
              Hệ thống admin
            </div>

            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-150 ${
                location.pathname === '/admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Quản lý tài khoản
            </Link>
          </>
        )}

        <div className="border-t border-slate-850 my-6"></div>

        {/* General Options */}
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-850 hover:text-white rounded-lg transition-all duration-150"
        >
          <Home className="w-4 h-4" />
          Về trang chủ
        </Link>
        <Link
          to="/events"
          className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-850 hover:text-white rounded-lg transition-all duration-150"
        >
          <CalendarDays className="w-4 h-4" />
          Xem tất cả sự kiện
        </Link>
      </nav>

      <div className="mt-auto p-2 bg-slate-850/50 rounded-xl border border-slate-800 flex items-center justify-between">
        <Link
          to="/profile"
          className="flex items-center gap-2 text-xs hover:text-indigo-400 transition"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=60&h=60'}
            className="w-7 h-7 rounded-full border border-slate-700 object-cover"
          />
          <div className="leading-tight">
            <p className="font-extrabold truncate w-24 text-[10px] text-slate-300">Trang cá nhân</p>
          </div>
        </Link>
      </div>
    </aside>
  );
};
