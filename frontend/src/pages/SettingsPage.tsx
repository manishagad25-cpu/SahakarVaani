import React, { useState } from 'react';
import { Settings, Globe, Type, Contrast, Bell, Shield, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const isTamil = lang === 'ta';
  const [textSize, setTextSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Settings size={22} />
          {isTamil ? 'அமைப்புகள்' : 'Settings'}
        </h1>
      </div>

      {/* Profile */}
      <div className="card">
        <h2 className="section-title">{isTamil ? 'சுயவிவரம்' : 'Profile'}</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-navy flex items-center justify-center text-white font-bold text-xl">
            {user?.full_name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-navy">{user?.full_name}</p>
            <p className="text-text-secondary text-sm">{user?.email}</p>
            <p className="text-xs text-text-secondary capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-text-secondary text-xs">Phone</span>
            <p className="font-medium">{user?.phone || '—'}</p>
          </div>
          <div>
            <span className="text-text-secondary text-xs">Member since</span>
            <p className="font-medium">{new Date(user?.created_at || '').toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <h2 className="section-title flex items-center gap-2">
          <Globe size={18} className="text-cooperative" />
          {isTamil ? 'மொழி' : 'Language'}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setLang('en')}
            className={clsx('flex-1 py-3 rounded-btn border-2 font-semibold text-sm transition-colors',
              lang === 'en' ? 'border-cooperative bg-cooperative-50 text-cooperative' : 'border-border text-text-secondary hover:border-cooperative')}
          >
            English
          </button>
          <button
            onClick={() => setLang('ta')}
            className={clsx('flex-1 py-3 rounded-btn border-2 font-semibold font-tamil transition-colors',
              lang === 'ta' ? 'border-cooperative bg-cooperative-50 text-cooperative' : 'border-border text-text-secondary hover:border-cooperative')}
          >
            தமிழ்
          </button>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {isTamil
            ? 'SahakarVaani தமிழ் மற்றும் ஆங்கிலத்தை ஆதரிக்கிறது. மேலும் மொழிகள் திட்டமிடப்பட்டுள்ளன.'
            : 'SahakarVaani supports Tamil and English. More languages are planned.'}
        </p>
      </div>

      {/* Accessibility */}
      <div className="card">
        <h2 className="section-title flex items-center gap-2">
          <Type size={18} className="text-cooperative" />
          {isTamil ? 'அணுகல்தன்மை' : 'Accessibility'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label">{isTamil ? 'உரை அளவு' : 'Text Size'}</label>
            <div className="flex gap-2">
              {['small', 'normal', 'large', 'x-large'].map(size => (
                <button key={size} onClick={() => setTextSize(size)}
                  className={clsx('px-3 py-1.5 rounded-btn border text-xs font-semibold transition-colors capitalize',
                    textSize === size ? 'bg-navy text-white border-navy' : 'border-border text-text-secondary hover:border-navy hover:text-navy')}>
                  {size}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary mt-1">Text size changes are illustrative (requires CSS variable integration)</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-navy text-sm flex items-center gap-2">
                <Contrast size={15} />
                {isTamil ? 'அதிக நிறமாறுபாடு' : 'High Contrast Mode'}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">Increases contrast for better readability</p>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={clsx('w-12 h-6 rounded-full transition-colors relative',
                highContrast ? 'bg-cooperative' : 'bg-border')}
            >
              <span className={clsx('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                highContrast ? 'translate-x-6' : 'translate-x-0.5')} />
            </button>
          </div>
        </div>
      </div>

      {/* Microphone & Privacy */}
      <div className="card">
        <h2 className="section-title flex items-center gap-2">
          <Shield size={18} className="text-cooperative" />
          {isTamil ? 'தனியுரிமை மற்றும் அனுமதிகள்' : 'Privacy & Permissions'}
        </h2>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-background border border-border rounded-btn">
            <p className="font-medium text-navy mb-1">Microphone Access</p>
            <p className="text-xs text-text-secondary">
              Microphone access is requested only when you tap the voice booking button.
              Audio is not stored unless you confirm the booking. You may revoke access in browser settings at any time.
            </p>
          </div>
          <div className="p-3 bg-background border border-border rounded-btn">
            <p className="font-medium text-navy mb-1">Data Collection</p>
            <p className="text-xs text-text-secondary">
              We collect your name, email, and phone for cooperative membership management.
              Voice transcripts linked to bookings are stored for audit purposes.
              This platform is a prototype and follows standard data minimization principles.
            </p>
          </div>
          <div className="p-3 bg-background border border-border rounded-btn">
            <p className="font-medium text-navy mb-1">Notifications</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-text-secondary">Enable booking status notifications</span>
              <button
                onClick={() => setNotifications(!notifications)}
                className={clsx('w-10 h-5 rounded-full transition-colors relative',
                  notifications ? 'bg-cooperative' : 'bg-border')}
              >
                <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                  notifications ? 'translate-x-5' : 'translate-x-0.5')} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="card">
        <button onClick={handleLogout} className="btn-danger w-full justify-center py-3">
          <LogOut size={16} />
          {isTamil ? 'வெளியேறு' : 'Sign Out'}
        </button>
        <p className="text-xs text-text-secondary text-center mt-2">
          SahakarVaani v1.0.0 — Smart India Hackathon Prototype
        </p>
      </div>
    </div>
  );
}
