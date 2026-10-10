import React, { useEffect, useState } from 'react';
import { Building2, Users, CheckCircle, TrendingUp, CreditCard, AlertTriangle, Filter } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { federationApi } from '../services/api';
import { useLang } from '../contexts/LangContext';

export default function FederationDashboard() {
  const { lang } = useLang();
  const isTamil = lang === 'ta';
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    federationApi.metrics()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const coops = (data?.cooperatives as Record<string, unknown>[]) || [];
  const totals = (data?.totals as Record<string, unknown>) || {};

  const chartData = coops.map(c => ({
    name: ((c.cooperative as Record<string, unknown>).city as string) || 'Coop',
    workers: c.workers,
    bookings: c.bookings,
    completed: c.completed,
    earnings: c.earnings,
  }));

  if (loading) return <div className="card text-center py-10 text-text-secondary">Loading federation data…</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Building2 size={24} className="text-cooperative" />
          {isTamil ? 'கூட்டமைப்பு டாஷ்போர்ட்' : 'Federation Dashboard'}
        </h1>
        <p className="page-subtitle">
          {isTamil ? 'அனைத்து கூட்டுறவுகளிலும் தொகுக்கப்பட்ட தரவு' : 'Aggregated data across all demo cooperatives'}
        </p>
        <span className="demo-label mt-1">Demo data — 3 cooperative organizations</span>
      </div>

      {/* Federation totals */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Workers', value: totals.total_workers as React.ReactNode, icon: Users, color: 'text-navy' },
          { label: 'Verified', value: totals.verified_workers as React.ReactNode, icon: CheckCircle, color: 'text-success' },
          { label: 'Total Bookings', value: totals.total_bookings as React.ReactNode, icon: TrendingUp, color: 'text-info' },
          { label: 'Completed', value: totals.completed_bookings as React.ReactNode, icon: CheckCircle, color: 'text-cooperative' },
          { label: 'Revenue (₹)', value: `₹${(totals.total_earnings as number || 0).toFixed(0)}` as React.ReactNode, icon: CreditCard, color: 'text-cooperative' },
          { label: 'Disputes', value: totals.unresolved_disputes as React.ReactNode, icon: AlertTriangle, color: 'text-warning' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-text-secondary text-[10px]">{label}</span>
              <Icon size={14} className={color} />
            </div>
            <div className="text-xl font-bold text-navy">{value ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Per-cooperative comparison chart */}
      <div className="card">
        <h2 className="section-title">Cooperative Comparison</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DCE3EA" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="workers" name="Workers" fill="#17324D" radius={[3,3,0,0]} />
            <Bar dataKey="bookings" name="Bookings" fill="#176B4D" radius={[3,3,0,0]} />
            <Bar dataKey="completed" name="Completed" fill="#D9822B" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-cooperative table */}
      <div className="card overflow-x-auto">
        <h2 className="section-title">Per-Cooperative Summary</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 font-semibold text-navy pr-4">Cooperative</th>
              <th className="pb-2 font-semibold text-navy pr-3">City</th>
              <th className="pb-2 font-semibold text-navy pr-3">Workers</th>
              <th className="pb-2 font-semibold text-navy pr-3">Verified</th>
              <th className="pb-2 font-semibold text-navy pr-3">Bookings</th>
              <th className="pb-2 font-semibold text-navy pr-3">Completed</th>
              <th className="pb-2 font-semibold text-navy pr-3">Revenue</th>
              <th className="pb-2 font-semibold text-navy">Disputes</th>
            </tr>
          </thead>
          <tbody>
            {coops.map((c, i) => {
              const coop = c.cooperative as Record<string, unknown>;
              const completion = c.bookings ? Math.round(((c.completed as number) / (c.bookings as number)) * 100) : 0;
              return (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 font-medium text-navy">{coop.name as string}</td>
                  <td className="py-2 pr-3 text-text-secondary">{coop.city as string}</td>
                  <td className="py-2 pr-3">{c.workers as number}</td>
                  <td className="py-2 pr-3 text-success">{c.verified_workers as number}</td>
                  <td className="py-2 pr-3">{c.bookings as number}</td>
                  <td className="py-2 pr-3">
                    <span className="text-cooperative font-semibold">{c.completed as number}</span>
                    <span className="text-text-secondary text-xs ml-1">({completion}%)</span>
                  </td>
                  <td className="py-2 pr-3 font-semibold text-cooperative">₹{(c.earnings as number).toFixed(0)}</td>
                  <td className="py-2">
                    <span className={`font-semibold ${(c.disputes as number) > 0 ? 'text-warning' : 'text-success'}`}>
                      {c.disputes as number}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card bg-background text-xs text-text-secondary">
        ⚠ All data represents fictional demonstration cooperatives. No real organizations are represented.
        Personal data is not exposed in federation views.
      </div>
    </div>
  );
}
