import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scheduler from './pages/Scheduler';
import BookAppointment from './pages/BookAppointment';
import AppointmentList from './pages/AppointmentList';
import StaffManagement from './pages/StaffManagement';
import AuditLogs from './pages/AuditLogs';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                borderRadius: '5px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px'
              }
            }}
          />
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Clinical Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/scheduler"
                element={
                  <ProtectedRoute>
                    <Scheduler />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/book"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'RECEPTIONIST']}>
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <AppointmentList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/staff"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <StaffManagement />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
