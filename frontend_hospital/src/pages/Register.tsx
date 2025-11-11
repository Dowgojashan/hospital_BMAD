import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import HospitalLogo from '../components/HospitalLogo';
import './Register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dob: '',
    card_number: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '註冊失敗，請檢查輸入資料');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <HospitalLogo size={60} showText={false} />
          </div>
          <h1 className="register-title">病患註冊</h1>
          <p className="register-subtitle">建立您的帳號以使用掛號服務</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-group">
            <label className="form-label">姓名 *</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="請輸入您的姓名"
            />
          </div>

          <div className="form-group">
            <label className="form-label">電子郵件 *</label>
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
            <label className="form-label">密碼 *</label>
            <input
              type="password"
              className="form-control"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder="請輸入密碼"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">電話 *</label>
            <input
              type="tel"
              className="form-control"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
              placeholder="請輸入聯絡電話"
            />
          </div>

          <div className="form-group">
            <label className="form-label">出生日期 *</label>
            <input
              type="date"
              className="form-control"
              value={formData.dob}
              onChange={(e) =>
                setFormData({ ...formData, dob: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">健保卡號 *</label>
            <input
              type="text"
              className="form-control"
              value={formData.card_number}
              onChange={(e) =>
                setFormData({ ...formData, card_number: e.target.value })
              }
              required
              placeholder="請輸入健保卡號"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '註冊中...' : '註冊'}
          </button>

          <div className="register-footer">
            <p>
              已有帳號？ <Link to="/login">立即登入</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

