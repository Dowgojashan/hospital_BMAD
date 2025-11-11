import React, { useState, useEffect } from 'react';
import {
  getSchedules,
  getDoctors,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../../services/scheduleService';
import { Schedule, Doctor } from '../../types';
import { mockSchedules, mockDoctors } from '../../utils/mockData';
import './ScheduleManagement.css';

const ScheduleManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
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
      // TODO: 未來使用 API
      // const data = await getSchedules();
      // setSchedules(data);
      
      // 測試用：使用假資料
      setSchedules(mockSchedules);
    } catch (error) {
      console.error('載入班表失敗:', error);
    }
  };

  const loadDoctors = async () => {
    try {
      // TODO: 未來使用 API
      // const data = await getDoctors();
      // setDoctors(data);
      
      // 測試用：使用假資料
      setDoctors(mockDoctors);
    } catch (error) {
      console.error('載入醫師列表失敗:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.schedule_id, formData);
      } else {
        await createSchedule(formData);
      }
      setShowForm(false);
      setEditingSchedule(null);
      setFormData({ doctor_id: '', date: '', start: '', end: '' });
      loadSchedules();
    } catch (error) {
      alert('操作失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      doctor_id: schedule.doctor_id,
      date: schedule.date,
      start: schedule.start,
      end: schedule.end,
    });
    setShowForm(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (!window.confirm('確定要刪除此班表嗎？')) {
      return;
    }

    try {
      await deleteSchedule(scheduleId);
      loadSchedules();
    } catch (error) {
      alert('刪除失敗，請稍後再試');
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

export default ScheduleManagement;

