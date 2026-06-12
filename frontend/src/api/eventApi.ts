import axiosClient from './axiosClient';
import { unwrap } from './apiUtils';
import { Event, EventStatus } from '../types/domain';

type BackendEvent = {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  address?: string;
  city?: string;
  startTime: string;
  endTime: string;
  totalTickets: number;
  availableTickets: number;
  price: number;
  imageUrl?: string;
  organizerId: number;
  organizerName: string;
  status: string;
};

type UploadImageResponse = {
  imageUrl: string;
  fileName: string;
};

type PageResponse<T> = {
  content: T[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const normalizeImageUrl = (imageUrl?: string) => {
  if (!imageUrl) {
    return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000';
  }

  try {
    const url = new URL(imageUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return `${API_BASE_URL.replace(/\/$/, '')}${url.pathname}`;
    }
  } catch {
    return imageUrl;
  }

  return imageUrl;
};

const categoryMap: Record<string, Event['category']> = {
  music: 'music',
  tech: 'tech',
  technology: 'tech',
  business: 'tech',
  education: 'tech',
  career: 'tech',
  design: 'art',
  art: 'art',
  food: 'food',
  sport: 'sport',
  sports: 'sport'
};

const eventStatuses: EventStatus[] = ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'];

const toEventStatus = (status?: string): EventStatus => {
  const normalized = String(status || 'DRAFT').toUpperCase();
  return eventStatuses.includes(normalized as EventStatus) ? normalized as EventStatus : 'DRAFT';
};

const toUiEvent = (event: BackendEvent): Event => {
  const start = event.startTime ? new Date(event.startTime) : new Date();
  return {
    id: String(event.id),
    title: event.title,
    description: event.description,
    content: event.description,
    category: categoryMap[String(event.category || '').toLowerCase()] || 'tech',
    image: normalizeImageUrl(event.imageUrl),
    date: start.toISOString().slice(0, 10),
    startTime: event.startTime,
    endTime: event.endTime,
    time: event.startTime && event.endTime
      ? `${event.startTime.slice(11, 16)} - ${event.endTime.slice(11, 16)}`
      : '',
    location: event.location || event.address || event.city || '',
    address: event.address,
    city: event.city,
    price: Number(event.price || 0),
    capacity: event.totalTickets,
    booked: Math.max(0, event.totalTickets - event.availableTickets),
    organizerId: String(event.organizerId),
    organizerName: event.organizerName,
    status: toEventStatus(event.status)
  };
};

const toBackendEventPayload = (eventData: Partial<Event>, includeStatus = false) => {
  const payload: Record<string, unknown> = {
    title: eventData.title,
    description: eventData.description,
    category: eventData.category,
    location: eventData.location,
    address: eventData.address,
    city: eventData.city,
    startTime: eventData.date ? `${eventData.date}T${eventData.time?.slice(0, 5) || '09:00'}:00` : undefined,
    endTime: eventData.date ? `${eventData.date}T${eventData.time?.slice(-5) || '17:00'}:00` : undefined,
    totalTickets: eventData.capacity,
    price: eventData.price,
    imageUrl: eventData.image,
  };

  if (includeStatus) {
    payload.status = eventData.status;
  }

  return payload;
};

const isPublicUpcoming = (event: Event) => (
  event.status === 'PUBLISHED'
  && (!event.endTime || new Date(event.endTime).getTime() > Date.now())
);

export const eventApi = {
  uploadEventImage: async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post('/api/events/images/upload', formData);
    const result = unwrap<UploadImageResponse>(response);
    return { ...result, imageUrl: normalizeImageUrl(result.imageUrl) };
  },

  getPublicEvents: async (params?: { category?: string; search?: string }) => {
    const response = await axiosClient.get('/api/events', {
      params: {
        keyword: params?.search,
        category: params?.category && params.category !== 'all' ? params.category : undefined
      }
    });
    const events = unwrap<PageResponse<BackendEvent>>(response).content.map(toUiEvent);
    return { data: events.filter(isPublicUpcoming) };
  },

  getAll: async (params?: { category?: string; search?: string }) => eventApi.getPublicEvents(params),

  getEventDetail: async (id: string) => {
    const response = await axiosClient.get(`/api/events/${id}`);
    return { data: toUiEvent(unwrap<BackendEvent>(response)) };
  },

  getById: async (id: string) => eventApi.getEventDetail(id),

  getOrganizerEvents: async (organizerId: string, status?: EventStatus) => {
    const response = await axiosClient.get(`/api/events/organizer/${organizerId}`, {
      params: { size: 100, status }
    });
    return { data: unwrap<PageResponse<BackendEvent>>(response).content.map(toUiEvent) };
  },

  getByOrganizer: async (organizerId: string, status?: EventStatus) => eventApi.getOrganizerEvents(organizerId, status),

  createEvent: async (eventData: Omit<Event, 'id' | 'booked' | 'organizerId' | 'organizerName'>) => {
    const response = await axiosClient.post('/api/events', toBackendEventPayload(eventData, true));
    return { data: toUiEvent(unwrap<BackendEvent>(response)) };
  },

  create: async (eventData: Omit<Event, 'id' | 'booked' | 'organizerId' | 'organizerName'>) => eventApi.createEvent(eventData),

  updateEvent: async (id: string, eventData: Partial<Event>) => {
    const response = await axiosClient.put(`/api/events/${id}`, toBackendEventPayload(eventData));
    return { data: toUiEvent(unwrap<BackendEvent>(response)) };
  },

  update: async (id: string, eventData: Partial<Event>) => eventApi.updateEvent(id, eventData),

  publishEvent: async (id: string) => {
    const response = await axiosClient.patch(`/api/events/${id}/publish`);
    return { data: toUiEvent(unwrap<BackendEvent>(response)) };
  },

  cancelEvent: async (id: string) => {
    const response = await axiosClient.patch(`/api/events/${id}/cancel`);
    return { data: toUiEvent(unwrap<BackendEvent>(response)) };
  },

  delete: async (id: string) => {
    await axiosClient.delete(`/api/events/${id}`);
    return { data: { success: true } };
  }
};
