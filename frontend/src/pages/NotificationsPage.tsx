import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckSquare, Sparkles, MessageSquareDot } from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import { authApi } from '../api/authApi';
import { Notification, User } from '../api/mockDb';
import { NotificationItem } from '../components/NotificationItem';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(authApi.getCurrentUser());

  const fetchNotifs = () => {
    notificationApi.getAll()
      .then((res) => {
        setNotifications(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      navigate('/login?message=Vui lòng đăng nhập để xem thông báo.');
      return;
    }
    fetchNotifs();
  }, [user, navigate]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Head header info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-600 shrink-0" />
              Thông báo ({unreadCount})
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">Xem thông tin cập nhật trạng thái đặt vé, và tin tức sự kiện.</p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<CheckSquare className="w-4 h-4 text-slate-400" />}
              className="text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Đọc tất cả thông báo
            </Button>
          )}
        </div>

        {/* Dynamic Items Content */}
        {loading ? (
          <Loading message="Đang nạp danh sách thư báo..." />
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-12 shadow-sm">
            <EmptyState
              title="Không có thông báo mới"
              description="Hộp thư thông báo của bạn hiện đang trống. Trạng thái giao dịch mua vé sự kiện sẽ cập nhật trực tiếp tại đây."
            />
          </div>
        ) : (
          <div className="space-y-3.5">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
