import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

// Form for adding/editing an admin
function AdminForm({ admin, onClose, onSave }) {
  const [formData, setFormData] = useState(admin || {
    account_username: '',
    password: '',
    name: '',
    email: '',
    is_system_admin: false, // Changed from is_system_account
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
      <h3>{admin ? '編輯管理員' : '新增管理員'}</h3>
      <form onSubmit={handleSubmit}>
        {!admin && (
          <div>
            <label>帳號:</label>
            <input
              type="text"
              name="account_username"
              value={formData.account_username}
              onChange={handleChange}
              required
            />
          </div>
        )}
        <div>
          <label>密碼:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!admin} // Password is required for new admins
          />
        </div>
        <div>
          <label>姓名:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="is_system_admin" // Changed from is_system_account
              checked={formData.is_system_admin} // Changed from is_system_account
              onChange={handleChange}
            />
            系統管理員
          </label>
        </div>
        <button type="submit">儲存</button>
        <button type="button" onClick={onClose} style={{ marginLeft: '10px' }}>取消</button>
      </form>
    </div>
  );
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const token = useAuthStore((s) => s.accessToken);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/admins/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data); // Added for debugging
      setAdmins(response.data);
    } catch (err) {
      setError('無法載入管理員列表');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [token]); // Re-fetch when token changes

  const handleAddClick = () => {
    setEditingAdmin(null);
    setShowForm(true);
  };

  const handleEditClick = (admin) => {
    setEditingAdmin(admin);
    setShowForm(true);
  };

  const handleDeleteClick = async (adminId) => {
    if (window.confirm('確定要刪除這位管理員嗎？')) {
      try {
        await api.delete(`/api/v1/admins/${adminId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchAdmins(); // Refresh list
      } catch (err) {
        if (err.response && err.response.status === 403) {
          alert(err.response.data.detail);
        } else {
          setError('無法刪除管理員');
          console.error(err);
        }
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingAdmin) {
        // Update existing admin
        await api.put(`/api/v1/admins/${editingAdmin.admin_id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Add new admin
        await api.post('/api/v1/admins/', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      setShowForm(false);
      fetchAdmins(); // Refresh list
    } catch (err) {
      if (err.response && err.response.status === 422) {
        const errorMessages = err.response.data.detail.map(d => `${d.loc[1]}: ${d.msg}`).join(', ');
        setError(errorMessages);
      } else {
        setError('儲存管理員失敗');
        console.error(err);
      }
    }
  };

  if (loading) return <div>載入中...</div>;
  if (error) return <div style={{ color: 'red' }}>錯誤: {error}</div>;

  return (
    <div>
      <h3>管理員管理</h3>
      <button onClick={handleAddClick}>新增管理員</button>

      {showForm && (
        <AdminForm
          admin={editingAdmin}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>帳號</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>姓名</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Email</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>系統管理員</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.admin_id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{admin.admin_id}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{admin.account_username}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{admin.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{admin.email}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{admin.is_system_admin ? '是' : '否'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <button onClick={() => handleEditClick(admin)}>編輯</button>
                <button onClick={() => handleDeleteClick(admin.admin_id)} style={{ marginLeft: '10px' }}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
