import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, ShoppingBag, User } from 'lucide-react';
import { ticketService } from '../api/ticketService';
import { ResaleTicketDetail } from '../types/domain';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { StatusBadge } from '../components/StatusBadge';
import { DetailSkeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/ToastProvider';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { getErrorMessage } from '../utils/getErrorMessage';

export const MarketplaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [listing, setListing] = useState<ResaleTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);

  const loadListing = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await ticketService.getListingDetail(id);
      setListing(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Listing not found or already sold.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const buyTicket = async () => {
    if (!id) return;
    setBuyLoading(true);
    try {
      await ticketService.buyTicket(id);
      toast.success('Ticket purchased', 'A fresh QR code is now available in your wallet.');
      navigate('/my-tickets');
    } catch (err) {
      toast.error('Could not buy ticket', getErrorMessage(err));
      setConfirmOpen(false);
      await loadListing();
    } finally {
      setBuyLoading(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error || !listing) {
    return <div className="mx-auto max-w-xl px-4 py-16"><ErrorState title="Could not load listing" message={error || 'Listing unavailable'} actionLabel="Back to marketplace" onAction={() => navigate('/marketplace')} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to marketplace
        </Link>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <img src={listing.eventImage} alt={listing.eventName} className="h-80 w-full object-cover" />
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={listing.status || 'ACTIVE'} />
                <StatusBadge status="standard" />
              </div>
              <h1 className="text-3xl font-black text-slate-900">{listing.eventName}</h1>
              <div className="grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-2">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> {formatDateTime(listing.eventDate)}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {listing.location || 'Location to be announced'}</div>
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" /> {listing.sellerName}</div>
                <div className="flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-slate-400" /> {listing.seat || 'General admission'}</div>
              </div>
            </div>
          </section>
          <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-400">Resale price</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{formatCurrency(listing.price)}</p>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-500">
              QR code and ticket code stay hidden until purchase. After buying, the ticket appears in your wallet with a newly generated QR.
            </p>
            <Button type="button" className="mt-6 w-full" onClick={() => setConfirmOpen(true)}>Buy Ticket</Button>
          </aside>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Buy this ticket?"
        description={`Confirm purchase for ${formatCurrency(listing.price)}.`}
        confirmText="Buy Ticket"
        cancelText="Not now"
        isLoading={buyLoading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={buyTicket}
      />
    </div>
  );
};
