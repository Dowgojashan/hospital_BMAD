import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DoctorRecordsPage.css';
import api from '../api/axios'; // Use existing axios instance
import { useAuthStore } from '../store/authStore'; // Import useAuthStore

const DoctorRecordsPage = () => {
  const { user } = useAuthStore(); // Get current user from auth store
  const [uniquePatients, setUniquePatients] = useState([]); // Store unique patients for the doctor
  const [selectedPatient, setSelectedPatient] = useState(null); // The patient being viewed
  const [patientRecords, setPatientRecords] = useState([]); // Records for the selected patient
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    summary: '',
    prescription: '',
  });
  const [loading, setLoading] = useState(false);
  const [pageMessage, setPageMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [patientToCreateRecordFor, setPatientToCreateRecordFor] = useState(null); // New state for patient selected in form
  const searchInputRef = useRef(null); // Ref for the search input

  // Load all patients for the current doctor
  const loadPatients = useCallback(async () => {
    setLoading(true);
    setPageMessage('');
    try {
      const response = await api.get('/api/v1/doctor-schedules/me/patients');
      setUniquePatients(response.data);
      if (response.data.length === 0) {
        setPageMessage('您目前沒有任何關聯的病患。');
      }
    } catch (error) {
      console.error('載入病患列表失敗:', error);
      setPageMessage('載入病患列表失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load medical records for a specific patient
  const loadPatientRecords = useCallback(async (patientId) => {
    setLoading(true);
    setPageMessage('');
    try {
      const response = await api.get(`/api/v1/medical-records/doctor/medical-records?patient_id=${patientId}`);
      setPatientRecords(response.data);
    } catch (error) {
      console.error('載入病歷失敗:', error);
      setPageMessage('載入病歷資料失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientRecords(selectedPatient.patient_id);
    } else {
      setPatientRecords([]);
    }
  }, [selectedPatient, loadPatientRecords]);

  const handleSelectPatient = async (patient) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/doctor-schedules/me/patients/${patient.patient_id}`);
      const patientDetails = response.data;
      const age = patientDetails.dob ? new Date().getFullYear() - new Date(patientDetails.dob).getFullYear() : 'N/A';
      setSelectedPatient({ ...patientDetails, age });
      setShowForm(false); // Hide form when selecting a new patient
      setPatientToCreateRecordFor(null); // Clear patient selected in form
    } catch (error) {
      console.error('載入病患詳細資訊失敗:', error);
      setPageMessage('載入病患詳細資訊失敗，請稍後再試。');
      setSelectedPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPageMessage('');

    try {
      if (!user || user.role !== 'doctor') {
        setPageMessage('您沒有權限執行此操作。');
        return;
      }

      let targetPatientId = null;
      if (selectedPatient) {
        targetPatientId = selectedPatient.patient_id;
      } else if (patientToCreateRecordFor) {
        targetPatientId = patientToCreateRecordFor.patient_id;
      } else {
        setPageMessage('請選擇一位病患以新增病歷。');
        setLoading(false);
        return;
      }

      const recordToSubmit = {
        patient_id: targetPatientId,
        summary: formData.summary,
        prescription: formData.prescription,
      };

      if (editingRecord) {
        await api.put(`/api/v1/medical-records/${editingRecord.record_id}`, recordToSubmit);
      } else {
        await api.post('/api/v1/medical-records', recordToSubmit);
      }
      setShowForm(false);
      setEditingRecord(null);
      setFormData({ summary: '', prescription: '' });
      setPatientToCreateRecordFor(null); // Clear patient selected in form
      
      // If we were in the patient details view, refresh those records
      if (selectedPatient) {
        await loadPatientRecords(selectedPatient.patient_id);
      } else {
        // If we were in the main patient list view, just reload the patient list
        // This might not be strictly necessary if the new record doesn't change the patient list
        // but it's safer for consistency.
        loadPatients();
      }
    } catch (error) {
      console.error('儲存病歷失敗:', error);
      setPageMessage(`儲存病歷失敗: ${error.response?.data?.detail || '請稍後再試'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      summary: record.summary || '',
      prescription: record.prescription || '',
    });
    setShowForm(true);
    setPatientToCreateRecordFor(null); // Clear patient selected in form
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('確定要刪除此病歷嗎？')) {
      return;
    }
    setLoading(true);
    setPageMessage('');
    try {
      await api.delete(`/api/v1/medical-records/${recordId}`);
      await loadPatientRecords(selectedPatient.patient_id); // Refresh records
    } catch (error) {
      console.error('刪除病歷失敗:', error);
      setPageMessage(`刪除病歷失敗: ${error.response?.data?.detail || '請稍後再試'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewClick = () => {
    setSelectedPatient(null); // Ensure no patient is selected
    setEditingRecord(null);
    setFormData({ summary: '', prescription: '' });
    setPatientToCreateRecordFor(null); // Reset patient for new record
    setShowForm(true); // Show the form
    setPageMessage(''); // Clear any previous messages
  };

  const handlePatientSelectInForm = (e) => {
    const patientId = e.target.value;
    const patient = uniquePatients.find(p => p.patient_id === patientId);
    setPatientToCreateRecordFor(patient);
  };

  if (!selectedPatient) {
    const filteredPatients = uniquePatients.filter(patient =>
      (patient.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">病歷管理</h1>
          <p className="page-subtitle">請選擇一位病患以查看或新增病歷</p>
          <button className="btn btn-primary" onClick={handleAddNewClick}>
            新增病歷
          </button>
        </div>
        <div className="card mb-3">
          <div className="card-body">
            <div className="form-group">
              <input
                ref={searchInputRef}
                type="text"
                className="form-control"
                placeholder="依姓名搜尋病患..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        {loading && <p>載入中...</p>}
        {pageMessage && !loading && <p className="text-danger">{pageMessage}</p>}

        {showForm && !selectedPatient && (
          <div className="card mt-3">
            <h3>新增病歷</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">選擇病患 *</label>
                <select
                  className="form-control"
                  value={patientToCreateRecordFor?.patient_id || ''}
                  onChange={handlePatientSelectInForm}
                  required
                >
                  <option value="">請選擇病患</option>
                  {uniquePatients.map(patient => (
                    <option key={patient.patient_id} value={patient.patient_id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>
              {patientToCreateRecordFor && (
                <>
                  <div className="form-group">
                    <label className="form-label">主訴/診斷 *</label>
                    <textarea
                      className="form-control"
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      rows={5}
                      required
                      placeholder="輸入病患主訴或診斷"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">處方籤</label>
                    <textarea
                      className="form-control"
                      value={formData.prescription}
                      onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                      rows={5}
                      placeholder="輸入處方籤內容"
                    />
                  </div>
                </>
              )}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading || !patientToCreateRecordFor}>
                  {loading ? '處理中...' : '儲存'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowForm(false); setPatientToCreateRecordFor(null); setFormData({ summary: '', prescription: '' }); }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {!showForm && (
          <>
            {!loading && filteredPatients.length === 0 && uniquePatients.length > 0 && (
              <div className="card"><p>找不到符合條件的病患。</p></div>
            )}
            {!loading && filteredPatients.length > 0 && (
              <div className="patient-list">
                {filteredPatients.map((patient) => (
                  <div key={patient.patient_id} className="patient-list-item card" onClick={() => handleSelectPatient(patient)}>
                    <h4>{patient.name}</h4>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <button className="btn btn-secondary mb-3" onClick={() => setSelectedPatient(null)}>
          &larr; 返回病患列表
        </button>
        <h1 className="page-title">病歷管理：{selectedPatient.name}</h1>
        <p className="page-subtitle">
          年齡: {selectedPatient.age !== 'N/A' ? `${selectedPatient.age} 歲` : '未提供'}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingRecord(null);
            setFormData({ summary: '', prescription: '' });
          }}
        >
          新增病歷
        </button>
      </div>
      {pageMessage && <p className="text-danger">{pageMessage}</p>}
      {showForm && (
        <div className="card">
          <h3>{editingRecord ? '編輯病歷' : '新增病歷'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">主訴/診斷 *</label>
              <textarea
                className="form-control"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={5}
                required
                placeholder="輸入病患主訴或診斷"
              />
            </div>
            <div className="form-group">
              <label className="form-label">處方籤</label>
              <textarea
                className="form-control"
                value={formData.prescription}
                onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                rows={5}
                placeholder="輸入處方籤內容"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '處理中...' : '儲存'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingRecord(null); }}>
                取消
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="records-list">
        {patientRecords.length > 0 ? (
          patientRecords.map((record) => (
            <div key={record.record_id} className="card record-card">
              <div className="record-header">
                <div>
                  <h3>{record.doctor_name || '醫師'}</h3>
                  <p className="record-date">{new Date(record.created_at).toLocaleString('zh-TW')}</p>
                </div>
                <div>
                  <button className="btn btn-secondary" onClick={() => handleEdit(record)} style={{ marginRight: '8px' }}>
                    編輯
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(record.record_id)}>
                    刪除
                  </button>
                </div>
              </div>
              <div className="record-content">
                <div className="record-section">
                  <h4>主訴/診斷</h4>
                  <p>{record.summary || '無'}</p>
                </div>
                <div className="record-section">
                  <h4>處方籤</h4>
                  <p>{record.prescription || '無'}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          !showForm && <div className="card"><p>這位病患目前沒有病歷記錄。</p></div>
        )}
      </div>
    </div>
  );
};

export default DoctorRecordsPage;

