import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import './EmailVerificationPage.css'; // Create this CSS file

// Generic Message Modal Component (copied from other pages)
const MessageModal = ({ show, onClose, message, type }) => {
  if (!show) return null;
  const modalTitle = type === 'success' ? '成功！' : '錯誤！';
  const titleClass = type === 'success' ? 'modal-title-success' : 'modal-title-error';
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className={titleClass}>{modalTitle}</h2>
        <p>{message}</p>
        <button onClick={onClose} className={`btn ${type === 'success' ? 'btn-primary' : 'btn-danger'}`}>關閉</button>
      </div>
    </div>
  );
};

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // States for modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const emailFromQuery = queryParams.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [location.search]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setModalMessage('');
    setShowErrorModal(false);
    setShowSuccessModal(false);

    if (!email || !otp) {
      setModalMessage('請輸入電子郵件和驗證碼。');
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/v1/auth/verify-email', { email, otp });
      setModalMessage('電子郵件驗證成功！您現在可以登入。');
      setShowSuccessModal(true);
      // Optionally redirect to login after a short delay or on modal close
      setTimeout(() => {
        handleCloseModal();
        navigate('/login');
      }, 2000);
    } catch (err) {
      let errorMessage = '驗證失敗，請檢查驗證碼或稍後再試。';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg).join('; ');
        } else {
          errorMessage = err.response.data.detail;
        }
      }
      setModalMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setModalMessage('');
    setShowErrorModal(false);
    setShowSuccessModal(false);

    if (!email) {
      setModalMessage('請輸入電子郵件以重新發送驗證碼。');
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/v1/auth/resend-verification-email', { email });
      setModalMessage('新的驗證碼已發送到您的電子郵件。');
      setShowSuccessModal(true);
    } catch (err) {
      let errorMessage = '重新發送失敗，請稍後再試。';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg).join('; ');
        } else {
          errorMessage = err.response.data.detail;
        }
      }
      setModalMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage('');
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h1 className="verification-title">電子郵件驗證</h1>
        <p className="verification-subtitle">請輸入發送到您電子郵件的驗證碼。</p>

        <form onSubmit={handleVerify} className="verification-form">
          <div className="form-group">
            <label className="form-label">電子郵件</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="您的電子郵件"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">驗證碼</label>
            <input
              type="text"
              className="form-control"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="請輸入 6 位數驗證碼"
              maxLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '驗證中...' : '驗證'}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-block mt-2"
            onClick={handleResend}
            disabled={loading}
          >
            {loading ? '重新發送中...' : '重新發送驗證碼'}
          </button>
        </form>
      </div>

      <MessageModal
        show={showSuccessModal || showErrorModal}
        onClose={handleCloseModal}
        message={modalMessage}
        type={showSuccessModal ? 'success' : 'error'}
      />
    </div>
  );
};

export default EmailVerificationPage;
