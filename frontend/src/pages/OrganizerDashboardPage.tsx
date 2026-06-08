import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Eye,
  PlusCircle,
  Ticket,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react';
import { eventApi } from '../api/eventApi';
import { authApi } from '../api/authApi';
import { Booking, Event, MockDatabase, User } from '../api/mockDb';
import { Sidebar } from '../components/Sidebar';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import { StatCard } from '../components/analytics/StatCard';
import { ChartCard } from '../components/analytics/ChartCard';
import { RevenueLineChart } from '../components/analytics/RevenueLineChart';
import { BookingBarChart } from '../components/analytics/BookingBarChart';
import { EventStatusPieChart, PaymentStatusPieChart } from '../components/analytics/StatusPieChart';
import { RecentTable, StatusCell } from '../components/analytics/RecentTable';
import { TopEventsTable } from '../components/analytics/TopEventsTable';
import {
  buildTopEvents,
  calculateOrganizerStats,
  countByStatus,
  groupBookingsByDay,
  groupRevenueByDay,
} from '../utils/analyticsUtils';
import { getErrorMessage } from '../utils/getErrorMessage';
import { formatCurrency, formatDate } from '../utils/formatters';
import { buildDemoBookingsFromEvents, buildDemoPaymentsFromBookings, DemoPayment } from '../data/demoAnalytics';

