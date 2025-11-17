import React, { useState, useEffect } from 'react';
// import {
//   getSchedules,
//   getDoctors,
//   createSchedule,
//   updateSchedule,
//   deleteSchedule,
// } from '../../services/scheduleService'; // To be adapted
// import { Schedule, Doctor } from '../../types'; // To be defined or use generic types
// import { mockSchedules, mockDoctors } from '../../utils/mockData'; // To be copied or created
import './AdminScheduleManagementPage.css';
import api from '../api/axios'; // Use existing axios instance
import Calendar from 'react-calendar'; // Import react-calendar
import 'react-calendar/dist/Calendar.css'; // Import react-calendar CSS

const TIME_PERIOD_OPTIONS = [
  { value: "morning", label: "上午診" },
  { value: "afternoon", label: "下午診" },
  { value: "night", label: "夜間診" },
];

const AdminScheduleManagementPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    doctor_id: '',
    date: '',
    time_period: '',
    max_patients: '10',
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState('0');
  const [recurringMonths, setRecurringMonths] = useState('1');
  const [editMode, setEditMode] = useState('single'); // 'single' or 'future'

  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (doctors.length > 0) {
      loadSchedules();
    }
  }, [doctors, calendarDate, selectedSpecialty, selectedTimePeriod]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const params = {
        month: calendarDate.getMonth() + 1,
        year: calendarDate.getFullYear(),
      };
      if (selectedSpecialty) {
        const doctorIdsInSpecialty = doctors
          .filter((doc) => doc.specialty === selectedSpecialty)
          .map((doc) => doc.id);
        if (doctorIdsInSpecialty.length > 0) {
          params.doctor_ids = doctorIdsInSpecialty.join(',');
        } else {
          setSchedules([]);
          setLoading(false);
          return;
        }
      }
      if (selectedTimePeriod) {
        params.time_period = selectedTimePeriod;
      }
      const response = await api.get('/api/v1/schedules/', { params });
      const enrichedSchedules = response.data.map(schedule => {
        const doctor = doctors.find(doc => doc.id === schedule.doctor_id);
        return {
          ...schedule,
          doctor_name: doctor ? doctor.name : '未知醫師',
          specialty: doctor ? doctor.specialty : '未知科別',
        };
      });
      setSchedules(enrichedSchedules);
    } catch (error) {
      console.error('載入班表失敗:', error);
      setMessage('載入班表失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/doctors/');
      const fetchedDoctors = response.data.map(doctor => ({
        id: doctor.doctor_id,
        name: doctor.name,
        specialty: doctor.specialty,
      }));
      setDoctors(fetchedDoctors);
    } catch (error) {
      console.error('載入醫師列表失敗:', error);
      setMessage('載入醫師列表失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // if (!editingSchedule && new Date(formData.date) < new Date()) {
    //   setMessage('日期不能是過去的日期。');
    //   setLoading(false);
    //   return;
    // }

    try {
      if (editingSchedule) {
        if (editMode === 'future') {
          // Handle recurring update
          const recurringUpdateData = {
            doctor_id: formData.doctor_id,
            time_period: formData.time_period,
            start_date: formData.date,
            day_of_week: parseInt(recurringDayOfWeek, 10),
            months_to_create: parseInt(recurringMonths, 10),
            max_patients: parseInt(formData.max_patients, 10),
          };
          await api.put(`/api/v1/schedules/recurring/${editingSchedule.recurring_group_id}`, recurringUpdateData);
          setMessage('週期性班表更新成功！');
        } else {
          // Handle single update, and "break" the link if it was recurring
          const updatePayload = {
            ...formData, // Use formData directly, it already contains the date
            recurring_group_id: null, // Break the link to the recurring group
          };
          await api.put(`/api/v1/schedules/${editingSchedule.schedule_id}`, updatePayload);
          setMessage('班表更新成功！');
        }
      } else if (isRecurring) {
        // Handle recurring creation
        const recurringData = {
          doctor_id: formData.doctor_id,
          time_period: formData.time_period,
          start_date: formData.date,
          day_of_week: parseInt(recurringDayOfWeek, 10),
          months_to_create: parseInt(recurringMonths, 10),
          max_patients: parseInt(formData.max_patients, 10),
        };
        await api.post('/api/v1/schedules/recurring', recurringData);
        setMessage('週期性班表新增成功！');
      } else {
        // Handle single creation
        await api.post('/api/v1/schedules/', formData);
        setMessage('班表新增成功！');
      }
      setShowForm(false);
      setEditingSchedule(null);
      setFormData({ doctor_id: '', date: '', time_period: '' });
      setIsRecurring(false);
      loadSchedules();
    } catch (error) {
      console.error('操作失敗:', error);
      let errorMessage = '操作失敗，請稍後再試。';
      if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail;
        if (Array.isArray(errorDetail)) {
          errorMessage = errorDetail.map(err => `${err.loc.join(' -> ')}: ${err.msg}`).join('; ');
        } else {
          errorMessage = errorDetail;
        }
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    if (schedule.recurring_group_id) {
      const userChoice = window.confirm(
        '這是一個週期性班表項目。\n點擊「確定」以編輯未來所有相關班表。\n點擊「取消」以僅編輯此單筆班表。'
      );
      if (userChoice) {
        // Edit this and all future recurring schedules
        setEditMode('future');
        setEditingSchedule(schedule);
        setIsRecurring(true);
        setFormData({
          doctor_id: schedule.doctor_id,
          date: schedule.date, // This will be the start date, but disabled
          time_period: schedule.time_period,
        });
        // Pre-fill recurring options based on the schedule's day
        const scheduleDate = new Date(schedule.date);
        // Adjust for timezone offset before getting the day
        const dayOfWeek = (scheduleDate.getUTCDay() + 6) % 7; // Convert Sunday=0 to Monday=0
        setRecurringDayOfWeek(String(dayOfWeek));
        setRecurringMonths(recurringMonths); // Keep the current value or allow user to set
      } else {
        // Edit only the single schedule instance
        setEditMode('single');
        setEditingSchedule(schedule);
        setIsRecurring(false);
        setFormData({
          doctor_id: schedule.doctor_id,
          date: schedule.date,
          time_period: schedule.time_period,
          max_patients: schedule.max_patients,
        });
      }
    } else {
      // Standard non-recurring schedule edit
      setEditMode('single');
      setEditingSchedule(schedule);
      setIsRecurring(false);
              setFormData({
                doctor_id: schedule.doctor_id,
                date: schedule.date,
                time_period: schedule.time_period,
                max_patients: schedule.max_patients,
              });    }

    const doctor = doctors.find(doc => doc.id === schedule.doctor_id);
    if (doctor) {
      setSelectedSpecialty(doctor.specialty);
    } else {
      setSelectedSpecialty('');
    }
    setShowForm(true);
  };

  const handleDelete = async (schedule) => {
    if (schedule.recurring_group_id) {
      const userChoice = window.confirm(
        '這是一個週期性班表項目。\n點擊「確定」以刪除未來所有相關班表。\n點擊「取消」以僅刪除此單筆班表。'
      );
      if (userChoice) {
        if (!window.confirm(`確定要從 ${schedule.date} 開始，刪除未來所有的相關班表嗎？`)) return;
        try {
          await api.delete(`/api/v1/schedules/recurring/${schedule.recurring_group_id}`, {
            params: { start_date: schedule.date }
          });
          setMessage('未來所有週期性班表已刪除！');
          loadSchedules();
        } catch (error) {
          console.error('週期性刪除失敗:', error);
          setMessage(error.response?.data?.detail || '週期性刪除失敗，請稍後再試。');
        }
      } else {
        if (!window.confirm(`確定要刪除 ${schedule.date} 這筆班表嗎？`)) return;
        try {
          await api.delete(`/api/v1/schedules/${schedule.schedule_id}`);
          setMessage('單筆班表刪除成功！');
          loadSchedules();
        } catch (error) {
          console.error('單筆刪除失敗:', error);
          setMessage(error.response?.data?.detail || '刪除失敗，請稍後再試。');
        }
      }
    } else {
      if (!window.confirm('確定要刪除此班表嗎？')) return;
      try {
        await api.delete(`/api/v1/schedules/${schedule.schedule_id}`);
        setMessage('刪除成功！');
        loadSchedules();
      } catch (error) {
        console.error('刪除失敗:', error);
        setMessage(error.response?.data?.detail || '刪除失敗，請稍後再試。');
      }
    }
  };

  const getScheduleStatusInfo = (schedule) => {
    const isUnavailable = schedule.status !== 'available';
    let label = `已預約 ${schedule.booked_patients} / 最多 ${schedule.max_patients} 人`;
    if (isUnavailable) {
      switch (schedule.status) {
        case 'leave_approved':
          label = '(已核准停診)';
          break;
        case 'leave_pending':
          label = '(停診審核中)';
          break;
        case 'cancelled':
          label = '(已取消)';
          break;
        default:
          label = '(無法預約)';
          break;
      }
    }
    return { isUnavailable, label };
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">班表管理</h1>
        <p className="page-subtitle">管理所有醫師的門診班表</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingSchedule(null);
            setFormData({ doctor_id: '', date: '', time_period: '', max_patients: '10' });
            setSelectedSpecialty('');
            setIsRecurring(false);
            setRecurringDayOfWeek('0');
            setRecurringMonths('1');
            setEditMode('single');
          }}
        >
          新增班表
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3>{editingSchedule ? '編輯班表' : '新增班表'}</h3>
          <form onSubmit={handleSubmit}>
            {/* Recurring Schedule Toggle */}
            {(isRecurring || !editingSchedule) && (
              <div className="form-group form-check recurring-checkbox-row mb-3">
                <label className="form-check-label" htmlFor="isRecurringCheck">
                  週期性排班
                </label>
                <input
                  type="checkbox"
                  className="form-check-input ms-2"
                  id="isRecurringCheck"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  disabled={!!editingSchedule}
                />
              </div>
            )}
            {/* Doctor and Specialty Fields */}
            <div className="form-group">
              <label className="form-label">科別</label>
              <select
                className="form-select"
                value={selectedSpecialty}
                onChange={(e) => {
                  setSelectedSpecialty(e.target.value);
                  setFormData({ ...formData, doctor_id: '' });
                }}
                required
              >
                <option value="">請選擇科別</option>
                {[...new Set(doctors.map(doctor => doctor.specialty))].map(
                  (specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">醫師</label>
              <select
                className="form-select"
                value={formData.doctor_id}
                onChange={(e) =>
                  setFormData({ ...formData, doctor_id: e.target.value })
                }
                required
                disabled={!selectedSpecialty}
              >
                <option value="">請選擇醫師</option>
                {doctors
                  .filter(doctor => doctor.specialty === selectedSpecialty)
                  .map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
              </select>
            </div>

            {/* Date and Recurring Fields */}
            <div className="form-group">
              <label className="form-label">{(isRecurring || editMode === 'future') ? '開始日期' : '日期'}</label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            {(isRecurring || editMode === 'future') && (
              <>
                <div className="form-group">
                  <label className="form-label">重複星期</label>
                  <select
                    className="form-select"
                    value={recurringDayOfWeek}
                    onChange={(e) => setRecurringDayOfWeek(e.target.value)}
                    required={isRecurring}
                  >
                    <option value="0">每週一</option>
                    <option value="1">每週二</option>
                    <option value="2">每週三</option>
                    <option value="3">每週四</option>
                    <option value="4">每週五</option>
                    <option value="5">每週六</option>
                    <option value="6">每週日</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">重複期間</label>
                  <select
                    className="form-select"
                    value={recurringMonths}
                    onChange={(e) => setRecurringMonths(e.target.value)}
                    required={isRecurring && !editingSchedule}
                  >
                    <option value="1">一個月</option>
                    <option value="2">兩個月</option>
                    <option value="3">三個月</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">時段</label>
              <select
                className="form-select"
                value={formData.time_period}
                onChange={(e) =>
                  setFormData({ ...formData, time_period: e.target.value })
                }
                required
              >
                <option value="">請選擇時段</option>
                {TIME_PERIOD_OPTIONS.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">最大預約人數</label>
              <input
                type="number"
                className="form-control"
                value={formData.max_patients}
                onChange={(e) =>
                  setFormData({ ...formData, max_patients: e.target.value })
                }
                required
                min="1"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '處理中...' : '儲存'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingSchedule(null);
                  setIsRecurring(false);
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>班表篩選</h3>
        <div className="filter-controls">
          <div className="form-group">
            <label className="form-label">科別篩選</label>
            <select
              className="form-select"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">請選擇科別</option>
              {[...new Set(doctors.map(doctor => doctor.specialty))].map(
                (specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                )
              )}
            </select>
          </div>

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
                    // minDate={new Date()} // Temporarily commented out for testing
                    maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                    locale="zh-TW"
                    className="react-calendar-custom"          tileContent={({ date, view }) => {
            if (view === 'month') {
              const daySchedules = schedules.filter(
                (schedule) =>
                  new Date(schedule.date).toDateString() === date.toDateString()
              );

              if (daySchedules.length === 0) return null;

              return (
                <div className="schedule-tile-content">
                  {daySchedules.map((schedule) => {
                    const { isUnavailable, label } = getScheduleStatusInfo(schedule);
                    return (
                      <div key={schedule.schedule_id} className={`schedule-entry ${isUnavailable ? 'unavailable' : ''}`}>
                        <span className="doctor-name">{schedule.doctor_name}</span>
                        <span className="time-period">
                          ({TIME_PERIOD_OPTIONS.find(option => option.value === schedule.time_period)?.label})
                          - {label}
                        </span>
                        <div className="schedule-actions">
                          <button onClick={() => handleEdit(schedule)} className="btn-edit">編輯</button>
                          <button onClick={() => handleDelete(schedule)} className="btn-delete">刪除</button>
                        </div>
                      </div>
                    );
                  })}
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

export default AdminScheduleManagementPage;
