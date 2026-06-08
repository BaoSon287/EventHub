import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  CreditCard,
  DollarSign,
  ShieldCheck,
  TicketCheck,
  UserCog,
  Users,
  XCircle,
} from 'lucide-react';
import { authApi } from '../api/authApi';
import { MockDatabase } from '../api/mockDb';
import type { Booking, Event, Notification, User } from '../api/mockDb';
import { Sidebar } from '../components/Sidebar';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import { StatCard } from '../components/analytics/StatCard';
import { ChartCard } from '../components/analytics/ChartCard';
import { RevenueLineChart } from '../components/analytics/RevenueLineChart';
import { BookingBarChart } from '../components/analytics/BookingBarChart';
import { EventStatusPieChart, PaymentStatusPieChart } from '../components/analytics/StatusPieChart';
import { RecentTable, StatusCell } from '../components/analytics/RecentTable';
import {
  calculateAdminStats,
  countByStatus,
  groupBookingsByDay,
  groupRevenueByDay,
} from '../utils/analyticsUtils';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  buildDemoBookingsFromEvents,
  buildDemoPaymentsFromBookings,
  demoNotifications,
  DemoPayment,
} from '../data/demoAnalytics';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(() => authApi.getCurrentUser());
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<DemoPayment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteTargetUsername, setDeleteTargetUsername] = useState<string | null>(null);

  const fetchDashboardData = () => {
    setLoading(true);
    const list = MockDatabase.getUsers();
    const eventList = MockDatabase.getEvents();
    const bookingList = MockDatabase.getBookings();
    const analyticsBookings = bookingList.length ? bookingList : buildDemoBookingsFromEvents(eventList);

    setUsers(list);
    setEvents(eventList);
    setBookings(analyticsBookings);
    setPayments(buildDemoPaymentsFromBookings(analyticsBookings));
    setNotifications(MockDatabase.getNotifications().length ? MockDatabase.getNotifications() : demoNotifications);
    setLoading(false);
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login?message=Admin dashboard requires administrator access.');
      return;
    }
    fetchDashboardData();
  }, [currentUser, navigate]);

  const handleRoleShift = (username: string, newRole: User['role']) => {
    const list = MockDatabase.getUsers();
    const idx = list.findIndex(u => u.username === username);
    if (idx !== -1) {
      list[idx].role = newRole;
      localStorage.setItem('eventhub_users', JSON.stringify(list));
      toast.success('Đã cập nhật phân quyền');
      fetchDashboardData();

      if (currentUser?.username === username) {
        const updatedUser = { ...currentUser, role: newRole };
        localStorage.setItem('eventhub_current_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        window.dispatchEvent(new Event('storage'));
      }
    }
  };

  const handleUserDelete = (username: string) => {
    if (username === 'admin') {
      toast.error('Không thể xóa admin gốc');
      return;
    }

    const list = MockDatabase.getUsers();
    const filtered = list.filter(u => u.username !== username);
    localStorage.setItem('eventhub_users', JSON.stringify(filtered));
    toast.success('Đã xóa tài khoản', `Tài khoản ${username} đã được gỡ khỏi danh sách mô phỏng.`);
    setDeleteTargetUsername(null);
    fetchDashboardData();
  };

  const stats = useMemo(() => calculateAdminStats(users, events, bookings, payments, notifications), [users, events, bookings, payments, notifications]);
  const revenueByDay = useMemo(() => groupRevenueByDay(payments), [payments]);
  const bookingsByDay = useMemo(() => groupBookingsByDay(bookings), [bookings]);
  const eventsByStatus = useMemo(() => countByStatus(events, 'status'), [events]);
  const paymentsByStatus = useMemo(() => countByStatus(payments, 'status'), [payments]);
  const usersByRole = useMemo(() => countByStatus(users, 'role'), [users]);
  const recentEvents = useMemo(() => [...events].slice(0, 6), [events]);
  const recentBookings = useMemo(() => [...bookings].slice(0, 6), [bookings]);
  const recentPayments = useMemo(() => [...payments].slice(0, 6), [payments]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="max-w-7xl flex-1 space-y-8 overflow-y-auto p-5 sm:p-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            <ShieldCheck className="h-7 w-7 text-indigo-600" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Monitor platform activity and system performance
          </p>
          <p className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            Admin analytics APIs are planned. Some values are demo data.
          </p>
        </div>

        {loading ? (
          <TableSkeleton rows={8} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="h-5 w-5" />} />
              <StatCard title="Total Events" value={stats.totalEvents} icon={<CalendarDays className="h-5 w-5" />} tone="emerald" />
              <StatCard title="Total Bookings" value={stats.totalBookings.toLocaleString('vi-VN')} icon={<TicketCheck className="h-5 w-5" />} tone="amber" />
              <StatCard title="Total Payments" value={stats.totalPayments} icon={<CreditCard className="h-5 w-5" />} />
              <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign className="h-5 w-5" />} tone="emerald" />
              <StatCard title="Paid Payments" value={stats.paidPayments} icon={<CreditCard className="h-5 w-5" />} tone="emerald" />
              <StatCard title="Failed Payments" value={stats.failedPayments} icon={<XCircle className="h-5 w-5" />} tone="rose" />
              <StatCard title="Notifications" value={stats.totalNotifications} icon={<Bell className="h-5 w-5" />} tone="slate" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ChartCard title="Revenue by Day" subtitle="Platform paid revenue" isEmpty={revenueByDay.length === 0}>
                <RevenueLineChart data={revenueByDay} />
              </ChartCard>
              <ChartCard title="Bookings by Day" subtitle="Ticket quantity across bookings" isEmpty={bookingsByDay.length === 0}>
                <BookingBarChart data={bookingsByDay} />
              </ChartCard>
              <ChartCard title="Events by Status" subtitle="Event lifecycle distribution" isEmpty={eventsByStatus.length === 0}>
                <EventStatusPieChart data={eventsByStatus} />
              </ChartCard>
              <ChartCard title="Payments by Status" subtitle="Payment state distribution" isEmpty={paymentsByStatus.length === 0}>
                <PaymentStatusPieChart data={paymentsByStatus} />
              </ChartCard>
              <ChartCard title="Users by Role" subtitle="Platform account role mix" isEmpty={usersByRole.length === 0}>
                <EventStatusPieChart data={usersByRole} />
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <RecentTable
                title="Recent Events"
                items={recentEvents}
                columns={[
                  { key: 'event', label: 'Event', render: (event) => <span className="font-extrabold text-slate-900">{event.title}</span> },
                  { key: 'date', label: 'Date', render: (event) => formatDate(event.date) },
                  { key: 'organizer', label: 'Organizer', render: (event) => event.organizerName },
                  { key: 'status', label: 'Status', render: (event) => <StatusCell status={event.status} /> },
                ]}
              />
              <RecentTable
                title="Recent Bookings"
                items={recentBookings}
                columns={[
                  { key: 'booking', label: 'Booking', render: (booking) => <span className="font-mono font-black text-indigo-700">#{booking.id.slice(-8)}</span> },
                  { key: 'event', label: 'Event', render: (booking) => <span className="font-extrabold text-slate-900">{booking.eventTitle}</span> },
                  { key: 'amount', label: 'Amount', render: (booking) => formatCurrency(booking.totalPrice) },
                  { key: 'status', label: 'Status', render: (booking) => <StatusCell status={booking.status} /> },
                ]}
              />
              <RecentTable
                title="Recent Payments"
                items={recentPayments}
                columns={[
                  { key: 'payment', label: 'Payment', render: (payment) => <span className="font-mono font-black text-indigo-700">#{payment.id.slice(-8)}</span> },
                  { key: 'event', label: 'Event', render: (payment) => <span className="font-extrabold text-slate-900">{payment.eventTitle}</span> },
                  { key: 'amount', label: 'Amount', render: (payment) => formatCurrency(payment.amount) },
                  { key: 'status', label: 'Status', render: (payment) => <StatusCell status={payment.status} /> },
                ]}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/70 p-5">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">User Management</h3>
                <p className="mt-1 text-xs font-semibold text-slate-400">Local mock admin controls for demo accounts</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                      <th className="px-6 py-3">Member</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3 text-right">Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold">
                    {users.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="flex items-center gap-3 px-6 py-3.5">
                          <img src={item.avatar} alt={item.name} className="h-9 w-9 rounded-full border border-slate-200 object-cover" />
                          <div>
                            <p className="font-extrabold text-slate-800">{item.name}</p>
                            <p className="font-mono text-[10px] uppercase text-indigo-600">@{item.username}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-500">{item.email}</td>
                        <td className="px-6 py-3.5"><StatusBadge status={item.role} /></td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {item.role === 'attendee' ? (
                              <Button variant="secondary" size="sm" onClick={() => handleRoleShift(item.username, 'organizer')} className="px-2 py-1! text-[10px] font-bold">
                                Organizer
                              </Button>
                            ) : item.role === 'organizer' ? (
                              <Button variant="secondary" size="sm" onClick={() => handleRoleShift(item.username, 'attendee')} className="px-2 py-1! text-[10px] font-bold">
                                Attendee
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={item.username === 'admin'}
                              onClick={() => setDeleteTargetUsername(item.username)}
                              className="px-2 py-1! text-[10px] font-bold text-red-500 hover:bg-red-50/50 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <ConfirmDialog
        open={Boolean(deleteTargetUsername)}
        title="Delete account?"
        description={`Remove ${deleteTargetUsername || 'this account'} from the local admin list?`}
        confirmText="Delete account"
        cancelText="Keep account"
        variant="danger"
        onCancel={() => setDeleteTargetUsername(null)}
        onConfirm={() => deleteTargetUsername && handleUserDelete(deleteTargetUsername)}
      />
    </div>
  );
};
