import React, { useState, useEffect } from 'react';
// import { getAuditLogs } from '../../services/medicalRecordService'; // To be adapted
// import { AuditLog as AuditLogType } from '../../types'; // To be defined or use generic types
// import { mockAuditLogs } from '../../utils/mockData'; // To be copied or created
import './AdminAuditLogPage.css';
import api from '../api/axios'; // Use existing axios instance

// Mock data for audit logs (temporary)
const mockAuditLogs = [
  { log_id: 'log001', timestamp: '2025-11-11T10:00:00Z', user_id: 'admin001', user_name: 'Admin User', action: 'CREATE', target_id: 'user004', details: 'Created new user user004' },
  { log_id: 'log002', timestamp: '2025-11-11T10:05:00Z', user_id: 'doctor001', user_name: 'Dr. Chen', action: 'UPDATE', target_id: 'rec001', details: 'Updated medical record rec001' },
  { log_id: 'log003', timestamp: '2025-11-11T10:10:00Z', user_id: 'admin001', user_name: 'Admin User', action: 'VIEW', target_id: 'sch005', details: 'Viewed schedule sch005' },
];

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
      // TODO: Integrate with actual API endpoint for fetching audit logs
      // const response = await api.get('/api/v1/admin/audit-logs', { params: filters });
      // setLogs(response.data);

      // Using mock data for now
      setTimeout(() => {
        let filteredLogs = mockAuditLogs;
        if (filters.action) {
          filteredLogs = filteredLogs.filter(log => log.action === filters.action);
        }
        if (filters.user_id) {
          filteredLogs = filteredLogs.filter(log => log.user_id.includes(filters.user_id));
        }
        // Add date filtering logic if needed
        setLogs(filteredLogs);
        setLoading(false);
      }, 500);
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
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">結束日期</label>
            <input
              type="date"
              className="form-control"
              value={filters.end_date}
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">操作類型</label>
            <select
              className="form-select"
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
            >
              <option value="">全部</option>
              <option value="CREATE">新增</option>
              <option value="UPDATE">修改</option>
              <option value="DELETE">刪除</option>
              <option value="VIEW">檢視</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">使用者ID</label>
            <input
              type="text"
              className="form-control"
              value={filters.user_id}
              onChange={(e) =>
                setFilters({ ...filters, user_id: e.target.value })
              }
              placeholder="輸入使用者ID"
            />
          </div>

          <button className="btn btn-primary" onClick={handleSearch}>
            搜尋
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            匯出
          </button>
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
                    <td>{new Date(log.timestamp).toLocaleString('zh-TW')}</td>
                    <td>{log.user_name || log.user_id}</td>
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
