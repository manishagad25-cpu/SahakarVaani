import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Mic, CalendarDays, Users, CreditCard, Star,
  Settings, LogOut, ChevronLeft, ChevronRight, Shield, TrendingUp,
  BarChart3, Heart, Globe, Menu, X, Scale, Wrench, Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { t } from '../../i18n/strings';
import clsx from 'clsx';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles: string[];
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    // Customer
    { to: '/customer/dashboard', icon: <LayoutDashboard size={18} />, label: t('nav.dashboard', lang), roles: ['customer'] },
    { to: '/customer/book', icon: <Mic size={18} />, label: t('nav.bookService', lang), roles: ['customer'] },
    { to: '/customer/bookings', icon: <CalendarDays size={18} />, label: t('nav.myBookings', lang), roles: ['customer'] },
    // Worker
    { to: '/worker/dashboard', icon: <LayoutDashboard size={18} />, label: t('nav.dashboard', lang), roles: ['worker'] },
    // Admin
    { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: t('nav.dashboard', lang), roles: ['coop_admin'] },
    { to: '/admin/allocation', icon: <Scale size={18} />, label: t('nav.allocation', lang), roles: ['coop_admin'] },
    { to: '/admin/forecast', icon: <TrendingUp size={18} />, label: t('nav.forecast', lang), roles: ['coop_admin'] },
    // Federation
    { to: '/federation/dashboard', icon: <Building2 size={18} />, label: t('nav.federation', lang), roles: ['federation_admin'] },
    // Shared
    { to: '/workers', icon: <Users size={18} />, label: t('nav.workers', lang), roles: ['customer', 'coop_admin', 'federation_admin'] },
    { to: '/payments', icon: <CreditCard size={18} />, label: t('nav.payments', lang), roles: ['customer', 'worker', 'coop_admin'] },
    { to: '/ratings', icon: <Star size={18} />, label: t('nav.ratings', lang), roles: ['customer', 'worker', 'coop_admin'] },
    { to: '/welfare', icon: <Heart size={18} />, label: t('nav.welfare', lang), roles: ['worker', 'coop_admin', 'federation_admin'] },
    { to: '/settings', icon: <Settings size={18} />, label: t('nav.settings', lang), roles: ['customer', 'worker', 'coop_admin', 'federation_admin'] },
  ];

  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleBadgeColor: Record<string, string> = {
    customer: 'bg-info text-white',
    worker: 'bg-cooperative text-white',
    coop_admin: 'bg-navy text-white',
    federation_admin: 'bg-saffron text-white',
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx("flex items-center gap-3 px-4 py-4 border-b border-navy-600", collapsed && "justify-center")}>
        <div className="w-9 h-9 rounded-btn bg-cooperative flex items-center justify-center flex-shrink-0">
          <Mic size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-bold text-base leading-tight">SahakarVaani</div>
            <div className="text-navy-200 text-[10px] leading-tight font-tamil">சஹாகார்வாணி</div>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-navy-600">
          <div className="text-white font-semibold text-sm truncate">{user.full_name}</div>
          <div className="text-navy-200 text-xs truncate">{user.email}</div>
          <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block", roleBadgeColor[user.role] || 'bg-gray-500 text-white')}>
            {user.role.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx("sidebar-link", isActive && "active", collapsed && "justify-center px-2")
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-navy-600 space-y-1">
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
          className={clsx("sidebar-link w-full", collapsed && "justify-center px-2")}
          title="Toggle language"
        >
          <Globe size={16} />
          {!collapsed && <span className="text-xs">{lang === 'en' ? 'தமிழ்' : 'English'}</span>}
        </button>
        <button
          onClick={handleLogout}
          className={clsx("sidebar-link w-full text-red-300 hover:text-white hover:bg-red-700", collapsed && "justify-center px-2")}
          title={t('nav.logout', lang)}
        >
          <LogOut size={16} />
          {!collapsed && <span>{t('nav.logout', lang)}</span>}
        </button>
        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link w-full justify-center hidden lg:flex"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — Desktop */}
      <aside
        className={clsx(
          "hidden lg:flex flex-col bg-navy transition-all duration-200 flex-shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar — Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 w-64 h-full bg-navy flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-surface border-b border-border shadow-nav flex items-center justify-between px-4 h-14 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden btn-ghost p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <Link to="/" className="flex items-center gap-2 text-navy font-semibold text-sm">
              <Shield size={16} className="text-cooperative" />
              <span className="hidden sm:inline">SahakarVaani</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              {lang === 'en' ? 'தமிழ்' : 'English'}
            </button>
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold">
                  {user.full_name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-text-primary hidden md:inline">{user.full_name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
