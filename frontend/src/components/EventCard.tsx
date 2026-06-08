import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { Event } from '../api/mockDb';
import { StatusBadge } from './StatusBadge';
import { EventImage } from './EventImage';

interface EventCardProps {
  event: Event;
  id?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ event, id }) => {
  const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn phí';
    return `${price.toLocaleString('vi-VN')}đ`;
  };

  const categoryLabels: Record<Event['category'], string> = {
    music: 'Âm nhạc',
    tech: 'Công nghệ',
    art: 'Nghệ thuật',
    food: 'Ẩm thực',
    sport: 'Thể thao'
  };

  const categoryColors: Record<Event['category'], string> = {
    music: 'bg-rose-50 text-rose-600 border border-rose-100',
    tech: 'bg-blue-50 text-blue-600 border border-blue-100',
    art: 'bg-purple-50 text-purple-600 border border-purple-100',
    food: 'bg-amber-50 text-amber-600 border border-amber-100',
    sport: 'bg-emerald-50 text-emerald-600 border border-emerald-100'
  };

  return (
    <div
      id={id}
      className="group bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden"
    >
      {/* Banner Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <EventImage src={event.image} alt={event.title} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColors[event.category]}`}>
            {categoryLabels[event.category]}
          </span>
        </div>
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge status={event.status} />
        </div>
      </div>

      {/* Content Details */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-base font-bold text-slate-800 line-clamp-2 h-12 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>

        {/* Short description */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4">
          {event.description}
        </p>

        {/* Date, Location, Organized Info */}
        <div className="space-y-2 mt-auto text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{event.date} • {event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 my-4"></div>

        {/* Pricing and Action button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Giá vé từ</span>
            <span className="text-base font-extrabold text-indigo-600">
              {formatPrice(event.price)}
            </span>
          </div>

          <Link
            to={`/events/${event.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            Mua vé ngay
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};
