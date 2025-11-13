import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
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
import AdminDashboardPage from './pages/AdminDashboardPage' // Import AdminDashboardPage
import AdminScheduleManagementPage from './pages/AdminScheduleManagementPage' // Import AdminScheduleManagementPage
import AdminUserManagementPage from './pages/AdminUserManagementPage' // Import AdminUserManagementPage
import AdminAuditLogPage from './pages/AdminAuditLogPage' // Import AdminAuditLogPage
import AdminLeaveManagementPage from './pages/AdminLeaveManagementPage';
import EmailVerificationPage from './pages/EmailVerificationPage'; // Import EmailVerificationPage
import { useAuthStore } from './store/authStore'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'

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

import Navbar from './components/Navbar'; // Import Navbar component

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
      <Navbar /> {/* Render Navbar component */}
      <Routes>
        <Route path="/login" element={<HospitalLoginPage />} />
        <Route path="/register" element={<HospitalRegisterPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} /> {/* New route for email verification */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/book" element={<ProtectedRoute><BookAppointmentPage /></ProtectedRoute>} />
        <Route path="/checkin" element={<ProtectedRoute><CheckInPage /></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><MedicalRecordsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/doctor/schedules" element={<ProtectedRoute><DoctorSchedulesPage /></ProtectedRoute>} />
        <Route path="/doctor/records" element={<ProtectedRoute><DoctorRecordsPage /></ProtectedRoute>} />
        <Route path="/doctor/leave" element={<ProtectedRoute><LeaveRequestPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboardPage /></ProtectedAdminRoute>} /> {/* Route for AdminDashboardPage */}
        <Route path="/admin/schedules" element={<ProtectedAdminRoute><AdminScheduleManagementPage /></ProtectedAdminRoute>} /> {/* Route for AdminScheduleManagementPage */}
        <Route path="/admin/leave-management" element={<ProtectedAdminRoute><AdminLeaveManagementPage /></ProtectedAdminRoute>} />
        <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUserManagementPage /></ProtectedAdminRoute>} /> {/* Route for AdminUserManagementPage */}
        <Route path="/admin/audit" element={<ProtectedAdminRoute><AdminAuditLogPage /></ProtectedAdminRoute>} /> {/* Route for AdminAuditLogPage */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        {/* The original /admin/account-management route is replaced by /admin/users */}
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
