import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AdminLeaveManagementPage.css';

// Generic Message Modal Component (copied from other pages)
const MessageModal = ({ show, onClose, message, type }) => {
  if (!show) return null;
  const modalTitle = type === 'success' ? '操作成功！' : '操作失敗！';
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

const AdminLeaveManagementPage = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequests, setSelectedRequests] = useState([]); // New state for selected requests

  // States for modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    setError('');
    setSelectedRequests([]); // Clear selections on refresh
    try {
      const response = await api.get('/api/v1/admin/leave-requests');
      setLeaveRequests(response.data);
    } catch (err) {
      setError('無法載入待審核的停診申請。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (scheduleId, action) => {
    let confirmationMessage = '';
    let successMessage = '';
    let errorMessage = '';

    if (action === 'approve') {
      confirmationMessage = '確定要核准此停診申請嗎？';
      successMessage = '停診申請已成功核准！';
      errorMessage = '核准停診申請失敗：';
    } else if (action === 'reject') {
      confirmationMessage = '確定要拒絕此停診申請嗎？';
      successMessage = '停診申請已成功拒絕！';
      errorMessage = '拒絕停診申請失敗：';
    }

    if (!window.confirm(confirmationMessage)) {
      return; // User cancelled the action
    }

    try {
      await api.put(`/api/v1/admin/leave-requests/${scheduleId}/${action}`);
      setModalMessage(successMessage);
      setShowSuccessModal(true);
      fetchLeaveRequests(); // Refresh the list after action
    } catch (err) {
      setModalMessage(`${errorMessage} ${err.response?.data?.detail || '請稍後再試。'}`);
      setShowErrorModal(true);
      console.error(err);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allScheduleIds = leaveRequests.map(req => req.schedule_id);
      setSelectedRequests(allScheduleIds);
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (e, scheduleId) => {
    if (e.target.checked) {
      setSelectedRequests(prev => [...prev, scheduleId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== scheduleId));
    }
  };

  const handleBatchRequest = async (action) => {
    if (selectedRequests.length === 0) {
      setModalMessage('請選擇至少一個停診申請進行批次操作。');
      setShowErrorModal(true);
      return;
    }

    let confirmationMessage = '';
    let successMessage = '';
    let errorMessage = '';

    if (action === 'approve') {
      confirmationMessage = `確定要批次核准這 ${selectedRequests.length} 個停診申請嗎？`;
      successMessage = '選定的停診申請已成功批次核准！';
      errorMessage = '批次核准停診申請失敗：';
    } else if (action === 'reject') {
      confirmationMessage = `確定要批次拒絕這 ${selectedRequests.length} 個停診申請嗎？`;
      successMessage = '選定的停診申請已成功批次拒絕！';
      errorMessage = '批次拒絕停診申請失敗：';
    }

    if (!window.confirm(confirmationMessage)) {
      return; // User cancelled the action
    }

    setLoading(true);
    try {
      // Process requests sequentially or in parallel
      const results = await Promise.allSettled(
        selectedRequests.map(id => api.put(`/api/v1/admin/leave-requests/${id}/${action}`))
      );

      const failedRequests = results.filter(result => result.status === 'rejected');
      if (failedRequests.length > 0) {
        setModalMessage(`${errorMessage} 部分操作失敗，請檢查控制台。`);
        setShowErrorModal(true);
      } else {
        setModalMessage(successMessage);
        setShowSuccessModal(true);
      }
      fetchLeaveRequests(); // Refresh the list after action
    } catch (err) {
      setModalMessage(`${errorMessage} ${err.response?.data?.detail || '請稍後再試。'}`);
      setShowErrorModal(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage('');
  };

  const isAllSelected = leaveRequests.length > 0 && selectedRequests.length === leaveRequests.length;
  const isAnySelected = selectedRequests.length > 0;

  if (loading) {
    return <div className="container">載入中...</div>;
  }

  if (error) {
    return <div className="container alert alert-danger">{error}</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">停診申請管理</h1>
        <p className="page-subtitle">審核或拒絕醫師的停診請求</p>
      </div>

      <div className="card">
        {leaveRequests.length === 0 ? (
          <p>目前沒有待審核的停診申請。</p>
        ) : (
          <>
            <div className="batch-actions">
              <button
                className="btn btn-success"
                onClick={() => handleBatchRequest('approve')}
                disabled={!isAnySelected || loading}
              >
                批次核准
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleBatchRequest('reject')}
                disabled={!isAnySelected || loading}
              >
                批次拒絕
              </button>
            </div>
            <table className="leave-requests-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={isAllSelected}
                      disabled={leaveRequests.length === 0}
                    />
                  </th>
                  <th>醫師</th>
                  <th>科別</th>
                  <th>申請日期</th>
                  <th>時段</th>
                  <th>停診原因</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.schedule_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.schedule_id)}
                        onChange={(e) => handleSelectRequest(e, request.schedule_id)}
                      />
                    </td>
                    <td>{request.doctor_name}</td>
                    <td>{request.specialty}</td>
                    <td>{new Date(request.date).toLocaleDateString()}</td>
                    <td>{request.time_period}</td>
                    <td>{request.leave_reason}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-success"
                          onClick={() => handleRequest(request.schedule_id, 'approve')}
                          disabled={loading}
                        >
                          核准
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleRequest(request.schedule_id, 'reject')}
                          disabled={loading}
                        >
                          拒絕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <MessageModal
        show={showSuccessModal}
        onClose={handleCloseModal}
        message={modalMessage}
        type="success"
      />
      <MessageModal
        show={showErrorModal}
        onClose={handleCloseModal}
        message={modalMessage}
        type="error"
      />
    </div>
  );
};

export default AdminLeaveManagementPage;
