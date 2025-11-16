import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './DoctorRecordsPage.css';
import api from '../api/axios'; // Use existing axios instance
import { useAuthStore } from '../store/authStore'; // Import useAuthStore

const DoctorRecordsPage = () => {
  const { patientId } = useParams(); // Get patientId from URL
  const { user } = useAuthStore(); // Get current user from auth store
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '', // Changed from patient_name, patient_email
    summary: '',
  });
  const [loading, setLoading] = useState(false);
  // Removed showEmailField and patientLookupError states

  useEffect(() => {
    loadRecords();
  }, [patientId]); // Reload records when patientId changes

  const loadRecords = async () => {
    try {
      const response = await api.get('/api/v1/medical-records/doctor/medical-records', {
        params: { patient_id: patientId } // Filter by patientId if available
      });
      setRecords(response.data);

      // If patientId is present and no records are found, automatically show the form for adding a new record
      if (patientId && response.data.length === 0) {
        setShowForm(true);
        setEditingRecord(null);
        // When pre-filling for a new record, we only have patientId
        setFormData({ ...formData, patient_id: patientId, summary: '' });
      }
    } catch (error) {
      console.error('載入病歷失敗:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Removed setPatientLookupError('');

    try {
      let finalPatientId = patientId; // Start with patientId from URL if available

      if (!editingRecord) { // Only for new records
        if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
          // Removed setPatientLookupError('您沒有權限執行此操作。');
          console.error('您沒有權限執行此操作。'); // Log error instead
          setLoading(false);
          return;
        }
        // If no patientId from URL, use the one from formData
        if (!finalPatientId) {
          finalPatientId = formData.patient_id;
        }
      } else {
        // For editing, patient_id comes from editingRecord or formData
        finalPatientId = editingRecord ? editingRecord.patient_id : formData.patient_id;
      }


      const recordToSubmit = {
        patient_id: finalPatientId,
        summary: formData.summary,
      };

      if (editingRecord) {
        await api.put(`/api/v1/medical-records/${editingRecord.record_id}`, recordToSubmit);
      } else {
        await api.post('/api/v1/medical-records', recordToSubmit);
      }
      setShowForm(false);
      setEditingRecord(null);
      setFormData({ patient_id: '', summary: '' }); // Reset form
      // Removed setShowEmailField(false);
      loadRecords();
    } catch (error) {
      console.error('操作失敗:', error);
      // Removed setPatientLookupError('操作失敗，請稍後再試。');
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
    // Removed setShowEmailField(false);
    // Removed setPatientLookupError('');
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('確定要刪除此病歷嗎？')) {
      return;
    }

    try {
      await api.delete(`/api/v1/medical-records/${recordId}`);
      loadRecords();
    } catch (error) {
      console.error('刪除失敗:', error);
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
            setFormData({ patient_id: '', summary: '' }); // Reset form for new entry
            // Removed setShowEmailField(false);
            // Removed setPatientLookupError('');
          }}
        >
          新增病歷
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3>{editingRecord ? '編輯病歷' : '新增病歷'}</h3>
          <form onSubmit={handleSubmit}>
            {!editingRecord && !patientId && ( // Only show patient_id input for new records without patientId from URL
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
                  placeholder="輸入病患ID (UUID)"
                />
              </div>
            )}
            {editingRecord && ( // Display patient_id for existing records
              <div className="form-group">
                <label className="form-label">病患ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.patient_id}
                  disabled
                />
              </div>
            )}
            {patientId && !editingRecord && ( // Display patientId from URL for new records
              <div className="form-group">
                <label className="form-label">病患ID (來自預約)</label>
                <input
                  type="text"
                  className="form-control"
                  value={patientId}
                  disabled
                />
              </div>
            )}

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
                  // Removed setPatientLookupError('');
                  // Removed setShowEmailField(false);
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
