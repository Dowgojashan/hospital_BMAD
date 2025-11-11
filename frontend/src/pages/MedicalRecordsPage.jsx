import React, { useState, useEffect } from 'react';
// import { getPatientRecords } from '../services/medicalRecordService'; // To be adapted
// import { MedicalRecord } from '../types'; // To be defined or use generic types
// import { mockMedicalRecords } from '../utils/mockData'; // To be copied or created
import './MedicalRecordsPage.css';
import api from '../api/axios'; // Use existing axios instance

// Mock data for medical records (temporary)
const mockMedicalRecords = [
  {
    record_id: 'rec001',
    doctor_name: 'Dr. Chen',
    created_at: '2025-11-01T10:00:00Z',
    summary: 'Patient presented with common cold symptoms. Prescribed rest and fluids.',
  },
  {
    record_id: 'rec002',
    doctor_name: 'Dr. Lin',
    created_at: '2025-10-15T14:30:00Z',
    summary: 'Follow-up for minor injury. Wound healing well. Advised continued care.',
  },
];

const MedicalRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      // TODO: Integrate with actual API endpoint for fetching patient records
      // const response = await api.get('/api/v1/patient/medical-records');
      // setRecords(response.data);

      // Using mock data for now
      setTimeout(() => {
        setRecords(mockMedicalRecords);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('載入病歷失敗:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">載入中...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">我的病歷</h1>
        <p className="page-subtitle">查看您的就診記錄和病歷摘要</p>
      </div>

      {records.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6c757d' /* var(--text-medium) */ }}>
            目前沒有病歷記錄
          </p>
        </div>
      ) : (
        <div className="records-list">
          {records.map((record) => (
            <div key={record.record_id} className="card record-card">
              <div className="record-header">
                <div>
                  <h3>{record.doctor_name || '醫師'}</h3>
                  <p className="record-date">
                    {new Date(record.created_at).toLocaleString('zh-TW')}
                  </p>
                </div>
              </div>

              <div className="record-content">
                <div className="record-summary">
                  <h4>診療摘要</h4>
                  <p>{record.summary || '無摘要'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsPage;
