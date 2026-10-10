import React, { useEffect, useState } from 'react';
import { Heart, Plus, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { welfareApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';
import clsx from 'clsx';

const CLAIM_STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-50 text-info border-blue-200',
  under_review: 'bg-yellow-50 text-warning border-yellow-200',
  approved: 'bg-green-50 text-success border-green-200',
  rejected: 'bg-red-50 text-error border-red-200',
};

const CLAIM_TYPES = ['medical', 'equipment', 'maternity', 'accident', 'training', 'other'];

export default function WelfarePage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [claims, setClaims] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ claim_type: 'medical', description: '', amount_requested: '' });
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  const isAdmin = ['coop_admin', 'federation_admin'].includes(user?.role || '');

  const fetchClaims = () => {
    welfareApi.list()
      .then(r => setClaims(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClaims(); }, []);

  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await welfareApi.create({
        claim_type: form.claim_type,
        description: form.description,
        amount_requested: parseFloat(form.amount_requested) || 0,
      });
      setShowForm(false);
      setForm({ claim_type: 'medical', description: '', amount_requested: '' });
      fetchClaims();
    } finally {
      setSubmitting(false);
    }
  };

  const updateClaim = async (cid: number, status: string) => {
    if (!confirm(`Mark claim as ${status}?`)) return;
    setUpdating(cid);
    try {
      await welfareApi.update(cid, { status });
      fetchClaims();
    } finally {
      setUpdating(null);
    }
  };

  const totalApproved = claims.filter(c => c.status === 'approved').reduce((s, c) => s + (c.amount_requested as number || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Heart size={22} className="text-cooperative" />
          {t('nav.welfare', lang)}
        </h1>
        <p className="page-subtitle">
          {isTamil ? 'நல உரிமைகோரல்கள் மற்றும் பங்களிப்பு பதிவு' : 'Welfare claims and contribution ledger'}
        </p>
        <span className="demo-label mt-1">Simulated welfare integrations</span>
      </div>

      {/* Simulated notice */}
      <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-card text-xs">
        <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
        <p className="text-text-secondary">
          <strong className="text-warning">Welfare Simulation Notice:</strong> Insurance, health, and external welfare integrations
          are simulated until genuinely connected to government or cooperative welfare portals.
        </p>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-text-secondary mb-1">Total Claims</p>
          <p className="text-2xl font-bold text-navy">{claims.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-text-secondary mb-1">Approved</p>
          <p className="text-2xl font-bold text-success">{claims.filter(c => c.status === 'approved').length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-text-secondary mb-1">Approved Amount</p>
          <p className="text-2xl font-bold text-cooperative">₹{totalApproved.toFixed(0)}</p>
        </div>
      </div>

      {/* New claim button (worker only) */}
      {user?.role === 'worker' && !showForm && (
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} />
          {isTamil ? 'புதிய உரிமைகோரல்' : 'Submit New Claim'}
        </button>
      )}

      {/* New claim form */}
      {showForm && (
        <form onSubmit={submitClaim} className="card space-y-4">
          <h2 className="section-title">{isTamil ? 'புதிய உரிமைகோரல்' : 'New Welfare Claim'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Claim Type</label>
              <select className="select-field" value={form.claim_type} onChange={e => setForm(f => ({ ...f, claim_type: e.target.value }))}>
                {CLAIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount Requested (₹)</label>
              <input type="number" className="input-field" placeholder="0" min="0"
                value={form.amount_requested} onChange={e => setForm(f => ({ ...f, amount_requested: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field h-24 resize-none" placeholder="Describe your welfare need in detail…"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? t('common.loading', lang) : t('common.submit', lang)}
            </button>
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>
              {t('booking.cancel', lang)}
            </button>
          </div>
        </form>
      )}

      {/* Claims list */}
      {loading ? (
        <div className="card text-center py-10 text-text-secondary">{t('common.loading', lang)}</div>
      ) : claims.length === 0 ? (
        <div className="card text-center py-10">
          <Heart size={40} className="text-border mx-auto mb-3" />
          <p className="text-text-secondary">{t('common.noData', lang)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map(c => (
            <div key={c.id as number} className="card">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy capitalize">{c.claim_type as string}</span>
                    <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full border', CLAIM_STATUS_COLORS[c.status as string])}>
                      {c.status as string}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {new Date(c.created_at as string).toLocaleDateString()} • Requested: ₹{c.amount_requested as number}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {c.status === 'approved' && (
                    <p className="text-success font-bold text-lg">₹{c.amount_requested as number}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-3">{c.description as string}</p>
              {Boolean(c.admin_notes) && (
                <div className="p-3 bg-background border border-border rounded-btn text-xs">
                  <span className="font-semibold text-navy">Admin notes: </span>
                  <span className="text-text-secondary">{c.admin_notes as string}</span>
                </div>
              )}
              {isAdmin && !['approved', 'rejected'].includes(c.status as string) && (
                <div className="flex gap-2 mt-3">
                  <button className="btn-primary text-xs py-1.5"
                    onClick={() => updateClaim(c.id as number, 'approved')} disabled={updating === c.id}>
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button className="btn-danger text-xs py-1.5"
                    onClick={() => updateClaim(c.id as number, 'rejected')} disabled={updating === c.id}>
                    <XCircle size={12} /> Reject
                  </button>
                  {c.status === 'submitted' && (
                    <button className="btn-outline text-xs py-1.5"
                      onClick={() => updateClaim(c.id as number, 'under_review')} disabled={updating === c.id}>
                      <Clock size={12} /> Set Under Review
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
