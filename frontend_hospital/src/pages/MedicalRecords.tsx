import React, { useState, useEffect } from 'react';
import { getPatientRecords } from '../services/medicalRecordService';
import { MedicalRecord } from '../types';
import { mockMedicalRecords } from '../utils/mockData';
import './MedicalRecords.css';

const MedicalRecords: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      // TODO: 未來使用 API
      // const data = await getPatientRecords();
      // setRecords(data);
      
      // 測試用：使用假資料
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
          <p style={{ textAlign: 'center', color: 'var(--text-medium)' }}>
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

export default MedicalRecords;

