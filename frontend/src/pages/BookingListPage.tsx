import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, ChevronRight, Search, Filter } from 'lucide-react';
import { bookingsApi } from '../services/api';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';
import BookingStatusBadge from '../components/BookingStatusBadge';

const STATUSES = ['all', 'requested', 'matched', 'accepted', 'in_progress', 'completed', 'cancelled'];

export default function BookingListPage() {
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    bookingsApi.list()
      .then(r => setBookings(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search && !(b.service_category_name_en as string)?.toLowerCase().includes(search.toLowerCase())
      && !(b.reference as string)?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('nav.myBookings', lang)}</h1>
          <p className="page-subtitle">{isTamil ? 'அனைத்து முன்பதிவுகளும்' : 'All your service bookings'}</p>
        </div>
        <Link to="/customer/book" className="btn-primary text-sm">
          {t('nav.bookService', lang)}
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder={isTamil ? 'தேடல்…' : 'Search by service or reference…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                filter === s
                  ? 'bg-navy text-white border-navy'
                  : 'border-border text-text-secondary hover:border-navy hover:text-navy'
              }`}
            >
              {s === 'all' ? (isTamil ? 'அனைத்தும்' : 'All') : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-text-secondary">{t('common.loading', lang)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10">
          <CalendarDays size={40} className="text-border mx-auto mb-3" />
          <p className="text-text-secondary">{t('common.noData', lang)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <Link
              key={b.id as number}
              to={`/bookings/${b.id}`}
              className="card-hover block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-navy">{b.service_category_name_en as string}</span>
                    {isTamil && <span className="font-tamil text-xs text-text-secondary">{b.service_category_name_ta as string}</span>}
                    <BookingStatusBadge status={b.status as string} lang={lang} />
                    {b.urgency !== 'normal' && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        b.urgency === 'emergency' ? 'bg-red-100 text-error' : 'bg-saffron-50 text-saffron-700'
                      }`}>
                        {b.urgency as string}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
                    <span className="flex items-center gap-1"><CalendarDays size={12} />{b.requested_date as string}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{b.time_window as string}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{b.location_city as string}</span>
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    Ref: <span className="font-mono">{b.reference as string}</span>
                    {Boolean(b.worker_id) && <span className="ml-2">• Worker assigned</span>}
                  </div>
                </div>
                <ChevronRight size={18} className="text-text-secondary flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
