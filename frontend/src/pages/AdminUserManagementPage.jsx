import React, { useState, useEffect } from 'react';
// import { User } from '../../types'; // To be defined or use generic types
// import { mockUsers } from '../../utils/mockData'; // To be copied or created
import './AdminUserManagementPage.css';
import api from '../api/axios'; // Use existing axios instance



const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin', // Default to admin
    specialty: '',
    phone: '',
  });
  const [filterRole, setFilterRole] = useState('all');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const [adminsResponse, doctorsResponse] = await Promise.all([
        api.get('/api/v1/admin/admins/'),
        api.get('/api/v1/admin/doctors/'),
      ]);

      const admins = adminsResponse.data.map(admin => ({
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        is_system_account: admin.is_system_account,
      }));

      const doctors = doctorsResponse.data.map(doctor => ({
        id: doctor.doctor_id,
        name: doctor.name,
        email: doctor.email,
        role: 'doctor',
        specialty: doctor.specialty,
        phone: doctor.phone,
      }));

      setUsers([...admins, ...doctors]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('載入使用者失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update user
        if (formData.role === 'admin') {
          await api.put(`/api/v1/admin/admins/${editingUser.id}`, {
            name: formData.name,
            email: formData.email,
            ...(formData.password && { password: formData.password }), // Only send password if it's not empty
          });
        } else if (formData.role === 'doctor') {
          await api.put(`/api/v1/admin/doctors/${editingUser.id}`, {
            name: formData.name,
            email: formData.email,
            specialty: formData.specialty,
            phone: formData.phone,
            ...(formData.password && { password: formData.password }), // Only send password if it's not empty
          });
        }
        alert('帳號更新成功！');
      } else {
        // Create user
        if (formData.role === 'admin') {
          await api.post('/api/v1/admin/admins/', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          });
        } else if (formData.role === 'doctor') {
          await api.post('/api/v1/admin/doctors/', {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            specialty: formData.specialty,
            phone: formData.phone,
          });
        }
        alert('帳號建立成功！');
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        specialty: '',
        phone: '',
      });
      loadUsers(); // Reload users after successful operation
    } catch (error) {
      console.error('Failed to submit user:', error);
      alert('操作失敗，請檢查輸入或稍後再試。');
    }
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
    });
    setShowForm(true);
  };

  const handleDelete = async (userId, role) => {
    if (!window.confirm('確定要刪除此帳號嗎？')) {
      return;
    }
    try {
      if (role === 'admin') {
        await api.delete(`/api/v1/admin/admins/${userId}`);
      } else if (role === 'doctor') {
        await api.delete(`/api/v1/admin/doctors/${userId}`);
      }
      alert('帳號刪除成功！');
      loadUsers(); // Reload users after successful deletion
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('刪除失敗，請稍後再試。');
    }
  };

    const getRoleBadge = (role) => {

      const roleMap = {

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

          <p className="page-subtitle">管理醫師和管理員帳號</p>

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

                  <option value="admin">管理員</option>

                  <option value="doctor">醫師</option>

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

                <option value="admin">管理員</option>

                <option value="doctor">醫師</option>

              </select>

            </div>

          </div>

  

          {isLoading ? (

            <p style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>載入中...</p>

          ) : filteredUsers.length === 0 ? (

            <p style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>

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

                          onClick={() => handleDelete(user.id, user.role)}

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