export const OrganizerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<DemoPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoAnalytics, setIsDemoAnalytics] = useState<boolean>(false);
  const [user] = useState<User | null>(authApi.getCurrentUser());
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const fetchOrganizerEvents = () => {
    if (!user) return;
    setLoading(true);
    eventApi.getAll()
      .then((res) => {
        const allEvents = res.data;
        const organizerEvents = user.role === 'admin'
          ? allEvents
          : allEvents.filter((event: Event) => event.organizerId === user.id);
        const eventIds = new Set(organizerEvents.map((event) => event.id));
        const mockBookings = MockDatabase.getBookings().filter((booking) => eventIds.has(booking.eventId));
        const analyticsBookings = mockBookings.length ? mockBookings : buildDemoBookingsFromEvents(organizerEvents);
        const analyticsPayments = buildDemoPaymentsFromBookings(analyticsBookings);

        setEvents(organizerEvents);
        setBookings(analyticsBookings);
        setPayments(analyticsPayments);
        setIsDemoAnalytics(mockBookings.length === 0);
      })
      .catch((err) => {
        const message = getErrorMessage(err);
        toast.error('Không tải được dashboard', message);
        const fallbackEvents = MockDatabase.getEvents().filter((event) => user.role === 'admin' || event.organizerId === user.id);
        const fallbackBookings = buildDemoBookingsFromEvents(fallbackEvents);
        setEvents(fallbackEvents);
        setBookings(fallbackBookings);
        setPayments(buildDemoPaymentsFromBookings(fallbackBookings));
        setIsDemoAnalytics(true);
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

  const stats = useMemo(() => calculateOrganizerStats(events, bookings, payments), [events, bookings, payments]);
  const revenueByDay = useMemo(() => groupRevenueByDay(payments), [payments]);
  const bookingsByDay = useMemo(() => groupBookingsByDay(bookings), [bookings]);
  const eventsByStatus = useMemo(() => countByStatus(events, 'status'), [events]);
  const paymentsByStatus = useMemo(() => countByStatus(payments, 'status'), [payments]);
  const topEvents = useMemo(() => buildTopEvents(events), [events]);
  const recentEvents = useMemo(() => [...events].slice(0, 6), [events]);
  const recentBookings = useMemo(() => [...bookings].slice(0, 6), [bookings]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="max-w-7xl flex-1 space-y-8 overflow-y-auto p-5 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
              <BarChart3 className="h-7 w-7 text-indigo-600" />
              Organizer Dashboard
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Track your events, bookings and revenue
            </p>
            {isDemoAnalytics && (
              <p className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                Some analytics are generated from demo data.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/events">
              <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />} className="w-full font-bold sm:w-auto">
                View Events
              </Button>
            </Link>
            <Link to="/organizer/events/create">
              <Button variant="primary" size="sm" leftIcon={<PlusCircle className="h-4 w-4" />} className="w-full font-bold sm:w-auto">
                Create Event
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} />
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <EmptyState
              title="No events yet"
              description="Create your first event to start tracking ticket availability, bookings and revenue."
              actionLabel="Create Event"
              onAction={() => navigate('/organizer/events/create')}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Events" value={stats.totalEvents} icon={<Calendar className="h-5 w-5" />} />
              <StatCard title="Published Events" value={stats.publishedEvents} icon={<BarChart3 className="h-5 w-5" />} tone="emerald" />
              <StatCard title="Cancelled Events" value={stats.cancelledEvents} icon={<Trash2 className="h-5 w-5" />} tone="rose" />
              <StatCard title="Available Tickets" value={stats.availableTickets.toLocaleString('vi-VN')} icon={<Ticket className="h-5 w-5" />} tone="amber" />
              <StatCard title="Total Bookings" value={stats.totalBookings.toLocaleString('vi-VN')} icon={<Users className="h-5 w-5" />} />
              <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign className="h-5 w-5" />} tone="amber" />
              <StatCard title="Paid Revenue" value={formatCurrency(stats.paidRevenue)} icon={<WalletCards className="h-5 w-5" />} tone="emerald" />
              <StatCard title="Draft Events" value={stats.draftEvents} icon={<Calendar className="h-5 w-5" />} tone="slate" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ChartCard title="Revenue by Day" subtitle="Paid revenue timeline" isEmpty={revenueByDay.length === 0}>
                <RevenueLineChart data={revenueByDay} />
              </ChartCard>
              <ChartCard title="Bookings by Day" subtitle="Ticket quantity booked by date" isEmpty={bookingsByDay.length === 0}>
                <BookingBarChart data={bookingsByDay} />
              </ChartCard>
              <ChartCard title="Events by Status" subtitle="Organizer event status mix" isEmpty={eventsByStatus.length === 0}>
                <EventStatusPieChart data={eventsByStatus} />
              </ChartCard>
              <ChartCard title="Payment Status" subtitle="Demo payment distribution" isEmpty={paymentsByStatus.length === 0}>
                <PaymentStatusPieChart data={paymentsByStatus} />
              </ChartCard>
            </div>

            <TopEventsTable events={topEvents} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <RecentTable
                title="Recent Events"
                items={recentEvents}
                columns={[
                  { key: 'event', label: 'Event', render: (event) => <Link to={`/events/${event.id}`} className="font-extrabold text-slate-900 hover:text-indigo-600">{event.title}</Link> },
                  { key: 'date', label: 'Date', render: (event) => formatDate(event.date) },
                  { key: 'sold', label: 'Sold', render: (event) => `${event.booked}/${event.capacity}` },
                  { key: 'status', label: 'Status', render: (event) => <StatusCell status={event.status} /> },
                  {
                    key: 'actions',
                    label: 'Actions',
                    render: (event) => (
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(event.id)}
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                        aria-label={`Delete ${event.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ),
                  },
                ]}
              />
              <RecentTable
                title="Recent Bookings"
                items={recentBookings}
                columns={[
                  { key: 'booking', label: 'Booking', render: (booking) => <span className="font-mono font-black text-indigo-700">#{booking.id.slice(-8)}</span> },
                  { key: 'event', label: 'Event', render: (booking) => <span className="font-extrabold text-slate-900">{booking.eventTitle}</span> },
                  { key: 'qty', label: 'Qty', render: (booking) => booking.quantity },
                  { key: 'amount', label: 'Amount', render: (booking) => formatCurrency(booking.totalPrice) },
                  { key: 'status', label: 'Status', render: (booking) => <StatusCell status={booking.status} /> },
                ]}
              />
            </div>
          </>
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
