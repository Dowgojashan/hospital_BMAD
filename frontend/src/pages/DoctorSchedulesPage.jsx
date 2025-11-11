import React, { useState, useEffect } from 'react';
// import { getDoctorSchedules } from '../../services/scheduleService'; // To be adapted
// import { Schedule } from '../../types'; // To be defined or use generic types
// import { mockSchedules } from '../../utils/mockData'; // To be copied or created
// import { getCurrentUser } from '../../services/authService'; // To be adapted
import './DoctorSchedulesPage.css';
import api from '../api/axios'; // Use existing axios instance
import { useAuthStore } from '../store/authStore'; // Use existing auth store

// Mock data for schedules (temporary)
const mockSchedules = [
  { schedule_id: 'sch001', doctor_name: 'Dr. Chen', specialty: '內科', date: '2025-12-01', start: '09:00', end: '12:00', doctor_id: 'doctor-1' },
  { schedule_id: 'sch002', doctor_name: 'Dr. Chen', specialty: '內科', date: '2025-12-02', start: '14:00', end: '17:00', doctor_id: 'doctor-1' },
  { schedule_id: 'sch003', doctor_name: 'Dr. Lin', specialty: '小兒科', date: '2025-12-01', start: '10:00', end: '13:00', doctor_id: 'doctor-2' },
];

const DoctorSchedulesPage = () => {
  const user = useAuthStore((s) => s.user); // Get user from auth store
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      // TODO: Integrate with actual API endpoint for fetching doctor schedules
      // const response = await api.get(`/api/v1/doctors/${user.id}/schedules`);
      // setSchedules(response.data);

      // Using mock data for now (filter by current user's doctor_id)
      const doctorSchedules = mockSchedules.filter(s => s.doctor_id === user?.id); // Assuming user.id is doctor_id
      setTimeout(() => {
        setSchedules(doctorSchedules);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('載入班表失敗:', error);
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
        <p className="page-subtitle">查看和管理您的門診班表</p>
      </div>

      {schedules.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6c757d' /* var(--text-medium) */ }}>
            目前沒有班表記錄
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="schedules-table">
            <table className="table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>開始時間</th>
                  <th>結束時間</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.schedule_id}>
                    <td>{new Date(schedule.date).toLocaleDateString('zh-TW')}</td>
                    <td>{schedule.start}</td>
                    <td>{schedule.end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSchedulesPage;
