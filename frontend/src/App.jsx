import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
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
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #eee' }}>
        <div>
          {accessToken && (
            <>
              <Link to="/dashboard" style={{ marginRight: '15px' }}>Dashboard</Link>
              {isAdmin && <Link to="/admin/account-management" style={{ marginRight: '15px' }}>Admin Management</Link>}
            </>
          )}
        </div>
        <div>
          {accessToken ? (
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>登出</button>
          ) : (
            <Link to="/login">登入</Link>
          )}
        </div>
      </div>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
