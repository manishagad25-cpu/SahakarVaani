import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, AlertTriangle, ChevronDown, CheckCircle } from 'lucide-react';
import { disputesApi, ratingsApi, bookingsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';
import clsx from 'clsx';

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-50 text-error border-red-200',
  under_review: 'bg-yellow-50 text-warning border-yellow-200',
  resolved: 'bg-green-50 text-success border-green-200',
  closed: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function RatingsDisputesPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [disputes, setDisputes] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<number | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);
  const [tab, setTab] = useState<'disputes' | 'ratings'>('disputes');

  const isAdmin = ['coop_admin', 'federation_admin'].includes(user?.role || '');

  const fetchData = () => {
    disputesApi.list()
      .then(r => setDisputes(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resolveDispute = async (did: number, status: string) => {
    setResolving(true);
    try {
      await disputesApi.update(did, { status, resolution_notes: resolution });
      fetchData();
      setSelectedDispute(null);
      setResolution('');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('nav.ratings', lang)}</h1>
        <p className="page-subtitle">
          {isTamil ? 'மதிப்பீடுகள், புகார்கள் மற்றும் தீர்வுகள்' : 'Ratings, complaints, and resolution tracking'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('disputes')}
          className={clsx('px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors', tab === 'disputes' ? 'border-navy text-navy' : 'border-transparent text-text-secondary hover:text-navy')}
        >
          <AlertTriangle size={14} className="inline mr-1.5" />
          {isTamil ? 'புகார்கள்' : 'Disputes & Complaints'} ({disputes.length})
        </button>
        <button
          onClick={() => setTab('ratings')}
          className={clsx('px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors', tab === 'ratings' ? 'border-navy text-navy' : 'border-transparent text-text-secondary hover:text-navy')}
        >
          <Star size={14} className="inline mr-1.5" />
          {isTamil ? 'மதிப்பீடுகள்' : 'Ratings'} (via booking details)
        </button>
      </div>

      {tab === 'disputes' && (
        <>
          {loading ? (
            <div className="card text-center py-10 text-text-secondary">{t('common.loading', lang)}</div>
          ) : disputes.length === 0 ? (
            <div className="card text-center py-10">
              <MessageSquare size={40} className="text-border mx-auto mb-3" />
              <p className="text-text-secondary">{t('common.noData', lang)}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map(d => (
                <div key={d.id as number} className="card">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-navy">{d.title as string}</h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Booking #{d.booking_id as number} • Raised by: {d.raised_by_name as string || `User #${d.raised_by_id}`}
                        • {new Date(d.created_at as string).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', DISPUTE_STATUS_COLORS[d.status as string])}>
                      {d.status as string}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-3">{d.description as string}</p>
                  {d.resolution_notes && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-btn text-xs">
                      <span className="font-semibold text-success">Resolution: </span>
                      <span className="text-text-secondary">{d.resolution_notes as string}</span>
                    </div>
                  )}
                  {isAdmin && d.status !== 'resolved' && d.status !== 'closed' && (
                    <div className="mt-3">
                      {selectedDispute === d.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="input-field text-sm h-16 resize-none"
                            placeholder="Resolution notes…"
                            value={resolution}
                            onChange={e => setResolution(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button className="btn-primary text-xs py-1.5"
                              onClick={() => resolveDispute(d.id as number, 'resolved')} disabled={resolving}>
                              <CheckCircle size={12} /> Mark Resolved
                            </button>
                            <button className="btn-outline text-xs py-1.5"
                              onClick={() => resolveDispute(d.id as number, 'under_review')} disabled={resolving}>
                              Mark Under Review
                            </button>
                            <button className="btn-ghost text-xs" onClick={() => setSelectedDispute(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-outline text-xs" onClick={() => setSelectedDispute(d.id as number)}>
                          Review & Resolve
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'ratings' && (
        <div className="card text-center py-10">
          <Star size={40} className="text-saffron mx-auto mb-3" />
          <p className="font-semibold text-navy mb-2">Ratings are linked to bookings</p>
          <p className="text-text-secondary text-sm">
            Go to a completed booking's detail page to submit or view ratings.
          </p>
        </div>
      )}
    </div>
  );
}
