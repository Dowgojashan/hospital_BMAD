import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import './MedicalRecordForm.css'; // Optional: for styling

const MedicalRecordForm = ({ recordId, patientId: initialPatientId, appointmentId: initialAppointmentId, onClose, onSuccess }) => {
  const user = useAuthStore((s) => s.user);
  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [appointmentId, setAppointmentId] = useState(initialAppointmentId || '');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // For patient and appointment selection (placeholders for now)
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (recordId) {
      // Fetch existing medical record for editing
      const fetchMedicalRecord = async () => {
        setLoading(true);
        try {
          // NOTE: GET /api/v1/records/{record_id} is not yet implemented in backend stories.
          // This is a placeholder for future implementation.
          const response = await api.get(`/api/v1/records/${recordId}`);
          const data = response.data;
          setPatientId(data.patient_id);
          setAppointmentId(data.appointment_id || '');
          setSummary(data.summary || '');
        } catch (err) {
          setError('載入病歷失敗。');
          console.error('Error fetching medical record:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchMedicalRecord();
    }
    // In a real scenario, you'd fetch patients and appointments here
    // For now, we'll just use the initialPatientId and initialAppointmentId
  }, [recordId, initialPatientId, initialAppointmentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!patientId) {
      setError('請選擇病患。');
      setLoading(false);
      return;
    }
    if (!summary.trim()) {
      setError('診療摘要不可為空。');
      setLoading(false);
      return;
    }

    const medicalRecordData = {
      patient_id: patientId,
      doctor_id: user.id, // Current logged-in doctor
      appointment_id: appointmentId || null,
      summary: summary.trim(),
    };

    try {
      if (recordId) {
        // Update existing medical record
        await api.put(`/api/v1/records/${recordId}`, medicalRecordData);
        setMessage('病歷更新成功！');
      } else {
        // Create new medical record
        await api.post('/api/v1/records', medicalRecordData);
        setMessage('病歷創建成功！');
      }
      onSuccess && onSuccess(); // Call success callback
      onClose && onClose(); // Close form if successful
    } catch (err) {
      setError(`操作失敗: ${err.response?.data?.detail || err.message}`);
      console.error('Error submitting medical record:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !message && !error) {
    return <div>載入中...</div>;
  }

  return (
    <div className="medical-record-form-container">
      <h3>{recordId ? '編輯病歷' : '撰寫新病歷'}</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="patientId">病患 ID:</label>
          {/* Placeholder for a more robust patient selector */}
          <input
            type="text"
            id="patientId"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            readOnly={!!recordId || !!initialPatientId} // Prevent changing patient for existing records or if pre-set
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="appointmentId">預約 ID (可選):</label>
          {/* Placeholder for an appointment selector */}
          <input
            type="text"
            id="appointmentId"
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="summary">診療摘要:</label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows="10"
            required
          ></textarea>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '提交中...' : '提交'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicalRecordForm;
