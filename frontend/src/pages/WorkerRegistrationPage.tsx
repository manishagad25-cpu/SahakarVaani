import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { workersApi, categoriesApi, cooperativesApi } from '../services/api';
import { useEffect } from 'react';
import { useLang } from '../contexts/LangContext';

export default function WorkerRegistrationPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [coops, setCoops] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skills, setSkills] = useState([{ service_category_id: '', experience_years: '1', certification_note: '' }]);
  const [form, setForm] = useState({
    cooperative_id: '',
    service_radius_km: '10',
    location_city: '',
    certification_notes: '',
  });

  useEffect(() => {
    Promise.all([categoriesApi.list(), cooperativesApi.list()])
      .then(([cRes, coopRes]) => {
        setCategories(cRes.data);
        setCoops(coopRes.data);
        if (coopRes.data.length > 0) setForm(f => ({ ...f, cooperative_id: String(coopRes.data[0].id) }));
      });
  }, []);

  const addSkill = () => setSkills(s => [...s, { service_category_id: '', experience_years: '1', certification_note: '' }]);
  const removeSkill = (i: number) => setSkills(s => s.filter((_, idx) => idx !== i));
  const updateSkill = (i: number, key: string, val: string) =>
    setSkills(s => s.map((sk, idx) => idx === i ? { ...sk, [key]: val } : sk));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await workersApi.register({
        ...form,
        cooperative_id: parseInt(form.cooperative_id),
        service_radius_km: parseFloat(form.service_radius_km),
        skills: skills.filter(s => s.service_category_id).map(s => ({
          service_category_id: parseInt(s.service_category_id),
          experience_years: parseFloat(s.experience_years),
          certification_note: s.certification_note || undefined,
        })),
      });
      navigate('/worker/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">Worker Registration</h1>
        <p className="page-subtitle">Set up your profile to receive jobs from the cooperative</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && (
          <div className="text-error text-sm bg-red-50 border border-red-200 rounded-btn px-3 py-2.5">{error}</div>
        )}

        <div>
          <label className="label">Cooperative</label>
          <select className="select-field" value={form.cooperative_id}
            onChange={e => setForm(f => ({ ...f, cooperative_id: e.target.value }))} required>
            <option value="">— Select cooperative —</option>
            {coops.map(c => <option key={c.id as number} value={c.id as number}>{c.name as string}</option>)}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Location City</label>
            <input type="text" className="input-field" placeholder="Chennai"
              value={form.location_city} onChange={e => setForm(f => ({ ...f, location_city: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Service Radius (km)</label>
            <input type="number" className="input-field" min="1" max="50"
              value={form.service_radius_km} onChange={e => setForm(f => ({ ...f, service_radius_km: e.target.value }))} required />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">Skills & Experience</label>
            <button type="button" className="btn-ghost text-xs" onClick={addSkill}>
              <Plus size={14} />Add skill
            </button>
          </div>
          <div className="space-y-3">
            {skills.map((skill, i) => (
              <div key={i} className="p-3 bg-background border border-border rounded-btn space-y-2">
                <div className="flex gap-2">
                  <select className="select-field flex-1" value={skill.service_category_id}
                    onChange={e => updateSkill(i, 'service_category_id', e.target.value)} required>
                    <option value="">— Select service —</option>
                    {categories.map(c => <option key={c.id as number} value={c.id as number}>{c.name_en as string}</option>)}
                  </select>
                  <input type="number" className="input-field w-24" placeholder="Years"
                    min="0" max="40" value={skill.experience_years}
                    onChange={e => updateSkill(i, 'experience_years', e.target.value)} />
                  {skills.length > 1 && (
                    <button type="button" onClick={() => removeSkill(i)} className="text-error hover:bg-red-50 p-2 rounded-btn">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <input type="text" className="input-field text-sm" placeholder="Certification note (optional)"
                  value={skill.certification_note}
                  onChange={e => updateSkill(i, 'certification_note', e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Additional Certification Notes</label>
          <textarea className="input-field h-20 resize-none"
            placeholder="Any other certifications, training, or relevant experience…"
            value={form.certification_notes}
            onChange={e => setForm(f => ({ ...f, certification_notes: e.target.value }))} />
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-btn text-xs text-text-secondary">
          Your profile will be submitted for verification by a cooperative administrator.
          You can accept jobs only after your profile is verified.
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : 'Submit Profile for Verification'}
        </button>
      </form>
    </div>
  );
}
