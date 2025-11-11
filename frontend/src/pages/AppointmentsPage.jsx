import React, { useState, useEffect } from 'react';
// import { getPatientAppointments, cancelAppointment } from '../services/appointmentService'; // To be adapted
// import { Appointment, AppointmentStatus } from '../types'; // To be defined or use generic types
// import { mockAppointments } from '../utils/mockData'; // To be copied or created
import './AppointmentsPage.css';
import api from '../api/axios'; // Use existing axios instance

// Mock data for appointments (temporary)
const mockAppointments = [
  {
    appointment_id: 'apt001',
    doctor_name: 'Dr. Chen',
    specialty: 'Family Medicine',
    date: '2025-12-01',
    time_period: '09:00-09:30',
    status: 'scheduled',
  },
  {
    appointment_id: 'apt002',
    doctor_name: 'Dr. Lin',
    specialty: 'Pediatrics',
    date: '2025-11-10',
    time_period: '14:00-14:30',
    status: 'completed',
  },
  {
    appointment_id: 'apt003',
    doctor_name: 'Dr. Wang',
    specialty: 'Dermatology',
    date: '2025-12-15',
    time_period: '10:00-10:30',
    status: 'confirmed',
  },
];

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      // TODO: Integrate with actual API endpoint for fetching patient appointments
      // const response = await api.get('/api/v1/patient/appointments');
      // setAppointments(response.data);

      // Using mock data for now
      setTimeout(() => {
        setAppointments(mockAppointments);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('載入預約失敗:', error);
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('確定要取消此預約嗎？')) {
      return;
    }

    try {
      // TODO: Integrate with actual API endpoint for canceling appointment
      // await api.post(`/api/v1/patient/appointments/${appointmentId}/cancel`);
      alert('取消預約成功 (Mock)'); // Mock success
      loadAppointments();
    } catch (error) {
      alert('取消預約失敗 (Mock)'); // Mock failure
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: { label: '已預約', class: 'badge-info' },
      confirmed: { label: '已確認', class: 'badge-success' },
      waitlist: { label: '候補', class: 'badge-warning' },
      cancelled: { label: '已取消', class: 'badge-danger' },
      checked_in: { label: '已報到', class: 'badge-success' },
      waiting: { label: '候診中', class: 'badge-info' },
      called: { label: '已叫號', class: 'badge-warning' },
      in_consult: { label: '看診中', class: 'badge-info' },
      completed: { label: '已完成', class: 'badge-success' },
      no_show: { label: '未到診', class: 'badge-danger' },
    };
    const statusInfo = statusMap[status] || { label: status, class: 'badge-info' };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'upcoming') return aptDate >= today;
    if (filter === 'past') return aptDate < today;
    return true;
  });

  if (loading) {
    return (
      <div className="container">
        <div className="loading">載入中...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">我的預約</h1>
        <p className="page-subtitle">查看和管理您的預約記錄</p>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button
          className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          未來預約
        </button>
        <button
          className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          歷史記錄
        </button>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6c757d' /* var(--text-medium) */ }}>
            目前沒有預約記錄
          </p>
        </div>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map((apt) => (
            <div key={apt.appointment_id} className="card appointment-card">
              <div className="appointment-header">
                <div>
                  <h3>{apt.doctor_name || '醫師'}</h3>
                  <p className="appointment-specialty">{apt.specialty}</p>
                </div>
                {getStatusBadge(apt.status)}
              </div>

              <div className="appointment-details">
                <div className="detail-item">
                  <span className="detail-label">預約日期：</span>
                  <span>{new Date(apt.date).toLocaleDateString('zh-TW')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">時段：</span>
                  <span>{apt.time_period}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">預約編號：</span>
                  <span>{apt.appointment_id}</span>
                </div>
              </div>

              {['scheduled', 'confirmed', 'waitlist'].includes(apt.status) && (
                <div className="appointment-actions">
                  <button
                    className="btn btn-danger"
                    onClick={() => handleCancel(apt.appointment_id)}
                  >
                    取消預約
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
