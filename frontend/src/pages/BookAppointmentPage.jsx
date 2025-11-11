import React, { useState, useEffect } from 'react';
// import { getDoctors, getSchedules } from '../services/scheduleService'; // To be adapted
// import { createAppointment } from '../services/appointmentService'; // To be adapted
// import { Doctor, Schedule } from '../types'; // To be defined or use generic types
// import { mockDoctors, mockSchedules } from '../utils/mockData'; // To be copied or created
import './BookAppointmentPage.css';
import api from '../api/axios'; // Use existing axios instance

// Mock data for doctors (temporary)
const mockDoctors = [
  { doctor_id: 'doc001', name: 'Dr. Chen', specialty: '內科' },
  { doctor_id: 'doc002', name: 'Dr. Lin', specialty: '小兒科' },
  { doctor_id: 'doc003', name: 'Dr. Wang', specialty: '內科' },
];

// Mock data for schedules (temporary)
const mockSchedules = [
  { schedule_id: 'sch001', doctor_id: 'doc001', date: '2025-12-01', start: '09:00', end: '12:00' },
  { schedule_id: 'sch002', doctor_id: 'doc001', date: '2025-12-02', start: '14:00', end: '17:00' },
  { schedule_id: 'sch003', doctor_id: 'doc002', date: '2025-12-01', start: '10:00', end: '13:00' },
];

const BookAppointmentPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const specialties = ['內科', '外科', '小兒科', '婦產科', '骨科', '眼科', '耳鼻喉科'];

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadSchedules();
    }
  }, [selectedDoctor, selectedDate]);

  const loadDoctors = async () => {
    try {
      // TODO: Integrate with actual API endpoint for fetching doctors
      // const params = selectedSpecialty ? { specialty: selectedSpecialty } : {};
      // const response = await api.get('/api/v1/doctors', { params });
      // setDoctors(response.data);

      // Using mock data for now
      let filteredDoctors = mockDoctors;
      if (selectedSpecialty) {
        filteredDoctors = mockDoctors.filter(d => d.specialty === selectedSpecialty);
      }
      setDoctors(filteredDoctors);
    } catch (error) {
      console.error('載入醫師列表失敗:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      // TODO: Integrate with actual API endpoint for fetching schedules
      // const params = { doctor_id: selectedDoctor, date: selectedDate };
      // const response = await api.get('/api/v1/schedules', { params });
      // setSchedules(response.data);

      // Using mock data for now
      const filteredSchedules = mockSchedules.filter(
        s => s.doctor_id === selectedDoctor && s.date === selectedDate
      );
      setSchedules(filteredSchedules);
    } catch (error) {
      console.error('載入班表失敗:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedDoctor || !selectedDate || !selectedTimePeriod) {
      setError('請選擇醫師、日期和時段');
      setLoading(false);
      return;
    }

    try {
      // TODO: Integrate with actual API endpoint for creating appointment
      // await api.post('/api/v1/appointments', {
      //   doctor_id: selectedDoctor,
      //   date: selectedDate,
      //   time_period: selectedTimePeriod,
      // });
      alert('預約成功！ (Mock)'); // Mock success
      // Reset form
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedTimePeriod('');
    } catch (err) {
      setError(err.response?.data?.message || '預約失敗，請稍後再試 (Mock)'); // Mock failure
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const timePeriods = ['早上', '下午', '晚上'];

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">線上掛號</h1>
        <p className="page-subtitle">選擇科別、醫師和時段進行預約</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="book-form">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-group">
            <label className="form-label">科別</label>
            <select
              className="form-select"
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setSelectedDoctor('');
              }}
            >
              <option value="">全部科別</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">選擇醫師 *</label>
            <select
              className="form-select"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              required
            >
              <option value="">請選擇醫師</option>
              {doctors.map((doctor) => (
                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                  {doctor.name} - {doctor.specialty}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">預約日期 *</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">時段 *</label>
            <select
              className="form-select"
              value={selectedTimePeriod}
              onChange={(e) => setSelectedTimePeriod(e.target.value)}
              required
            >
              <option value="">請選擇時段</option>
              {timePeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '預約中...' : '確認預約'}
          </button>
        </form>
      </div>

      {selectedDoctor && selectedDate && schedules.length > 0 && (
        <div className="card">
          <h3>可用班表</h3>
          <div className="schedules-list">
            {schedules.map((schedule) => (
              <div key={schedule.schedule_id} className="schedule-item">
                <div>
                  <strong>{schedule.start} - {schedule.end}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointmentPage;
