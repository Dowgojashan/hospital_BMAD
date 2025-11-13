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

// Generic Message Modal Component
const MessageModal = ({ show, onClose, message, type }) => {
  if (!show) {
    return null;
  }

  const modalTitle = type === 'success' ? '預約成功！' : '預約失敗！';
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

const BookAppointmentPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState(null);

  // States for modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState(''); // Generic message for modal

  // Fetch all unique specialties from doctors
  const allSpecialties = [...new Set(doctors.map(doctor => doctor.specialty))];

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty]);

  useEffect(() => {
    loadSchedules();
  }, [calendarDate, selectedSpecialty, selectedDoctorId, selectedTimePeriod]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const params = selectedSpecialty ? { specialty: selectedSpecialty } : {};
      const response = await api.get('/api/v1/patient/doctors', { params });
      setDoctors(response.data);
      if (selectedSpecialty && selectedDoctorId) {
        const doctorExistsInSpecialty = response.data.some(doc => doc.doctor_id === selectedDoctorId);
        if (!doctorExistsInSpecialty) {
          setSelectedDoctorId('');
        }
      }
    } catch (error) {
      console.error('載入醫師列表失敗:', error);
      setModalMessage('載入醫師列表失敗，請稍後再試。');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const params = {
        month: calendarDate.getMonth() + 1,
        year: calendarDate.getFullYear(),
      };
      if (selectedDoctorId) {
        params.doctor_id = selectedDoctorId;
      } else if (selectedSpecialty) {
        params.specialty = selectedSpecialty;
      }
      if (selectedTimePeriod) {
        params.time_period = selectedTimePeriod;
      }
      const response = await api.get('/api/v1/patient/schedules', { params });
      setSchedules(response.data);
    } catch (error) {
      console.error('載入班表失敗:', error);
      setModalMessage('載入班表失敗，請稍後再試。');
      if (error.response?.data?.detail) {
        setModalMessage(`載入班表失敗: ${error.response.data.detail}`);
      }
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedScheduleSlot) {
      setModalMessage('請選擇一個班表時段進行預約。');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    setShowSuccessModal(false); // Clear any previous success modal
    setShowErrorModal(false);   // Clear any previous error modal
    setModalMessage('');        // Clear previous message

    try {
      const appointmentData = {
        doctor_id: selectedScheduleSlot.doctor_id,
        date: selectedScheduleSlot.date,
        time_period: selectedScheduleSlot.time_period,
      };
      await api.post('/api/v1/patient/appointments', appointmentData);
      setModalMessage('您的預約已成功建立！');
      setShowSuccessModal(true);
      setSelectedScheduleSlot(null);
      loadSchedules();
    } catch (error) {
      console.error('預約失敗:', error);
      setModalMessage(error.response?.data?.detail || '預約失敗，請稍後再試。');
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

  const getScheduleStatusInfo = (schedule) => {
    const isUnavailable = schedule.status !== 'available' || schedule.booked_patients >= schedule.max_patients;
    let label = `已預約 ${schedule.booked_patients} / ${schedule.max_patients}`;
    let statusClass = '';

    if (schedule.status === 'leave_approved') {
      label = '(已停診)';
      statusClass = 'unavailable';
    } else if (schedule.status === 'cancelled') {
      label = '(已取消)';
      statusClass = 'unavailable';
    } else if (schedule.booked_patients >= schedule.max_patients) {
      label = '(已額滿)';
      statusClass = 'full';
    }
    
    return { isUnavailable, label, statusClass };
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">線上掛號</h1>
        <p className="page-subtitle">選擇科別、醫師和時段進行預約</p>
      </div>

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
                setSelectedDoctorId('');
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
              disabled={!selectedSpecialty && doctors.length === 0}
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
                    {daySchedules.map((schedule) => {
                      const { isUnavailable, label, statusClass } = getScheduleStatusInfo(schedule);
                      return (
                        <div
                          key={schedule.schedule_id}
                          className={`schedule-entry ${selectedScheduleSlot?.schedule_id === schedule.schedule_id ? 'selected' : ''} ${statusClass}`}
                          onClick={() => !isUnavailable && setSelectedScheduleSlot(schedule)}
                        >
                          <span className="doctor-name">{schedule.doctor_name}</span>
                          <span className="specialty">({schedule.specialty})</span>
                          <span className="time-period">
                            ({TIME_PERIOD_OPTIONS.find(option => option.value === schedule.time_period)?.label})
                            - {label}
                          </span>
                        </div>
                      );
                    })}
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
            <p>預約狀態: <strong>{getScheduleStatusInfo(selectedScheduleSlot).label}</strong></p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleBookAppointment}
              disabled={loading || getScheduleStatusInfo(selectedScheduleSlot).isUnavailable}
            >
              {loading ? '預約中...' : '確認預約'}
            </button>
          </div>
        ) : (
          <p>請從日曆中選擇一個可用的班表時段。</p>
        )}
      </div>

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

export default BookAppointmentPage;
