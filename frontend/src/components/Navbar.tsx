import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, Ticket, Shield, LayoutDashboard, User as UserIcon, Activity, Sparkles, RefreshCw } from 'lucide-react';
import { authApi } from '../api/authApi';
import { notificationApi } from '../api/notificationApi';
import { getApiMode, setApiMode } from '../api/axiosClient';
import { User, Notification } from '../api/mockDb';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(authApi.getCurrentUser());
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [apiMode, setApiModeState] = useState<'real' | 'mock'>(getApiMode());
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  useEffect(() => {
    // Poll user info and notifications
    setUser(authApi.getCurrentUser());
    
    if (user) {
      notificationApi.getAll()
        .then((res) => {
          const unread = res.data.filter((n: Notification) => !n.read).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }

    // Capture standard login/out events or changes
    const handleStorageChange = () => {
      setUser(authApi.getCurrentUser());
      setApiModeState(getApiMode());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location, user?.id]);

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setShowDropdown(false);
    navigate('/');
  };

  const toggleApiMode = () => {
    const nextMode = apiMode === 'real' ? 'mock' : 'real';
    setApiMode(nextMode);
    setApiModeState(nextMode);
    // Reload state or toast
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo & Navigation Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform">
                EH
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-indigo-600 bg-clip-text text-transparent">
                Event<span className="text-indigo-600">Hub</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition ${
                  location.pathname === '/' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Trang chủ
              </Link>
              <Link
                to="/events"
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition ${
                  location.pathname === '/events' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Khám phá sự kiện
              </Link>
            </div>
          </div>

          {/* User actions and API status indicators */}
          <div className="flex items-center gap-4">
            
            {/* Mode Switcher pill */}
            <button
              onClick={toggleApiMode}
              title="Click để đổi chế độ kết nối dữ liệu"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition cursor-pointer select-none"
            >
              <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" style={{ animationDuration: '6s' }} />
              {apiMode === 'mock' ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Mô phỏng Offline
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Local Host (8080)
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {/* Bookings shortcut */}
                <Link
                  to="/my-bookings"
                  title="Vé của tôi"
                  className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition relative"
                >
                  <Ticket className="w-5 h-5" />
                </Link>

                {/* Notifications ring */}
                <Link
                  to="/notifications"
                  title="Thông báo"
                  className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 block w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white font-extrabold text-center leading-4">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* User menu dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 focus:outline-none p-1.5 hover:bg-slate-50 rounded-lg transition"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                    />
                    <span className="hidden md:block text-xs font-bold text-slate-700">{user.name}</span>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-50">
                        <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">ID: {user.username}</p>
                        <p className="text-xs text-slate-400 font-semibold truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] text-indigo-700 bg-indigo-50 font-bold uppercase rounded-sm px-1.5 py-0.5">
                          {user.role === 'admin' ? 'Admin' : user.role === 'organizer' ? 'Nhà tổ chức' : 'Người dùng'}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold transition"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Trang cá nhân
                      </Link>

                      {/* Organizer Dashboard */}
                      {(user.role === 'organizer' || user.role === 'admin') && (
                        <Link
                          to="/organizer/dashboard"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold transition border-t border-slate-50"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          Dashboard Quản lý
                        </Link>
                      )}

                      {/* Admin Access panel */}
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold transition"
                        >
                          <Shield className="w-4 h-4 text-slate-400" />
                          Quản trị Hệ thống
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold transition border-t border-slate-50 text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
