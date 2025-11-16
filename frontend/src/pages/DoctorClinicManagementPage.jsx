import React, { useState, useEffect } from 'react';
import './DoctorClinicManagementPage.css';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import MedicalRecordForm from '../components/MedicalRecordForm'; // Import MedicalRecordForm

const TIME_PERIOD_OPTIONS = {
  "morning": "上午診",
  "afternoon": "下午診",
  "night": "夜間診",
};

const getTranslatedStatus = (status) => {
  switch (status) {
    case 'checked_in':
      return '已報到';
    case 'no_show':
      return '未到診';
    case 'seen':
      return '已看診';
    default:
      return status;
  }
};

const DoctorClinicManagementPage = () => {
  const user = useAuthStore((s) => s.user);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [queueStatus, setQueueStatus] = useState({});
  const [waitingPatients, setWaitingPatients] = useState({});
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  useEffect(() => {
    if (user && user.id) {
      loadTodaySchedules();
      const interval = setInterval(() => {
        loadQueueStatusForAllSchedules();
        loadWaitingPatientsForAllSchedules();
      }, 10000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
      setMessage('無法載入診間管理資訊，請確認您已登入為醫生。');
    }
  }, [user?.id]);

  const loadTodaySchedules = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await api.get(`/api/v1/doctor/schedules`, {
        params: {
          doctor_id: user.id,
          date_str: today,
        },
      });
      setTodaySchedules(response.data);
      setMessage('');
      loadQueueStatusForAllSchedules(response.data);
      loadWaitingPatientsForAllSchedules(response.data);
    } catch (error) {
      console.error('載入今日班表失敗:', error);
      setMessage('載入今日班表失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const loadQueueStatusForAllSchedules = async (schedules = todaySchedules) => {
    if (!schedules.length) return;

    const newQueueStatus = {};
    for (const schedule of schedules) {
      try {
        const response = await api.get(`/api/v1/doctor/schedules/${schedule.schedule_id}/queue-status`);
        newQueueStatus[schedule.schedule_id] = response.data;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          newQueueStatus[schedule.schedule_id] = {
            current_number: 'N/A',
            waiting_count: 0,
            estimated_wait_time: 0,
            clinic_status: '未開診',
          };
        } else {
          console.error(`載入 ${schedule.schedule_id} 候診資訊失敗:`, error);
          newQueueStatus[schedule.schedule_id] = {
            current_number: '錯誤',
            waiting_count: '錯誤',
            estimated_wait_time: '錯誤',
            clinic_status: '錯誤',
          };
        }
      }
    }
    setQueueStatus(newQueueStatus);
  };

  const loadWaitingPatientsForAllSchedules = async (schedules = todaySchedules) => {
    if (!schedules.length) return;

    const newWaitingPatients = {};
    for (const schedule of schedules) {
      try {
        const response = await api.get(`/api/v1/doctor/schedules/${schedule.schedule_id}/waiting-patients`);
        newWaitingPatients[schedule.schedule_id] = response.data;
      } catch (error) {
        console.error(`載入 ${schedule.schedule_id} 候診病患列表失敗:`, error);
        newWaitingPatients[schedule.schedule_id] = [];
      }
    }
    setWaitingPatients(newWaitingPatients);
  };

  const handleOpenClinic = async (scheduleId) => {
    setLoading(true);
    try {
      await api.post(`/api/v1/doctor/schedules/${scheduleId}/open-clinic`);
      alert('診間已開診！');
      setMessage('診間已開診！');
      loadTodaySchedules();
    } catch (error) {
      console.error('開診失敗:', error);
      alert('開診失敗，請稍後再試。');
      setMessage('開診失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseClinic = async (scheduleId) => {
    setLoading(true);
    try {
      await api.post(`/api/v1/doctor/schedules/${scheduleId}/close-clinic`);
      alert('診間已關診！');
      setMessage('診間已關診！');
      loadTodaySchedules();
    } catch (error) {
      console.error('關診失敗:', error);
      alert('關診失敗，請稍後再試。');
      setMessage('關診失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleCallNextPatient = async (scheduleId) => {
    const currentQueueStatus = queueStatus[scheduleId] || { waiting_count: 0 };
    if (currentQueueStatus.waiting_count === 0) {
      alert('現在無病患等候。');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/v1/doctor/schedules/${scheduleId}/call-next-patient`);
      alert('已叫號下一位病患！');
      setMessage('已叫號下一位病患！');
      loadTodaySchedules();
    } catch (error) {
      console.error('叫號失敗:', error);
      alert('叫號失敗，請稍後再試。');
      setMessage('叫號失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMedicalRecordForm = (patientId, recordId = null) => {
    setSelectedPatientId(patientId);
    setSelectedRecordId(recordId);
    setShowMedicalRecordForm(true);
  };

  const handleCloseMedicalRecordForm = () => {
    setShowMedicalRecordForm(false);
    setSelectedPatientId(null);
    setSelectedRecordId(null);
  };

  const handleMedicalRecordFormSuccess = () => {
    loadWaitingPatientsForAllSchedules();
    setMessage('病歷操作成功！');
  };

  const handleMedicalRecord = (patientId) => {
    handleOpenMedicalRecordForm(patientId);
  };

  const handleMarkNoShow = async (scheduleId, checkinId) => {
    if (!window.confirm('確定要將此病患標記為未到嗎？')) {
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/v1/doctor/schedules/${scheduleId}/checkins/${checkinId}/mark-no-show`);
      alert('病患已標記為未到！');
      setMessage('病患已標記為未到！');
      loadQueueStatusForAllSchedules();
      loadWaitingPatientsForAllSchedules();
    } catch (error) {
      console.error('標記未到失敗:', error);
      alert('標記未到失敗，請稍後再試。');
      setMessage('標記未到失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleReCheckIn = async (scheduleId, checkinId) => {
    if (!window.confirm('確定要為此病患進行補報到嗎？')) {
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/v1/doctor/schedules/${scheduleId}/checkins/${checkinId}/re-check-in`);
      alert('病患已成功補報到！');
      setMessage('病患已成功補報到！');
      loadQueueStatusForAllSchedules();
      loadWaitingPatientsForAllSchedules();
    } catch (error) {
      console.error('補報到失敗:', error);
      alert('補報到失敗，請稍後再試。');
      setMessage('補報到失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">載入中...</div>;
  }

  if (!user || user.role !== 'doctor') {
    return <div className="container">您沒有權限訪問此頁面。</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">醫生診間管理</h1>
        <p className="page-subtitle">管理您的今日班表和候診病患</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h3>今日班表 ({format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhTW })})</h3>
        {todaySchedules.length === 0 ? (
          <p>今天沒有排班。</p>
        ) : (
          <div className="schedule-list">
            {todaySchedules.map((schedule) => {
              const currentQueueStatus = queueStatus[schedule.schedule_id] || {
                current_number: 'N/A',
                waiting_count: 0,
                estimated_wait_time: 0,
                clinic_status: '未開診',
              };
              const isClinicOpen = currentQueueStatus.clinic_status === '開診中';

              return (
                <div key={schedule.schedule_id} className="schedule-item">
                  <div className="schedule-details">
                    <div className="schedule-info">
                      <h4>{TIME_PERIOD_OPTIONS[schedule.time_period]}</h4>
                      <p>預約人數: {schedule.booked_patients} / {schedule.max_patients}</p>
                      <p>診間狀態: <strong>{currentQueueStatus.clinic_status}</strong></p>
                    </div>
                    <div className="queue-info">
                      <p>目前叫號: {currentQueueStatus.current_number}</p>
                      <p>前方等待: {currentQueueStatus.waiting_count} 人</p>
                      <p>預估等待: {currentQueueStatus.estimated_wait_time} 分鐘</p>
                    </div>
                  </div>

                  <div className="schedule-actions">
                    {!isClinicOpen ? (
                      <button className="btn btn-dark" onClick={() => handleOpenClinic(schedule.schedule_id)}>開診</button>
                    ) : (
                      <>
                        <button className="btn btn-dark" onClick={() => handleCallNextPatient(schedule.schedule_id)}>叫號</button>
                        <button className="btn btn-dark" onClick={() => handleCloseClinic(schedule.schedule_id)}>關診</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h3>候診病患列表</h3>
        {todaySchedules.length === 0 ? (
          <p>今天沒有排班，因此沒有候診病患。</p>
        ) : (
          <div className="waiting-patients-list">
            {todaySchedules.map((schedule) => (
              <div key={schedule.schedule_id} className="schedule-waiting-list-section">
                <h4>{TIME_PERIOD_OPTIONS[schedule.time_period]} 候診病患</h4>

                {waitingPatients[schedule.schedule_id] &&
                waitingPatients[schedule.schedule_id].length > 0 ? (
                  <ul>
                    {waitingPatients[schedule.schedule_id].map((patient, index) => (
                      <li key={index} className="waiting-patient-item">
                        <div className="patient-info">
                          <span className={`status-label status-${patient.status}`}>
                            {getTranslatedStatus(patient.status)}
                          </span>
                          <span>號碼牌: {patient.ticket_number}</span>
                          <span>姓名: {patient.patient_name}</span>
                          <span>
                            報到時間:{' '}
                            {new Date(patient.checkin_time).toLocaleTimeString('zh-TW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="patient-actions">
                          <button
                            className="btn btn-info btn-sm"
                            onClick={() => handleMedicalRecord(patient.patient_id)}
                          >
                            病歷管理
                          </button>

                          {patient.status === 'no_show' ? (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() =>
                                handleReCheckIn(schedule.schedule_id, patient.checkin_id)
                              }
                            >
                              補報到
                            </button>
                          ) : (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                handleMarkNoShow(schedule.schedule_id, patient.checkin_id)
                              }
                            >
                              未到
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>目前沒有候診病患。</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showMedicalRecordForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <MedicalRecordForm
              patientId={selectedPatientId}
              recordId={selectedRecordId}
              onClose={handleCloseMedicalRecordForm}
              onSuccess={handleMedicalRecordFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorClinicManagementPage;
