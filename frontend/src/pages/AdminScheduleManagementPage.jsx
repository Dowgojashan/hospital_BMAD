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
  const [message, setMessage] = useState(''); // For displaying messages to the user

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (doctors.length > 0) {
      loadSchedules();
    }
  }, [doctors]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/schedules/');
      const fetchedSchedules = response.data;

      // Enrich schedules with doctor names and specialties
      const enrichedSchedules = fetchedSchedules.map(schedule => {
        const doctor = doctors.find(doc => doc.id === schedule.doctor_id);
        return {
          ...schedule,
          doctor_name: doctor ? doctor.name : '未知醫師',
          specialty: doctor ? doctor.specialty : '未知科別',
        };
      });
      setSchedules(enrichedSchedules);
    } catch (error) {
      console.error('載入班表失敗:', error);
      setMessage('載入班表失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/doctors/');
      // Assuming the doctor objects from /api/v1/doctors/ have doctor_id, name, specialty
      const fetchedDoctors = response.data.map(doctor => ({
        id: doctor.doctor_id,
        name: doctor.name,
        specialty: doctor.specialty,
      }));
      setDoctors(fetchedDoctors);
    } catch (error) {
      console.error('載入醫師列表失敗:', error);
      setMessage('載入醫師列表失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (new Date(formData.date) < new Date()) {
      setMessage('日期不能是過去的日期。');
      setLoading(false);
      return;
    }

    if (formData.start >= formData.end) {
      setMessage('開始時間必須早於結束時間。');
      setLoading(false);
      return;
    }

    // Validate minutes for start and end times
    const startMinutes = parseInt(formData.start.split(':')[1]);
    const endMinutes = parseInt(formData.end.split(':')[1]);

    if ((startMinutes !== 0 && startMinutes !== 30) || (endMinutes !== 0 && endMinutes !== 30)) {
      setMessage('時間只能選擇整點或30分。');
      setLoading(false);
      return;
    }

    console.log('Submitting formData:', formData); // Debugging line

    try {
      if (editingSchedule) {
        await api.put(`/api/v1/schedules/${editingSchedule.schedule_id}`, formData);
        setMessage('班表更新成功！');
      } else {
        await api.post('/api/v1/schedules/', formData);
        setMessage('班表新增成功！');
      }
      setShowForm(false);
      setEditingSchedule(null);
      setFormData({ doctor_id: '', date: '', start: '', end: '' });
      loadSchedules();
    } catch (error) {
      console.error('操作失敗:', error);
      const errorMessage = error.response?.data?.detail || '操作失敗，請稍後再試。';
      setMessage(errorMessage);
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
      await api.delete(`/api/v1/schedules/${scheduleId}`);
      setMessage('刪除成功！');
      loadSchedules();
    } catch (error) {
      console.error('刪除失敗:', error);
      const errorMessage = error.response?.data?.detail || '刪除失敗，請稍後再試。';
      setMessage(errorMessage);
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
                  <option key={doctor.id} value={doctor.id}>
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
