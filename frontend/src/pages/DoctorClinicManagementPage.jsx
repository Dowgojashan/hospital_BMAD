import React, { useState, useEffect } from 'react';
import './DoctorClinicManagementPage.css';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const TIME_PERIOD_OPTIONS = {
  "morning": "上午診",
  "afternoon": "下午診",
  "night": "夜間診",
};

const DoctorClinicManagementPage = () => {
  const user = useAuthStore((s) => s.user);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [queueStatus, setQueueStatus] = useState({}); // {schedule_id: {current_number, waiting_count, estimated_wait_time}}

  useEffect(() => {
    if (user && user.id) {
      loadTodaySchedules();
      // Set up polling for queue status
      const interval = setInterval(loadQueueStatusForAllSchedules, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    } else {
      // If user or doctor_id is not available, ensure loading state is eventually false
      setLoading(false);
      setMessage('無法載入診間管理資訊，請確認您已登入為醫生。');
    }
  }, [user?.id]); // Changed dependency to user?.id

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
    } catch (error) {
      console.error('載入今日班表失敗:', error);
      setMessage('載入今日班表失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const loadQueueStatusForAllSchedules = async () => {
    if (!todaySchedules.length) return;

    const newQueueStatus = {};
    for (const schedule of todaySchedules) {
      try {
        const response = await api.get(`/api/v1/doctor/schedules/${schedule.schedule_id}/queue-status`);
        newQueueStatus[schedule.schedule_id] = response.data;
      } catch (error) {
        // If queue status not found (e.g., clinic not opened yet), it's a 404, just ignore or set default
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

  const handleOpenClinic = async (scheduleId) => {
    setLoading(true);
    try {
      await api.post(`/api/v1/doctor/schedules/${scheduleId}/open-clinic`);
      alert('診間已開診！');
      setMessage('診間已開診！');
      loadTodaySchedules(); // Reload schedules to update status
      loadQueueStatusForAllSchedules(); // Reload queue status
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
      loadTodaySchedules(); // Reload schedules to update status
      loadQueueStatusForAllSchedules(); // Reload queue status
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
      loadTodaySchedules(); // Reload schedules to update status
      loadQueueStatusForAllSchedules(); // Reload queue status
    } catch (error) {
      console.error('叫號失敗:', error);
      alert('叫號失敗，請稍後再試。');
      setMessage('叫號失敗，請稍後再試。');
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

      {/* TODO: 候診病患列表 */}
      <div className="card">
        <h3>候診病患列表</h3>
        <p>此處將顯示已報到並等待看診的病患列表。</p>
      </div>
    </div>
  );
};

export default DoctorClinicManagementPage;
