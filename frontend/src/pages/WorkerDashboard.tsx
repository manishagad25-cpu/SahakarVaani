import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ToggleLeft, ToggleRight, CalendarDays, CheckCircle, XCircle,
  TrendingUp, Wallet, Heart, Shield, Clock, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';
import { bookingsApi, workersApi, invoicesApi } from '../services/api';
import BookingStatusBadge from '../components/BookingStatusBadge';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchData = () => {
    Promise.all([
      workersApi.myProfile().catch(() => ({ data: null })),
      bookingsApi.list(),
      invoicesApi.list(),
    ]).then(([pRes, bRes, iRes]) => {
      setProfile(pRes.data);
      setBookings(bRes.data);
      setInvoices(iRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const toggleAvailability = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      await workersApi.updateAvailability(profile.id as number, !profile.is_available);
      setProfile(p => p ? { ...p, is_available: !p.is_available } : p);
    } finally {
      setToggling(false);
    }
  };

  const updateBookingStatus = async (bid: number, status: string) => {
    await bookingsApi.updateStatus(bid, status);
    fetchData();
  };

  const pendingJobs = bookings.filter(b => b.status === 'matched');
  const activeJobs = bookings.filter(b => ['accepted', 'in_progress'].includes(b.status as string));
  const completedJobs = bookings.filter(b => b.status === 'completed');
  const weekEarnings = invoices.reduce((s, i) => s + (i.worker_payout as number || 0), 0);

  if (loading) return <div className="card text-center py-10 text-text-secondary">{t('common.loading', lang)}</div>;

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center py-10">
          <Shield size={40} className="text-border mx-auto mb-3" />
          <h2 className="font-bold text-navy mb-2">{isTamil ? 'சுயவிவர உருவாக்கம் தேவை' : 'Create your worker profile'}</h2>
          <p className="text-text-secondary text-sm mb-4">
            {isTamil ? 'சேவை தொழிலாளராக பதிவு செய்ய உங்கள் சுயவிவரத்தை உருவாக்கவும்' : 'Set up your profile to start receiving jobs'}
          </p>
          <Link to="/worker/register" className="btn-primary">
            {isTamil ? 'சுயவிவரம் உருவாக்கு' : 'Create Profile'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">{isTamil ? 'தொழிலாளர் டாஷ்போர்ட்' : 'Worker Dashboard'}</h1>
        <p className="page-subtitle">{user?.full_name}</p>
      </div>

      {/* Verification status */}
      {profile.verification_status !== 'verified' && (
        <div className={`card border ${profile.verification_status === 'pending' ? 'border-yellow-300 bg-yellow-50' : 'border-red-300 bg-red-50'}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className={profile.verification_status === 'pending' ? 'text-warning' : 'text-error'} />
            <div>
              <p className="font-semibold text-navy text-sm">
                {profile.verification_status === 'pending' ? 'Verification Pending' : 'Verification Rejected'}
              </p>
              <p className="text-text-secondary text-xs mt-0.5">
                {profile.verification_status === 'pending'
                  ? 'Your profile is being reviewed by the cooperative administrator.'
                  : 'Your profile was not approved. Contact your cooperative for details.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Availability toggle */}
      <div className="card flex items-center justify-between">
        <div>
          <h2 className={`font-semibold text-navy ${isTamil ? 'font-tamil' : ''}`}>{t('worker.availability', lang)}</h2>
          <p className={`text-sm text-text-secondary mt-0.5 ${isTamil ? 'font-tamil' : ''}`}>
            {profile.is_available
              ? (isTamil ? 'நீங்கள் தற்போது கிடைக்கிறீர்கள்' : 'You are currently available for jobs')
              : (isTamil ? 'நீங்கள் தற்போது கிடைக்க மாட்டீர்கள்' : 'You are not taking new jobs')}
          </p>
        </div>
        <button onClick={toggleAvailability} disabled={toggling}
          className={`p-2 rounded-full transition-colors ${profile.is_available ? 'text-cooperative hover:bg-cooperative-50' : 'text-gray-400 hover:bg-gray-50'}`}>
          {profile.is_available
            ? <ToggleRight size={40} className="text-cooperative" />
            : <ToggleLeft size={40} className="text-gray-400" />}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: isTamil ? 'புதிய வேலைகள்' : 'New Requests', value: pendingJobs.length, icon: Clock, color: 'text-info' },
          { label: isTamil ? 'செயலில் உள்ள வேலைகள்' : 'Active Jobs', value: activeJobs.length, icon: TrendingUp, color: 'text-saffron' },
          { label: isTamil ? 'முடிந்த வேலைகள்' : 'Completed', value: completedJobs.length, icon: CheckCircle, color: 'text-success' },
          { label: isTamil ? 'மொத்த வருமானம்' : 'Total Earned', value: `₹${weekEarnings.toFixed(0)}`, icon: Wallet, color: 'text-cooperative' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-text-secondary text-xs">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-navy">{value}</div>
          </div>
        ))}
      </div>

      {/* New job requests */}
      {pendingJobs.length > 0 && (
        <div className="card">
          <h2 className={`section-title ${isTamil ? 'font-tamil' : ''}`}>{isTamil ? 'புதிய வேலை கோரிக்கைகள்' : 'New Job Requests'}</h2>
          <div className="space-y-3">
            {pendingJobs.map(b => (
              <div key={b.id as number} className="border border-border rounded-card p-4 bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-navy">{b.service_category_name_en as string}</span>
                  <BookingStatusBadge status={b.status as string} lang={lang} />
                </div>
                <div className="text-xs text-text-secondary mb-3 space-y-1">
                  <div>📅 {b.requested_date as string} — {b.time_window as string}</div>
                  <div>📍 {b.location_city as string}</div>
                  <div>👤 {b.customer_name as string}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn-primary text-sm py-2"
                    onClick={() => updateBookingStatus(b.id as number, 'accepted')}>
                    <CheckCircle size={14} />
                    {t('worker.accept', lang)}
                  </button>
                  <button
                    className="btn-danger text-sm py-2"
                    onClick={() => updateBookingStatus(b.id as number, 'declined')}>
                    <XCircle size={14} />
                    {t('worker.decline', lang)}
                  </button>
                  <Link to={`/bookings/${b.id}`} className="btn-outline text-sm py-2">Details</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="card">
          <h2 className={`section-title ${isTamil ? 'font-tamil' : ''}`}>{isTamil ? 'செயலில் உள்ள வேலைகள்' : 'Active Jobs'}</h2>
          <div className="space-y-3">
            {activeJobs.map(b => (
              <Link key={b.id as number} to={`/bookings/${b.id}`}
                className="block border border-border rounded-card p-3 hover:border-cooperative transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-navy text-sm">{b.service_category_name_en as string}</span>
                    <div className="text-xs text-text-secondary mt-0.5">{b.requested_date as string} — {b.location_city as string}</div>
                  </div>
                  <BookingStatusBadge status={b.status as string} lang={lang} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Earnings Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">{t('worker.earnings', lang)}</h2>
          <span className="demo-label">Demo data</span>
        </div>
        {invoices.length === 0 ? (
          <p className="text-text-secondary text-sm">{t('common.noData', lang)}</p>
        ) : (
          <div className="space-y-3">
            {invoices.slice(0, 5).map(inv => (
              <div key={inv.id as number} className="flex items-center justify-between p-3 bg-background rounded-btn border border-border text-sm">
                <div>
                  <p className="font-medium text-navy">Booking #{inv.booking_id as number}</p>
                  <p className="text-xs text-text-secondary">
                    Commission: ₹{inv.commission_amount as number} | Welfare: ₹{inv.welfare_amount as number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-cooperative">₹{inv.worker_payout as number}</p>
                  <p className={`text-[10px] font-semibold ${inv.payment_status === 'simulated_paid' ? 'text-success' : 'text-warning'}`}>
                    {inv.payment_status as string}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Welfare link */}
      <div className="card border-cooperative-200 bg-cooperative-50 flex items-center gap-4">
        <Heart size={20} className="text-cooperative flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-navy text-sm">{t('nav.welfare', lang)}</p>
          <p className="text-xs text-text-secondary mt-0.5">
            {isTamil ? 'நல உரிமைகோரல்கள் மற்றும் பங்களிப்புகளை காண்க' : 'View your welfare contributions and claims'}
          </p>
        </div>
        <Link to="/welfare" className="btn-primary text-sm">View</Link>
      </div>
    </div>
  );
}
