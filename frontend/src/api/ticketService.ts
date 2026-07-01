import axiosClient from './axiosClient';
import { unwrap } from './apiUtils';
import { eventApi } from './eventApi';
import { ResaleTicket, ResaleTicketDetail, TicketAsset, TicketAssetStatus, TicketTransferHistory } from '../types/domain';

type BackendTicketAsset = {
  id: string;
  ticketId: number;
  eventId: number;
  eventName: string;
  status: TicketAssetStatus;
  qrCode?: string;
  purchasePrice: number;
  activeListingId?: string;
};

type BackendListing = {
  listingId: string;
  ticketAssetId?: string;
  ticketId?: number;
  price: number;
  status: string;
};

type BackendMarketplaceTicket = {
  listingId: string;
  eventName: string;
  eventDate?: string;
  location?: string;
  price: number;
  sellerName: string;
};

type BackendMarketplaceDetail = BackendMarketplaceTicket & {
  eventId?: number;
  seat?: string;
  status?: string;
};

type BackendHistory = {
  id: string;
  ticketAssetId: string;
  fromUserId?: number;
  toUserId?: number;
  action: TicketTransferHistory['action'];
  createdAt?: string;
};

const fallbackImage = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000';

const enrichTicket = async (ticket: BackendTicketAsset): Promise<TicketAsset> => {
  try {
    const event = await eventApi.getEventDetail(String(ticket.eventId));
    return {
      id: ticket.id,
      ticketId: String(ticket.ticketId),
      eventId: String(ticket.eventId),
      eventName: ticket.eventName || event.data.title,
      eventImage: event.data.image || fallbackImage,
      eventDate: event.data.startTime || event.data.date,
      eventLocation: [event.data.location, event.data.address, event.data.city].filter(Boolean).join(', '),
      ticketType: 'standard',
      status: ticket.status,
      qrCode: ticket.qrCode,
      purchasePrice: Number(ticket.purchasePrice || 0),
      activeListingId: ticket.activeListingId,
    };
  } catch {
    return {
      id: ticket.id,
      ticketId: String(ticket.ticketId),
      eventId: String(ticket.eventId),
      eventName: ticket.eventName,
      eventImage: fallbackImage,
      eventLocation: 'Location to be announced',
      ticketType: 'standard',
      status: ticket.status,
      qrCode: ticket.qrCode,
      purchasePrice: Number(ticket.purchasePrice || 0),
      activeListingId: ticket.activeListingId,
    };
  }
};

const toResaleTicket = (ticket: BackendMarketplaceTicket): ResaleTicket => ({
  listingId: ticket.listingId,
  eventName: ticket.eventName,
  eventDate: ticket.eventDate,
  location: ticket.location,
  price: Number(ticket.price || 0),
  sellerName: ticket.sellerName,
});

export const ticketService = {
  getMyTickets: async () => {
    const response = await axiosClient.get('/api/tickets/my');
    const tickets = unwrap<BackendTicketAsset[]>(response);
    return { data: await Promise.all(tickets.map(enrichTicket)) };
  },

  getTicketDetail: async (id: string) => {
    const response = await axiosClient.get(`/api/tickets/${id}`);
    return { data: await enrichTicket(unwrap<BackendTicketAsset>(response)) };
  },

  createResellListing: async (ticketId: string, price: number) => {
    const response = await axiosClient.post(`/api/tickets/${ticketId}/resell`, { price });
    return { data: unwrap<BackendListing>(response) };
  },

  cancelListing: async (listingId: string) => {
    const response = await axiosClient.delete(`/api/resale-tickets/${listingId}`);
    return { data: unwrap<BackendListing>(response) };
  },

  getMarketplace: async (params?: { eventId?: string; minPrice?: number; maxPrice?: number; date?: string }) => {
    const response = await axiosClient.get('/api/resale-tickets', {
      params: {
        eventId: params?.eventId,
        minPrice: params?.minPrice,
        maxPrice: params?.maxPrice,
        date: params?.date,
      }
    });
    return { data: unwrap<BackendMarketplaceTicket[]>(response).map(toResaleTicket) };
  },

  getListingDetail: async (listingId: string) => {
    const response = await axiosClient.get(`/api/resale-tickets/${listingId}`);
    const detail = unwrap<BackendMarketplaceDetail>(response);
    let eventImage = fallbackImage;
    if (detail.eventId) {
      try {
        const event = await eventApi.getEventDetail(String(detail.eventId));
        eventImage = event.data.image || fallbackImage;
      } catch {
        eventImage = fallbackImage;
      }
    }
    return {
      data: {
        ...toResaleTicket(detail),
        eventId: detail.eventId ? String(detail.eventId) : undefined,
        seat: detail.seat,
        status: detail.status,
        eventImage,
      } satisfies ResaleTicketDetail
    };
  },

  buyTicket: async (listingId: string) => {
    const response = await axiosClient.post(`/api/resale-tickets/${listingId}/buy`);
    return { data: unwrap<BackendListing>(response) };
  },

  getHistory: async (ticketId: string) => {
    const response = await axiosClient.get(`/api/tickets/${ticketId}/history`);
    return {
      data: unwrap<BackendHistory[]>(response).map((item): TicketTransferHistory => ({
        id: item.id,
        ticketAssetId: item.ticketAssetId,
        fromUserId: item.fromUserId == null ? undefined : String(item.fromUserId),
        toUserId: item.toUserId == null ? undefined : String(item.toUserId),
        action: item.action,
        createdAt: item.createdAt,
      }))
    };
  },
};
