import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout/AppLayout';

// Pages (lazy loaded for performance)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FederationDashboard from './pages/FederationDashboard';
import VoiceBookingPage from './pages/VoiceBookingPage';
import BookingListPage from './pages/BookingListPage';
import BookingDetailPage from './pages/BookingDetailPage';
import WorkerDirectoryPage from './pages/WorkerDirectoryPage';
import WorkerProfilePage from './pages/WorkerProfilePage';
import WorkerRegistrationPage from './pages/WorkerRegistrationPage';
import PaymentsPage from './pages/PaymentsPage';
import RatingsDisputesPage from './pages/RatingsDisputesPage';
import FairAllocationPage from './pages/FairAllocationPage';
import DemandForecastPage from './pages/DemandForecastPage';
import WelfarePage from './pages/WelfarePage';
import SettingsPage from './pages/SettingsPage';

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  switch (user.role) {
    case 'customer': return <Navigate to="/customer/dashboard" />;
    case 'worker': return <Navigate to="/worker/dashboard" />;
    case 'coop_admin': return <Navigate to="/admin/dashboard" />;
    case 'federation_admin': return <Navigate to="/federation/dashboard" />;
    default: return <Navigate to="/" />;
  }
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Dashboard redirect */}
      <Route path="/dashboard" element={<RequireAuth><DashboardRedirect /></RequireAuth>} />

      {/* Protected app routes inside layout */}
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        {/* Customer */}
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/book" element={<VoiceBookingPage />} />
        <Route path="/customer/bookings" element={<BookingListPage />} />
        <Route path="/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/workers" element={<WorkerDirectoryPage />} />
        <Route path="/workers/:id" element={<WorkerProfilePage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/ratings" element={<RatingsDisputesPage />} />
        <Route path="/welfare" element={<WelfarePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Worker */}
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/worker/register" element={<WorkerRegistrationPage />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/allocation" element={<FairAllocationPage />} />
        <Route path="/admin/forecast" element={<DemandForecastPage />} />

        {/* Federation */}
        <Route path="/federation/dashboard" element={<FederationDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
