import React, { useState, useEffect } from 'react';
// import { getPatientAppointments } from '../services/appointmentService'; // To be adapted
// import { onlineCheckIn, getQueueStatus } from '../services/checkInService'; // To be adapted
// import { Appointment, QueueStatus } from '../types'; // To be defined or use generic types
// import { getCurrentUser } from '../services/authService'; // To be adapted
// import { mockAppointments, mockQueueStatus } from '../utils/mockData'; // To be copied or created
import './CheckInPage.css';
import api from '../api/axios'; // Use existing axios instance
import { useAuthStore } from '../store/authStore'; // Use existing auth store

// Helper function to extract and format error messages
const getErrorMessage = (error, defaultMessage) => {
  if (error.response && error.response.data && error.response.data.detail) {
    const detail = error.response.data.detail;
    if (Array.isArray(detail)) {
      // FastAPI validation errors are often an array of objects
      return detail.map(d => d.msg).join('; ');
    } else if (typeof detail === 'string') {
      return detail;
    } else if (typeof detail === 'object' && detail.msg) {
      return detail.msg;
    }
  }
  return defaultMessage;
};

// Generic Message Modal Component
const MessageModal = ({ show, onClose, message, type }) => {
  if (!show) {
    return null;
  }

  const modalTitle = type === 'success' ? '操作成功！' : '操作失敗！';
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

const CheckInPage = () => {
  const user = useAuthStore((s) => s.user); // Get user from auth store
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // States for modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState(''); // Generic message for modal

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (selectedAppointment) {
      loadQueueStatus();
      const interval = setInterval(loadQueueStatus, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedAppointment]);

  const loadAppointments = async () => {
    try {
      const response = await api.get('/api/v1/patient/appointments');
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = response.data.filter(
        (apt) => apt.date === today && ['confirmed', 'scheduled', 'checked_in', 'no_show'].includes(apt.status)
      );
      setAppointments(todayAppointments);
    } catch (error) {
      console.error('載入預約失敗:', error);
      setModalMessage(getErrorMessage(error, '載入預約失敗，請稍後再試。'));
      setShowErrorModal(true);
    }
  };

  const loadQueueStatus = async () => {
    if (!selectedAppointment) return;

    try {
      const response = await api.get(`/api/v1/checkin/queue/${selectedAppointment.appointment_id}`);
      setQueueStatus(response.data);
    } catch (error) {
      console.error('載入候診資訊失敗:', error);
      setModalMessage(getErrorMessage(error, '載入候診資訊失敗，請稍後再試。'));
      setShowErrorModal(true);
    }
  };

  const handleOnlineCheckIn = async () => {
    if (!selectedAppointment) return;

    setError('');
    setLoading(true);
    setModalMessage('');
    setShowSuccessModal(false);
    setShowErrorModal(false);

    try {
      await api.post(`/api/v1/checkin/${selectedAppointment.appointment_id}`);
      setModalMessage('報到成功！');
      setShowSuccessModal(true);
      loadAppointments();
      loadQueueStatus();
    } catch (err) {
      const errorMsg = getErrorMessage(err, '報到失敗，請稍後再試。');
      setModalMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage('');
  };

  const isSuspended = user?.suspended_until && new Date(user.suspended_until) > new Date();

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">報到服務</h1>
        <p className="page-subtitle">線上報到或查看候診資訊</p>
      </div>

      {isSuspended && (
        <div className="alert alert-warning">
          <strong>注意：</strong>您的帳號目前限制線上報到，請至現場機台報到。
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {appointments.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6c757d' /* var(--text-medium) */ }}>
            今天沒有可報到的預約
          </p>
        </div>
      ) : (
        <>
          <div className="card">
            <h3>選擇預約</h3>
            <div className="appointments-select">
              {appointments.map((apt) => (
                <div
                  key={apt.appointment_id}
                  className={`appointment-option ${
                    selectedAppointment?.appointment_id === apt.appointment_id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedAppointment(apt)}
                >
                  <div>
                    <strong>{apt.doctor_name}</strong>
                    <p>{apt.specialty} - {apt.time_period}</p>
                  </div>
                  <span className="badge badge-info">
                    {apt.status === 'checked_in' ? '已報到' : apt.status === 'no_show' ? '未到診' : '未報到'}
                  </span>
                </div>
              ))}
            </div>

            {selectedAppointment && (
              <div className="checkin-actions">
                {selectedAppointment.status === 'no_show' ? (
                  <p className="text-danger">您已被標記為未到診，請聯繫診所進行補報到。</p>
                ) : selectedAppointment.status !== 'checked_in' && !isSuspended ? (
                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleOnlineCheckIn}
                    disabled={loading}
                  >
                    {loading ? '報到中...' : '線上報到'}
                  </button>
                ) : selectedAppointment.status === 'checked_in' && (
                  <p className="text-success">✓ 已報到</p>
                )}
              </div>
            )}
          </div>

          {selectedAppointment && queueStatus && (
            <div className="card queue-status-card">
              <h3>候診資訊</h3>
              <div className="queue-info">
                <div className="queue-item">
                  <span className="queue-label">目前看診號碼：</span>
                  <span className="queue-value">{queueStatus.current_number}</span>
                </div>
                <div className="queue-item">
                  <span className="queue-label">您的號碼：</span>
                  <span className="queue-value">{queueStatus.my_position}</span>
                </div>
                <div className="queue-item">
                  <span className="queue-label">前方等候人數：</span>
                  <span className="queue-value">{queueStatus.waiting_count}</span>
                </div>
                <div className="queue-item">
                  <span className="queue-label">預估等待時間：</span>
                  <span className="queue-value">{queueStatus.estimated_wait_time} 分鐘</span>
                </div>
              </div>
            </div>
          )}
        </>
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

export default CheckInPage;
