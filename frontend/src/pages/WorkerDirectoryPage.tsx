import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Star, MapPin, Wrench, ChevronRight, Search, Filter } from 'lucide-react';
import { workersApi } from '../services/api';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';
import clsx from 'clsx';

export default function WorkerDirectoryPage() {
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [workers, setWorkers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('verified');

  useEffect(() => {
    workersApi.list({ status: filterStatus })
      .then(r => setWorkers(r.data))
      .finally(() => setLoading(false));
  }, [filterStatus]);

  const filtered = workers.filter(w => {
    if (!search) return true;
    const name = (w.full_name as string || '').toLowerCase();
    const city = (w.location_city as string || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || city.includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('nav.workers', lang)}</h1>
        <p className="page-subtitle">{isTamil ? 'சரிபார்க்கப்பட்ட சேவை தொழிலாளர்கள்' : 'Verified cooperative service workers'}</p>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input type="text" className="input-field pl-9" placeholder="Search by name or city…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {['verified', 'pending', 'all'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={clsx('px-3 py-2 rounded-btn text-xs font-semibold border transition-colors',
                  filterStatus === s ? 'bg-navy text-white border-navy' : 'border-border text-text-secondary hover:border-navy hover:text-navy')}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-text-secondary">{t('common.loading', lang)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10 text-text-secondary">{t('common.noData', lang)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(w => (
            <Link key={w.id as number} to={`/workers/${w.id}`} className="card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(w.full_name as string)?.charAt(0) || 'W'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-navy truncate">{w.full_name as string}</p>
                  <div className="flex items-center gap-1">
                    {w.verification_status === 'verified' ? (
                      <span className="badge-verified text-[10px]"><Shield size={10} />Verified</span>
                    ) : w.verification_status === 'pending' ? (
                      <span className="badge-pending text-[10px]">Pending</span>
                    ) : (
                      <span className="badge-rejected text-[10px]">Rejected</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="flex-shrink-0" />
                  <span>{w.location_city as string} • {w.service_radius_km as number} km radius</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="flex-shrink-0 text-saffron" />
                  <span>{w.rating_avg as number} ({w.rating_count as number} ratings)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wrench size={12} className="flex-shrink-0" />
                  <span className="truncate">
                    {((w.skills as Record<string, unknown>[]) || []).map(s => s.service_category_name_en).join(', ')}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full',
                  w.is_available ? 'bg-cooperative-50 text-cooperative' : 'bg-gray-100 text-gray-500')}>
                  {w.is_available ? t('worker.available', lang) : t('worker.unavailable', lang)}
                </span>
                <span className="text-xs text-text-secondary">{w.completed_jobs as number} jobs</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
