import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, CalendarDays, Clock, MapPin, User, FileText,
  CheckCircle, Circle, AlertTriangle, Loader2, Star, MessageSquare,
  CreditCard, Shield
} from 'lucide-react';
import { bookingsApi, matchingApi, invoicesApi, ratingsApi, disputesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';
import BookingStatusBadge from '../components/BookingStatusBadge';
import clsx from 'clsx';

const TIMELINE_STEPS = ['requested', 'matched', 'accepted', 'in_progress', 'completed'];

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rating, setRating] = useState({ score: 5, comment: '' });
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [dispute, setDispute] = useState({ title: '', description: '' });
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const fetchBooking = () => {
    bookingsApi.get(parseInt(id!))
      .then(r => setBooking(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const updateStatus = async (status: string) => {
    if (!confirm(`Are you sure you want to mark this as "${status}"?`)) return;
    setUpdating(true);
    try {
      const res = await bookingsApi.updateStatus(parseInt(id!), status);
      setBooking(res.data);
    } finally {
      setUpdating(false);
    }
  };

  const simulatePay = async () => {
    const inv = booking?.invoice as Record<string, unknown> | null;
    if (!inv) return;
    setUpdating(true);
    try {
      await invoicesApi.pay(inv.id as number);
      fetchBooking();
    } finally {
      setUpdating(false);
    }
  };

  const submitRating = async () => {
    if (!booking?.worker) return;
    const worker = booking.worker as Record<string, unknown>;
    await ratingsApi.create({
      booking_id: booking.id,
      to_user_id: worker.user_id,
      score: rating.score,
      comment: rating.comment,
    });
    setRatingSubmitted(true);
    setShowRatingForm(false);
  };

  const submitDispute = async () => {
    await disputesApi.create({
      booking_id: booking?.id,
      title: dispute.title,
      description: dispute.description,
    });
    setDisputeSubmitted(true);
    setShowDisputeForm(false);
  };

  const currentStepIdx = TIMELINE_STEPS.indexOf(booking?.status as string);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-cooperative" />
      </div>
    );
  }

  if (!booking) {
    return <div className="card text-center py-10 text-error">Booking not found</div>;
  }

  const inv = booking.invoice as Record<string, unknown> | null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <Link to="/customer/bookings" className="btn-ghost text-sm -ml-2">
        <ChevronLeft size={16} />
        {t('common.back', lang)}
      </Link>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-navy">{booking.service_category_name_en as string}</h1>
            {isTamil && <p className="font-tamil text-text-secondary text-sm">{booking.service_category_name_ta as string}</p>}
            <p className="text-xs text-text-secondary mt-1 font-mono">Ref: {booking.reference as string}</p>
          </div>
          <BookingStatusBadge status={booking.status as string} lang={lang} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <CalendarDays size={15} className="flex-shrink-0" />
            <span>{booking.requested_date as string}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock size={15} className="flex-shrink-0" />
            <span>{booking.time_window as string}</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <MapPin size={15} className="flex-shrink-0" />
            <span>{booking.location_city as string}</span>
          </div>
        </div>
        {booking.notes && (
          <p className="mt-3 text-sm text-text-secondary border-t border-border pt-3">
            <span className="font-medium">Notes:</span> {booking.notes as string}
          </p>
        )}
        {booking.urgency !== 'normal' && (
          <div className={`mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-btn text-xs font-bold ${
            booking.urgency === 'emergency' ? 'bg-red-50 text-error border border-red-200' : 'bg-saffron-50 text-saffron border border-saffron-200'
          }`}>
            <AlertTriangle size={12} />
            {(booking.urgency as string).toUpperCase()}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card">
        <h2 className="section-title">{isTamil ? 'நிலை வரலாறு' : 'Status Timeline'}</h2>
        <div className="space-y-4">
          {TIMELINE_STEPS.map((step, idx) => {
            const isDone = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step} className="timeline-step">
                <div className={clsx(
                  'timeline-icon text-white',
                  isDone ? 'bg-cooperative' : 'bg-border',
                  isCurrent && 'ring-2 ring-cooperative ring-offset-2'
                )}>
                  {isDone ? <CheckCircle size={16} /> : <Circle size={16} className="text-text-secondary" />}
                </div>
                <div className="pt-0.5">
                  <p className={clsx('text-sm font-semibold capitalize', isDone ? 'text-navy' : 'text-text-secondary')}>
                    {step.replace('_', ' ')}
                  </p>
                  {isCurrent && <p className="text-xs text-cooperative">Current status</p>}
                </div>
              </div>
            );
          })}
          {['cancelled', 'declined'].includes(booking.status as string) && (
            <div className="timeline-step">
              <div className="timeline-icon bg-error text-white">
                <AlertTriangle size={16} />
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-error capitalize">{booking.status as string}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Worker info */}
      {booking.worker && (
        <div className="card">
          <h2 className="section-title">{t('booking.assignedWorker', lang)}</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-white font-bold text-lg">
              {(booking.worker as Record<string, unknown>).full_name?.toString()?.charAt(0) || 'W'}
            </div>
            <div>
              <p className="font-semibold text-navy">{(booking.worker as Record<string, unknown>).full_name as string}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Shield size={12} className="text-cooperative" />
                <span className="text-xs text-cooperative font-semibold">Verified</span>
                <span className="text-xs text-text-secondary">•</span>
                <span className="text-xs text-text-secondary">
                  ★ {(booking.worker as Record<string, unknown>).rating_avg as number} ({(booking.worker as Record<string, unknown>).rating_count} ratings)
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{(booking.worker as Record<string, unknown>).cooperative_name as string}</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice */}
      {inv && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">{isTamil ? 'விலைப்பட்டியல்' : 'Invoice'}</h2>
            <span className="demo-label">Demo data</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Service amount</span>
              <span className="font-semibold">₹{inv.service_amount as number}</span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Cooperative commission ({Math.round((inv.commission_rate as number) * 100)}%)</span>
              <span>−₹{inv.commission_amount as number}</span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Welfare contribution ({Math.round((inv.welfare_rate as number) * 100)}%)</span>
              <span>−₹{inv.welfare_amount as number}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold text-cooperative">
              <span>Worker payout</span>
              <span>₹{inv.worker_payout as number}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                inv.payment_status === 'simulated_paid' ? 'bg-green-50 text-success border border-green-200' : 'bg-yellow-50 text-warning border border-yellow-200'
              }`}>
                {inv.payment_status as string}
              </span>
              {inv.payment_status !== 'simulated_paid' && user?.role === 'customer' && (
                <button className="btn-primary text-xs px-4 py-2" onClick={simulatePay} disabled={updating}>
                  <CreditCard size={13} />
                  {isTamil ? 'கட்டணம் செலுத்தவும் (டெமோ)' : 'Simulate Payment'}
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-3 pt-3 border-t border-border">
            ⚠ This is a simulated payment. No real transaction occurs.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="card space-y-3">
        <h2 className="section-title">{isTamil ? 'செயல்கள்' : 'Actions'}</h2>

        {/* Customer actions */}
        {user?.role === 'customer' && booking.status === 'requested' && (
          <button className="btn-danger text-sm" onClick={() => updateStatus('cancelled')} disabled={updating}>
            {isTamil ? 'முன்பதிவை ரத்து செய்க' : 'Cancel Booking'}
          </button>
        )}

        {/* Worker actions */}
        {user?.role === 'worker' && booking.status === 'matched' && (
          <div className="flex gap-3">
            <button className="btn-primary text-sm" onClick={() => updateStatus('accepted')} disabled={updating}>
              {t('worker.accept', lang)}
            </button>
            <button className="btn-danger text-sm" onClick={() => updateStatus('declined')} disabled={updating}>
              {t('worker.decline', lang)}
            </button>
          </div>
        )}
        {user?.role === 'worker' && booking.status === 'accepted' && (
          <button className="btn-primary text-sm" onClick={() => updateStatus('in_progress')} disabled={updating}>
            {isTamil ? 'வேலையை தொடங்கு' : 'Start Job'}
          </button>
        )}
        {user?.role === 'worker' && booking.status === 'in_progress' && (
          <button className="btn-primary text-sm" onClick={() => updateStatus('completed')} disabled={updating}>
            {isTamil ? 'வேலையை முடிந்தது என்று குறிக்கவும்' : 'Mark Completed'}
          </button>
        )}

        {/* Rating */}
        {booking.status === 'completed' && user?.role === 'customer' && !ratingSubmitted && (
          <>
            {!showRatingForm ? (
              <button className="btn-outline text-sm" onClick={() => setShowRatingForm(true)}>
                <Star size={14} />
                {isTamil ? 'மதிப்பீடு கொடுங்கள்' : 'Rate this service'}
              </button>
            ) : (
              <div className="p-4 bg-background border border-border rounded-card space-y-3">
                <h3 className="font-semibold text-navy text-sm">Rate Worker</h3>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(r => ({ ...r, score: s }))}
                      className={`w-9 h-9 rounded-full border-2 text-sm font-bold transition-colors ${
                        rating.score >= s ? 'bg-saffron text-white border-saffron' : 'border-border text-text-secondary hover:border-saffron'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
                <textarea className="input-field text-sm h-16 resize-none"
                  placeholder="Optional comment…"
                  value={rating.comment}
                  onChange={e => setRating(r => ({ ...r, comment: e.target.value }))} />
                <div className="flex gap-2">
                  <button className="btn-primary text-sm" onClick={submitRating}>Submit</button>
                  <button className="btn-ghost text-sm" onClick={() => setShowRatingForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
        {ratingSubmitted && <p className="text-success text-sm font-semibold">✓ Rating submitted</p>}

        {/* Dispute */}
        {!disputeSubmitted ? (
          <>
            {!showDisputeForm ? (
              <button className="btn-ghost text-sm text-text-secondary" onClick={() => setShowDisputeForm(true)}>
                <MessageSquare size={14} />
                {isTamil ? 'புகார் அளிக்கவும்' : 'Raise a dispute'}
              </button>
            ) : (
              <div className="p-4 bg-background border border-border rounded-card space-y-3">
                <h3 className="font-semibold text-navy text-sm">Raise Dispute</h3>
                <input className="input-field text-sm" placeholder="Title"
                  value={dispute.title} onChange={e => setDispute(d => ({ ...d, title: e.target.value }))} />
                <textarea className="input-field text-sm h-20 resize-none" placeholder="Describe the issue…"
                  value={dispute.description} onChange={e => setDispute(d => ({ ...d, description: e.target.value }))} />
                <div className="flex gap-2">
                  <button className="btn-primary text-sm" onClick={submitDispute}>Submit</button>
                  <button className="btn-ghost text-sm" onClick={() => setShowDisputeForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-success text-sm font-semibold">✓ Dispute submitted for admin review</p>
        )}
      </div>
    </div>
  );
}
