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
    time_period: '', // Changed from start/end to time_period
  });
  const [selectedSpecialty, setSelectedSpecialty] = useState(''); // New state for selected specialty
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(''); // New state for time period filter
  const [calendarDate, setCalendarDate] = useState(new Date()); // State for the current month in the calendar
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // For displaying messages to the user

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (doctors.length > 0) {
      loadSchedules();
    }
  }, [doctors, calendarDate, selectedSpecialty, selectedTimePeriod]); // Added dependencies

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const params = {
        month: calendarDate.getMonth() + 1, // getMonth() is 0-indexed
        year: calendarDate.getFullYear(),
      };

      if (selectedSpecialty) {
        // Collect all doctor_ids for the selected specialty
        const doctorIdsInSpecialty = doctors
          .filter((doc) => doc.specialty === selectedSpecialty)
          .map((doc) => doc.id);

        if (doctorIdsInSpecialty.length > 0) {
          // Pass the list of doctor_ids to the backend as a comma-separated string
          params.doctor_ids = doctorIdsInSpecialty.join(',');
        } else {
          // If no doctors in selected specialty, no schedules to fetch
          setSchedules([]);
          setLoading(false);
          return;
        }
      }

      if (selectedTimePeriod) {
        params.time_period = selectedTimePeriod;
      }

      const response = await api.get('/api/v1/schedules/', { params });
      // No frontend filtering by specialty needed anymore as backend handles it
      let fetchedSchedules = response.data;

      // Enrich schedules with doctor names and specialties
      const enrichedSchedules = fetchedSchedules.map(schedule => {
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
      // Assuming the doctor objects from /api/v1/doctors/ have doctor_id, name, specialty
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

    if (!editingSchedule && new Date(formData.date) < new Date()) {
      setMessage('日期不能是過去的日期。');
      setLoading(false);
      return;
    }

    console.log('Submitting formData:', formData); // Debugging line

    try {
      if (editingSchedule) {
        await api.put(`/api/v1/schedules/${editingSchedule.schedule_id}`, formData);
        setMessage('班表更新成功！');
      } else {
        await api.post('/api/v1/schedules/', formData);
        setMessage('班表新增成功！');
      }
      setShowForm(false);
      setEditingSchedule(null);
      setFormData({ doctor_id: '', date: '', time_period: '' }); // Reset formData
      loadSchedules();
    } catch (error) {
      console.error('操作失敗:', error);
      let errorMessage = '操作失敗，請稍後再試。';
      if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail;
        if (Array.isArray(errorDetail)) {
          errorMessage = errorDetail
            .map(err => `${err.loc.join(' -> ')}: ${err.msg}`)
            .join('; ');
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
    setEditingSchedule(schedule);
    setFormData({
      doctor_id: schedule.doctor_id,
      date: schedule.date,
      time_period: schedule.time_period, // Use time_period
    });
    // Find the doctor to set the specialty
    const doctor = doctors.find(doc => doc.id === schedule.doctor_id);
    if (doctor) {
      setSelectedSpecialty(doctor.specialty);
    } else {
      setSelectedSpecialty(''); // Reset if doctor not found
    }
    setShowForm(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('確定要刪除此班表嗎？')) {
      return;
    }

    try {
      await api.delete(`/api/v1/schedules/${scheduleId}`);
      setMessage('刪除成功！');
      loadSchedules();
    } catch (error) {
      console.error('刪除失敗:', error);
      const errorMessage = error.response?.data?.detail || '刪除失敗，請稍後再試。';
      setMessage(errorMessage);
    }
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
            setFormData({ doctor_id: '', date: '', time_period: '' }); // Reset formData
            setSelectedSpecialty(''); // Reset selected specialty
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
            <div className="form-group">
              <label className="form-label">科別</label>
              <select
                className="form-select"
                value={selectedSpecialty}
                onChange={(e) => {
                  setSelectedSpecialty(e.target.value);
                  setFormData({ ...formData, doctor_id: '' }); // Reset doctor_id when specialty changes
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
                disabled={!selectedSpecialty} // Disable doctor selection until specialty is chosen
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

            <div className="form-group">
              <label className="form-label">日期</label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
                disabled={!!editingSchedule} // Disable date input when editing
              />
            </div>

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
                      <span className="time-period">
                        ({TIME_PERIOD_OPTIONS.find(option => option.value === schedule.time_period)?.label})
                      </span>
                      <div className="schedule-actions">
                        <button onClick={() => handleEdit(schedule)} className="btn-edit">編輯</button>
                        <button onClick={() => handleDelete(schedule.schedule_id)} className="btn-delete">刪除</button>
                      </div>
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

export default AdminScheduleManagementPage;
