import React, { useState, useEffect } from 'react';
import './BookAppointmentPage.css';
import api from '../api/axios'; // Use existing axios instance
import Calendar from 'react-calendar'; // Import react-calendar
import 'react-calendar/dist/Calendar.css'; // Import react-calendar CSS

const TIME_PERIOD_OPTIONS = [
  { value: "morning", label: "上午診" },
  { value: "afternoon", label: "下午診" },
  { value: "night", label: "夜間診" },
];

const BookAppointmentPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(''); // Changed from selectedDoctor to selectedDoctorId
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(''); // New state for time period filter
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // Changed from error to message for consistency

  // Fetch all unique specialties from doctors
  const allSpecialties = [...new Set(doctors.map(doctor => doctor.specialty))];

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty]);

  useEffect(() => {
    loadSchedules();
  }, [calendarDate, selectedSpecialty, selectedDoctorId, selectedTimePeriod]); // Add selectedTimePeriod here

  const loadDoctors = async () => {
    setLoading(true);
    setMessage('');
    try {
      const params = selectedSpecialty ? { specialty: selectedSpecialty } : {};
      const response = await api.get('/api/v1/patient/doctors', { params }); // Call public doctors endpoint
      setDoctors(response.data);
      // If a specialty is selected, and the previously selected doctor is not in this specialty, clear selected doctor
      if (selectedSpecialty && selectedDoctorId) {
        const doctorExistsInSpecialty = response.data.some(doc => doc.doctor_id === selectedDoctorId);
        if (!doctorExistsInSpecialty) {
          setSelectedDoctorId('');
        }
      }
    } catch (error) {
      console.error('載入醫師列表失敗:', error);
      setMessage('載入醫師列表失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    setMessage('');
    try {
      const params = {
        month: calendarDate.getMonth() + 1,
        year: calendarDate.getFullYear(),
      };
      if (selectedDoctorId) {
        params.doctor_id = selectedDoctorId; // Use doctor_id for single doctor filter
      } else if (selectedSpecialty) {
        // If no specific doctor is selected but a specialty is, filter by doctors in that specialty
        // The backend list_public_schedules can filter by specialty directly
        params.specialty = selectedSpecialty;
      }
      if (selectedTimePeriod) { // Add time period to params
        params.time_period = selectedTimePeriod;
      }
      const response = await api.get('/api/v1/patient/schedules', { params }); // Call public patient schedules endpoint
      setSchedules(response.data);
    } catch (error) {
      console.error('載入班表失敗:', error);
      setMessage('載入班表失敗，請稍後再試。');
      if (error.response?.data?.detail) {
        setMessage(`載入班表失敗: ${error.response.data.detail}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Temporarily disable booking functionality
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('預約功能暫時禁用。');
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">線上掛號/查詢班表</h1>
        <p className="page-subtitle">選擇科別、醫師和時段進行預約</p>
      </div>

      {message && (
        <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h3>查詢班表</h3>
        <div className="filter-controls">
          <div className="form-group">
            <label className="form-label">科別</label>
            <select
              className="form-select"
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setSelectedDoctorId(''); // Clear selected doctor when specialty changes
              }}
            >
              <option value="">全部科別</option>
              {allSpecialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">醫師</label>
            <select
              className="form-select"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={!selectedSpecialty && doctors.length === 0} // Disable if no specialty selected and no doctors loaded
            >
              <option value="">所有醫師</option>
              {doctors
                .filter(doc => !selectedSpecialty || doc.specialty === selectedSpecialty)
                .map((doctor) => (
                  <option key={doctor.doctor_id} value={doctor.doctor_id}>
                    {doctor.name} - {doctor.specialty}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">時段</label>
            <select
              className="form-select"
              value={selectedTimePeriod}
              onChange={(e) => setSelectedTimePeriod(e.target.value)}
            >
              <option value="">所有時段</option>
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
        {loading ? (
          <div className="loading">載入中...</div>
        ) : (
          <Calendar
            onChange={setCalendarDate}
            value={calendarDate}
            onActiveStartDateChange={({ activeStartDate }) => setCalendarDate(activeStartDate)}
            minDate={new Date()}
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
                        {/* Booking button will be added later */}
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
        )}
      </div>

      {/* Booking form (temporarily disabled) */}
      <div className="card">
        <h3>預約掛號 (暫時禁用)</h3>
        <form onSubmit={handleSubmit} className="book-form">
          <p>預約功能將在後續版本中啟用。</p>
          <button type="submit" className="btn btn-primary btn-block" disabled>
            確認預約
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
