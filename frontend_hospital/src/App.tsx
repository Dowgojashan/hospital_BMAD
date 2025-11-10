import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';
import CheckIn from './pages/CheckIn';
import Schedules from './pages/Schedules';
import MedicalRecords from './pages/MedicalRecords';
import Profile from './pages/Profile';
import Dashboard from './pages/admin/Dashboard';
import ScheduleManagement from './pages/admin/ScheduleManagement';
import UserManagement from './pages/admin/UserManagement';
import AuditLogPage from './pages/admin/AuditLog';
import DoctorSchedules from './pages/doctor/DoctorSchedules';
import LeaveRequest from './pages/doctor/LeaveRequest';
import DoctorRecords from './pages/doctor/DoctorRecords';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book"
            element={
              <ProtectedRoute>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkin"
            element={
              <ProtectedRoute>
                <CheckIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedules"
            element={
              <ProtectedRoute>
                <Schedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/records"
            element={
              <ProtectedRoute>
                <MedicalRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* 管理員路由 */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/schedules"
            element={
              <ProtectedRoute>
                <ScheduleManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />
          {/* 醫師路由 */}
          <Route
            path="/doctor/schedules"
            element={
              <ProtectedRoute>
                <DoctorSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/leave"
            element={
              <ProtectedRoute>
                <LeaveRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/records"
            element={
              <ProtectedRoute>
                <DoctorRecords />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
