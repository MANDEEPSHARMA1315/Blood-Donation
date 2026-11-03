import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import DemoAccountsBar from './components/DemoAccountsBar';

// Pages
import DashboardPage from './pages/DashboardPage';
import CampsPage from './pages/CampsPage';
import CampDetailPage from './pages/CampDetailPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import VolunteerShiftsPage from './pages/VolunteerShiftsPage';
import CampOperationsPage from './pages/CampOperationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* 1-Click Demo Evaluation Bar */}
      <DemoAccountsBar />

      {/* Main Sticky Navbar */}
      <Navbar />

      {/* Page Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/camps"} replace />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/camps" element={<CampsPage />} />
          <Route path="/camps/:id" element={<CampDetailPage />} />
          <Route
            path="/my-appointments"
            element={
              <ProtectedRoute allowedRoles={['donor', 'admin', 'coordinator']}>
                <MyAppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer-shifts"
            element={
              <ProtectedRoute allowedRoles={['volunteer', 'coordinator', 'admin']}>
                <VolunteerShiftsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/camp-operations"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <CampOperationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/camp-operations/:campId"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <CampOperationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 BloodLink — Blood Donation Camp Coordination System. All rights reserved.</p>
          <p className="text-[11px] text-slate-400">
            Dedicated to community health, voluntary blood donation & operational safety.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
