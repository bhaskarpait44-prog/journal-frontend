import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { setNavigate } from './lib/api';

// Layouts
import AppShell from './components/layout/AppShell';
import AdminLayout from './admin/components/AdminLayout.jsx';

// Pages
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Pricing from './pages/Pricing.jsx';
import Payment from './pages/Payment.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Trades from './pages/Trades.jsx';
import AddTrade from './pages/AddTrade.jsx';
import Analytics from './pages/Analytics.jsx';
import Psychology from './pages/Psychology.jsx';
import Calendar from './pages/Calendar.jsx';
import Export from './pages/Export.jsx';
import Profile from './pages/Profile.jsx';
import Risk from './pages/Risk.jsx';

// Admin Pages
import AdminDashboard from './admin/views/AdminDashboard.jsx';
import AdminUsers from './admin/views/AdminUsers.jsx';
import AdminSubscriptions from './admin/views/AdminSubscriptions.jsx';
import AdminPayments from './admin/views/AdminPayments.jsx';
import AdminTrades from './admin/views/AdminTrades.jsx';
import AdminAnalytics from './admin/views/AdminAnalytics.jsx';
import AdminSettings from './admin/views/AdminSettings.jsx';

// Route Guards
const PublicRoute = ({ children }) => {
  const { isLoggedIn, hasSub } = useAuthStore();
  if (isLoggedIn()) {
    return <Navigate to={hasSub() ? '/dashboard' : '/pricing'} replace />;
  }
  return children;
};

const ProtectedRoute = ({ children, requiresSub = true }) => {
  const { isLoggedIn, hasSub } = useAuthStore();
  if (!isLoggedIn()) return <Navigate to="/landing" replace />;
  if (requiresSub && !hasSub()) return <Navigate to="/pricing" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isLoggedIn, isAdmin } = useAuthStore();
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
};

// Hook to set navigate in API lib
const ApiNavigateSetter = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);
  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      {/* <ApiNavigateSetter /> - need to import useNavigate but can only be inside BrowserRouter */}
      <AppRoutes />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

import { useNavigate } from 'react-router-dom';

function AppRoutes() {
  const navigate = useNavigate();
  React.useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return (
    <Routes>
      <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pricing" element={<ProtectedRoute requiresSub={false}><Pricing /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute requiresSub={false}><Payment /></ProtectedRoute>} />

      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="trades" element={<Trades />} />
        <Route path="add-trade" element={<AddTrade />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="psychology" element={<Psychology />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="export" element={<Export />} />
        <Route path="profile" element={<Profile />} />
        <Route path="risk" element={<Risk />} />
      </Route>

      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="trades" element={<AdminTrades />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
