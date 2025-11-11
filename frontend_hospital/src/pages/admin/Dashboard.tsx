import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../services/dashboardService';
import { DashboardStats } from '../../types';
import { mockDashboardStats } from '../../utils/mockData';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000); // 每分鐘更新
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // TODO: 未來使用 API
      // const data = await getDashboardStats();
      // setStats(data);
      
      // 測試用：使用假資料
      setTimeout(() => {
        setStats(mockDashboardStats);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('載入統計資料失敗:', error);
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
        <h1 className="page-title">管理儀表板</h1>
        <p className="page-subtitle">即時門診流量與統計資訊</p>
      </div>

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h3>今日預約總數</h3>
                <p className="stat-value">{stats.total_appointments_today}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>已報到</h3>
                <p className="stat-value">{stats.checked_in_count}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>候診中</h3>
                <p className="stat-value">{stats.waiting_count}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✓</div>
              <div className="stat-content">
                <h3>已完成</h3>
                <p className="stat-value">{stats.completed_count}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>診間負載</h3>
            <div className="clinic-load-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>診間</th>
                    <th>當前病患數</th>
                    <th>候診人數</th>
                    <th>負載狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.clinic_load.map((clinic) => (
                    <tr key={clinic.clinic_id}>
                      <td>{clinic.clinic_name}</td>
                      <td>{clinic.current_patients}</td>
                      <td>{clinic.waiting_count}</td>
                      <td>
                        <span
                          className={`badge ${
                            clinic.waiting_count > 10
                              ? 'badge-danger'
                              : clinic.waiting_count > 5
                              ? 'badge-warning'
                              : 'badge-success'
                          }`}
                        >
                          {clinic.waiting_count > 10
                            ? '高負載'
                            : clinic.waiting_count > 5
                            ? '中負載'
                            : '正常'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

