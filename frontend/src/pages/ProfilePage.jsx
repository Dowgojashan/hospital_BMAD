import React, { useState, useEffect } from 'react';
// import { getCurrentUser } from '../services/authService'; // To be adapted
// import { User } from '../types'; // To be defined or use generic types
import './ProfilePage.css';
import api from '../api/axios'; // Use existing axios instance
import { useAuthStore } from '../store/authStore'; // Use existing auth store

const ProfilePage = () => {
  const user = useAuthStore((s) => s.user); // Get user from auth store
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    card_number: '',
    specialty: '', // Added for doctor's specialty
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
        specialty: user.specialty || '', // Set specialty for doctor
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // TODO: Implement API call for updating user profile
      // const payload = { ...formData };
      // if (user.role === 'patient') {
      //   // Patient specific fields
      // } else if (user.role === 'doctor') {
      //   // Doctor specific fields
      // }
      // await api.put(`/api/v1/users/${user.id}`, payload);
      setMessage('個人資料更新成功！ (Mock)'); // Mock success
    } catch (error) {
      setMessage('更新失敗，請稍後再試 (Mock)'); // Mock failure
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Or redirect to login if user is not available
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

          {user.role === 'doctor' && formData.specialty && (
            <div className="form-group">
              <label className="form-label">專科</label>
              <input
                type="text"
                className="form-control"
                value={formData.specialty}
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

export default ProfilePage;
