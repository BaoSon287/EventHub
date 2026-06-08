import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Flame, Music, Cpu, Palette, Pizza, Trophy, ArrowRight, ShieldCheck, HeartHandshake, Zap, Sparkles } from 'lucide-react';
import { eventApi } from '../api/eventApi';
import { Event } from '../api/mockDb';
import { EventCard } from '../components/EventCard';
import { Loading } from '../components/Loading';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    eventApi.getAll()
      .then((res) => {
        // filter featured, or grab some
        const all = res.data;
        const featured = all.filter((e: Event) => e.featured) || all.slice(0, 3);
        setFeaturedEvents(featured.length ? featured : all.slice(0, 3));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/events');
    }
  };

  const categories = [
    { value: 'music', label: 'Âm nhạc', icon: <Music className="w-5 h-5" />, color: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' },
    { value: 'tech', label: 'Công nghệ', icon: <Cpu className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' },
    { value: 'art', label: 'Nghệ thuật', icon: <Palette className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100' },
    { value: 'food', label: 'Ẩm thực', icon: <Pizza className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' },
    { value: 'sport', label: 'Thể thao', icon: <Trophy className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-slate-900 text-white min-h-[500px] flex items-center pt-8 pb-16">
        <div className="absolute inset-0 z-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/50 via-slate-900 to-slate-900"></div>
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-600 rounded-full filter blur-3xl opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Nền tảng đặt vé sự kiện hàng đầu Việt Nam
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight sm:leading-none tracking-tight">
              Khám Phá Những <br />
              <span className="bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">
                Sự Kiện Đỉnh Cao
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-medium leading-relaxed">
              Trải nghiệm đại nhạc hội sôi động, diễn đàn công nghệ đỉnh cao, triển lãm nghệ thuật sang trọng và tinh hoa ẩm thực khắp mọi miền.
            </p>

            {/* Interactive Search Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-lg bg-white rounded-xl p-2 flex flex-col sm:flex-row gap-2 shadow-xl border border-slate-700/50">
              <div className="flex-1 flex items-center px-3 gap-2">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Nhập tên sự kiện, chủ đề hoặc địa điểm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-sm h-10 font-medium"
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 font-bold text-sm text-white px-6 py-3 rounded-lg transition duration-200 shrink-0 text-center"
              >
                Tìm kiếm
              </button>
            </form>
          </div>

          {/* Hero Right Mock Image */}
          <div className="lg:col-span-5 hidden lg:block relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-indigo-400/20 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000"
                alt="Event Hero"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-slate-850 p-4 rounded-xl shadow-lg border border-slate-800 flex items-center gap-3 backdrop-blur-md">
              <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center text-white font-bold">
                🔥
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300">Xu hướng nổi bật</p>
                <p className="text-sm font-black text-white">Ravolution EDM 2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CHOOSE CATEGORY BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -translate-y-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 sm:p-8">
          <div className="text-center sm:text-left mb-6">
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest">Danh mục sự kiện</h2>
            <p className="text-lg font-bold text-slate-800">Lựa chọn chủ đề bạn quan tâm</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => navigate(`/events?category=${cat.value}`)}
                className={`py-4 px-3 rounded-xl border flex flex-col items-center gap-3 transition cursor-pointer ${cat.color}`}
              >
                <div className="p-2.5 rounded-lg bg-white shadow-xs">
                  {cat.icon}
                </div>
                <span className="text-sm font-bold text-slate-700">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED EVENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-100">
              <Flame className="w-3.5 h-3.5 animate-bounce" />
              Sức hút lan tỏa
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">Sự Kiện Nổi Bật</h2>
          </div>
          <Link
            to="/events"
            className="group inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            Xem tất cả sự kiện
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* 4. VALUE PROPOSITIONS */}
      <section className="bg-slate-100 py-16 mt-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-black uppercase tracking-widest text-indigo-600">Những tính năng ưu việt</h2>
            <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">Chọn EventHub, Chọn Trải Nghiệm Hoàn Hảo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-850 mb-2">Thanh Toán Bảo Mật</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                Cổng thanh toán đa dạng (Momo, ShopeePay, chuyển khoản ngân hàng) được mã hóa bảo mật tối đa, xử lý cực nhanh.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-850 mb-2">Dịch Vụ Khách Hàng 24/7</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                Đội ngũ hỗ trợ nhiệt tình hỗ trợ giải đáp mọi thắc mắc và xử lý khiếu nại liên quan đến vé và hoàn trả.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-850 mb-2">Tạo Vé Siêu Tốc</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                Nhà tổ chức có thể thiết lập, quảng bá và phân phối vé số hóa nhanh chóng chỉ trong vài thao tác cấu hình.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-800 pb-8 mb-8 gap-4">
            <div>
              <span className="text-xl font-extrabold text-white">EventHub</span>
              <p className="text-xs text-slate-500 mt-1">Nâng tầm giá trị những kết nối tương lai</p>
            </div>
            <div className="flex gap-6 text-xs font-semibold">
              <a href="#" className="hover:text-white transition">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-white transition">Chính sách bảo mật</a>
              <a href="#" className="hover:text-white transition">Về chúng tôi</a>
            </div>
          </div>
          <p className="text-xs text-center text-slate-500 font-semibold">
            © 2026 EventHub. All rights reserved. Crafted with React, Vite & Tailwind CSS.
          </p>
        </div>
      </footer>

    </div>
  );
};
