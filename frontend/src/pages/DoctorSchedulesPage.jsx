import React, { useState, useEffect } from 'react';
import './DoctorSchedulesPage.css';
import api from '../api/axios'; // Use existing axios instance
import { useAuthStore } from '../store/authStore'; // Use existing auth store
import Calendar from 'react-calendar'; // Import react-calendar
import 'react-calendar/dist/Calendar.css'; // Import react-calendar CSS

const TIME_PERIOD_OPTIONS = [
  { value: "morning", label: "上午診" },
  { value: "afternoon", label: "下午診" },
  { value: "night", label: "夜間診" },
];

const DoctorSchedulesPage = () => {
  const user = useAuthStore((s) => s.user);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');
  const [message, setMessage] = useState('');

  console.log("DoctorSchedulesPage: Component rendered. Current user:", user);
  console.log("DoctorSchedulesPage: Current loading state:", loading);

  useEffect(() => {
    console.log("DoctorSchedulesPage: useEffect triggered. User:", user);
    if (user?.id) {
      loadSchedules();
    } else {
      console.log("DoctorSchedulesPage: User ID not available in useEffect, setting loading to false.");
      setLoading(false);
      setMessage('請先登入以查看您的班表。'); // More informative message
    }
  }, [user, calendarDate, selectedTimePeriod]);

  const loadSchedules = async () => {
    setLoading(true);
    setMessage(''); // Clear previous messages
    if (!user?.id) {
      console.log("DoctorSchedulesPage: User ID not available in loadSchedules, cannot load schedules.");
      setLoading(false);
      setMessage('無法載入班表：用戶資訊不完整。');
      return;
    }
    try {
      const params = {
        month: calendarDate.getMonth() + 1,
        year: calendarDate.getFullYear(),
      };
      if (selectedTimePeriod) {
        params.time_period = selectedTimePeriod;
      }
      console.log(`DoctorSchedulesPage: Fetching schedules for doctor ${user.id} with params:`, params);
      const response = await api.get(`/api/v1/doctors/me/schedules`, { params });
      console.log("DoctorSchedulesPage: API response:", response.data);
      setSchedules(response.data);
      if (response.data.length === 0) {
        setMessage('目前沒有班表記錄。');
      }
    } catch (error) {
      console.error('DoctorSchedulesPage: 載入班表失敗:', error);
      setMessage('載入班表失敗，請稍後再試。');
      // Check for specific error details from backend
      if (error.response && error.response.data && error.response.data.detail) {
        setMessage(`載入班表失敗: ${error.response.data.detail}`);
      }
    } finally {
      console.log("DoctorSchedulesPage: loadSchedules finished, setting loading to false.");
      setLoading(false);
    }
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
        <h1 className="page-title">我的班表</h1>
        <p className="page-subtitle">查看您的門診班表</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h3>班表篩選</h3>
        <div className="filter-controls">
          <div className="form-group">
            <label className="form-label">時段篩選</label>
            <select
              className="form-select"
              value={selectedTimePeriod}
              onChange={(e) => setSelectedTimePeriod(e.target.value)}
            >
              <option value="">請選擇時段</option>
              {TIME_PERIOD_OPTIONS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>班表日曆</h3>
        <Calendar
          onChange={setCalendarDate}
          value={calendarDate}
          onActiveStartDateChange={({ activeStartDate }) => setCalendarDate(activeStartDate)}
          minDate={new Date()}
          maxDate={new Date(new Date().setMonth(new Date().getMonth() + 3))}
          locale="zh-TW"
          className="react-calendar-custom"
          tileContent={({ date, view }) => {
            if (view === 'month') {
              const daySchedules = schedules.filter(
                (schedule) =>
                  new Date(schedule.date).toDateString() === date.toDateString()
              );

              if (daySchedules.length === 0) return null;

              return (
                <div className="schedule-tile-content">
                  {daySchedules.map((schedule) => (
                    <div key={schedule.schedule_id} className="schedule-entry">
                      <span className="doctor-name">{schedule.doctor_name}</span>
                      <span className="specialty">({schedule.specialty})</span>
                      <span className="time-period">
                        ({TIME_PERIOD_OPTIONS.find(option => option.value === schedule.time_period)?.label})
                      </span>
                    </div>
                  ))}
                </div>
              );
            }
            return null;
          }}
        />
      </div>
    </div>
  );
};

export default DoctorSchedulesPage;
