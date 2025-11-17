import React, { useState, useEffect } from 'react';
// import { getAuditLogs } from '../../services/medicalRecordService'; // To be adapted
// import { AuditLog as AuditLogType } from '../../types'; // To be defined or use generic types
// import { mockAuditLogs } from '../../utils/mockData'; // To be copied or created
import './AdminAuditLogPage.css';
import api from '../api/axios'; // Use existing axios instance

const AdminAuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    user_id: '',
    action: '',
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/admin/audit-logs', { params: filters });
      console.log('API Response:', response.data);
      setLogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('載入審計日誌失敗:', error);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadLogs();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('匯出功能開發中... (Mock)');
  };

  const getActionBadge = (action) => {
    const actionMap = {
      CREATE: { label: '新增', class: 'badge-success' },
      UPDATE: { label: '修改', class: 'badge-info' },
      DELETE: { label: '刪除', class: 'badge-danger' },
      VIEW: { label: '檢視', class: 'badge-info' },
      REGISTER: { label: '註冊', class: 'badge-primary' },
    };
    const actionInfo = actionMap[action] || { label: action, class: 'badge-info' };
    return <span className={`badge ${actionInfo.class}`}>{actionInfo.label}</span>;
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">審計日誌</h1>
        <p className="page-subtitle">查看系統操作審計記錄</p>
      </div>

      <div className="card">
  <h3>搜尋條件</h3>
  <div className="search-filters">
    <div className="form-group">
      <label className="form-label">開始日期</label>
      <input
        type="date"
        className="form-control"
        value={filters.start_date}
        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label className="form-label">結束日期</label>
      <input
        type="date"
        className="form-control"
        value={filters.end_date}
        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
      />
    </div>
    {/* 修改重點：將按鈕包在一個 div 裡面 */}
    <div className="filter-actions">
      <button className="btn btn-primary" onClick={handleSearch}>
        搜尋
      </button>
    </div>
  </div>
</div>

      <div className="card">
        <h3>審計日誌列表</h3>
        {loading ? (
          <div className="loading">載入中...</div>
        ) : (
          <div className="audit-logs-table">
            <table className="table">
              <thead>
                <tr>
                  <th>時間</th>
                  <th>操作者</th>
                  <th>操作類型</th>
                  <th>目標ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.log_id}>
                    <td>{new Date(log.timestamp).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '-')}</td>
                    <td>{log.user_id === 'System' ? 'System' : log.user_id}</td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>{log.target_id || '-'}</td>
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

export default AdminAuditLogPage;
