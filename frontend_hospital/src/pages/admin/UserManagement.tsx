import React, { useState } from 'react';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient' as 'patient' | 'doctor' | 'admin',
    specialty: '',
    phone: '',
    dob: '',
    card_number: '',
  });

  // TODO: 實作載入使用者列表、新增、編輯、刪除功能

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">帳號管理</h1>
        <p className="page-subtitle">管理病患、醫師和管理員帳號</p>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          新增帳號
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>新增帳號</h3>
          <form>
            <div className="form-group">
              <label className="form-label">角色</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as 'patient' | 'doctor' | 'admin',
                  })
                }
              >
                <option value="patient">病患</option>
                <option value="doctor">醫師</option>
                <option value="admin">管理員</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">姓名</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">電子郵件</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">密碼</label>
              <input
                type="password"
                className="form-control"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            {formData.role === 'doctor' && (
              <div className="form-group">
                <label className="form-label">專科</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData({ ...formData, specialty: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {formData.role === 'patient' && (
              <>
                <div className="form-group">
                  <label className="form-label">電話</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">出生日期</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dob}
                    onChange={(e) =>
                      setFormData({ ...formData, dob: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">健保卡號</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.card_number}
                    onChange={(e) =>
                      setFormData({ ...formData, card_number: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                建立帳號
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>帳號列表</h3>
        <p style={{ color: 'var(--text-medium)' }}>
          帳號管理功能開發中...
        </p>
      </div>
    </div>
  );
};

export default UserManagement;

