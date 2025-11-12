import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getDoctors, getSchedules } from '../services/scheduleService';
import { createAppointment } from '../services/appointmentService';
import { Doctor, Schedule } from '../types';
import { mockDoctors, mockSchedules } from '../utils/mockData';
import './BookAppointment.css';

// Helper to get schedules for a specific day
const getSchedulesForDay = (date: Date, schedules: Schedule[], doctors: Doctor[]) => {
  const dateString = date.toISOString().split('T')[0];
  return schedules
    .filter(s => s.date === dateString)
    .map(s => {
      const doctor = doctors.find(d => d.doctor_id === s.doctor_id);
      return {
        ...s,
        doctorName: doctor ? doctor.name : '未知醫師',
        specialty: doctor ? doctor.specialty : '未知科別',
      };
    });
};

const BookAppointment: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('早上'); // Default to '早上'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const specialties = ['內科', '外科', '小兒科', '婦產科', '骨科', '眼科', '耳鼻喉科'];
  const timePeriods = ['早上', '下午', '晚上'];

  useEffect(() => {
    // Load initial data
    setDoctors(mockDoctors);
    setSchedules(mockSchedules);
  }, []);

  const handleAppointmentClick = async (scheduleId: string, doctorId: string, date: string, timePeriod: string) => {
    if (!window.confirm(`您確定要預約 ${date} ${timePeriod} 的門診嗎？`)) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createAppointment({
        doctor_id: doctorId,
        date: date,
        time_period: timePeriod,
      });
      alert('預約成功！');
      // Optionally, reload schedules to reflect the change
    } catch (err: any) {
      setError(err.response?.data?.message || '預約失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const renderDayContents = (day: number, date: Date) => {
    const daySchedules = getSchedulesForDay(date, schedules, doctors)
      .filter(s => selectedSpecialty ? s.specialty === selectedSpecialty : true)
      .filter(s => s.time_period === selectedTimePeriod);

    return (
      <div className="calendar-day">
        <div className="day-number">{day}</div>
        <div className="schedules-for-day">
          {daySchedules.map(schedule => (
            <div key={schedule.schedule_id} className="day-schedule-item">
              <p>{schedule.doctorName}</p>
              {schedule.available_slots > 0 ? (
                <button
                  className="btn btn-book"
                  onClick={() => handleAppointmentClick(schedule.schedule_id, schedule.doctor_id, schedule.date, schedule.time_period)}
                >
                  預約
                </button>
              ) : (
                <span className="text-danger">額滿</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">線上掛號</h1>
        <p className="page-subtitle">請選擇科別和時段，然後在月曆上點選預約</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="loading-spinner">預約中...</div>}

      <div className="filters-container card">
        <div className="form-group">
          <label className="form-label">科別</label>
          <select
            className="form-select"
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
          >
            <option value="">請選擇科別</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
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
            {/* Removed "請選擇時段" as per image, it defaults to a time */}
            {timePeriods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="calendar-wrapper card">
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => setSelectedDate(date)}
          minDate={new Date()}
          maxDate={maxDate}
          renderDayContents={renderDayContents}
          inline
        />
      </div>
    </div>
  );
};

export default BookAppointment;

