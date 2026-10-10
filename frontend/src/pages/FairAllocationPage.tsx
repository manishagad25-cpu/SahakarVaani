import React, { useEffect, useState } from 'react';
import { Scale, BarChart3, Info, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { workersApi, matchingApi, bookingsApi } from '../services/api';
import { useLang } from '../contexts/LangContext';

export default function FairAllocationPage() {
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);
  const [matchResult, setMatchResult] = useState<Record<string, unknown> | null>(null);
  const [workers, setWorkers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [expandedWorker, setExpandedWorker] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      bookingsApi.list(),
      workersApi.list({ status: 'verified' }),
    ]).then(([bRes, wRes]) => {
      setBookings(bRes.data.filter((b: Record<string, unknown>) => ['requested', 'matched'].includes(b.status as string)));
      setWorkers(wRes.data);
    }).finally(() => setLoadingBookings(false));
  }, []);

  const runMatching = async (bid: number) => {
    setSelectedBooking(bid);
    setLoading(true);
    try {
      const res = await matchingApi.get(bid);
      setMatchResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  const candidates = (matchResult?.candidates as Record<string, unknown>[]) || [];
  const workloadData = workers.map(w => ({
    name: (w.full_name as string)?.split(' ')[0] || 'W',
    jobs: w.completed_jobs as number,
    current: w.current_jobs as number,
  }));

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return '#176B4D';
    if (score >= 0.4) return '#D9822B';
    return '#B42318';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Scale size={24} className="text-cooperative" />
          {isTamil ? 'நியாயமான ஒதுக்கீடு நுண்ணறிவு' : 'Fair Allocation Intelligence'}
        </h1>
        <p className="page-subtitle">
          {isTamil
            ? 'வேலை ஒதுக்கீடு வழிமுறை விளக்கம் மற்றும் நியாயத்தன்மை ஒப்பீடு'
            : 'Transparent job allocation algorithm with fairness comparison'}
        </p>
        <span className="demo-label mt-1">Demo data</span>
      </div>

      {/* Algorithm explanation */}
      <div className="card bg-navy text-white">
        <h2 className="font-bold text-white mb-3 flex items-center gap-2">
          <Info size={18} />
          {isTamil ? 'வழிமுறை விளக்கம்' : 'How the Algorithm Works'}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-cooperative-200 mb-2">Stage A — Eligibility</p>
            <ul className="space-y-1 text-navy-200">
              <li>✓ Required skill match</li>
              <li>✓ Worker verified by cooperative</li>
              <li>✓ Currently available</li>
              <li>✓ Covers the requested area</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-cooperative-200 mb-2">Stage B — Ranking (Fairness-Aware)</p>
            <ul className="space-y-1 text-navy-200">
              <li>Skill suitability: 30%</li>
              <li>Travel distance: 20%</li>
              <li>Availability: 15%</li>
              <li>Reliability (rating): 20%</li>
              <li><span className="text-saffron font-semibold">Fairness (workload balance): 15%</span></li>
            </ul>
          </div>
        </div>
        <p className="text-navy-300 text-xs mt-3">
          Workers with fewer recent jobs receive a higher fairness score, ensuring more equitable distribution without sacrificing essential skill compatibility.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Booking selector */}
        <div className="card">
          <h2 className="section-title">
            {isTamil ? 'முன்பதிவு தேர்ந்தெடுக்கவும்' : 'Select a Booking to Analyze'}
          </h2>
          {loadingBookings ? (
            <p className="text-text-secondary text-sm">{isTamil ? 'ஏற்றுகிறோம்…' : 'Loading…'}</p>
          ) : bookings.length === 0 ? (
            <p className="text-text-secondary text-sm">No pending bookings to analyze.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map(b => (
                <button
                  key={b.id as number}
                  onClick={() => runMatching(b.id as number)}
                  className={`w-full text-left p-3 border rounded-btn transition-colors text-sm ${
                    selectedBooking === b.id ? 'border-cooperative bg-cooperative-50' : 'border-border hover:border-cooperative'
                  }`}
                >
                  <div className="font-semibold text-navy">{b.service_category_name_en as string}</div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {b.requested_date as string} — {b.location_city as string}
                  </div>
                  <div className="text-xs font-mono text-text-secondary">{b.reference as string}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Match results */}
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <div className="card text-center py-10 text-text-secondary">
              Running fairness-aware matching…
            </div>
          )}

          {matchResult && !loading && (
            <>
              {/* Algorithm comparison */}
              {matchResult.nearest_available_top && candidates[0] && (
                <div className="card border-saffron-200 bg-saffron-50">
                  <h3 className="font-semibold text-navy text-sm mb-2">
                    Algorithm Comparison
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-white rounded-btn border border-border">
                      <p className="font-bold text-cooperative mb-1">✓ Fairness-Aware (Selected)</p>
                      <p>Worker: {(candidates[0].worker as Record<string, unknown>).full_name as string}</p>
                      <p>Score: {(candidates[0].score as number).toFixed(3)}</p>
                      <p>Jobs: {(candidates[0].worker as Record<string, unknown>).completed_jobs as number}</p>
                    </div>
                    <div className="p-3 bg-white rounded-btn border border-border">
                      <p className="font-bold text-text-secondary mb-1">Nearest-Available Baseline</p>
                      <p>Worker: {((matchResult.nearest_available_top as Record<string, unknown>).worker as Record<string, unknown>).full_name as string}</p>
                      <p>Score: {((matchResult.nearest_available_top as Record<string, unknown>).score as number).toFixed(3)}</p>
                      <p>Jobs: {((matchResult.nearest_available_top as Record<string, unknown>).worker as Record<string, unknown>).completed_jobs as number}</p>
                    </div>
                  </div>
                  {Boolean(matchResult.fairness_improvement_desc) && (
                    <p className="text-xs text-text-secondary mt-2 p-2 bg-white rounded-btn border border-border">
                      {matchResult.fairness_improvement_desc as string}
                    </p>
                  )}
                </div>
              )}

              {/* Candidates list */}
              <div className="card">
                <h3 className="section-title">{isTamil ? 'தகுதி வாய்ந்த தொழிலாளர்கள்' : 'Eligible Candidates (Ranked)'}</h3>
                <div className="space-y-3">
                  {candidates.map((c, idx) => {
                    const cand = c as Record<string, unknown>;
                    const worker = cand.worker as Record<string, unknown>;
                    const bd = cand.score_breakdown as Record<string, unknown>;
                    const isExpanded = expandedWorker === idx;
                    return (
                      <div key={idx} className={`border rounded-card overflow-hidden ${cand.is_recommended ? 'border-cooperative' : 'border-border'}`}>
                        <div
                          className={`p-3 cursor-pointer ${cand.is_recommended ? 'bg-cooperative-50' : 'bg-background'}`}
                          onClick={() => setExpandedWorker(isExpanded ? null : idx)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold">
                                {(worker.full_name as string)?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-navy text-sm">
                                  {worker.full_name as string}
                                  {Boolean(cand.is_recommended) && <span className="ml-2 badge-verified text-[10px]">Recommended</span>}
                                </p>
                                <p className="text-xs text-text-secondary">{worker.completed_jobs as number} total jobs</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-lg font-bold" style={{ color: getScoreColor(cand.score as number) }}>
                                  {((cand.score as number) * 100).toFixed(0)}
                                </p>
                                <p className="text-[10px] text-text-secondary">score</p>
                              </div>
                              {isExpanded ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="p-3 border-t border-border bg-white space-y-2">
                            <p className="text-xs text-text-secondary italic">{cand.match_explanation as string}</p>
                            <div className="space-y-1.5">
                              {Object.entries(bd).filter(([k]) => k !== 'total').map(([k, v]) => (
                                <div key={k} className="flex items-center gap-2">
                                  <span className="text-xs text-text-secondary w-36 capitalize">{k.replace('_score', '').replace('_', ' ')}</span>
                                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${(v as number) * 100}%`, backgroundColor: getScoreColor(v as number) }} />
                                  </div>
                                  <span className="text-xs font-semibold text-navy w-10 text-right">{((v as number) * 100).toFixed(0)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Workload distribution chart */}
      <div className="card">
        <h2 className="section-title">Worker Workload Distribution</h2>
        <p className="text-xs text-text-secondary mb-4">
          Showing total completed jobs per worker. The fairness algorithm favors workers with fewer jobs to balance workload.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={workloadData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="jobs" name="Completed Jobs" fill="#17324D" radius={[3,3,0,0]} />
            <Bar dataKey="current" name="Current Jobs" fill="#176B4D" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
