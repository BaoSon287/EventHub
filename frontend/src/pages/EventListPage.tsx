import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { eventApi } from '../api/eventApi';
import { Event } from '../api/mockDb';
import { EventCard } from '../components/EventCard';
import { Loading } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';

export const EventListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Get active filter status from search params
  const categoryFilter = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'music', label: 'Âm nhạc' },
    { value: 'tech', label: 'Công nghệ' },
    { value: 'art', label: 'Nghệ thuật' },
    { value: 'food', label: 'Ẩm thực' },
    { value: 'sport', label: 'Thể thao' },
  ];

  useEffect(() => {
    setLoading(true);
    eventApi.getAll({
      category: categoryFilter,
      search: searchQuery
    })
      .then((res) => {
        setEvents(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [categoryFilter, searchQuery]);

  const handleCategoryChange = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', val);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (!val) {
      newParams.delete('search');
    } else {
      newParams.set('search', val);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Title and stats summary */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Khám phá Sự kiện
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1.5 leading-relaxed">
            Tìm kiếm hàng ngàn sự kiện âm nhạc, công nghệ và nghệ thuật hấp dẫn nhất xung quanh bạn.
          </p>
        </div>

        {/* Filter controls panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="w-full lg:w-96 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nhập tên, mốc địa điểm để tìm kiếm..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-slate-50 font-medium border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* Additional info badge */}
            <div className="flex items-center gap-2 self-start lg:self-center">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">
                Hiển thị {events.length} sự kiện
              </span>
            </div>
          </div>

          {/* Category Filter Pills bar */}
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-4.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer select-none ${
                  categoryFilter === cat.value
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Lists Grid */}
        {loading ? (
          <Loading message="Đang tìm kiếm sự kiện phù hợp..." />
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-12 shadow-sm">
            <EmptyState
              title="Không tìm thấy sự kiện phù hợp"
              description="Hãy thử thay đổi mốc từ khóa tìm kiếm hoặc chọn danh mục sự kiện khác."
              actionLabel="Xóa toàn bộ bộ lọc"
              onAction={clearFilters}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
