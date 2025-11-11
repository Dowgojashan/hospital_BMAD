import React, { useState, useEffect } from 'react';
import { getPatientAppointments } from '../services/appointmentService';
import { onlineCheckIn, getQueueStatus } from '../services/checkInService';
import { Appointment, QueueStatus } from '../types';
import { getCurrentUser } from '../services/authService';
import { mockAppointments, mockQueueStatus } from '../utils/mockData';
import './CheckIn.css';

const CheckIn: React.FC = () => {
  const user = getCurrentUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (selectedAppointment) {
      loadQueueStatus();
      const interval = setInterval(loadQueueStatus, 30000); // 每30秒更新一次
      return () => clearInterval(interval);
    }
  }, [selectedAppointment]);

  const loadAppointments = async () => {
    try {
      // TODO: 未來使用 API
      // const data = await getPatientAppointments();
      // const today = new Date().toISOString().split('T')[0];
      // const todayAppointments = data.filter(
      //   (apt) => apt.date === today && ['confirmed', 'scheduled'].includes(apt.status)
      // );
      // setAppointments(todayAppointments);
      
      // 測試用：使用假資料
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = mockAppointments.filter(
        (apt) => apt.date === today && ['confirmed', 'scheduled', 'checked_in'].includes(apt.status)
      );
      setAppointments(todayAppointments);
    } catch (error) {
      console.error('載入預約失敗:', error);
    }
  };

  const loadQueueStatus = async () => {
    if (!selectedAppointment) return;

    try {
      // TODO: 未來使用 API
      // const status = await getQueueStatus(selectedAppointment.appointment_id);
      // setQueueStatus(status);
      
      // 測試用：使用假資料
      setQueueStatus(mockQueueStatus);
    } catch (error) {
      console.error('載入候診資訊失敗:', error);
    }
  };

  const handleOnlineCheckIn = async () => {
    if (!selectedAppointment) return;

    setError('');
    setLoading(true);

    try {
      await onlineCheckIn(selectedAppointment.appointment_id);
      alert('報到成功！');
      loadAppointments();
      loadQueueStatus();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || '報到失敗';
      setError(errorMsg);
      if (errorMsg.includes('限制') || errorMsg.includes('suspended')) {
        alert('您的帳號目前限制線上報到，請至現場機台報到');
      }
    } finally {
      setLoading(false);
    }
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
          <p style={{ textAlign: 'center', color: 'var(--text-medium)' }}>
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
                  <span className="badge badge-info">{apt.status === 'checked_in' ? '已報到' : '未報到'}</span>
                </div>
              ))}
            </div>

            {selectedAppointment && (
              <div className="checkin-actions">
                {selectedAppointment.status !== 'checked_in' && !isSuspended && (
                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleOnlineCheckIn}
                    disabled={loading}
                  >
                    {loading ? '報到中...' : '線上報到'}
                  </button>
                )}
                {selectedAppointment.status === 'checked_in' && (
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
    </div>
  );
};

export default CheckIn;

