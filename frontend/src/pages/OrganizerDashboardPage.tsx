import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, DollarSign, PlusCircle, Trash2, Edit2, Play, Sparkles, LayoutDashboard } from 'lucide-react';
import { eventApi } from '../api/eventApi';
import { authApi } from '../api/authApi';
import { Event, User } from '../api/mockDb';
import { Sidebar } from '../components/Sidebar';
import { DashboardCard } from '../components/DashboardCard';
import { Loading } from '../components/Loading';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';
import { formatCurrency } from '../utils/formatters';

export const OrganizerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(authApi.getCurrentUser());
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const fetchOrganizerEvents = () => {
    if (!user) return;
    setLoading(true);
    eventApi.getAll()
      .then((res) => {
        // filter events registered by this organizer, or if admin show all
        const all = res.data;
        const filtered = user.role === 'admin' 
          ? all 
          : all.filter((e: Event) => e.organizerId === user.id);
        setEvents(filtered);
      })
      .catch((err) => {
        toast.error('Không tải được dashboard', getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
      navigate('/login?message=Khu vực dành riêng cho nhà tổ chức sự kiện.');
      return;
    }
    fetchOrganizerEvents();
  }, [user, navigate]);

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await eventApi.delete(id);
      toast.success('Đã xóa sự kiện');
      setDeleteTargetId(null);
      fetchOrganizerEvents();
    } catch (err) {
      toast.error('Không thể xóa sự kiện', getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Compute statistics
  const totalEvents = events.length;
  const totalBookings = events.reduce((acc, e) => acc + e.booked, 0);
  const totalRevenue = events.reduce((acc, e) => acc + (e.booked * e.price), 0);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      
      {/* Sidebar layouts */}
      <Sidebar />

      {/* Main Container core */}
      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto max-w-7xl">
        
        {/* Title sections */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-6.5 h-6.5 text-indigo-600 shrink-0" />
              Tổng quan Dashboard
            </h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">Trang quản trị hoạt động chi tiết dành cho Nhà tổ chức EventHub.</p>
          </div>

          <Link to="/organizer/events/create">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="text-xs font-bold shadow-md cursor-pointer"
            >
              Tạo sự kiện mới
            </Button>
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="space-y-8">
            
            {/* 3 Metrics Dashboard widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <DashboardCard
                title="Khởi tạo sự kiện"
                value={`${totalEvents} Sự kiện`}
                icon={<Calendar className="w-5 h-5" />}
                change="+12.5%"
                changeType="positive"
              />
              <DashboardCard
                title="Số vé giữ chỗ"
                value={`${totalBookings.toLocaleString('vi-VN')} Vé`}
                icon={<Users className="w-5 h-5" />}
                change="+8.3%"
                changeType="positive"
              />
              <DashboardCard
                title="Doanh thu giả định"
                value={`${totalRevenue.toLocaleString('vi-VN')} đ`}
                icon={<DollarSign className="w-5 h-5" />}
                change="+15.2%"
                changeType="positive"
              />
            </div>

            {/* List Table panel */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Danh sách sự kiện đang mở</h3>
                <span className="text-[10px] font-bold text-slate-400">Hiển thị {events.length} kết quả</span>
              </div>

              {events.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-semibold text-xs">
                  <EmptyState
                    title="Chưa có sự kiện"
                    description="Tạo sự kiện đầu tiên để bắt đầu quản lý vé, lượt đặt chỗ và trạng thái xuất bản."
                    actionLabel="Tạo sự kiện mới"
                    onAction={() => navigate('/organizer/events/create')}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-slate-600 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 bg-slate-50">
                        <th className="py-3 px-6">Sự kiện</th>
                        <th className="py-3 px-6 col-span-2">Tiến trình bán vé</th>
                        <th className="py-3 px-6">Giá vé chuẩn</th>
                        <th className="py-3 px-6 text-right">Tác vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs font-semibold">
                      {events.map((event) => {
                        const progress = event.capacity > 0 ? (event.booked / event.capacity) * 100 : 0;
                        return (
                          <tr key={event.id} className="hover:bg-slate-50">
                            {/* Product thumbnail title */}
                            <td className="py-4 px-6 flex items-center gap-3.5 max-w-sm">
                              <img src={event.image} className="w-16 h-10 object-cover rounded-lg shrink-0" />
                              <div className="min-w-0">
                                <Link to={`/events/${event.id}`} className="font-extrabold text-slate-800 hover:text-indigo-600 truncate block">
                                  {event.title}
                                </Link>
                                <p className="text-[10px] text-slate-400 font-semibold">{event.date} • {event.location.split(',')[0]}</p>
                              </div>
                            </td>

                            {/* Ticket sales progress gauge bar */}
                            <td className="py-4 px-6 max-w-xs">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-slate-500 font-bold">{event.booked} / {event.capacity} vé</span>
                                  <span className="font-black text-indigo-600">{progress.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-600 rounded-full"
                                    style={{ width: `${Math.min(100, progress)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>

                            {/* Base Price level */}
                            <td className="py-4 px-6 text-slate-800 font-extrabold">
                              {event.price === 0 ? 'Miễn phí' : formatCurrency(event.price)}
                            </td>

                            {/* Table Action utilities */}
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-2">
                                <Link
                                  to={`/events/${event.id}`}
                                  title="Xem sự kiện"
                                  className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition"
                                >
                                  <Play className="w-4 h-4 text-slate-400" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTargetId(event.id)}
                                  title="Xóa sự kiện"
                                  className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-slate-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete event?"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete event"
        cancelText="Keep event"
        variant="danger"
        isLoading={deleteLoading}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
      />

    </div>
  );
};
