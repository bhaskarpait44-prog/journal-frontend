import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { setNavigate } from './lib/api';

// Layouts
import AppShell from './components/layout/AppShell';

// Pages
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Trades from './pages/Trades.jsx';
import AddTrade from './pages/AddTrade.jsx';
import Analytics from './pages/Analytics.jsx';
import Psychology from './pages/Psychology.jsx';
import Calendar from './pages/Calendar.jsx';
import Export from './pages/Export.jsx';
import Profile from './pages/Profile.jsx';
import Risk from './pages/Risk.jsx';
import TradeDetail from './pages/TradeDetail.jsx';

// Route Guards
const PublicRoute = ({ children }) => {
  const token = useAuthStore(s => s.token);
  const isLoggedIn = !!token;
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;
  return children;
};

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore(s => s.token);
  const isLoggedIn = !!token;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  const currentTheme = useThemeStore((s) => s.theme);

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 12,
          fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
        },
        components: {
          Card: {
            colorBgContainer: currentTheme === 'dark' ? '#0d1525' : '#ffffff',
          },
          Input: {
            colorBgContainer: currentTheme === 'dark' ? '#0a1220' : '#f8fafc',
          },
          Select: {
            colorBgContainer: currentTheme === 'dark' ? '#0a1220' : '#f8fafc',
          },
        }
      }}
    >
      <BrowserRouter>
        <AppRoutes />
        <Toaster 
          position="top-center" 
          richColors
          theme={currentTheme === 'dark' ? 'dark' : 'light'}
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontFamily: "'Inter', sans-serif",
            }
          }}
        />
      </BrowserRouter>
    </ConfigProvider>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  React.useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return (
    <>
      <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="trades" element={<Trades />} />
        <Route path="trades/:id" element={<TradeDetail />} />
        <Route path="add-trade" element={<AddTrade />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="psychology" element={<Psychology />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="export" element={<Export />} />
        <Route path="profile" element={<Profile />} />
        <Route path="risk" element={<Risk />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
