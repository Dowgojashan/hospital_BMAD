import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import './HospitalLoginPage.css'; // Reuse the same CSS

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/v1/auth/forgot-password', { email });
      setMessage(response.data.message || '如果該信箱存在，一封密碼重設郵件將會寄出。');
    } catch (err) {
      setError(err.response?.data?.detail || '發生錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">忘記密碼</h1>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <p className="login-subtitle" style={{ textAlign: 'center', marginBottom: '24px' }}>
            請輸入您的電子郵件地址，我們將會寄送一封包含重設密碼連結的郵件給您。
          </p>
          <div className="form-group">
            <label className="form-label">電子郵件</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="請輸入您註冊的電子郵件"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '發送中...' : '發送重設連結'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/login">返回登入</Link>
        </div>
      </div>
    </div>
  );
}