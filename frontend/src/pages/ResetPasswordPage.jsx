import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './HospitalLoginPage.css'; // Reuse the same CSS

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('無效的重設連結，權杖不存在。');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('密碼與確認密碼不相符。');
      return;
    }
    if (!token) {
      setError('權杖不存在，無法重設密碼。');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/v1/auth/reset-password', { token, password });
      setMessage(response.data.message || '密碼已成功重設，3秒後將自動跳轉至登入頁面。');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || '密碼重設失敗，連結可能已過期或無效。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">重設密碼</h1>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <p className="login-subtitle" style={{ textAlign: 'center', marginBottom: '24px' }}>
            請輸入您的新密碼。
          </p>
          <div className="form-group">
            <label className="form-label">新密碼</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="請輸入新密碼"
            />
          </div>
          <div className="form-group">
            <label className="form-label">確認新密碼</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="請再次輸入新密碼"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={!token || loading}>
            {loading ? '重設中...' : '重設密碼'}
          </button>
        </form>
        
        <div className="login-footer">
          <Link to="/login">返回登入</Link>
        </div>
      </div>
    </div>
  );
}