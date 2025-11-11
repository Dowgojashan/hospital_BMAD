import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import { User } from '../types';
import './Profile.css';

const Profile: React.FC = () => {
  const user = getCurrentUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    card_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: user.dob || '',
        card_number: user.card_number || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // TODO: 實作更新個人資料的 API 呼叫
      // await updateProfile(formData);
      setMessage('個人資料更新成功！');
    } catch (error) {
      setMessage('更新失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">個人資料</h1>
        <p className="page-subtitle">管理您的個人資訊</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="profile-form">
          {message && (
            <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-danger'}`}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">姓名</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">電子郵件</label>
            <input
              type="email"
              className="form-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {user.role === 'patient' && (
            <>
              <div className="form-group">
                <label className="form-label">電話</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">出生日期</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">健保卡號</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.card_number}
                  onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                />
              </div>
            </>
          )}

          {user.role === 'doctor' && user.specialty && (
            <div className="form-group">
              <label className="form-label">專科</label>
              <input
                type="text"
                className="form-control"
                value={user.specialty}
                disabled
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '更新中...' : '更新資料'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;

