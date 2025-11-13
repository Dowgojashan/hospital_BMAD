import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import { login } from '../services/authService'; // To be adapted
// import HospitalLogo from '../components/HospitalLogo'; // To be adapted or replaced
import './HospitalLoginPage.css';
import api from '../api/axios'; // Use existing axios instance
import { useAuthStore } from '../store/authStore'; // Use existing auth store

const HospitalLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Adapt login logic to existing frontend's API and auth store
      const params = new URLSearchParams();
      params.append('username', formData.email); // Assuming email is used as username
      params.append('password', formData.password);

      const resp = await api.post('/api/v1/auth/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const { access_token } = resp.data;
      setToken(access_token);

      const user = useAuthStore.getState().user; // Get the user object from the store
      if (user && user.role === 'admin') {
        navigate('/admin/dashboard'); // Navigate to the correct admin dashboard
      } else {
        navigate('/'); // Navigate to the main home page for patients/doctors
      }
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      if (errorDetail === "Email not verified. Please check your email for a verification code or resend it.") {
        setError(errorDetail);
        navigate(`/verify-email?email=${formData.email}`);
      } else {
        setError(errorDetail || '登入失敗，請檢查帳號密碼');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            {/* <HospitalLogo size={60} showText={false} /> */}
            {/* Placeholder for HospitalLogo */}
            <div style={{ width: 60, height: 60, backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>H</div>
          </div>
          <h1 className="login-title">智慧醫療系統</h1>
          <p className="login-subtitle">請登入您的帳號</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-group">
            <label className="form-label">電子郵件 / 帳號 ID</label>
            <input
              type="text"
              className="form-control"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="請輸入您的電子郵件或帳號 ID"
            />
          </div>

          <div className="form-group">
            <label className="form-label">密碼</label>
            <input
              type="password"
              className="form-control"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder="請輸入您的密碼"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '登入中...' : '登入'}
          </button>

          <div className="login-footer">
            <p>
              還沒有帳號？ <Link to="/register">立即註冊</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalLoginPage;
