import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import PatientDashboard from './pages/patient/Dashboard'
import PatientAppointments from './pages/patient/Appointments'
import PatientSchedule from './pages/patient/Schedule'
import PatientCheckin from './pages/patient/Checkin'
import PatientMedicalRecords from './pages/patient/MedicalRecords'
import DoctorDashboard from './pages/doctor/Dashboard'
import DoctorSchedule from './pages/doctor/Schedule'
import DoctorLeaveRequest from './pages/doctor/LeaveRequest'
import DoctorMedicalRecords from './pages/doctor/MedicalRecords'
import AdminDashboard from './pages/admin/Dashboard'
import AdminAccounts from './pages/admin/Accounts'
import AdminSchedules from './pages/admin/Schedules'
import AdminAuditLogs from './pages/admin/AuditLogs'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* 病患路由 */}
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/patient/appointments" element={<PatientAppointments />} />
            <Route path="/patient/schedule" element={<PatientSchedule />} />
            <Route path="/patient/checkin" element={<PatientCheckin />} />
            <Route path="/patient/medical-records" element={<PatientMedicalRecords />} />
            
            {/* 醫生路由 */}
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/schedule" element={<DoctorSchedule />} />
            <Route path="/doctor/leave-request" element={<DoctorLeaveRequest />} />
            <Route path="/doctor/medical-records" element={<DoctorMedicalRecords />} />
            
            {/* 管理員路由 */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/accounts" element={<AdminAccounts />} />
            <Route path="/admin/schedules" element={<AdminSchedules />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

