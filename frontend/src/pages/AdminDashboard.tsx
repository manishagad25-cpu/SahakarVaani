import React, { useEffect, useState } from 'react';
import {
  Users, CheckCircle, Clock, TrendingUp, AlertTriangle, Shield,
  BarChart3, FileText, ChevronRight, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminApi, analyticsApi, workersApi } from '../services/api';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';
import BookingStatusBadge from '../components/BookingStatusBadge';

const COLORS = ['#176B4D', '#17324D', '#D9822B', '#245DA8', '#A96208'];

export default function AdminDashboard() {
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [pendingWorkers, setPendingWorkers] = useState<Record<string, unknown>[]>([]);
  const [auditLog, setAuditLog] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<number | null>(null);

  const fetchData = () => {
    Promise.all([
      analyticsApi.coopMetrics(),
      adminApi.pendingVerifications(),
      adminApi.auditLog(),
    ]).then(([mRes, pRes, aRes]) => {
      setMetrics(mRes.data);
      setPendingWorkers(pRes.data);
      setAuditLog(aRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const verifyWorker = async (wid: number, status: 'verified' | 'rejected') => {
    if (!confirm(`Mark this worker as ${status}?`)) return;
    setVerifying(wid);
    try {
      await workersApi.verify(wid, status);
      fetchData();
    } finally {
      setVerifying(null);
    }
  };

  if (loading) return <div className="card text-center py-10 text-text-secondary">{t('common.loading', lang)}</div>;

  const demand = (metrics?.demand_by_category as Record<string, unknown>[]) || [];
  const trend = (metrics?.booking_trend as Record<string, unknown>[]) || [];
  const workload = (metrics?.workload_distribution as Record<string, unknown>[]) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">{isTamil ? 'நிர்வாக டாஷ்போர்ட்' : 'Admin Dashboard'}</h1>
          <p className="page-subtitle">{isTamil ? 'கூட்டுறவு நிர்வாகி காட்சி' : 'Cooperative administrator view'}</p>
          <span className="demo-label mt-1">Demo data</span>
        </div>
        <button onClick={fetchData} className="btn-outline text-sm">
          <RefreshCw size={14} />Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Workers', ta: 'மொத்த தொழிலாளர்கள்', value: metrics?.total_workers as React.ReactNode, icon: Users, color: 'text-navy' },
          { label: 'Verified', ta: 'சரிபார்க்கப்பட்டவர்கள்', value: metrics?.verified_workers as React.ReactNode, icon: CheckCircle, color: 'text-success' },
          { label: 'Active Bookings', ta: 'செயலில் முன்பதிவுகள்', value: metrics?.active_bookings as React.ReactNode, icon: Clock, color: 'text-info' },
          { label: 'Completed Jobs', ta: 'முடிந்த வேலைகள்', value: metrics?.completed_jobs as React.ReactNode, icon: TrendingUp, color: 'text-cooperative' },
          { label: 'Pending Disputes', ta: 'நிலுவை புகார்கள்', value: metrics?.pending_disputes as React.ReactNode, icon: AlertTriangle, color: 'text-warning' },
        ].map(({ label, ta, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-text-secondary text-xs ${isTamil ? 'font-tamil' : ''}`}>{isTamil ? ta : label}</span>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-navy">{value ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Financial summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="stat-card">
          <p className="text-text-secondary text-xs mb-1">Total Service Revenue (Demo)</p>
          <p className="text-2xl font-bold text-cooperative">₹{(metrics?.total_earnings as number || 0).toFixed(0)}</p>
        </div>
        <div className="stat-card">
          <p className="text-text-secondary text-xs mb-1">Cooperative Contributions (Demo)</p>
          <p className="text-2xl font-bold text-navy">₹{(metrics?.total_cooperative_contribution as number || 0).toFixed(0)}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Demand by category */}
        <div className="card">
          <h2 className="section-title">{isTamil ? 'சேவை தேவை' : 'Service Demand'}</h2>
          {demand.length === 0 ? (
            <p className="text-text-secondary text-sm">{t('common.noData', lang)}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={demand} dataKey="count" nameKey={isTamil ? 'category_ta' : 'category_en'} cx="50%" cy="50%" outerRadius={70}>
                  {demand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Booking trend */}
        <div className="card">
          <h2 className="section-title">{isTamil ? 'முன்பதிவு போக்கு (7 நாட்கள்)' : 'Booking Trend (7 days)'}</h2>
          {trend.length === 0 ? (
            <p className="text-text-secondary text-sm">{t('common.noData', lang)}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="bookings" name="Bookings" fill="#17324D" radius={[3,3,0,0]} />
                <Bar dataKey="completed" name="Completed" fill="#176B4D" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Workload distribution */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">{isTamil ? 'தொழிலாளர் வேலை விநியோகம்' : 'Worker Workload Distribution'}</h2>
          <Link to="/admin/allocation" className="text-cooperative text-xs font-semibold hover:underline flex items-center gap-1">
            Fair Allocation <ChevronRight size={13} />
          </Link>
        </div>
        {workload.length === 0 ? (
          <p className="text-text-secondary text-sm">{t('common.noData', lang)}</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={workload} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="worker_name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="jobs_all_time" name="Total jobs" fill="#176B4D" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pending verifications */}
      <div className="card">
        <h2 className="section-title">{t('admin.pendingQueue', lang)} ({pendingWorkers.length})</h2>
        {pendingWorkers.length === 0 ? (
          <p className="text-text-secondary text-sm">{isTamil ? 'சரிபார்ப்பு நிலுவையில் இல்லை' : 'No pending verifications'}</p>
        ) : (
          <div className="space-y-3">
            {pendingWorkers.map(w => (
              <div key={w.id as number} className="flex items-center justify-between p-3 bg-background border border-border rounded-btn gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {(w.full_name as string)?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-navy text-sm truncate">{w.full_name as string}</p>
                    <p className="text-xs text-text-secondary truncate">
                      {((w.skills as Record<string, unknown>[]) || []).map(s => s.service_category_name_en).join(', ') || 'No skills listed'}
                    </p>
                    <p className="text-xs text-text-secondary">{w.location_city as string} — {w.cooperative_name as string}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    className="btn-primary text-xs py-1.5 px-3"
                    onClick={() => verifyWorker(w.id as number, 'verified')}
                    disabled={verifying === w.id}
                  >
                    <CheckCircle size={12} />
                    {t('admin.verifyWorker', lang)}
                  </button>
                  <button
                    className="btn-danger text-xs py-1.5 px-3"
                    onClick={() => verifyWorker(w.id as number, 'rejected')}
                    disabled={verifying === w.id}
                  >
                    {t('admin.rejectWorker', lang)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit log */}
      <div className="card">
        <h2 className="section-title">{t('admin.recentActivity', lang)}</h2>
        {auditLog.length === 0 ? (
          <p className="text-text-secondary text-sm">{t('common.noData', lang)}</p>
        ) : (
          <div className="space-y-2">
            {auditLog.slice(0, 10).map(e => (
              <div key={e.id as number} className="flex items-center gap-3 text-xs py-2 border-b border-border last:border-0">
                <Shield size={13} className="text-cooperative flex-shrink-0" />
                <span className="font-medium text-navy">{e.actor_name as string || 'System'}</span>
                <span className="text-text-secondary">{e.action as string}</span>
                <span className="text-text-secondary">{e.entity_type as string} #{e.entity_id as number}</span>
                <span className="text-text-secondary ml-auto">{new Date(e.created_at as string).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/admin/allocation" className="card-hover border border-border flex items-center gap-3 py-4">
          <BarChart3 size={20} className="text-cooperative" />
          <span className="font-semibold text-navy text-sm">Fair Allocation</span>
          <ChevronRight size={16} className="text-text-secondary ml-auto" />
        </Link>
        <Link to="/admin/forecast" className="card-hover border border-border flex items-center gap-3 py-4">
          <TrendingUp size={20} className="text-navy" />
          <span className="font-semibold text-navy text-sm">Demand Forecast</span>
          <ChevronRight size={16} className="text-text-secondary ml-auto" />
        </Link>
        <Link to="/ratings" className="card-hover border border-border flex items-center gap-3 py-4">
          <AlertTriangle size={20} className="text-warning" />
          <span className="font-semibold text-navy text-sm">Disputes Queue</span>
          <ChevronRight size={16} className="text-text-secondary ml-auto" />
        </Link>
      </div>
    </div>
  );
}
