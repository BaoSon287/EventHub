import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, ShoppingBag } from 'lucide-react';
import { ticketService } from '../api/ticketService';
import { TicketAsset, TicketTransferHistory } from '../types/domain';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { StatusBadge } from '../components/StatusBadge';
import { DetailSkeleton } from '../components/ui/Skeleton';
import { QRCodeViewer } from '../components/tickets/QRCodeViewer';
import { TicketHistory } from '../components/tickets/TicketHistory';
import { useToast } from '../components/ui/ToastProvider';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { getErrorMessage } from '../utils/getErrorMessage';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [ticket, setTicket] = useState<TicketAsset | null>(null);
  const [history, setHistory] = useState<TicketTransferHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [sellPrice, setSellPrice] = useState('');
  const [sellLoading, setSellLoading] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [ticketResponse, historyResponse] = await Promise.all([
        ticketService.getTicketDetail(id),
        ticketService.getHistory(id).catch(() => ({ data: [] as TicketTransferHistory[] })),
      ]);
      setTicket(ticketResponse.data);
      setHistory(historyResponse.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Ticket not found or you do not have access.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const sellTicket = async () => {
    if (!ticket) return;
    const price = Number(sellPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Invalid price');
      return;
    }
    setSellLoading(true);
    try {
      const response = await ticketService.createResellListing(ticket.ticketId, price);
      setTicket({ ...ticket, status: 'LISTED_FOR_SALE', activeListingId: response.data.listingId });
      setSellOpen(false);
      toast.success('Ticket listed');
      await loadTicket();
    } catch (err) {
      toast.error('Could not list ticket', getErrorMessage(err));
    } finally {
      setSellLoading(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <ErrorState title="Could not load ticket" message={error || 'Ticket unavailable'} actionLabel="Back to wallet" onAction={() => navigate('/my-tickets')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link to="/my-tickets" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to wallet
        </Link>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <img src={ticket.eventImage} alt={ticket.eventName} className="h-72 w-full object-cover" />
            <div className="space-y-6 p-6">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={ticket.status} />
                <StatusBadge status={ticket.ticketType} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900">{ticket.eventName}</h1>
                <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-2">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> {formatDateTime(ticket.eventDate)}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {ticket.eventLocation || 'Location to be announced'}</div>
                </div>
              </div>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                <div><p className="text-xs font-bold uppercase text-slate-400">Ticket ID</p><p className="mt-1 font-mono text-sm font-black text-slate-900">{ticket.ticketId}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Purchase price</p><p className="mt-1 font-black text-slate-900">{formatCurrency(ticket.purchasePrice)}</p></div>
                <div><p className="text-xs font-bold uppercase text-slate-400">Status</p><p className="mt-1 font-black text-slate-900">{ticket.status}</p></div>
              </div>
              {ticket.status === 'OWNED' && (
                <Button type="button" onClick={() => { setSellPrice(String(ticket.purchasePrice || '')); setSellOpen(true); }} leftIcon={<ShoppingBag className="h-4 w-4" />}>
                  Sell Ticket
                </Button>
              )}
            </div>
          </section>
          <aside className="space-y-6">
            <QRCodeViewer qrCode={ticket.qrCode} />
            <div>
              <h2 className="mb-3 text-base font-black text-slate-900">Transfer history</h2>
              <TicketHistory history={history} />
            </div>
          </aside>
        </div>
      </div>

      {sellOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
            <h2 className="text-base font-black text-slate-900">Sell Ticket</h2>
            <label className="mt-5 block text-xs font-bold uppercase text-slate-500">Resale price</label>
            <input value={sellPrice} onChange={(event) => setSellPrice(event.target.value)} type="number" min="1" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500" />
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={sellLoading} onClick={() => setSellOpen(false)}>Cancel</Button>
              <Button type="button" isLoading={sellLoading} onClick={sellTicket}>Confirm Sell</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
