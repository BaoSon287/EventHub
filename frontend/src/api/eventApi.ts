import axiosClient from './axiosClient';
import { unwrap } from './apiUtils';
import { Event } from '../types/domain';

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

const toUiEvent = (event: BackendEvent): Event => {
  const start = event.startTime ? new Date(event.startTime) : new Date();
  return {
    id: String(event.id),
    title: event.title,
    description: event.description,
    content: event.description,
    category: categoryMap[String(event.category || '').toLowerCase()] || 'tech',
    image: event.imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000',
    date: start.toISOString().slice(0, 10),
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
    status: event.status === 'CANCELLED' ? 'cancelled' : event.status === 'COMPLETED' ? 'completed' : 'upcoming'
  };
};

const toBackendEventPayload = (eventData: Partial<Event>) => ({
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
  status: eventData.status === 'cancelled' ? 'CANCELLED' : eventData.status === 'completed' ? 'COMPLETED' : 'PUBLISHED'
});

export const eventApi = {
  uploadEventImage: async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post('/api/events/images/upload', formData);
    return unwrap<UploadImageResponse>(response);
  },

  getAll: async (params?: { category?: string; search?: string }) => {
    const response = await axiosClient.get('/api/events', {
      params: {
        keyword: params?.search,
        category: params?.category && params.category !== 'all' ? params.category : undefined
      }
    });
    return { data: unwrap<PageResponse<BackendEvent>>(response).content.map(toUiEvent) };
  },

  getById: async (id: string) => {
    const response = await axiosClient.get(`/api/events/${id}`);
    return { data: toUiEvent(unwrap<BackendEvent>(response)) };
  },

  getByOrganizer: async (organizerId: string) => {
    const response = await axiosClient.get(`/api/events/organizer/${organizerId}`, {
      params: { size: 100 }
    });
    return { data: unwrap<PageResponse<BackendEvent>>(response).content.map(toUiEvent) };
  },

  create: async (eventData: Omit<Event, 'id' | 'booked' | 'organizerId' | 'organizerName'>) => {
    const response = await axiosClient.post('/api/events', toBackendEventPayload(eventData));
    return { data: toUiEvent(unwrap<BackendEvent>(response)) };
  },

  update: async (id: string, eventData: Partial<Event>) => {
    const response = await axiosClient.put(`/api/events/${id}`, toBackendEventPayload(eventData));
    return { data: toUiEvent(unwrap<BackendEvent>(response)) };
  },

  delete: async (id: string) => {
    await axiosClient.delete(`/api/events/${id}`);
    return { data: { success: true } };
  }
};
