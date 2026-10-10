import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Shield, Star, MapPin, Wrench, Phone, CheckCircle, Clock } from 'lucide-react';
import { workersApi } from '../services/api';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';

export default function WorkerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [worker, setWorker] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workersApi.get(parseInt(id!))
      .then(r => setWorker(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="card text-center py-10 text-text-secondary">{t('common.loading', lang)}</div>;
  if (!worker) return <div className="card text-center py-10 text-error">Worker not found</div>;

  const skills = (worker.skills as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link to="/workers" className="btn-ghost text-sm -ml-2">
        <ChevronLeft size={16} />{t('common.back', lang)}
      </Link>

      <div className="card">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {(worker.full_name as string)?.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-navy">{worker.full_name as string}</h1>
            <p className="text-text-secondary text-sm">{worker.cooperative_name as string}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {worker.verification_status === 'verified' && (
                <span className="badge-verified"><Shield size={11} />Verified</span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                worker.is_available ? 'bg-cooperative-50 text-cooperative' : 'bg-gray-100 text-gray-500'
              }`}>
                {worker.is_available ? t('worker.available', lang) : t('worker.unavailable', lang)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-sm mb-5">
          <div className="flex items-center gap-2 text-text-secondary">
            <MapPin size={14} className="text-navy" />
            <span>{worker.location_city as string} — {worker.service_radius_km as number} km radius</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Star size={14} className="text-saffron" />
            <span>{worker.rating_avg as number} / 5 ({worker.rating_count as number} reviews)</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <CheckCircle size={14} className="text-cooperative" />
            <span>{worker.completed_jobs as number} jobs completed</span>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-navy mb-3">{t('worker.skills', lang)}</h3>
          <div className="space-y-2">
            {skills.map(s => (
              <div key={s.id as number} className="flex items-center justify-between p-3 bg-background rounded-btn border border-border">
                <div>
                  <p className="font-medium text-navy text-sm">{s.service_category_name_en as string}</p>
                  {isTamil && <p className="font-tamil text-xs text-text-secondary">{s.service_category_name_ta as string}</p>}
                  {Boolean(s.certification_note) && <p className="text-xs text-text-secondary">{s.certification_note as string}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-semibold text-cooperative">{s.experience_years as number} yrs exp</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-border">
          <p className="text-xs text-text-secondary">
            ⚠ This is a demonstration profile with fictional data. Worker details do not represent real individuals.
          </p>
        </div>
      </div>

      <Link to="/customer/book" className="btn-primary w-full justify-center py-3">
        Book this worker's service
      </Link>
    </div>
  );
}
