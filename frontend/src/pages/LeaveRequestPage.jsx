import React, { useState } from 'react';
import './LeaveRequestPage.css';
import api from '../api/axios'; // Use existing axios instance

const LeaveRequestPage = () => {
  const [formData, setFormData] = useState({
    date: '',
    time_period: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement API call for submitting leave request
      // await api.post('/api/v1/doctor/leave-request', formData);
      alert('停診申請已送出，等待管理員審核 (Mock)'); // Mock success
      setFormData({ date: '', time_period: '', reason: '' });
    } catch (error) {
      alert('申請失敗，請稍後再試 (Mock)'); // Mock failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">停診申請</h1>
        <p className="page-subtitle">申請停診並通知受影響病患</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">停診日期 *</label>
            <input
              type="date"
              className="form-control"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">時段 *</label>
            <select
              className="form-select"
              value={formData.time_period}
              onChange={(e) =>
                setFormData({ ...formData, time_period: e.target.value })
              }
              required
            >
              <option value="">請選擇時段</option>
              <option value="早上">早上</option>
              <option value="下午">下午</option>
              <option value="晚上">晚上</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">停診原因 *</label>
            <textarea
              className="form-control"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={5}
              required
              placeholder="請說明停診原因"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? '送出中...' : '送出申請'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestPage;
