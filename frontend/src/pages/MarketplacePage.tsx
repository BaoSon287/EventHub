import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, RefreshCw, Search, ShoppingBag, User } from 'lucide-react';
import { ticketService } from '../api/ticketService';
import { ResaleTicket } from '../types/domain';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { EventCardSkeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/ToastProvider';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { getErrorMessage } from '../utils/getErrorMessage';

const fallbackImage = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000';

export const MarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<ResaleTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyTarget, setBuyTarget] = useState<ResaleTicket | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);

  const search = searchParams.get('search') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const date = searchParams.get('date') || '';

  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ticketService.getMarketplace({
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        date: date || undefined,
      });
      setTickets(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load resale marketplace.'));
    } finally {
      setLoading(false);
    }
  }, [date, maxPrice, minPrice]);

  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  const filteredTickets = useMemo(() => (
    tickets.filter((ticket) => ticket.eventName.toLowerCase().includes(search.toLowerCase()))
  ), [search, tickets]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const buyTicket = async () => {
    if (!buyTarget) return;
    setBuyLoading(true);
    try {
      await ticketService.buyTicket(buyTarget.listingId);
      toast.success('Ticket purchased', 'The ticket is now in your wallet with a new QR code.');
      setBuyTarget(null);
      navigate('/my-tickets');
    } catch (err) {
      toast.error('Could not buy ticket', getErrorMessage(err));
      await loadMarketplace();
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-indigo-600" />
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Resale Marketplace</h1>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">Browse verified tickets listed by other EventHub users.</p>
          </div>
          <Button type="button" variant="outline" onClick={loadMarketplace} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
        </div>

        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_150px_150px_170px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search event" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <input value={minPrice} onChange={(event) => updateFilter('minPrice', event.target.value)} type="number" min="0" placeholder="Min price" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500" />
            <input value={maxPrice} onChange={(event) => updateFilter('maxPrice', event.target.value)} type="number" min="0" placeholder="Max price" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500" />
            <input value={date} onChange={(event) => updateFilter('date', event.target.value)} type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <EventCardSkeleton key={index} />)}</div>
        ) : error ? (
          <div className="rounded-lg border border-slate-100 bg-white"><ErrorState title="Could not load marketplace" message={error} actionLabel="Retry" onAction={loadMarketplace} /></div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-lg border border-slate-100 bg-white">
            <EmptyState title="No resale tickets found" description="Try adjusting the filters or check back later." actionLabel="Clear filters" onAction={() => setSearchParams({})} />
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTickets.map((ticket) => (
              <article key={ticket.listingId} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <img src={fallbackImage} alt={ticket.eventName} className="h-44 w-full object-cover" />
                <div className="space-y-4 p-5">
                  <Link to={`/marketplace/${ticket.listingId}`} className="line-clamp-2 text-lg font-black text-slate-900 transition hover:text-indigo-600">
                    {ticket.eventName}
                  </Link>
                  <div className="space-y-2 text-sm font-semibold text-slate-600">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> {formatDateTime(ticket.eventDate)}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {ticket.location || 'Location to be announced'}</div>
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-slate-400" /> {ticket.sellerName}</div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xl font-black text-slate-900">{formatCurrency(ticket.price)}</span>
                    <div className="flex gap-2">
                      <Link to={`/marketplace/${ticket.listingId}`}><Button type="button" variant="outline" size="sm">Details</Button></Link>
                      <Button type="button" size="sm" onClick={() => setBuyTarget(ticket)}>Buy</Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(buyTarget)}
        title="Buy this ticket?"
        description={`You are about to buy ${buyTarget?.eventName || 'this ticket'} for ${formatCurrency(buyTarget?.price || 0)}.`}
        confirmText="Buy Ticket"
        cancelText="Not now"
        isLoading={buyLoading}
        onCancel={() => setBuyTarget(null)}
        onConfirm={buyTicket}
      />
    </div>
  );
};
