import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mic, Droplets, Zap, Sparkles, Car, Wrench, Shield, Users,
  ChevronRight, Check, Globe, Star, MessageSquare, ArrowRight,
  BadgeCheck, Wallet, Volume2
} from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { t } from '../i18n/strings';

const SERVICE_CARDS = [
  { icon: Droplets, nameKey: 'Plumbing', ta: 'குழாய் பணி', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { icon: Zap, nameKey: 'Electrical', ta: 'மின் பணி', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { icon: Sparkles, nameKey: 'Cleaning', ta: 'சுத்தம்', color: 'bg-green-50 text-green-700 border-green-200' },
  { icon: Car, nameKey: 'Driving', ta: 'வாகன ஓட்டு', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { icon: Wrench, nameKey: 'Home Repairs', ta: 'வீட்டு பழுது', color: 'bg-orange-50 text-orange-700 border-orange-200' },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck, en: 'Cooperative Verification', ta: 'கூட்டுறவு சரிபார்ப்பு', descEn: 'Every worker verified by a registered cooperative', descTa: 'பதிவு செய்யப்பட்ட கூட்டுறவால் சரிபார்க்கப்பட்ட தொழிலாளர்கள்' },
  { icon: Wallet, en: 'Transparent Pricing', ta: 'வெளிப்படையான விலை', descEn: 'Full fee breakdown: worker pay + cooperative contribution', descTa: 'முழு கட்டண விவரம்: தொழிலாளர் சம்பளம் + கூட்டுறவு பங்கு' },
  { icon: Volume2, en: 'Voice-First, Tamil-First', ta: 'குரல் முதல், தமிழ் முதல்', descEn: 'Book services in Tamil by speaking — no forms needed', descTa: 'தமிழில் பேசி சேவை பதிவு செய்யுங்கள் — படிவங்கள் தேவையில்லை' },
  { icon: Shield, en: 'Worker Welfare', ta: 'தொழிலாளர் நலன்', descEn: 'Workers access welfare support through the cooperative', descTa: 'தொழிலாளர்கள் கூட்டுறவு மூலம் நல ஆதரவை அணுகுகிறார்கள்' },
];

export default function LandingPage() {
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const [voiceDemo, setVoiceDemo] = useState('');

  const isTamil = lang === 'ta';
  const fontClass = isTamil ? 'font-tamil' : '';

  return (
    <div className={`min-h-screen bg-background ${fontClass}`}>
      {/* Navigation */}
      <nav className="bg-navy shadow-nav sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cooperative rounded-btn flex items-center justify-center">
              <Mic size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-none">SahakarVaani</div>
              <div className="text-navy-200 text-[10px] font-tamil">சஹாகார்வாணி</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              className="flex items-center gap-1.5 text-navy-100 hover:text-white text-sm px-3 py-1.5 rounded-btn hover:bg-navy-600 transition-colors"
              aria-label="Switch language"
            >
              <Globe size={15} />
              {lang === 'en' ? 'தமிழ்' : 'English'}
            </button>
            <Link to="/login" className="text-navy-100 hover:text-white text-sm px-3 py-1.5 rounded-btn hover:bg-navy-600 transition-colors">
              {t('auth.signIn', lang)}
            </Link>
            <Link to="/register" className="bg-cooperative text-white text-sm px-4 py-2 rounded-btn font-semibold hover:bg-cooperative-600 transition-colors">
              {t('landing.joinWorker', lang)}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy-500 to-cooperative-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-cooperative/20 border border-cooperative/30 text-cooperative-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Shield size={12} />
              Worker-Owned Cooperative Platform
            </div>
            <h1 className={`text-4xl sm:text-5xl font-bold leading-tight mb-6 text-balance ${isTamil ? 'font-tamil' : ''}`}>
              {t('landing.heroTitle', lang)}
            </h1>
            <p className={`text-lg text-navy-100 mb-10 leading-relaxed max-w-2xl ${isTamil ? 'font-tamil' : ''}`}>
              {t('landing.heroSubtitle', lang)}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="bg-cooperative hover:bg-cooperative-600 text-white font-semibold px-8 py-3.5 rounded-btn text-base transition-colors flex items-center gap-2 shadow-lg"
              >
                <Mic size={20} />
                {t('landing.bookNow', lang)}
              </Link>
              <Link
                to="/register?role=worker"
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-btn text-base transition-colors flex items-center gap-2"
              >
                {t('landing.joinWorker', lang)}
                <ChevronRight size={18} />
              </Link>
              <Link
                to="/login"
                className="bg-saffron/90 hover:bg-saffron text-white font-semibold px-8 py-3.5 rounded-btn text-base transition-colors"
              >
                {t('landing.coopLogin', lang)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Voice booking section */}
      <section className="bg-cooperative-50 border-y border-cooperative-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-navy mb-2">
              {isTamil ? 'குரலில் சேவை கோரவும்' : 'Request a Service by Voice'}
            </h2>
            <p className="text-text-secondary text-sm">
              {isTamil
                ? 'தமிழில் பேசுங்கள் — சேவை விவரங்கள் தானாக பிரிக்கப்படும்'
                : 'Speak in Tamil — service details are extracted automatically'}
            </p>
          </div>
          <div className="max-w-xl mx-auto">
            <div className="card">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Link
                    to="/register"
                    className="voice-btn w-24 h-24 text-white shadow-xl hover:scale-105 transition-transform"
                    aria-label="Voice booking"
                  >
                    <Mic size={36} />
                  </Link>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-navy">
                    {isTamil ? t('voice.tapToSpeak', lang) : t('voice.tapToSpeak', lang)}
                  </p>
                  <p className="text-xs text-text-secondary mt-1 font-tamil italic">
                    "{isTamil ? 'நாளைக்கு காலையில் ஒரு plumber வேண்டும்' : 'Naalaikku kaalaila oru plumber venum'}"
                  </p>
                </div>
                <div className="w-full border-t border-border pt-3 text-center">
                  <p className="text-xs text-text-secondary">
                    {isTamil
                      ? 'உள்நுழைந்த பிறகு முழு குரல் உதவியாளரை பயன்படுத்துங்கள்'
                      : 'Sign in to access the full voice booking assistant'}
                  </p>
                  <Link to="/register" className="text-cooperative text-xs font-semibold hover:underline mt-1 inline-block">
                    {isTamil ? 'இப்போது பதிவு செய்யுங்கள் →' : 'Register now →'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-navy">{t('landing.services', lang)}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {SERVICE_CARDS.map(({ icon: Icon, nameKey, ta, color }) => (
              <Link
                key={nameKey}
                to="/register"
                className={`card-hover border ${color} flex flex-col items-center gap-3 py-6 text-center`}
              >
                <Icon size={28} />
                <div>
                  <div className="font-semibold text-sm">{nameKey}</div>
                  <div className="font-tamil text-xs mt-0.5 opacity-80">{ta}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-12">{t('landing.howItWorks', lang)}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: t('landing.step1Title', lang), desc: t('landing.step1Desc', lang), icon: Mic },
              { step: '02', title: t('landing.step2Title', lang), desc: t('landing.step2Desc', lang), icon: Users },
              { step: '03', title: t('landing.step3Title', lang), desc: t('landing.step3Desc', lang), icon: Check },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-cooperative flex items-center justify-center shadow-lg">
                  <Icon size={28} className="text-white" />
                </div>
                <div className="text-cooperative-300 font-mono text-sm font-semibold">{step}</div>
                <h3 className={`text-lg font-bold text-white ${isTamil ? 'font-tamil' : ''}`}>{title}</h3>
                <p className={`text-navy-200 text-sm leading-relaxed ${isTamil ? 'font-tamil' : ''}`}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <div className="flex items-center gap-3 text-navy-300">
              <div className="h-px bg-navy-600 w-20" />
              <ArrowRight size={18} />
              <div className="h-px bg-navy-600 w-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy text-center mb-10">{t('landing.trust', lang)}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, en, ta, descEn, descTa }) => (
              <div key={en} className="card flex flex-col gap-3">
                <div className="w-10 h-10 bg-cooperative-50 rounded-btn flex items-center justify-center">
                  <Icon size={20} className="text-cooperative" />
                </div>
                <div>
                  <h3 className={`font-semibold text-navy text-sm ${isTamil ? 'font-tamil' : ''}`}>
                    {isTamil ? ta : en}
                  </h3>
                  <p className={`text-text-secondary text-xs mt-1 leading-relaxed ${isTamil ? 'font-tamil' : ''}`}>
                    {isTamil ? descTa : descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-cooperative-50 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className={`text-2xl font-bold text-navy mb-4 ${isTamil ? 'font-tamil' : ''}`}>
            {isTamil ? 'இன்றே தொடங்குங்கள்' : 'Get started today'}
          </h2>
          <p className={`text-text-secondary mb-8 ${isTamil ? 'font-tamil' : ''}`}>
            {isTamil
              ? 'வாடிக்கையாளர் அல்லது தொழிலாளராக பதிவு செய்யுங்கள்'
              : 'Register as a customer or a cooperative worker.'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3">
              <Users size={18} />
              {t('landing.bookNow', lang)}
            </Link>
            <Link to="/register?role=worker" className="btn-secondary text-base px-8 py-3">
              {t('landing.joinWorker', lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-navy-200 text-xs text-center sm:text-left">
              © 2024 SahakarVaani. A cooperative services platform prototype.
            </div>
            <div className="text-navy-300 text-xs text-center sm:text-right max-w-md">
              {t('landing.disclaimer', lang)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
