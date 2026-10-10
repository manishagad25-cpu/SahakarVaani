import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: params.get('role') || 'customer',
    preferred_language: lang,
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t('common.error', lang));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Mic size={22} className="text-cooperative" />
          <span className="font-bold text-navy text-xl">SahakarVaani</span>
        </Link>

        <h2 className="text-2xl font-bold text-navy mb-1">{t('auth.signUp', lang)}</h2>
        <p className="text-text-secondary text-sm mb-6">
          {t('auth.haveAccount', lang)}{' '}
          <Link to="/login" className="text-cooperative font-semibold hover:underline">{t('auth.signIn', lang)}</Link>
        </p>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-error text-sm bg-red-50 border border-red-200 rounded-btn px-3 py-2.5">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="label" htmlFor="full_name">{t('auth.fullName', lang)}</label>
            <input id="full_name" name="full_name" type="text" className="input-field"
              value={form.full_name} onChange={handleChange} required placeholder="Your full name" />
          </div>

          <div>
            <label className="label" htmlFor="email">{t('auth.email', lang)}</label>
            <input id="email" name="email" type="email" className="input-field"
              value={form.email} onChange={handleChange} required placeholder="your@email.com" />
          </div>

          <div>
            <label className="label" htmlFor="phone">{t('auth.phone', lang)}</label>
            <input id="phone" name="phone" type="tel" className="input-field"
              value={form.phone} onChange={handleChange} placeholder="9876543210" />
          </div>

          <div>
            <label className="label" htmlFor="password">{t('auth.password', lang)}</label>
            <div className="relative">
              <input id="password" name="password" type={showPw ? 'text' : 'password'} className="input-field pr-10"
                value={form.password} onChange={handleChange} required placeholder="Min 6 characters" />
              <button type="button" tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-navy"
                onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="role">{t('auth.role', lang)}</label>
              <select id="role" name="role" className="select-field" value={form.role} onChange={handleChange}>
                <option value="customer">{t('auth.roleCustomer', lang)}</option>
                <option value="worker">{t('auth.roleWorker', lang)}</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="preferred_language">Language</label>
              <select id="preferred_language" name="preferred_language" className="select-field"
                value={form.preferred_language} onChange={handleChange}>
                <option value="en">English</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-3" disabled={isLoading}>
            {isLoading ? t('common.loading', lang) : t('auth.signUp', lang)}
          </button>

          <p className="text-xs text-text-secondary text-center">
            By registering, you consent to the collection of your name, email, and phone for cooperative membership management.
          </p>
        </form>
      </div>
    </div>
  );
}
