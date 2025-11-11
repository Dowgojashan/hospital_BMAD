import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';
import HospitalLogo from '../components/HospitalLogo';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登入失敗，請檢查帳號密碼');
    } finally {
      setLoading(false);
    }
  };

  // 快速填入測試帳號
  const fillTestAccount = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <HospitalLogo size={60} showText={false} />
          </div>
          <h1 className="login-title">智慧醫療系統</h1>
          <p className="login-subtitle">請登入您的帳號</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-group">
            <label className="form-label">電子郵件</label>
            <input
              type="email"
              className="form-control"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="請輸入您的電子郵件"
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

          {/* 測試用：快速登入按鈕 */}
          <div style={{ marginTop: '20px', padding: '16px', background: '#f0f8ff', borderRadius: '8px', fontSize: '14px' }}>
            <p style={{ marginBottom: '12px', fontWeight: '600', color: '#0066cc' }}>🧪 測試帳號（開發用）</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => fillTestAccount('patient@test.com', 'patient123')}
                className="btn btn-secondary"
                style={{ fontSize: '14px', padding: '8px 12px' }}
              >
                病患：patient@test.com / patient123
              </button>
              <button
                type="button"
                onClick={() => fillTestAccount('doctor@test.com', 'doctor123')}
                className="btn btn-secondary"
                style={{ fontSize: '14px', padding: '8px 12px' }}
              >
                醫師：doctor@test.com / doctor123
              </button>
              <button
                type="button"
                onClick={() => fillTestAccount('admin@test.com', 'admin123')}
                className="btn btn-secondary"
                style={{ fontSize: '14px', padding: '8px 12px' }}
              >
                管理員：admin@test.com / admin123
              </button>
            </div>
          </div>

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

export default Login;