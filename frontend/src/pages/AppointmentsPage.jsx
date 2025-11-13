import React, { useState, useEffect } from 'react';
import './AppointmentsPage.css';
import api from '../api/axios'; // Use existing axios instance

const TIME_PERIOD_OPTIONS = [
  { value: "morning", label: "上午診" },
  { value: "afternoon", label: "下午診" },
  { value: "night", label: "夜間診" },
];

// Generic Message Modal Component (copied from BookAppointmentPage.jsx)
const MessageModal = ({ show, onClose, message, type }) => {
  if (!show) {
    return null;
  }

  const modalTitle = type === 'success' ? '操作成功！' : '操作失敗！'; // Changed title to be more generic
  const titleClass = type === 'success' ? 'modal-title-success' : 'modal-title-error';

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className={titleClass}>{modalTitle}</h2>
        <p>{message}</p>
        <button onClick={onClose} className={`btn ${type === 'success' ? 'btn-primary' : 'btn-danger'}`}>關閉</button>
      </div>
    </div>
  );
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // States for modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState(''); // Generic message for modal

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setModalMessage(''); // Clear previous messages
    setShowErrorModal(false); // Clear previous error modal
    try {
      const response = await api.get('/api/v1/patient/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('載入預約失敗:', error);
      setModalMessage(error.response?.data?.detail || '載入預約失敗，請稍後再試。');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('確定要取消此預約嗎？')) {
      return;
    }

    setLoading(true);
    setModalMessage('');
    setShowSuccessModal(false);
    setShowErrorModal(false);

    try {
      const response = await api.delete(`/api/v1/patient/appointments/${appointmentId}`);
      setModalMessage(response.data.message || '預約已成功取消！');
      setShowSuccessModal(true);
      loadAppointments(); // Reload appointments to reflect the cancellation
    } catch (error) {
      console.error('取消預約失敗:', error);
      setModalMessage(error.response?.data?.detail || '取消預約失敗，請稍後再試。');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
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

  const getTimePeriodLabel = (value) => {
    const option = TIME_PERIOD_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'upcoming') return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no_show';
    if (filter === 'past') return aptDate < today || apt.status === 'cancelled' || apt.status === 'completed' || apt.status === 'no_show';
    return true;
  });

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage('');
  };

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
                  <h3>{apt.specialty}</h3>
                  <p className="appointment-doctor-name">{apt.doctor_name || '醫師'}</p>
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
                  <span>{getTimePeriodLabel(apt.time_period)}</span>
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

      <MessageModal
        show={showSuccessModal}
        onClose={handleCloseModal}
        message={modalMessage}
        type="success"
      />
      <MessageModal
        show={showErrorModal}
        onClose={handleCloseModal}
        message={modalMessage}
        type="error"
      />
    </div>
  );
};

export default AppointmentsPage;
