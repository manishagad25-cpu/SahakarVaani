import React, { useEffect, useState } from 'react';
import { TrendingUp, Info, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, AreaChart, Area
} from 'recharts';
import { analyticsApi } from '../services/api';
import { useLang } from '../contexts/LangContext';

const COLORS = ['#176B4D', '#17324D', '#D9822B', '#245DA8', '#A96208'];

export default function DemandForecastPage() {
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('Plumbing');

  useEffect(() => {
    analyticsApi.forecast()
      .then(r => {
        setData(r.data.data || []);
        setLabel(r.data.label || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(data.map(d => d.category_en as string))];
  const catData = data.filter(d => d.category_en === selectedCat);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <TrendingUp size={24} className="text-cooperative" />
          {isTamil ? 'சேவை தேவை முன்னறிவிப்பு' : 'Service Demand Forecast'}
        </h1>
        <p className="page-subtitle">
          {isTamil ? 'வரலாற்று தரவின் அடிப்படையில் எதிர்காலத் தேவை முன்னறிவிப்பு' : 'Historical demand with simple extrapolation forecast'}
        </p>
      </div>

      {/* Simulated data notice */}
      <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-card text-xs">
        <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
        <span className="text-text-secondary">
          <strong className="text-warning">{label || 'Demo data'}</strong> — Forecasts use a simple linear extrapolation from seeded demo bookings.
          Confidence intervals are illustrative only. This does not represent real-world demand.
        </span>
      </div>

      {/* Methodology */}
      <div className="card bg-navy text-white">
        <h2 className="font-bold text-white mb-2 flex items-center gap-2">
          <Info size={16} />
          {isTamil ? 'முறை விளக்கம்' : 'Forecast Methodology'}
        </h2>
        <p className="text-navy-200 text-sm">
          Historical bookings from the past 4 weeks are aggregated per service category.
          Forecast is computed as: <code className="bg-navy-600 px-1 rounded">avg(last 2 weeks) × (1 + 0.1 × week_offset)</code>.
          Confidence bands are ±2 bookings for illustration.
          A production system would use time-series models (ARIMA, Prophet) with real data.
        </p>
      </div>

      {/* Category selector */}
      <div className="card p-3">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat, i) => (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-btn text-xs font-semibold border transition-colors ${
                selectedCat === cat ? 'text-white border-transparent' : 'border-border text-text-secondary hover:border-navy hover:text-navy'
              }`}
              style={selectedCat === cat ? { backgroundColor: COLORS[i % COLORS.length] } : undefined}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-text-secondary">Loading forecast data…</div>
      ) : (
        <>
          {/* Forecast chart */}
          <div className="card">
            <h2 className="section-title">{selectedCat} — Weekly Demand Forecast</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={catData}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#176B4D" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#176B4D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#17324D" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#17324D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  labelFormatter={l => `Period: ${l}`}
                />
                <Legend />
                {/* Confidence band */}
                <Area type="monotone" dataKey="confidence_high" stroke="none"
                  fill="#176B4D" fillOpacity={0.08} name="Confidence High" legendType="none" />
                <Area type="monotone" dataKey="confidence_low" stroke="none"
                  fill="#FFFFFF" fillOpacity={1} name="Confidence Low" legendType="none" />
                <Line type="monotone" dataKey="actual" stroke="#17324D" strokeWidth={2}
                  dot={{ r: 4 }} name="Actual Bookings" connectNulls={false} />
                <Line type="monotone" dataKey="forecast" stroke="#176B4D" strokeWidth={2}
                  strokeDasharray="6 3" dot={{ r: 4 }} name="Forecast" />
                {/* Mark forecast start */}
                <ReferenceLine x="Week +1 (forecast)" stroke="#D9822B" strokeDasharray="4 4"
                  label={{ value: 'Forecast →', fill: '#D9822B', fontSize: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Data table */}
          <div className="card overflow-x-auto">
            <h2 className="section-title">Forecast Data Table</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-semibold text-navy pr-4">Period</th>
                  <th className="pb-2 font-semibold text-navy pr-4">Actual</th>
                  <th className="pb-2 font-semibold text-navy pr-4">Forecast</th>
                  <th className="pb-2 font-semibold text-navy pr-4">Low</th>
                  <th className="pb-2 font-semibold text-navy">High</th>
                </tr>
              </thead>
              <tbody>
                {catData.map((row, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${row.is_forecast ? 'bg-cooperative-50' : ''}`}>
                    <td className="py-2 pr-4 text-navy font-medium">{row.period as string}</td>
                    <td className="py-2 pr-4">{row.actual !== null ? row.actual as number : '—'}</td>
                    <td className="py-2 pr-4 font-semibold text-cooperative">{row.forecast as number}</td>
                    <td className="py-2 pr-4 text-text-secondary">{row.confidence_low as number}</td>
                    <td className="py-2 text-text-secondary">{row.confidence_high as number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-text-secondary mt-3">Highlighted rows = forecast periods</p>
          </div>
        </>
      )}
    </div>
  );
}
