import React, { useState, useEffect } from 'react';
// import {
//   getPatientRecords,
//   createMedicalRecord,
//   updateMedicalRecord,
//   deleteMedicalRecord,
// } from '../../services/medicalRecordService'; // To be adapted
// import { MedicalRecord } from '../../types'; // To be defined or use generic types
// import { mockMedicalRecords } from '../../utils/mockData'; // To be copied or created
import './DoctorRecordsPage.css';
import api from '../api/axios'; // Use existing axios instance

// Mock data for medical records (temporary)
const mockMedicalRecords = [
  {
    record_id: 'rec001',
    patient_id: 'pat001',
    patient_name: 'Patient A',
    doctor_name: 'Dr. Chen',
    created_at: '2025-11-01T10:00:00Z',
    summary: 'Patient presented with common cold symptoms. Prescribed rest and fluids.',
  },
  {
    record_id: 'rec002',
    patient_id: 'pat002',
    patient_name: 'Patient B',
    doctor_name: 'Dr. Lin',
    created_at: '2025-10-15T14:30:00Z',
    summary: 'Follow-up for minor injury. Wound healing well. Advised continued care.',
  },
];

const DoctorRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    summary: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      // TODO: Integrate with actual API endpoint for fetching patient records
      // const response = await api.get('/api/v1/doctor/medical-records');
      // setRecords(response.data);

      // Using mock data for now
      setTimeout(() => {
        setRecords(mockMedicalRecords);
      }, 500);
    } catch (error) {
      console.error('載入病歷失敗:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingRecord) {
        // TODO: Integrate with actual API endpoint for updating medical record
        // await api.put(`/api/v1/medical-records/${editingRecord.record_id}`, formData);
        alert('病歷更新成功！ (Mock)'); // Mock success
      } else {
        // TODO: Integrate with actual API endpoint for creating medical record
        // await api.post('/api/v1/medical-records', formData);
        alert('病歷新增成功！ (Mock)'); // Mock success
      }
      setShowForm(false);
      setEditingRecord(null);
      setFormData({ patient_id: '', summary: '' });
      loadRecords();
    } catch (error) {
      alert('操作失敗，請稍後再試 (Mock)'); // Mock failure
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      patient_id: record.patient_id,
      summary: record.summary,
    });
    setShowForm(true);
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('確定要刪除此病歷嗎？')) {
      return;
    }

    try {
      // TODO: Integrate with actual API endpoint for deleting medical record
      // await api.delete(`/api/v1/medical-records/${recordId}`);
      alert('刪除成功！ (Mock)'); // Mock success
      loadRecords();
    } catch (error) {
      alert('刪除失敗，請稍後再試 (Mock)'); // Mock failure
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">病歷管理</h1>
        <p className="page-subtitle">新增和編輯病患病歷記錄</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingRecord(null);
            setFormData({ patient_id: '', summary: '' });
          }}
        >
          新增病歷
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingRecord ? '編輯病歷' : '新增病歷'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">病患ID *</label>
              <input
                type="text"
                className="form-control"
                value={formData.patient_id}
                onChange={(e) =>
                  setFormData({ ...formData, patient_id: e.target.value })
                }
                required
                placeholder="輸入病患ID"
              />
            </div>

            <div className="form-group">
              <label className="form-label">診療摘要 *</label>
              <textarea
                className="form-control"
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                rows={10}
                required
                placeholder="輸入診療摘要"
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
                  setEditingRecord(null);
                }}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="records-list">
        {records.map((record) => (
          <div key={record.record_id} className="card record-card">
            <div className="record-header">
              <div>
                <h3>{record.patient_name || '病患'}</h3>
                <p className="record-date">
                  {new Date(record.created_at).toLocaleString('zh-TW')}
                </p>
              </div>
              <div>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleEdit(record)}
                  style={{ marginRight: '8px' }}
                >
                  編輯
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(record.record_id)}
                >
                  刪除
                </button>
              </div>
            </div>

            <div className="record-content">
              <p>{record.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorRecordsPage;
