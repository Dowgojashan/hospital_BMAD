import React, { useState, useEffect } from 'react';
// import { User } from '../../types'; // To be defined or use generic types
// import { mockUsers } from '../../utils/mockData'; // To be copied or created
import './AdminUserManagementPage.css';
import api from '../api/axios'; // Use existing axios instance

// Mock data for users (temporary)
const mockUsers = [
  { id: 'user001', name: 'Patient A', email: 'patient.a@example.com', role: 'patient', phone: '0912345678', dob: '1990-01-01', card_number: '1234567890' },
  { id: 'user002', name: 'Dr. Chen', email: 'dr.chen@example.com', role: 'doctor', specialty: '內科' },
  { id: 'user003', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
];

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    specialty: '',
    phone: '',
    dob: '',
    card_number: '',
  });
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    // TODO: Integrate with actual API endpoint for fetching users
    // const response = await api.get('/api/v1/admin/users');
    // setUsers(response.data);

    // Using mock data for now
    setTimeout(() => {
      setUsers(mockUsers);
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API for adding/editing users
    alert(editingUser ? '編輯功能開發中... (Mock)' : '新增功能開發中... (Mock)');
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'patient',
      specialty: '',
      phone: '',
      dob: '',
      card_number: '',
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Password should not be pre-filled for security
      role: user.role,
      specialty: user.specialty || '',
      phone: user.phone || '',
      dob: user.dob || '',
      card_number: user.card_number || '',
    });
    setShowForm(true);
  };

  const handleDelete = (userId) => {
    if (!window.confirm('確定要刪除此帳號嗎？')) {
      return;
    }
    // TODO: Implement API for deleting user
    alert('刪除功能開發中... (Mock)');
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      patient: { label: '病患', class: 'badge-info' },
      doctor: { label: '醫師', class: 'badge-success' },
      admin: { label: '管理員', class: 'badge-warning' },
    };
    const roleInfo = roleMap[role] || { label: role, class: 'badge-info' };
    return <span className={`badge ${roleInfo.class}`}>{roleInfo.label}</span>;
  };

  const filteredUsers = filterRole === 'all'
    ? users
    : users.filter(user => user.role === filterRole);

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
          <h3>{editingUser ? '編輯帳號' : '新增帳號'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">角色</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value,
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
                required={!editingUser} // Password required only for new user
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
                {editingUser ? '更新帳號' : '建立帳號'}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>帳號列表</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#6c757d' /* var(--text-medium) */ }}>篩選：</label>
            <select
              className="form-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ width: 'auto', minWidth: '120px' }}
            >
              <option value="all">全部</option>
              <option value="patient">病患</option>
              <option value="doctor">醫師</option>
              <option value="admin">管理員</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6c757d' /* var(--text-medium) */, padding: '40px' }}>
            目前沒有帳號記錄
          </p>
        ) : (
          <div className="users-table">
            <table className="table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>電子郵件</th>
                  <th>角色</th>
                  <th>專科/電話</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>
                      {user.role === 'doctor' && user.specialty ? (
                        <span>{user.specialty}</span>
                      ) : user.role === 'patient' && user.phone ? (
                        <span>{user.phone}</span>
                      ) : (
                        <span style={{ color: '#6c757d' /* var(--text-medium) */ }}>-</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEdit(user)}
                        style={{ marginRight: '8px', fontSize: '14px', padding: '6px 12px' }}
                      >
                        編輯
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(user.id)}
                        style={{ fontSize: '14px', padding: '6px 12px' }}
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagementPage;
