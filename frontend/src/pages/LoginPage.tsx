import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';
import clsx from 'clsx';

const DEMO_ACCOUNTS = [
  { label: 'Customer (Priya)', email: 'priya@demo.in', password: 'demo123', role: 'customer' },
  { label: 'Worker (Murugan)', email: 'murugan@demo.in', password: 'demo123', role: 'worker' },
  { label: 'Coop Admin', email: 'admin@sahakarvaani.in', password: 'admin123', role: 'coop_admin' },
  { label: 'Federation Admin', email: 'federation@sahakarvaani.in', password: 'fed123', role: 'federation_admin' },
];

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t('common.error', lang));
    }
  };

  const quickLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setError('');
    try {
      await login(acc.email, acc.password);
      navigate('/dashboard');
    } catch {
      setError('Demo login failed. Make sure the backend is running.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col items-center justify-center p-12">
        <div className="w-20 h-20 bg-cooperative rounded-full flex items-center justify-center mb-6">
          <Mic size={36} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white text-center mb-3">SahakarVaani</h1>
        <p className="font-tamil text-navy-200 text-center text-lg mb-2">சஹாகார்வாணி</p>
        <p className="text-navy-300 text-center text-sm mt-4 max-w-xs leading-relaxed">
          {t('tagline', lang)}
        </p>
        <div className="mt-10 space-y-3 w-full max-w-xs">
          <div className="flex items-center gap-3 text-navy-200 text-sm">
            <div className="w-6 h-6 bg-cooperative/30 rounded-full flex items-center justify-center flex-shrink-0">✓</div>
            Worker-owned cooperative model
          </div>
          <div className="flex items-center gap-3 text-navy-200 text-sm">
            <div className="w-6 h-6 bg-cooperative/30 rounded-full flex items-center justify-center flex-shrink-0">✓</div>
            Tamil voice-first booking
          </div>
          <div className="flex items-center gap-3 text-navy-200 text-sm">
            <div className="w-6 h-6 bg-cooperative/30 rounded-full flex items-center justify-center flex-shrink-0">✓</div>
            Transparent earnings & welfare
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Mic size={20} className="text-cooperative" />
            <span className="font-bold text-navy text-xl">SahakarVaani</span>
          </div>

          <h2 className="text-2xl font-bold text-navy mb-1">{t('auth.signIn', lang)}</h2>
          <p className="text-text-secondary text-sm mb-6">
            {t('auth.haveAccount', lang)} — {t('auth.noAccount', lang)}{' '}
            <Link to="/register" className="text-cooperative font-semibold hover:underline">
              {t('auth.signUp', lang)}
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-card">
            <p className="text-xs font-semibold text-warning mb-2">⚠ Demo accounts — for evaluation only</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc)}
                  className="text-left px-2.5 py-1.5 bg-white border border-border rounded text-xs hover:border-cooperative hover:bg-cooperative-50 transition-colors"
                >
                  <div className="font-semibold text-navy">{acc.label}</div>
                  <div className="text-text-secondary">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-error text-sm bg-red-50 border border-red-200 rounded-btn px-3 py-2.5">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">{t('auth.email', lang)}</label>
              <input
                id="email"
                type="email"
                className="input-field"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">{t('auth.password', lang)}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-navy"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary w-full justify-center py-3"
              disabled={isLoading}
            >
              {isLoading ? t('auth.signingIn', lang) : t('auth.signIn', lang)}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-text-secondary">
              {t('auth.noAccount', lang)}{' '}
              <Link to="/register" className="text-cooperative font-semibold hover:underline">
                {t('auth.signUp', lang)}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
