import React, { useState, useEffect } from 'react';
// import { getCurrentUser } from '../services/authService'; // To be adapted
// import { User } from '../types'; // To be defined or use generic types
import './ProfilePage.css';
import api from '../api/axios'; // Use existing axios instance
import { useAuthStore } from '../store/authStore'; // Use existing auth store

// Helper function for email validation
const isValidEmail = (email) => {
  // Basic regex for email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Helper function for phone number validation (Taiwan format: 09xxxxxxxx)
const isValidPhone = (phone) => {
  // Taiwan mobile number regex: starts with 09, followed by 8 digits
  return /^09\d{8}$/.test(phone);
};

const ProfilePage = () => {
  const user = useAuthStore((s) => s.user); // Get user from auth store
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    card_number: '',
    specialty: '', // Added for doctor's specialty
    login_id: '', // Added for doctor/admin login ID
    password: '',
    confirmPassword: '',
  });
  const [originalFormData, setOriginalFormData] = useState({}); // To store original data for cancel
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false); // New state for edit mode

  const fetchProfile = async () => {
    if (user && user.id && user.role) { // Changed user.sub to user.id as per authStore fix
      setLoading(true);
      try {
        const response = await api.get('/api/v1/profile/me');
        const profileData = response.data;
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          dob: profileData.dob || '',
          card_number: profileData.card_number || '',
          specialty: profileData.specialty || '',
          login_id: profileData.account_username || profileData.doctor_login_id || '',
          password: '',
          confirmPassword: '',
        });
        setOriginalFormData({ // Store original data
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          dob: profileData.dob || '',
          card_number: profileData.card_number || '',
          specialty: profileData.specialty || '',
          login_id: profileData.account_username || profileData.doctor_login_id || '',
        });
        setIsEditing(false); // Ensure not in editing mode initially
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setMessage('載入個人資料失敗。');
        if (error.response && error.response.data && error.response.data.detail) {
          setMessage(`載入個人資料失敗: ${error.response.data.detail}`);
        }
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false); // Ensure loading state is reset even if API call is skipped
      setMessage('無法載入個人資料：用戶未登入或資訊不完整。');
    }
  };

  useEffect(() => {
    if (user && user.id) { // Only fetch if user.id is available
      fetchProfile();
    } else {
      setLoading(false); // Ensure loading is false if no user to fetch profile for
    }
  }, [user]); // Dependency on user object

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setMessage('密碼與確認密碼不符，請重新輸入。');
        setLoading(false);
        return;
      }
      if (formData.password.length > 0 && formData.password.length < 6) {
        setMessage('密碼長度不得少於6個字元。');
        setLoading(false);
        return;
      }
    }

    // Email format validation
    if (formData.email && !isValidEmail(formData.email)) {
      setMessage('電子郵件格式不正確，請重新輸入。');
      setLoading(false);
      return;
    }

    // Patient-specific phone validation
    if (user.role === 'patient' && formData.phone && !isValidPhone(formData.phone)) {
      setMessage('電話號碼格式不正確，請輸入09開頭的10位數字。');
      setLoading(false);
      return;
    }

    try {
      let payload = {};
      if (user.role === 'patient') {
        payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          dob: formData.dob,
          card_number: formData.card_number,
          ...(formData.password && { password: formData.password }),
        };
      } else if (user.role === 'doctor') {
        payload = {
          name: formData.name,
          email: formData.email,
          ...(formData.password && { password: formData.password }),
        };
      } else if (user.role === 'admin') {
        payload = {
          name: formData.name,
          email: formData.email,
          ...(formData.password && { password: formData.password }),
        };
      }

      await api.put('/api/v1/profile/me', payload);
      setMessage('個人資料更新成功！');
      // After successful update, reset to non-editing state and clear password fields
      setIsEditing(false);
      // Re-fetch profile to get the latest data, or update originalFormData
      // For simplicity, let's re-fetch the profile
      fetchProfile(); // Call fetchProfile again to update the displayed data and originalFormData
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.response?.data?.detail || '更新失敗，請稍後再試。';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">載入中...</div>
      </div>
    );
  }

  if (!user || !user.id) { // Display message if user is not logged in or id is missing
    return (
      <div className="container">
        <div className="card">
          <p style={{ textAlign: 'center', color: '#dc3545' }}>
            {message || '請先登入以查看您的個人資料。'}
          </p>
        </div>
      </div>
    );
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
              disabled={!isEditing}
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
              disabled={!isEditing}
            />
          </div>

          {(user.role === 'doctor' || user.role === 'admin') && (
            <div className="form-group">
              <label className="form-label">登入帳號</label>
              <input
                type="text"
                className="form-control"
                value={formData.login_id}
                disabled // Always disabled
              />
            </div>
          )}

          {user.role === 'patient' && (
            <>
              <div className="form-group">
                <label className="form-label">電話</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label className="form-label">出生日期</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  disabled // Always disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">健保卡號</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.card_number}
                  onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                  disabled // Always disabled
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
                disabled // Always disabled
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">新密碼 (留空則不更改)</label>
            <input
              type="password"
              className="form-control"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label className="form-label">確認新密碼</label>
            <input
              type="password"
              className="form-control"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          {!isEditing && ( // Show Edit button when not editing
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => setIsEditing(true)}
            >
              編輯
            </button>
          )}

          {isEditing && ( // Show Update and Cancel buttons when editing
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '更新中...' : '更新資料'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setFormData(originalFormData); // Revert changes
                  setIsEditing(false);
                  setMessage('');
                }}
              >
                取消
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;