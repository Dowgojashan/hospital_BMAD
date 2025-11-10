import React, { useState, useEffect } from 'react';
import { getDoctorSchedules } from '../../services/scheduleService';
import { Schedule } from '../../types';
import { mockSchedules } from '../../utils/mockData';
import { getCurrentUser } from '../../services/authService';
import './DoctorSchedules.css';

const DoctorSchedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      // TODO: 未來使用 API
      // const data = await getDoctorSchedules();
      // setSchedules(data);
      
      // 測試用：使用假資料（只顯示當前醫師的班表）
      const user = getCurrentUser();
      const doctorSchedules = mockSchedules.filter(s => s.doctor_id === 'doctor-1'); // 假設當前醫師是 doctor-1
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
          <p style={{ textAlign: 'center', color: 'var(--text-medium)' }}>
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

export default DoctorSchedules;

