import React from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import './Home.css';

const Home: React.FC = () => {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">歡迎回來，{user.name}！</h1>
        <p className="page-subtitle">智慧醫院管理系統</p>
      </div>

      <div className="home-grid">
        {user.role === 'patient' && (
          <>
            <Link to="/book" className="home-card">
              <div className="home-card-icon">📅</div>
              <h3>線上掛號</h3>
              <p>選擇科別、醫師和時段進行預約掛號</p>
            </Link>

            <Link to="/appointments" className="home-card">
              <div className="home-card-icon">📋</div>
              <h3>我的預約</h3>
              <p>查看和管理您的預約記錄</p>
            </Link>

            <Link to="/checkin" className="home-card">
              <div className="home-card-icon">✅</div>
              <h3>報到</h3>
              <p>線上報到或查看候診資訊</p>
            </Link>

            <Link to="/records" className="home-card">
              <div className="home-card-icon">📄</div>
              <h3>我的病歷</h3>
              <p>查看您的就診記錄和病歷摘要</p>
            </Link>

            <Link to="/schedules" className="home-card">
              <div className="home-card-icon">🔍</div>
              <h3>查詢班表</h3>
              <p>查詢醫師的門診班表</p>
            </Link>
          </>
        )}

        {user.role === 'doctor' && (
          <>
            <Link to="/doctor/schedules" className="home-card">
              <div className="home-card-icon">📅</div>
              <h3>我的班表</h3>
              <p>查看和管理您的門診班表</p>
            </Link>

            <Link to="/doctor/leave" className="home-card">
              <div className="home-card-icon">🚫</div>
              <h3>停診申請</h3>
              <p>申請停診並通知受影響病患</p>
            </Link>

            <Link to="/doctor/records" className="home-card">
              <div className="home-card-icon">📝</div>
              <h3>病歷管理</h3>
              <p>新增和編輯病患病歷記錄</p>
            </Link>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <Link to="/admin/dashboard" className="home-card">
              <div className="home-card-icon">📊</div>
              <h3>儀表板</h3>
              <p>查看即時門診流量與統計資訊</p>
            </Link>

            <Link to="/admin/schedules" className="home-card">
              <div className="home-card-icon">📅</div>
              <h3>班表管理</h3>
              <p>管理所有醫師的門診班表</p>
            </Link>

            <Link to="/admin/users" className="home-card">
              <div className="home-card-icon">👥</div>
              <h3>帳號管理</h3>
              <p>管理病患、醫師和管理員帳號</p>
            </Link>

            <Link to="/admin/audit" className="home-card">
              <div className="home-card-icon">📋</div>
              <h3>審計日誌</h3>
              <p>查看系統操作審計記錄</p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;

