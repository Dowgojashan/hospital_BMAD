import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import HospitalLoginPage from './pages/HospitalLoginPage'
import HospitalRegisterPage from './pages/HospitalRegisterPage'
import HomePage from './pages/HomePage'
import AppointmentsPage from './pages/AppointmentsPage'
import BookAppointmentPage from './pages/BookAppointmentPage'
import CheckInPage from './pages/CheckInPage'
import MedicalRecordsPage from './pages/MedicalRecordsPage'
import ProfilePage from './pages/ProfilePage'
import DoctorSchedulesPage from './pages/DoctorSchedulesPage'
import DoctorRecordsPage from './pages/DoctorRecordsPage'
import LeaveRequestPage from './pages/LeaveRequestPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminScheduleManagementPage from './pages/AdminScheduleManagementPage'
import AdminUserManagementPage from './pages/AdminUserManagementPage'

import AdminLeaveManagementPage from './pages/AdminLeaveManagementPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DoctorClinicManagementPage from './pages/DoctorClinicManagementPage'; // Import DoctorClinicManagementPage
import { useAuthStore } from './store/authStore'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import Navbar from './components/Navbar';

function Dashboard() {
  console.info('Dashboard: render')
  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>
      <p>受保護的頁面 - 需要登入</p>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.accessToken)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AppContent() {
  console.info('AppContent: render')
  const navigate = useNavigate()
  const { accessToken, clearToken } = useAuthStore()

  const handleLogout = () => {
    clearToken()
    navigate('/login')
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<HospitalLoginPage />} />
        <Route path="/register" element={<HospitalRegisterPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/resend-verification" element={<ResendVerificationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/book" element={<ProtectedRoute><BookAppointmentPage /></ProtectedRoute>} />
        <Route path="/checkin" element={<ProtectedRoute><CheckInPage /></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><MedicalRecordsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/doctor/schedules" element={<ProtectedRoute><DoctorSchedulesPage /></ProtectedRoute>} />
        <Route path="/doctor/records/:patientId?" element={<ProtectedRoute><DoctorRecordsPage /></ProtectedRoute>} />
        <Route path="/doctor/leave" element={<ProtectedRoute><LeaveRequestPage /></ProtectedRoute>} />
        <Route path="/doctor/clinic-management" element={<ProtectedRoute><DoctorClinicManagementPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboardPage /></ProtectedAdminRoute>} />
        <Route path="/admin/schedules" element={<ProtectedAdminRoute><AdminScheduleManagementPage /></ProtectedAdminRoute>} />

        <Route path="/admin/leave-management" element={<ProtectedAdminRoute><AdminLeaveManagementPage /></ProtectedAdminRoute>} />
        <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUserManagementPage /></ProtectedAdminRoute>} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default function App() {
  console.info('App: render')
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}