import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import { register } from '../services/authService'; // To be adapted
// import HospitalLogo from '../components/HospitalLogo'; // To be adapted or replaced
import './HospitalRegisterPage.css';
import api from '../api/axios'; // Use existing axios instance

const HospitalRegisterPage = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // --- Client-side Validation ---
    if (formData.password.length < 6) {
      setError('密碼長度至少要 6 碼');
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('電子郵件格式不正確');
      setLoading(false);
      return;
    }
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('電話號碼必須是 09 開頭的 10 位數字');
      setLoading(false);
      return;
    }
    // --- End Validation ---

    try {
      // Adapt register logic to existing frontend's API
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        dob: formData.dob,
        card_number: formData.card_number,
      };
      await api.post('/api/v1/register/patient', payload);
      navigate('/login'); // Assuming successful registration redirects to login
    } catch (err) {
      setError(err.response?.data?.detail || '註冊失敗，請檢查輸入資料');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            {/* <HospitalLogo size={60} showText={false} /> */}
            {/* Placeholder for HospitalLogo */}
            <div style={{ width: 60, height: 60, backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>H</div>
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

export default HospitalRegisterPage;
