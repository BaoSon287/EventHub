import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Home, LayoutDashboard, LogOut, Menu, PlusCircle, Shield, ShoppingBag, Ticket, User as UserIcon, X } from 'lucide-react';
import { authApi } from '../api/authApi';
import { notificationApi } from '../api/notificationApi';
import { Notification, User } from '../types/domain';
import { useToast } from './ui/ToastProvider';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(authApi.getCurrentUser());
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      notificationApi.getAll()
        .then((res) => {
          const unread = res.data.filter((item: Notification) => !item.read).length;
          setUnreadCount(unread);
        })
        .catch(() => setUnreadCount(0));
    } else {
      setUnreadCount(0);
    }

    const handleStorageChange = () => {
      setUser(authApi.getCurrentUser());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location]);

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setShowDropdown(false);
    setShowMobileMenu(false);
    toast.success('Đã đăng xuất');
    navigate('/');
  };

  const closeMobileMenu = () => setShowMobileMenu(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/90 shadow-xs backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="group flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-extrabold text-white shadow-sm transition-transform group-hover:scale-105">
                EH
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-indigo-600 bg-clip-text text-xl font-black text-transparent">
                Event<span className="text-indigo-600">Hub</span>
              </span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              <Link
                to="/"
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  location.pathname === '/' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Trang chủ
              </Link>
              <Link
                to="/events"
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  location.pathname === '/events' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Khám phá sự kiện
              </Link>
              <Link
                to="/marketplace"
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  location.pathname.startsWith('/marketplace') ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Marketplace
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="hidden items-center gap-3 md:flex">
                <Link to="/my-tickets" title="My Tickets" className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600">
                  <Ticket className="h-5 w-5" />
                </Link>
                <Link to="/marketplace" title="Marketplace" className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600">
                  <ShoppingBag className="h-5 w-5" />
                </Link>
                <Link to="/notifications" title="Thông báo" className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 block h-4 w-4 rounded-full bg-rose-500 text-center text-[10px] font-extrabold leading-4 text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown((value) => !value)}
                    className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-50 focus:outline-none"
                  >
                    <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full border border-slate-200 object-cover" />
                    <span className="hidden text-xs font-bold text-slate-700 md:block">{user.name}</span>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-100 bg-white py-2 shadow-lg">
                      <div className="border-b border-slate-50 px-4 py-2">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">ID: {user.username}</p>
                        <p className="truncate text-xs font-semibold text-slate-400">{user.email}</p>
                        <span className="mt-1 inline-block rounded-sm bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-700">
                          {user.role === 'admin' ? 'Admin' : user.role === 'organizer' ? 'Nhà tổ chức' : 'Người dùng'}
                        </span>
                      </div>

                      <Link to="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        Trang cá nhân
                      </Link>

                      {(user.role === 'organizer' || user.role === 'admin') && (
                        <Link to="/organizer/dashboard" onClick={() => setShowDropdown(false)} className="flex items-center gap-2 border-t border-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                          <LayoutDashboard className="h-4 w-4 text-slate-400" />
                          Dashboard quản lý
                        </Link>
                      )}

                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setShowDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                          <Shield className="h-4 w-4 text-slate-400" />
                          Quản trị hệ thống
                        </Link>
                      )}

                      <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 border-t border-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50">
                        <LogOut className="h-4 w-4 text-red-400" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/login" className="px-4 py-2 text-xs font-bold text-slate-700 transition hover:text-indigo-600">
                  Đăng nhập
                </Link>
                <Link to="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700">
                  Đăng ký
                </Link>
              </div>
            )}

            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setShowMobileMenu((value) => !value)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:hidden"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="border-t border-slate-100 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              <Link to="/" onClick={closeMobileMenu} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${location.pathname === '/' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Home className="h-4 w-4" /> Home
              </Link>
              <Link to="/events" onClick={closeMobileMenu} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${location.pathname === '/events' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Ticket className="h-4 w-4" /> Events
              </Link>
              <Link to="/marketplace" onClick={closeMobileMenu} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${location.pathname.startsWith('/marketplace') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <ShoppingBag className="h-4 w-4" /> Marketplace
              </Link>

              {user ? (
                <>
                  <Link to="/my-tickets" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                    <Ticket className="h-4 w-4" /> My Tickets
                  </Link>
                  <Link to="/notifications" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                    <Bell className="h-4 w-4" /> Notifications
                    {unreadCount > 0 && <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">{unreadCount}</span>}
                  </Link>
                  <Link to="/profile" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                    <UserIcon className="h-4 w-4" /> Profile
                  </Link>
                  {(user.role === 'organizer' || user.role === 'admin') && (
                    <>
                      <Link to="/organizer/dashboard" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                        <LayoutDashboard className="h-4 w-4" /> Organizer Dashboard
                      </Link>
                      <Link to="/organizer/events/create" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                        <PlusCircle className="h-4 w-4" /> Create Event
                      </Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                      <Shield className="h-4 w-4" /> Admin Dashboard
                    </Link>
                  )}
                  <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link to="/login" onClick={closeMobileMenu} className="rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-bold text-slate-700">
                    Login
                  </Link>
                  <Link to="/register" onClick={closeMobileMenu} className="rounded-xl bg-indigo-600 px-3 py-2 text-center text-sm font-bold text-white">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
