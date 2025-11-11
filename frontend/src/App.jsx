import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import HospitalLoginPage from './pages/HospitalLoginPage'
import HospitalRegisterPage from './pages/HospitalRegisterPage'
import { useAuthStore } from './store/authStore'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import AccountManagementPage from './components/AccountManagementPage'
import { decodeToken } from './utils/auth'

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

  const decodedToken = accessToken ? decodeToken(accessToken) : null;
  const isAdmin = decodedToken && decodedToken.role === 'admin';

  return (
    <>
      {/* Removed navigation links and buttons */}
      <Routes>
        <Route path="/login" element={<HospitalLoginPage />} />
        <Route path="/register" element={<HospitalRegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/account-management" element={<ProtectedAdminRoute><AccountManagementPage /></ProtectedAdminRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
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
