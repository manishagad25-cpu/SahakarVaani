import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, CalendarDays, Clock, ChevronRight, Droplets, Zap, Sparkles, Car, Wrench, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';
import { bookingsApi, categoriesApi } from '../services/api';
import BookingStatusBadge from '../components/BookingStatusBadge';
import clsx from 'clsx';

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Plumbing: Droplets,
  Electrical: Zap,
  Cleaning: Sparkles,
  Driving: Car,
  'Home Repairs': Wrench,
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([bookingsApi.list(), categoriesApi.list()])
      .then(([bRes, cRes]) => {
        setBookings(bRes.data);
        setCategories(cRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter(b => ['requested', 'matched', 'accepted', 'in_progress'].includes(b.status as string));
  const recent = bookings.filter(b => ['completed', 'cancelled'].includes(b.status as string)).slice(0, 3);

  const greeting = () => {
    const hour = new Date().getHours();
    const name = user?.full_name?.split(' ')[0] || '';
    if (isTamil) {
      if (hour < 12) return `காலை வணக்கம், ${name}`;
      if (hour < 17) return `மதிய வணக்கம், ${name}`;
      return `மாலை வணக்கம், ${name}`;
    }
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className={`page-title ${isTamil ? 'font-tamil' : ''}`}>{greeting()}</h1>
        <p className={`page-subtitle ${isTamil ? 'font-tamil' : ''}`}>
          {isTamil ? 'உங்கள் சேவை டாஷ்போர்ட் — சஹாகார்வாணி' : 'Your service dashboard — SahakarVaani'}
        </p>
      </div>

      {/* Voice booking hero */}
      <div className="card bg-gradient-to-r from-cooperative-600 to-navy border-0 text-white">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <h2 className={`text-xl font-bold mb-2 ${isTamil ? 'font-tamil' : ''}`}>
              {isTamil ? 'குரலில் சேவை பதிவு செய்யுங்கள்' : 'Book a service by voice'}
            </h2>
            <p className={`text-cooperative-100 text-sm mb-4 ${isTamil ? 'font-tamil' : ''}`}>
              {isTamil
                ? 'தமிழில் பேசுங்கள் — சேவை விவரங்கள் தானாக பிரிக்கப்படும்'
                : 'Speak in Tamil or English — we extract the details automatically'}
            </p>
            <Link to="/customer/book" className="bg-white text-navy font-semibold px-6 py-2.5 rounded-btn text-sm hover:bg-cooperative-50 transition-colors inline-flex items-center gap-2">
              <Mic size={18} />
              {t('nav.bookService', lang)}
            </Link>
          </div>
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                <Mic size={28} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick service categories */}
      <div>
        <div className="section-title">{isTamil ? 'சேவைகள்' : 'Quick book'}</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const Icon = SERVICE_ICONS[cat.name_en as string] || Wrench;
            return (
              <Link
                key={cat.id as number}
                to={`/customer/book?category=${cat.id}`}
                className="card-hover border border-border flex flex-col items-center gap-2 py-4 text-center"
              >
                <Icon size={22} className="text-cooperative" />
                <div>
                  <div className="text-xs font-semibold text-navy">{cat.name_en as string}</div>
                  {isTamil && <div className="font-tamil text-[10px] text-text-secondary">{cat.name_ta as string}</div>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming bookings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">{isTamil ? 'வரவிருக்கும் முன்பதிவுகள்' : 'Upcoming'}</h3>
            <Link to="/customer/bookings" className="text-cooperative text-xs font-semibold hover:underline flex items-center gap-1">
              {t('common.viewDetails', lang)} <ChevronRight size={13} />
            </Link>
          </div>
          {loading ? (
            <p className="text-text-secondary text-sm">{t('common.loading', lang)}</p>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-6">
              <CalendarDays size={32} className="text-border mx-auto mb-2" />
              <p className="text-text-secondary text-sm">{isTamil ? 'முன்பதிவுகள் இல்லை' : 'No upcoming bookings'}</p>
              <Link to="/customer/book" className="btn-primary text-xs mt-3 px-4 py-2">
                <Mic size={14} />
                {isTamil ? 'பதிவு செய்க' : 'Book now'}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map(b => (
                <Link key={b.id as number} to={`/bookings/${b.id}`} className="block p-3 border border-border rounded-btn hover:border-cooperative transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-navy text-sm">{b.service_category_name_en as string}</span>
                    <BookingStatusBadge status={b.status as string} lang={lang} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1"><CalendarDays size={12} />{b.requested_date as string}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{b.time_window as string}</span>
                  </div>
                  <div className="text-xs text-text-secondary mt-1">Ref: {b.reference as string}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">{isTamil ? 'சமீபத்திய வரலாறு' : 'Recent history'}</h3>
          </div>
          {loading ? (
            <p className="text-text-secondary text-sm">{t('common.loading', lang)}</p>
          ) : recent.length === 0 ? (
            <p className="text-text-secondary text-sm py-6 text-center">{isTamil ? 'வரலாறு இல்லை' : 'No history yet'}</p>
          ) : (
            <div className="space-y-3">
              {recent.map(b => (
                <Link key={b.id as number} to={`/bookings/${b.id}`}
                  className="block p-3 border border-border rounded-btn hover:border-cooperative transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-navy text-sm">{b.service_category_name_en as string}</span>
                    <BookingStatusBadge status={b.status as string} lang={lang} />
                  </div>
                  <div className="text-xs text-text-secondary">{b.requested_date as string} — {b.location_city as string}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help */}
      <div className="card bg-blue-50 border-info/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-info/10 rounded-btn flex items-center justify-center flex-shrink-0">
            <Phone size={18} className="text-info" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-navy text-sm">{isTamil ? 'உதவி தேவையா?' : 'Need help?'}</h3>
            <p className="text-text-secondary text-xs mt-0.5">
              {isTamil
                ? 'ஆபரேட்டர் உதவிக்கு: 1800-XXX-XXXX (இலவசம்) — டெமோ நோட்டீஸ்'
                : 'Operator support: 1800-XXX-XXXX (toll-free) — Demo placeholder'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
