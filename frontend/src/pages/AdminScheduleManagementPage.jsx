import React, { useState, useEffect } from 'react';
// import {
//   getSchedules,
//   getDoctors,
//   createSchedule,
//   updateSchedule,
//   deleteSchedule,
// } from '../../services/scheduleService'; // To be adapted
// import { Schedule, Doctor } from '../../types'; // To be defined or use generic types
// import { mockSchedules, mockDoctors } from '../../utils/mockData'; // To be copied or created
import './AdminScheduleManagementPage.css';
import api from '../api/axios'; // Use existing axios instance

// Mock data for doctors (temporary)
const mockDoctors = [
  { doctor_id: 'doc001', name: 'Dr. Chen', specialty: '內科' },
  { doctor_id: 'doc002', name: 'Dr. Lin', specialty: '小兒科' },
  { doctor_id: 'doc003', name: 'Dr. Wang', specialty: '內科' },
];

// Mock data for schedules (temporary)
const mockSchedules = [
  { schedule_id: 'sch001', doctor_name: 'Dr. Chen', specialty: '內科', date: '2025-12-01', start: '09:00', end: '12:00', doctor_id: 'doc001' },
  { schedule_id: 'sch002', doctor_name: 'Dr. Chen', specialty: '內科', date: '2025-12-02', start: '14:00', end: '17:00', doctor_id: 'doc001' },
  { schedule_id: 'sch003', doctor_name: 'Dr. Lin', specialty: '小兒科', date: '2025-12-01', start: '10:00', end: '13:00', doctor_id: 'doc002' },
];

const AdminScheduleManagementPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    doctor_id: '',
    date: '',
    start: '',
    end: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchedules();
    loadDoctors();
  }, []);

  const loadSchedules = async () => {
    try {
      // TODO: Integrate with actual API endpoint for fetching schedules
      // const response = await api.get('/api/v1/admin/schedules');
      // setSchedules(response.data);

      // Using mock data for now
      setSchedules(mockSchedules);
    } catch (error) {
      console.error('載入班表失敗:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      // TODO: Integrate with actual API endpoint for fetching doctors
      // const response = await api.get('/api/v1/admin/doctors');
      // setDoctors(response.data);

      // Using mock data for now
      setDoctors(mockDoctors);
    } catch (error) {
      console.error('載入醫師列表失敗:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSchedule) {
        // TODO: Integrate with actual API endpoint for updating schedule
        // await api.put(`/api/v1/admin/schedules/${editingSchedule.schedule_id}`, formData);
        alert('班表更新成功！ (Mock)'); // Mock success
      } else {
        // TODO: Integrate with actual API endpoint for creating schedule
        // await api.post('/api/v1/admin/schedules', formData);
        alert('班表新增成功！ (Mock)'); // Mock success
      }
      setShowForm(false);
      setEditingSchedule(null);
      setFormData({ doctor_id: '', date: '', start: '', end: '' });
      loadSchedules();
    } catch (error) {
      alert('操作失敗，請稍後再試 (Mock)'); // Mock failure
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      doctor_id: schedule.doctor_id,
      date: schedule.date,
      start: schedule.start,
      end: schedule.end,
    });
    setShowForm(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('確定要刪除此班表嗎？')) {
      return;
    }

    try {
      // TODO: Integrate with actual API endpoint for deleting schedule
      // await api.delete(`/api/v1/admin/schedules/${scheduleId}`);
      alert('刪除成功！ (Mock)'); // Mock success
      loadSchedules();
    } catch (error) {
      alert('刪除失敗，請稍後再試 (Mock)'); // Mock failure
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">班表管理</h1>
        <p className="page-subtitle">管理所有醫師的門診班表</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingSchedule(null);
            setFormData({ doctor_id: '', date: '', start: '', end: '' });
          }}
        >
          新增班表
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingSchedule ? '編輯班表' : '新增班表'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">醫師</label>
              <select
                className="form-select"
                value={formData.doctor_id}
                onChange={(e) =>
                  setFormData({ ...formData, doctor_id: e.target.value })
                }
                required
              >
                <option value="">請選擇醫師</option>
                {doctors.map((doctor) => (
                  <option key={doctor.doctor_id} value={doctor.doctor_id}>
                    {doctor.name} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">日期</label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">開始時間</label>
              <input
                type="time"
                className="form-control"
                value={formData.start}
                onChange={(e) =>
                  setFormData({ ...formData, start: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">結束時間</label>
              <input
                type="time"
                className="form-control"
                value={formData.end}
                onChange={(e) =>
                  setFormData({ ...formData, end: e.target.value })
                }
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '處理中...' : '儲存'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingSchedule(null);
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>班表列表</h3>
        <div className="schedules-table">
          <table className="table">
            <thead>
              <tr>
                <th>醫師</th>
                <th>科別</th>
                <th>日期</th>
                <th>時段</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.schedule_id}>
                  <td>{schedule.doctor_name || '醫師'}</td>
                  <td>{schedule.specialty}</td>
                  <td>{new Date(schedule.date).toLocaleDateString('zh-TW')}</td>
                  <td>{schedule.start} - {schedule.end}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(schedule)}
                      style={{ marginRight: '8px' }}
                    >
                      編輯
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(schedule.schedule_id)}
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminScheduleManagementPage;
