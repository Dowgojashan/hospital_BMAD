import React, { useState, useEffect } from 'react';
import './MedicalRecordsPage.css';
import api from '../api/axios'; // Use existing axios instance

const MedicalRecordsPage = () => {
  const [records, setRecords] = useState([]); // Keep original records for processing
  const [groupedRecords, setGroupedRecords] = useState({}); // New state for grouped records
  const [expandedGroups, setExpandedGroups] = useState({}); // New state to manage expanded/collapsed groups
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/api/v1/medical-records/patient/me');
      setRecords(response.data); // Store all fetched records

      // Group records by department and doctor name
      const grouped = response.data.reduce((acc, record) => {
        const groupKey = `${record.department || '未知科別'} - ${record.doctor_name || '未知醫師'}`;
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(record);
        return acc;
      }, {});
      setGroupedRecords(grouped);

      // Initialize all groups as collapsed by default
      const initialExpandedState = Object.keys(grouped).reduce((acc, key) => {
        acc[key] = false; // Initialize as collapsed
        return acc;
      }, {});
      setExpandedGroups(initialExpandedState);

    } catch (error) {
      console.error('載入病歷失敗:', error);
      setErrorMessage('載入病歷失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupExpansion = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
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

      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      {records.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6c757d' /* var(--text-medium) */ }}>
            目前沒有病歷記錄
          </p>
        </div>
      ) : (
        <div className="grouped-records-list">
          {Object.entries(groupedRecords)
            .sort(([groupKeyA, recordsA], [groupKeyB, recordsB]) => {
              const latestA = Math.max(...recordsA.map(r => new Date(r.created_at).getTime()));
              const latestB = Math.max(...recordsB.map(r => new Date(r.created_at).getTime()));
              return latestB - latestA; // Sort in descending order (most recent first)
            })
            .map(([groupKey, recordsInGroup]) => (
            <div key={groupKey} className="record-group-container card">
              <div className="record-group-header" onClick={() => toggleGroupExpansion(groupKey)}>
                <h2>{groupKey} ({recordsInGroup.length})</h2>
                <span>{expandedGroups[groupKey] ? '▲' : '▼'}</span>
              </div>
              {expandedGroups[groupKey] && (
                <div className="record-group-content">
                  {recordsInGroup.map((record) => (
                    <div key={record.record_id} className="card record-card">
                      <div className="record-header">
                        <div>
                          <p className="record-date">
                            {new Date(record.created_at).toLocaleString('zh-TW')}
                          </p>
                        </div>
                      </div>

                      <div className="record-content">
                        <div className="record-section">
                          <h4>診療摘要</h4>
                          <p>{record.summary || '無摘要'}</p>
                        </div>
                        {record.prescription && (
                          <div className="record-section">
                            <h4>處方籤</h4>
                            <p>{record.prescription}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsPage;
