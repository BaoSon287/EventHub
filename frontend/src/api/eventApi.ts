import axiosClient, { getApiMode } from './axiosClient';
import { unwrap } from './apiUtils';
import { MockDatabase, Event } from './mockDb';

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

type PageResponse<T> = {
  content: T[];
};

const categoryMap: Record<string, Event['category']> = {
  music: 'music',
  tech: 'tech',
  technology: 'tech',
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
    location: [event.location, event.city].filter(Boolean).join(', '),
    price: Number(event.price || 0),
    capacity: event.totalTickets,
    booked: Math.max(0, event.totalTickets - event.availableTickets),
    organizerId: String(event.organizerId),
    organizerName: event.organizerName,
    status: event.status === 'CANCELLED' ? 'cancelled' : event.status === 'COMPLETED' ? 'completed' : 'upcoming'
  };
};

export const eventApi = {
  getAll: async (params?: { category?: string; search?: string }) => {
    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      let events = MockDatabase.getEvents();
      
      if (params?.category && params.category !== 'all') {
        events = events.filter(e => e.category === params.category);
      }
      if (params?.search) {
        const query = params.search.toLowerCase();
        events = events.filter(e => 
          e.title.toLowerCase().includes(query) || 
          e.description.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query)
        );
      }
      return { data: events };
    }

    const response = await axiosClient.get('/api/events', {
      params: {
        keyword: params?.search,
        category: params?.category && params.category !== 'all' ? params.category : undefined
      }
    });
    return { data: unwrap<PageResponse<BackendEvent>>(response).content.map(toUiEvent) };
  },

  getById: async (id: string) => {
    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const event = MockDatabase.getEventById(id);
      if (event) {
        return { data: event };
      }
      throw new Error(`Không tìm thấy sự kiện với ID ${id}`);
    }

    const response = await axiosClient.get(`/api/events/${id}`);
    return { data: toUiEvent(unwrap<BackendEvent>(response)) };
  },

  create: async (eventData: Omit<Event, 'id' | 'booked' | 'organizerId' | 'organizerName'>) => {
    // Determine current user
    const userStr = localStorage.getItem('eventhub_current_user');
    const user = userStr ? JSON.parse(userStr) : null;
    const organizerId = user?.id || 'unknown';
    const organizerName = user?.name || 'Đối tác EventHub';

    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const newEvent = MockDatabase.createEvent({
        ...eventData,
        organizerId,
        organizerName
      });
      return { data: newEvent };
    }

    const response = await axiosClient.post('/api/events', {
      title: eventData.title,
      description: eventData.description,
      category: eventData.category,
      location: eventData.location,
      address: eventData.location,
      city: eventData.location,
      startTime: `${eventData.date}T${eventData.time?.slice(0, 5) || '09:00'}:00`,
      endTime: `${eventData.date}T${eventData.time?.slice(-5) || '17:00'}:00`,
      totalTickets: eventData.capacity,
      price: eventData.price,
      imageUrl: eventData.image,
      status: 'PUBLISHED',
      organizerId,
      organizerName
    });
    return { data: toUiEvent(unwrap<BackendEvent>(response)) };
  },

  update: async (id: string, eventData: Partial<Event>) => {
    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const updated = MockDatabase.updateEvent(id, eventData);
      if (updated) {
        return { data: updated };
      }
      throw new Error(`Lỗi cập nhật sự kiện ${id}`);
    }

    return axiosClient.put(`/api/events/${id}`, eventData);
  },

  delete: async (id: string) => {
    if (getApiMode() === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const success = MockDatabase.deleteEvent(id);
      if (success) {
        return { data: { success: true } };
      }
      throw new Error(`Lỗi xóa sự kiện ${id}`);
    }

    return axiosClient.delete(`/api/events/${id}`);
  }
};
