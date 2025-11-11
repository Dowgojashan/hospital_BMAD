import React, { useState, useEffect } from 'react';
import { getDoctors, getSchedules } from '../services/scheduleService';
import { createAppointment } from '../services/appointmentService';
import { Doctor, Schedule } from '../types';
import { mockDoctors, mockSchedules } from '../utils/mockData';
import './BookAppointment.css';

const BookAppointment: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
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
      // TODO: 未來使用 API
      // const params = selectedSpecialty ? { specialty: selectedSpecialty } : {};
      // const data = await getDoctors(params);
      // setDoctors(data);
      
      // 測試用：使用假資料
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
      // TODO: 未來使用 API
      // const params: any = { doctor_id: selectedDoctor };
      // if (selectedDate) {
      //   params.date = selectedDate;
      // }
      // const data = await getSchedules(params);
      // setSchedules(data);
      
      // 測試用：使用假資料
      const filteredSchedules = mockSchedules.filter(
        s => s.doctor_id === selectedDoctor && s.date === selectedDate
      );
      setSchedules(filteredSchedules);
    } catch (error) {
      console.error('載入班表失敗:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedDoctor || !selectedDate || !selectedTimePeriod) {
      setError('請選擇醫師、日期和時段');
      setLoading(false);
      return;
    }

    try {
      await createAppointment({
        doctor_id: selectedDoctor,
        date: selectedDate,
        time_period: selectedTimePeriod,
      });
      alert('預約成功！');
      // 重置表單
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedTimePeriod('');
    } catch (err: any) {
      setError(err.response?.data?.message || '預約失敗，請稍後再試');
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

export default BookAppointment;

