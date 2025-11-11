import React, { useState, useEffect } from 'react';
// import { getSchedules, getDoctors } from '../services/scheduleService'; // To be adapted
// import { Schedule, Doctor } from '../types'; // To be defined or use generic types
// import { mockDoctors, mockSchedules } from '../utils/mockData'; // To be copied or created
import './SchedulesPage.css';
import api from '../api/axios'; // Use existing axios instance

// Mock data for doctors (temporary)
const mockDoctors = [
  { doctor_id: 'doc001', name: 'Dr. Chen', specialty: '內科' },
  { doctor_id: 'doc002', name: 'Dr. Lin', specialty: '小兒科' },
  { doctor_id: 'doc003', name: 'Dr. Wang', specialty: '內科' },
];

// Mock data for schedules (temporary)
const mockSchedules = [
  { schedule_id: 'sch001', doctor_name: 'Dr. Chen', specialty: '內科', date: '2025-12-01', start: '09:00', end: '12:00' },
  { schedule_id: 'sch002', doctor_name: 'Dr. Chen', specialty: '內科', date: '2025-12-02', start: '14:00', end: '17:00' },
  { schedule_id: 'sch003', doctor_name: 'Dr. Lin', specialty: '小兒科', date: '2025-12-01', start: '10:00', end: '13:00' },
];

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);

  const specialties = ['內科', '外科', '小兒科', '婦產科', '骨科', '眼科', '耳鼻喉科'];

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty]);

  useEffect(() => {
    if (selectedDate) {
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
    setLoading(true);
    try {
      // TODO: Integrate with actual API endpoint for fetching schedules
      // const params = {};
      // if (selectedDoctor) params.doctor_id = selectedDoctor;
      // if (selectedDate) params.date = selectedDate;
      // const response = await api.get('/api/v1/schedules', { params });
      // setSchedules(response.data);

      // Using mock data for now
      let filteredSchedules = mockSchedules;
      if (selectedDoctor) {
        filteredSchedules = filteredSchedules.filter(s => s.doctor_id === selectedDoctor);
      }
      if (selectedDate) {
        filteredSchedules = filteredSchedules.filter(s => s.date === selectedDate);
      }
      setSchedules(filteredSchedules);
    } catch (error) {
      console.error('載入班表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadSchedules();
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">查詢班表</h1>
        <p className="page-subtitle">查詢醫師的門診班表資訊</p>
      </div>

      <div className="card">
        <div className="search-filters">
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
            <label className="form-label">醫師</label>
            <select
              className="form-select"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option value="">全部醫師</option>
              {doctors.map((doctor) => (
                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                  {doctor.name} - {doctor.specialty}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">日期</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? '查詢中...' : '查詢'}
          </button>
        </div>
      </div>

      {schedules.length > 0 && (
        <div className="card">
          <h3>查詢結果</h3>
          <div className="schedules-table">
            <table className="table">
              <thead>
                <tr>
                  <th>醫師</th>
                  <th>科別</th>
                  <th>日期</th>
                  <th>時段</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.schedule_id}>
                    <td>{schedule.doctor_name || '醫師'}</td>
                    <td>{schedule.specialty}</td>
                    <td>{new Date(schedule.date).toLocaleDateString('zh-TW')}</td>
                    <td>{schedule.start} - {schedule.end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && selectedDate && schedules.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6c757d' /* var(--text-medium) */ }}>
            查無班表資料
          </p>
        </div>
      )}
    </div>
  );
};

export default SchedulesPage;
