import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './HospitalLoginPage.css'; // Reuse the same CSS

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResend = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/v1/resend-verification-email', { email });
      setMessage(response.data.message || '新的驗證信已成功寄出，請檢查您的信箱。');
      setEmailSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || '發生錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/v1/verify-email', { email, otp });
      setMessage(response.data.message || '電子郵件驗證成功！2秒後將跳轉至登入頁面。');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || '驗證失敗，請檢查您的驗證碼。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">重寄驗證信</h1>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!emailSent ? (
          <form onSubmit={handleResend} className="login-form">
            <p className="login-subtitle" style={{ textAlign: 'center', marginBottom: '24px' }}>
              如果您在註冊後沒有收到驗證信，可以在這裡重新發送。
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
              {loading ? '發送中...' : '發送驗證信'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="login-form">
            <div className="form-group">
              <label className="form-label">請輸入您信箱中收到的 6 位數驗證碼</label>
              <input
                type="text"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength="6"
                placeholder="6位數驗證碼"
              />
            </div>
            <div className="form-group">
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? '驗證中...' : '驗證'}
                </button>
            </div>
            <div className="form-group">
                <button type="button" onClick={handleResend} className="btn btn-secondary btn-block" disabled={loading}>
                    {loading ? '發送中...' : '重發驗證信'}
                </button>
            </div>
          </form>
        )}

        <div className="login-footer">
          <Link to="/login">返回登入</Link>
        </div>
      </div>
    </div>
  );
}
