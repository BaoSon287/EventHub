import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Eye, MapPin, RefreshCw, ShoppingBag, Ticket, XCircle } from 'lucide-react';
import { ticketService } from '../api/ticketService';
import { authApi } from '../api/authApi';
import { TicketAsset, User } from '../types/domain';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { StatusBadge } from '../components/StatusBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { QRCodeViewer } from '../components/tickets/QRCodeViewer';
import { useToast } from '../components/ui/ToastProvider';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { getErrorMessage } from '../utils/getErrorMessage';

const ticketPlace = (ticket: TicketAsset) => ticket.eventLocation || 'Location to be announced';

export const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user] = useState<User | null>(authApi.getCurrentUser());
  const [tickets, setTickets] = useState<TicketAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrTicket, setQrTicket] = useState<TicketAsset | null>(null);
  const [sellTicket, setSellTicket] = useState<TicketAsset | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [sellLoading, setSellLoading] = useState(false);
  const [cancelTicket, setCancelTicket] = useState<TicketAsset | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketService.getMyTickets();
      setTickets(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your ticket wallet.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login?message=Please sign in to view your tickets.');
      return;
    }
    loadTickets();
  }, [loadTickets, navigate, user]);

  const openSell = (ticket: TicketAsset) => {
    setSellTicket(ticket);
    setSellPrice(String(ticket.purchasePrice || ''));
  };

  const confirmSell = async () => {
    if (!sellTicket) return;
    const price = Number(sellPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Invalid price', 'Resale price must be greater than 0.');
      return;
    }
    setSellLoading(true);
    try {
      const response = await ticketService.createResellListing(sellTicket.ticketId, price);
      setTickets((current) => current.map((ticket) => ticket.id === sellTicket.id
        ? { ...ticket, status: 'LISTED_FOR_SALE', activeListingId: response.data.listingId }
        : ticket
      ));
      toast.success('Ticket listed', 'Your ticket is now available on the marketplace.');
      setSellTicket(null);
    } catch (err) {
      toast.error('Could not list ticket', getErrorMessage(err));
    } finally {
      setSellLoading(false);
    }
  };

  const confirmCancelListing = async () => {
    if (!cancelTicket?.activeListingId) {
      toast.error('Missing listing', 'This ticket does not have an active listing id.');
      setCancelTicket(null);
      return;
    }
    setCancelLoading(true);
    try {
      await ticketService.cancelListing(cancelTicket.activeListingId);
      setTickets((current) => current.map((ticket) => ticket.id === cancelTicket.id
        ? { ...ticket, status: 'OWNED', activeListingId: undefined }
        : ticket
      ));
      toast.success('Listing cancelled', 'Your ticket is back in your wallet.');
      setCancelTicket(null);
    } catch (err) {
      toast.error('Could not cancel listing', getErrorMessage(err));
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Ticket className="h-7 w-7 text-indigo-600" />
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Ticket Wallet</h1>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">Manage owned tickets, QR codes, and resale listings.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/marketplace">
              <Button type="button" variant="outline" leftIcon={<ShoppingBag className="h-4 w-4" />}>Marketplace</Button>
            </Link>
            <Button type="button" variant="outline" onClick={loadTickets} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <div className="rounded-lg border border-slate-100 bg-white">
            <ErrorState title="Could not load wallet" message={error} actionLabel="Retry" onAction={loadTickets} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-lg border border-slate-100 bg-white">
            <EmptyState
              title="No tickets in your wallet"
              description="Paid tickets become digital assets here after purchase."
              actionLabel="Browse Events"
              onAction={() => navigate('/events')}
            />
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <img src={ticket.eventImage} alt={ticket.eventName} className="h-44 w-full object-cover" />
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <StatusBadge status={ticket.ticketType} />
                  </div>
                  <div>
                    <Link to={`/tickets/${ticket.ticketId}`} className="line-clamp-2 text-lg font-black text-slate-900 transition hover:text-indigo-600">
                      {ticket.eventName}
                    </Link>
                    <div className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
                      <div className="flex min-w-0 items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{formatDateTime(ticket.eventDate)}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{ticketPlace(ticket)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-bold uppercase text-slate-400">Purchase price</span>
                    <span className="text-sm font-black text-slate-900">{formatCurrency(ticket.purchasePrice)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setQrTicket(ticket)} leftIcon={<Eye className="h-4 w-4" />}>
                      View QR
                    </Button>
                    {ticket.status === 'OWNED' && (
                      <Button type="button" size="sm" onClick={() => openSell(ticket)} leftIcon={<ShoppingBag className="h-4 w-4" />}>
                        Sell Ticket
                      </Button>
                    )}
                    {ticket.status === 'LISTED_FOR_SALE' && (
                      <Button type="button" variant="danger" size="sm" onClick={() => setCancelTicket(ticket)} leftIcon={<XCircle className="h-4 w-4" />}>
                        Cancel Listing
                      </Button>
                    )}
                    {ticket.status === 'USED' && (
                      <Button type="button" variant="secondary" size="sm" disabled>
                        Used
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {qrTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Ticket QR</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">{qrTicket.eventName}</p>
              </div>
              <button type="button" onClick={() => setQrTicket(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">x</button>
            </div>
            <QRCodeViewer qrCode={qrTicket.qrCode} />
          </div>
        </div>
      )}

      {sellTicket && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
            <h2 className="text-base font-black text-slate-900">Sell Ticket</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{sellTicket.eventName}</p>
            <label className="mt-5 block text-xs font-bold uppercase text-slate-500">Resale price</label>
            <input
              type="number"
              min="1"
              value={sellPrice}
              onChange={(event) => setSellPrice(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={sellLoading} onClick={() => setSellTicket(null)}>Cancel</Button>
              <Button type="button" isLoading={sellLoading} onClick={confirmSell}>Confirm Sell</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTicket)}
        title="Cancel listing?"
        description="Your ticket will be removed from the marketplace and returned to owned status."
        confirmText="Cancel listing"
        cancelText="Keep listing"
        variant="danger"
        isLoading={cancelLoading}
        onCancel={() => setCancelTicket(null)}
        onConfirm={confirmCancelListing}
      />
    </div>
  );
};
