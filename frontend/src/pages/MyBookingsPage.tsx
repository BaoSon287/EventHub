import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Copy, MapPin, Printer, RefreshCw, Ticket, Wallet } from 'lucide-react';
import { bookingApi } from '../api/bookingApi';
import { authApi } from '../api/authApi';
import { Booking, User } from '../types/domain';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import { getErrorMessage } from '../utils/getErrorMessage';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const canShowActiveQr = (booking: Booking) => (
  booking.bookingStatus === 'CONFIRMED' && booking.paymentStatus === 'PAID'
);

const qrBlockLabel = (booking: Booking) => {
  if (booking.bookingStatus === 'CANCELLED' || booking.status === 'cancelled') return 'Cancelled';
  if (booking.paymentStatus !== 'PAID') return 'Payment required';
  return null;
};

const eventPlace = (booking: Booking) => (
  [booking.eventLocation, booking.eventAddress, booking.eventCity].filter(Boolean).join(', ') || 'Location to be announced'
);

const escapeHtml = (value: string) => (
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
);

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useState<User | null>(authApi.getCurrentUser());
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingApi.getMyBookings();
      setBookings(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your tickets.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login?message=Please sign in to view your tickets.');
      return;
    }
    loadBookings();
  }, [loadBookings, navigate, user]);

  const copyTicketCode = async (ticketCode: string) => {
    try {
      await navigator.clipboard.writeText(ticketCode);
      toast.success('Ticket code copied');
    } catch {
      toast.error('Could not copy ticket code');
    }
  };

  const handleCancel = async (bookingId: string) => {
    setCancelLoading(true);
    try {
      const res = await bookingApi.cancel(bookingId);
      const updatedBooking = res.data;
      setBookings((current) => current.map((item) => item.id === bookingId ? updatedBooking : item));
      toast.success('Booking cancelled', 'The ticket is no longer valid for check-in.');
      setCancelTargetId(null);
    } catch (err) {
      toast.error('Could not cancel booking', getErrorMessage(err));
    } finally {
      setCancelLoading(false);
    }
  };

  const printTicket = (booking: Booking) => {
    const printWindow = window.open('', '_blank', 'width=720,height=900');
    if (!printWindow) {
      toast.error('Could not open print window');
      return;
    }

    const safeTitle = escapeHtml(booking.eventTitle);
    const safeTicketCode = escapeHtml(booking.ticketCode);
    const safeTime = escapeHtml(formatDateTime(booking.eventStartTime || booking.eventDate));
    const safePlace = escapeHtml(eventPlace(booking));
    const safeQuantity = escapeHtml(String(booking.quantity));
    const safeTotal = escapeHtml(formatCurrency(booking.totalPrice));
    const safeStatus = escapeHtml(`${booking.bookingStatus} / ${booking.paymentStatus}`);

    printWindow.document.write(`
      <html>
        <head>
          <title>EventHub Ticket ${safeTicketCode}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            .ticket { border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; max-width: 560px; margin: 0 auto; }
            .label { color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 700; }
            h1 { font-size: 24px; margin: 8px 0 16px; }
            .row { margin: 12px 0; }
            .code { font-family: monospace; font-size: 18px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="label">EventHub Ticket</div>
            <h1>${safeTitle}</h1>
            <div class="row"><span class="label">Ticket Code</span><br><span class="code">${safeTicketCode}</span></div>
            <div class="row"><span class="label">Time</span><br>${safeTime}</div>
            <div class="row"><span class="label">Place</span><br>${safePlace}</div>
            <div class="row"><span class="label">Quantity</span><br>${safeQuantity}</div>
            <div class="row"><span class="label">Total</span><br>${safeTotal}</div>
            <div class="row"><span class="label">Status</span><br>${safeStatus}</div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Ticket className="h-7 w-7 text-indigo-600" />
              <h1 className="text-3xl font-black tracking-tight text-slate-900">My Tickets</h1>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">View your booked event tickets and QR codes.</p>
          </div>
          <Link to="/events" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
            Browse Events
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <div className="rounded-lg border border-red-100 bg-white p-8 text-center shadow-sm">
            <p className="text-base font-bold text-slate-900">Could not load your tickets.</p>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <Button type="button" variant="outline" onClick={loadBookings} leftIcon={<RefreshCw className="h-4 w-4" />} className="mt-5">
              Retry
            </Button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-lg border border-slate-100 bg-white py-12 shadow-sm">
            <EmptyState
              title="You have no tickets yet."
              description="Find an upcoming event and book your first EventHub ticket."
              actionLabel="Browse Events"
              onAction={() => navigate('/events')}
            />
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => {
              const activeQr = canShowActiveQr(booking);
              const disabledQrLabel = qrBlockLabel(booking);

              return (
                <article key={booking.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="grid gap-0 lg:grid-cols-[220px_1fr_220px]">
                    <img
                      src={booking.eventImage}
                      alt={booking.eventTitle}
                      className="h-52 w-full object-cover lg:h-full"
                    />

                    <div className="space-y-4 p-5">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={booking.bookingStatus} />
                        <StatusBadge status={booking.paymentStatus} />
                      </div>

                      <div>
                        <Link to={`/events/${booking.eventId}`} className="text-xl font-black text-slate-900 transition hover:text-indigo-600">
                          {booking.eventTitle}
                        </Link>
                        <div className="mt-3 grid gap-2 text-sm font-medium text-slate-600 sm:grid-cols-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">{formatDateTime(booking.eventStartTime || booking.eventDate)}</span>
                          </div>
                          <div className="flex min-w-0 items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">{eventPlace(booking)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">Quantity</p>
                          <p className="mt-1 font-black text-slate-900">{booking.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">Total</p>
                          <p className="mt-1 font-black text-slate-900">{formatCurrency(booking.totalPrice)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">Ticket Code</p>
                          <p className="mt-1 break-all font-mono text-sm font-black text-indigo-700">{booking.ticketCode || 'Pending'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link to={`/events/${booking.eventId}`}>
                          <Button type="button" variant="outline" size="sm">View Event</Button>
                        </Link>
                        <Button type="button" variant="outline" size="sm" onClick={() => copyTicketCode(booking.ticketCode)} leftIcon={<Copy className="h-4 w-4" />} disabled={!booking.ticketCode}>
                          Copy Ticket Code
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => printTicket(booking)} leftIcon={<Printer className="h-4 w-4" />}>
                          Print Ticket
                        </Button>
                        {booking.status === 'pending_payment' && (
                          <Button type="button" variant="primary" size="sm" onClick={() => navigate(`/payments/${booking.id}`)} leftIcon={<Wallet className="h-4 w-4" />}>
                            Pay Now
                          </Button>
                        )}
                        {booking.status === 'pending_payment' && (
                          <Button type="button" variant="danger" size="sm" onClick={() => setCancelTargetId(booking.id)}>
                            Cancel Booking
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-center border-t border-slate-100 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                      <div className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className={activeQr ? '' : 'opacity-20 blur-[1px]'}>
                          {booking.qrCodeContent ? (
                            <QRCodeSVG value={booking.qrCodeContent} size={150} level="M" includeMargin />
                          ) : (
                            <div className="flex h-[150px] w-[150px] items-center justify-center rounded bg-slate-100 text-center text-xs font-bold text-slate-400">
                              QR unavailable
                            </div>
                          )}
                        </div>
                        {disabledQrLabel && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                              {disabledQrLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(cancelTargetId)}
        title="Cancel booking?"
        description="This keeps the ticket code for your records, but the QR code will no longer be valid."
        confirmText="Cancel booking"
        cancelText="Keep booking"
        variant="danger"
        isLoading={cancelLoading}
        onCancel={() => setCancelTargetId(null)}
        onConfirm={() => cancelTargetId && handleCancel(cancelTargetId)}
      />
    </div>
  );
};
