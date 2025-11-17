import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

// Form for adding/editing a doctor
function DoctorForm({ doctor, onClose, onSave }) {
  const [formData, setFormData] = useState(doctor || {
    doctor_login_id: '',
    password: '',
    name: '',
    specialty: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
      <h3>{doctor ? '編輯醫生' : '新增醫生'}</h3>
      <form onSubmit={handleSubmit}>
        {!doctor && (
          <div>
            <label>登入 ID:</label>
            <input
              type="text"
              name="doctor_login_id"
              value={formData.doctor_login_id}
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
            required={!doctor} // Password is required for new doctors
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
          <label>專長:</label>
          <input
            type="text"
            name="specialty"
            value={formData.specialty}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">儲存</button>
        <button type="button" onClick={onClose} style={{ marginLeft: '10px' }}>取消</button>
      </form>
    </div>
  );
}

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const token = useAuthStore((s) => s.accessToken);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/doctors/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDoctors(response.data);
    } catch (err) {
      setError('無法載入醫生列表');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [token]); // Re-fetch when token changes

  const handleAddClick = () => {
    setEditingDoctor(null);
    setShowForm(true);
  };

  const handleEditClick = (doctor) => {
    setEditingDoctor(doctor);
    setShowForm(true);
  };

  const handleDeleteClick = async (doctorId) => {
    if (window.confirm('確定要刪除這位醫生嗎？')) {
      try {
        await api.delete(`/api/v1/doctors/${doctorId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        fetchDoctors(); // Refresh list
      } catch (err) {
        if (err.response && err.response.status === 403) {
          alert(err.response.data.detail);
        } else {
          setError('無法刪除醫生');
          console.error(err);
        }
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingDoctor) {
        // Update existing doctor
        await api.put(`/api/v1/doctors/${editingDoctor.doctor_id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Add new doctor
        await api.post('/api/v1/doctors/', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      setShowForm(false);
      fetchDoctors(); // Refresh list
    } catch (err) {
      if (err.response && err.response.status === 422) {
        const errorMessages = err.response.data.detail.map(d => `${d.loc[1]}: ${d.msg}`).join(', ');
        setError(errorMessages);
      } else {
        setError('儲存醫生失敗');
        console.error(err);
      }
    }
  };

  if (loading) return <div>載入中...</div>;
  if (error) return <div style={{ color: 'red' }}>錯誤: {error}</div>;

  return (
    <div>
      <h3>醫生管理</h3>
      <button onClick={handleAddClick}>新增醫生</button>

      {showForm && (
        <DoctorForm
          doctor={editingDoctor}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>登入 ID</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>姓名</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>專長</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor) => (
            <tr key={doctor.doctor_id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{doctor.doctor_id}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{doctor.doctor_login_id}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{doctor.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{doctor.specialty}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                <button onClick={() => handleEditClick(doctor)}>編輯</button>
                <button onClick={() => handleDeleteClick(doctor.doctor_id)} style={{ marginLeft: '10px' }}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
