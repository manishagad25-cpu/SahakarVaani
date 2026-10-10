import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mic, MicOff, Loader2, CheckCircle, AlertTriangle, Edit3,
  RotateCcw, ArrowRight, Phone, ChevronDown, Info
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';
import { voiceApi, bookingsApi, categoriesApi } from '../services/api';
import clsx from 'clsx';

type Stage = 'idle' | 'recording' | 'processing' | 'extracted' | 'confirming' | 'booking' | 'success' | 'error';

interface ExtractedIntent {
  intent: string;
  service_category?: string;
  requested_date?: string;
  time_window?: string;
  location?: string;
  urgency: string;
  confidence: number;
  missing_fields: string[];
  raw_transcript: string;
}

const SAMPLE_PHRASES = [
  { en: 'I need a plumber tomorrow morning', ta: 'நாளைக்கு காலையில் ஒரு plumber வேண்டும்' },
  { en: 'Need an electrician today afternoon', ta: 'இன்று மதியம் மின்சாரர் வேண்டும்' },
  { en: 'Book cleaning service for next week morning', ta: 'அடுத்த வாரம் காலை சுத்தம் செய்யும் சேவை வேண்டும்' },
];

export default function VoiceBookingPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isTamil = lang === 'ta';

  const [stage, setStage] = useState<Stage>('idle');
  const [transcript, setTranscript] = useState('');
  const [intent, setIntent] = useState<ExtractedIntent | null>(null);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState('');
  const [useManual, setUseManual] = useState(false);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  // Manual form state
  const [manualForm, setManualForm] = useState({
    service_category_id: params.get('category') || '',
    requested_date: '',
    time_window: 'morning',
    location_address: '',
    location_city: '',
    urgency: 'normal',
    notes: '',
  });

  // Voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    categoriesApi.list().then(r => setCategories(r.data));
  }, []);

  const checkMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicPermission('granted');
      return true;
    } catch {
      setMicPermission('denied');
      return false;
    }
  };

  const startRecording = async () => {
    setError('');
    const ok = await checkMicPermission();
    if (!ok) {
      setError(t('voice.permissionNeeded', lang));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => processAudio();
      mr.start();
      setStage('recording');
    } catch {
      setError(t('voice.permissionNeeded', lang));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      setStage('processing');
    }
  };

  const processAudio = async () => {
    // In demo: no live STT configured → show demo mode
    // We use a demo transcript for the voice demo
    const demoTranscript = isTamil
      ? 'நாளைக்கு காலையில் ஒரு plumber வேண்டும்'
      : 'I need a plumber tomorrow morning';
    await processTranscript(demoTranscript, true);
  };

  const processTranscript = async (text: string, isDemo = false) => {
    setStage('processing');
    setTranscript(text);
    try {
      const res = await voiceApi.extractIntent(text, lang);
      const extracted: ExtractedIntent = res.data;
      setIntent(extracted);
      // Pre-fill manual form with extracted data
      const matchedCat = categories.find(c =>
        (c.name_en as string).toLowerCase() === extracted.service_category?.toLowerCase()
      );
      if (matchedCat) setManualForm(f => ({ ...f, service_category_id: String(matchedCat.id) }));
      if (extracted.requested_date) setManualForm(f => ({ ...f, requested_date: extracted.requested_date! }));
      if (extracted.time_window) setManualForm(f => ({ ...f, time_window: extracted.time_window! }));
      setStage('extracted');
    } catch {
      setError(t('common.error', lang));
      setStage('error');
    }
  };

  const handleConfirm = async () => {
    setStage('booking');
    try {
      const payload = {
        service_category_id: parseInt(manualForm.service_category_id),
        requested_date: manualForm.requested_date || new Date().toISOString().split('T')[0],
        time_window: manualForm.time_window,
        location_address: manualForm.location_address || manualForm.location_city,
        location_city: manualForm.location_city || 'Chennai',
        urgency: manualForm.urgency,
        notes: manualForm.notes,
        voice_transcript: transcript || undefined,
      };
      const res = await bookingsApi.create(payload);
      setStage('success');
      setTimeout(() => navigate(`/bookings/${res.data.id}`), 1500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t('common.error', lang));
      setStage('error');
    }
  };

  const reset = () => {
    setStage('idle');
    setTranscript('');
    setIntent(null);
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className={`page-title ${isTamil ? 'font-tamil' : ''}`}>{t('voice.title', lang)}</h1>
        <p className={`page-subtitle ${isTamil ? 'font-tamil' : ''}`}>{t('voice.subtitle', lang)}</p>
      </div>

      {/* Demo mode notice */}
      <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-card text-xs">
        <Info size={14} className="text-warning flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-warning">{t('voice.voiceDemoMode', lang)}</span>
          <span className="text-text-secondary ml-1">
            — A demo transcript is used. Connect a real STT provider (e.g., Google Speech-to-Text) via <code>VITE_STT_API_KEY</code> for live recognition.
          </span>
        </div>
      </div>

      {/* Main voice card */}
      <div className="card">
        {/* Language selector */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-medium text-navy">Language:</span>
          <div className="flex gap-2">
            {(['en', 'ta'] as const).map(l => (
              <button
                key={l}
                className={clsx(
                  'px-3 py-1.5 rounded-btn text-sm font-semibold transition-colors',
                  lang === l ? 'bg-navy text-white' : 'border border-border text-navy hover:bg-navy-50'
                )}
                onClick={() => {}}
              >
                {l === 'en' ? 'English' : 'தமிழ்'}
              </button>
            ))}
          </div>
        </div>

        {/* Stage: idle */}
        {stage === 'idle' && !useManual && (
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-center">
              <p className={`text-sm text-text-secondary mb-4 ${isTamil ? 'font-tamil' : ''}`}>
                {t('voice.samplePrompt', lang)}
              </p>
              {/* Sample phrases */}
              <div className="flex flex-col gap-2 mb-6">
                {SAMPLE_PHRASES.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => processTranscript(isTamil ? p.ta : p.en)}
                    className="text-xs text-cooperative border border-cooperative-200 bg-cooperative-50 rounded-btn px-3 py-2 hover:bg-cooperative-100 transition-colors font-tamil"
                  >
                    "{isTamil ? p.ta : p.en}"
                  </button>
                ))}
              </div>
            </div>
            <button
              className="voice-btn"
              onClick={startRecording}
              aria-label={t('voice.tapToSpeak', lang)}
            >
              <Mic size={32} />
            </button>
            <p className={`text-sm font-medium text-navy ${isTamil ? 'font-tamil' : ''}`}>
              {t('voice.tapToSpeak', lang)}
            </p>
            <button
              className="btn-outline text-sm"
              onClick={() => setUseManual(true)}
            >
              <Edit3 size={15} />
              {t('voice.typeInstead', lang)}
            </button>
          </div>
        )}

        {/* Stage: recording */}
        {stage === 'recording' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <button className="voice-btn recording mic-pulse" onClick={stopRecording}>
              <MicOff size={32} />
            </button>
            <p className={`text-error font-semibold ${isTamil ? 'font-tamil' : ''}`}>
              {t('voice.listening', lang)}
            </p>
            <p className="text-xs text-text-secondary">Tap to stop recording</p>
          </div>
        )}

        {/* Stage: processing */}
        {stage === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={40} className="text-cooperative animate-spin" />
            <p className={`text-cooperative font-semibold ${isTamil ? 'font-tamil' : ''}`}>
              {t('voice.processing', lang)}
            </p>
            {transcript && (
              <div className="bg-background rounded-btn px-4 py-3 text-sm text-text-primary max-w-md text-center font-tamil italic">
                "{transcript}"
              </div>
            )}
          </div>
        )}

        {/* Stage: extracted / manual form */}
        {(stage === 'extracted' || useManual) && (
          <div className="space-y-5 fade-in">
            {/* Transcript */}
            {transcript && (
              <div>
                <label className="label">{t('voice.transcript', lang)}</label>
                <div className="bg-background border border-border rounded-btn px-3 py-2.5 text-sm font-tamil italic text-text-primary">
                  "{transcript}"
                </div>
              </div>
            )}

            {/* Confidence indicator */}
            {intent && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary">Confidence:</span>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full', intent.confidence >= 0.7 ? 'bg-success' : intent.confidence >= 0.4 ? 'bg-warning' : 'bg-error')}
                    style={{ width: `${intent.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-navy">{Math.round(intent.confidence * 100)}%</span>
              </div>
            )}

            {/* Low confidence warning */}
            {intent && intent.confidence < 0.5 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-btn text-xs">
                <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
                <span className={isTamil ? 'font-tamil' : ''}>{t('voice.confidenceLow', lang)}</span>
              </div>
            )}

            {/* Missing fields warning */}
            {intent?.missing_fields && intent.missing_fields.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-btn text-xs">
                <span className="font-semibold text-warning">{t('voice.missingFields', lang)}</span>
                <ul className="mt-1 list-disc list-inside text-text-secondary">
                  {intent.missing_fields.map(f => <li key={f}>{f.replace('_', ' ')}</li>)}
                </ul>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="service_category_id">{t('booking.selectService', lang)}</label>
                <select id="service_category_id" className="select-field"
                  value={manualForm.service_category_id}
                  onChange={e => setManualForm(f => ({ ...f, service_category_id: e.target.value }))}
                  required>
                  <option value="">— Select —</option>
                  {categories.map(c => (
                    <option key={c.id as number} value={c.id as number}>
                      {c.name_en as string} {isTamil ? `/ ${c.name_ta}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="requested_date">{t('booking.date', lang)}</label>
                <input id="requested_date" type="date" className="input-field"
                  value={manualForm.requested_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setManualForm(f => ({ ...f, requested_date: e.target.value }))} required />
              </div>
              <div>
                <label className="label" htmlFor="time_window">{t('booking.timeWindow', lang)}</label>
                <select id="time_window" className="select-field"
                  value={manualForm.time_window}
                  onChange={e => setManualForm(f => ({ ...f, time_window: e.target.value }))}>
                  <option value="morning">{t('booking.morning', lang)}</option>
                  <option value="afternoon">{t('booking.afternoon', lang)}</option>
                  <option value="evening">{t('booking.evening', lang)}</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="urgency">{t('booking.urgency', lang)}</label>
                <select id="urgency" className="select-field"
                  value={manualForm.urgency}
                  onChange={e => setManualForm(f => ({ ...f, urgency: e.target.value }))}>
                  <option value="normal">{t('booking.urgencyNormal', lang)}</option>
                  <option value="urgent">{t('booking.urgencyUrgent', lang)}</option>
                  <option value="emergency">{t('booking.urgencyEmergency', lang)}</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="location_address">{t('booking.address', lang)}</label>
                <input id="location_address" type="text" className="input-field"
                  value={manualForm.location_address}
                  onChange={e => setManualForm(f => ({ ...f, location_address: e.target.value }))}
                  placeholder="Street address" required />
              </div>
              <div>
                <label className="label" htmlFor="location_city">{t('booking.city', lang)}</label>
                <input id="location_city" type="text" className="input-field"
                  value={manualForm.location_city}
                  onChange={e => setManualForm(f => ({ ...f, location_city: e.target.value }))}
                  placeholder="City" required />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="notes">{t('booking.notes', lang)}</label>
              <textarea id="notes" className="input-field h-20 resize-none"
                value={manualForm.notes}
                onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional details…" />
            </div>

            {/* Confirmation message */}
            <div className="p-4 bg-cooperative-50 border border-cooperative-200 rounded-card">
              <p className={`text-sm font-medium text-cooperative-700 ${isTamil ? 'font-tamil' : ''}`}>
                {t('voice.pleaseConfirm', lang)}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button className="btn-primary" onClick={handleConfirm}
                disabled={!manualForm.service_category_id || !manualForm.requested_date}>
                <CheckCircle size={16} />
                {t('booking.confirm', lang)}
              </button>
              <button className="btn-outline" onClick={reset}>
                <RotateCcw size={15} />
                {t('voice.retry', lang)}
              </button>
            </div>
          </div>
        )}

        {/* Stage: booking */}
        {stage === 'booking' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 size={40} className="text-cooperative animate-spin" />
            <p className="text-cooperative font-semibold">Creating your booking…</p>
          </div>
        )}

        {/* Stage: success */}
        {stage === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8 fade-in">
            <CheckCircle size={48} className="text-success" />
            <p className={`text-success font-bold text-lg ${isTamil ? 'font-tamil' : ''}`}>
              {t('common.success', lang)} {isTamil ? 'முன்பதிவு உருவாக்கப்பட்டது!' : 'Booking created!'}
            </p>
            <p className="text-text-secondary text-sm">Redirecting to booking details…</p>
          </div>
        )}

        {/* Stage: error */}
        {stage === 'error' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <AlertTriangle size={40} className="text-warning" />
            <p className="text-error font-semibold">{error || t('common.error', lang)}</p>
            <div className="flex gap-3">
              <button className="btn-outline" onClick={reset}>
                <RotateCcw size={15} />
                {t('voice.retry', lang)}
              </button>
              <button className="btn-ghost text-sm text-text-secondary" onClick={() => {}}>
                <Phone size={14} />
                {t('voice.operatorHelp', lang)}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Operator support */}
      <div className="card border-border bg-background">
        <div className="flex items-center gap-3">
          <Phone size={18} className="text-info" />
          <div>
            <p className="text-sm font-semibold text-navy">
              {isTamil ? 'உதவி தேவையா?' : 'Need operator support?'}
            </p>
            <p className="text-xs text-text-secondary">
              {isTamil ? 'போன் செய்யுங்கள்: 1800-XXX-XXXX (டெமோ)' : 'Call: 1800-XXX-XXXX (demo placeholder — not a real number)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
