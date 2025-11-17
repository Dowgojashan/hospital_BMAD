import React, { useState, useEffect } from 'react';
import './AdminUserManagementPage.css';
import api from '../api/axios'; // Use existing axios instance
import { useAuthStore } from '../store/authStore'; // Use existing auth store

// Helper function for email validation
const isValidEmail = (email) => {
  // Basic regex for email validation
  return /^[^ @]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Helper function for phone number validation (Taiwan format: 09xxxxxxxx)
const isValidPhone = (phone) => {
  // Taiwan mobile number regex: starts with 09, followed by 8 digits
  return /^09\d{8}$/.test(phone);
};

const AdminUserManagementPage = () => {
  const currentUser = useAuthStore((s) => s.user); // Get current user for role checks
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    login_id: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    specialty: '',
    phone: '',
    dob: '',
    card_number: '',
    department: '',
  });
  const [filterRole, setFilterRole] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddNewUserClick = () => {
    setEditingUser(null);
    const initialDepartment = currentUser.role === 'admin' && !currentUser.is_system_admin 
      ? currentUser.department 
      : '';
    const initialSpecialty = currentUser.role === 'admin' && !currentUser.is_system_admin 
      ? currentUser.department 
      : '';

    setFormData({
      name: '',
      login_id: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'patient',
      specialty: initialSpecialty,
      phone: '',
      dob: '',
      card_number: '',
      department: initialDepartment,
    });
    setShowForm(true);
  };

  const handleRoleChange = (newRole) => {
    const initialDepartment = newRole === 'admin' && currentUser.role === 'admin' && !currentUser.is_system_admin
      ? currentUser.department
      : '';
    const initialSpecialty = newRole === 'doctor' && currentUser.role === 'admin' && !currentUser.is_system_admin
      ? currentUser.department
      : '';

    setFormData({
      ...formData,
      role: newRole,
      specialty: initialSpecialty,
      phone: '',
      dob: '',
      card_number: '',
      department: initialDepartment,
    });
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const [adminsResponse, doctorsResponse, patientsResponse] = await Promise.all([
        api.get('/api/v1/admins/'),
        api.get('/api/v1/doctors/'),
        api.get('/api/v1/patients/'),
      ]);

      const admins = adminsResponse.data.map(admin => ({
        id: admin.admin_id,
        name: admin.name,
        login_id: admin.account_username,
        email: admin.email,
        role: 'admin',
        is_system_account: admin.is_system_account,
        department: admin.department,
      }));

      const doctors = doctorsResponse.data.map(doctor => ({
        id: doctor.doctor_id,
        name: doctor.name,
        login_id: doctor.doctor_login_id,
        email: doctor.email,
        role: 'doctor',
        specialty: doctor.specialty,
      }));

      const patients = patientsResponse.data.map(patient => ({
        id: patient.patient_id,
        name: patient.name,
        email: patient.email,
        role: 'patient',
        phone: patient.phone,
        dob: patient.dob,
        card_number: patient.card_number,
      }));

      setUsers([...admins, ...doctors, ...patients]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('載入使用者失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingUser && formData.password !== formData.confirmPassword) {
      alert('密碼與確認密碼不符，請重新輸入。');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      alert('密碼長度不得少於6個字元。');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      alert('電子郵件格式不正確，請重新輸入。');
      return;
    }

    if (formData.role === 'patient' && formData.phone && !isValidPhone(formData.phone)) {
      alert('電話號碼格式不正確，請輸入09開頭的10位數字。');
      return;
    }
    try {
      if (editingUser) {
        if (formData.role === 'admin') {
          await api.put(`/api/v1/admins/${editingUser.id}`, {
            account_username: formData.login_id,
            name: formData.name,
            email: formData.email,
            department: formData.department,
            ...(formData.password && { password: formData.password }),
          });
        } else if (formData.role === 'doctor') {
          await api.put(`/api/v1/doctors/${editingUser.id}`, {
            doctor_login_id: formData.login_id,
            name: formData.name,
            specialty: formData.specialty,
            email: formData.email,
            ...(formData.password && { password: formData.password }),
          });
        } else if (formData.role === 'patient') {
          await api.put(`/api/v1/patients/${editingUser.id}`, {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            dob: formData.dob,
            card_number: formData.card_number,
            ...(formData.password && { password: formData.password }),
          });
        }
        alert('帳號更新成功！');
      } else {
        if (formData.role === 'admin') {
          await api.post('/api/v1/admins/', {
            account_username: formData.login_id,
            name: formData.name,
            email: formData.email,
            password: formData.password,
            department: formData.department,
          });
        } else if (formData.role === 'doctor') {
          const doctorData = {
            doctor_login_id: formData.login_id,
            name: formData.name,
            password: formData.password,
            specialty: formData.specialty,
            email: formData.email,
          };
          await api.post('/api/v1/doctors/', doctorData);
        } else if (formData.role === 'patient') {
          const patientData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            dob: formData.dob,
            card_number: formData.card_number,
          };
          await api.post('/api/v1/patients/', patientData);
        }
        alert('帳號建立成功！');
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'patient',
        specialty: '',
        phone: '',
        dob: '',
        card_number: '',
        department: '',
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to submit user:', error);
      const errorMessage = error.response?.data?.detail || '操作失敗，請檢查輸入或稍後再試。';
      alert(errorMessage);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      login_id: user.role === 'admin' ? user.login_id : user.role === 'doctor' ? user.login_id : '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      role: user.role,
      specialty: user.specialty || '',
      phone: user.phone || '',
      dob: user.dob || '',
      card_number: user.card_number || '',
      department: user.department || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (userId, role) => {
    if (!window.confirm('確定要刪除此帳號嗎？')) {
      return;
    }
    try {
      if (role === 'admin') {
        await api.delete(`/api/v1/admins/${userId}`);
      } else if (role === 'doctor') {
        await api.delete(`/api/v1/doctors/${userId}`);
      } else if (role === 'patient') {
        await api.delete(`/api/v1/patients/${userId}`);
      }
      alert('帳號刪除成功！');
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      const errorMessage = error.response?.data?.detail || '刪除失敗，請稍後再試。';
      alert(errorMessage);
    }
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
          onClick={handleAddNewUserClick}
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
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="patient">病患</option>
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

            {(formData.role === 'admin' || formData.role === 'doctor') && (
              <div className="form-group">
                <label className="form-label">登入帳號</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.login_id}
                  onChange={(e) =>
                    setFormData({ ...formData, login_id: e.target.value })
                  }
                  required={!editingUser}
                />
              </div>
            )}

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

            {formData.role === 'admin' && (
              <div className="form-group">
                <label className="form-label">科別</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder=""
                  disabled={editingUser || (currentUser.role === 'admin' && !currentUser.is_system_admin)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">密碼</label>
              <input
                type="password"
                className="form-control"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!editingUser}
              />
            </div>

            {!editingUser && (
              <div className="form-group">
                <label className="form-label">確認密碼</label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
            )}

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
                  disabled={editingUser || (currentUser.role === 'admin' && !currentUser.is_system_admin)}
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">出生日期</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">健保卡號</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.card_number}
                    onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                    required
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
            <label style={{ fontSize: '14px', color: '#6c757d' }}>篩選：</label>
            <select
              className="form-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ width: 'auto', minWidth: '120px' }}
            >
              <option value="all">全部</option>
              <option value="patient">病患</option>
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
                  <th>專科/電話/科別</th>
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
                      ) : user.role === 'admin' && user.department ? (
                        <span>{user.department}</span>
                      ) : (
                        <span style={{ color: '#6c757d' }}>-</span>
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