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
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState(null); // New state to hold selected slot for booking

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

  const handleBookAppointment = async () => {
    if (!selectedScheduleSlot) {
      setMessage('請選擇一個班表時段進行預約。');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const appointmentData = {
        doctor_id: selectedScheduleSlot.doctor_id,
        date: selectedScheduleSlot.date,
        time_period: selectedScheduleSlot.time_period,
      };
      await api.post('/api/v1/patient/appointments', appointmentData);
      setMessage('預約成功！');
      setSelectedScheduleSlot(null); // Clear selection after successful booking
      loadSchedules(); // Reload schedules to reflect the booking
    } catch (error) {
      console.error('預約失敗:', error);
      setMessage(error.response?.data?.detail || '預約失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">線上掛號</h1>
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
                      <div
                        key={schedule.schedule_id}
                        className={`schedule-entry ${selectedScheduleSlot?.schedule_id === schedule.schedule_id ? 'selected' : ''}`}
                        onClick={() => setSelectedScheduleSlot(schedule)} // Select slot on click
                      >
                        <span className="doctor-name">{schedule.doctor_name}</span>
                        <span className="specialty">({schedule.specialty})</span>
                        <span className="time-period">
                          ({TIME_PERIOD_OPTIONS.find(option => option.value === schedule.time_period)?.label})
                          - 已預約 {schedule.booked_patients} / 最多 {schedule.max_patients} 人
                        </span>
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

      {/* Booking form - now enabled */}
      <div className="card">
        <h3>確認預約</h3>
        {selectedScheduleSlot ? (
          <div className="booking-confirmation">
            <p>您已選擇：</p>
            <p>醫師: <strong>{selectedScheduleSlot.doctor_name}</strong> ({selectedScheduleSlot.specialty})</p>
            <p>日期: <strong>{new Date(selectedScheduleSlot.date).toLocaleDateString('zh-TW')}</strong></p>
            <p>時段: <strong>{TIME_PERIOD_OPTIONS.find(option => option.value === selectedScheduleSlot.time_period)?.label}</strong></p>
            <p>預約人數: <strong>{selectedScheduleSlot.booked_patients} / {selectedScheduleSlot.max_patients}</strong></p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleBookAppointment}
              disabled={loading}
            >
              {loading ? '預約中...' : '確認預約'}
            </button>
          </div>
        ) : (
          <p>請從日曆中選擇一個可用的班表時段。</p>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentPage;
