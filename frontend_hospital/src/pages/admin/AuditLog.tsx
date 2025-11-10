import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../../services/medicalRecordService';
import { AuditLog as AuditLogType } from '../../types';
import { mockAuditLogs } from '../../utils/mockData';
import './AuditLog.css';

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
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
      // TODO: 未來使用 API
      // const data = await getAuditLogs(filters);
      // setLogs(data);
      
      // 測試用：使用假資料
      setTimeout(() => {
        let filteredLogs = mockAuditLogs;
        if (filters.action) {
          filteredLogs = filteredLogs.filter(log => log.action === filters.action);
        }
        if (filters.user_id) {
          filteredLogs = filteredLogs.filter(log => log.user_id.includes(filters.user_id));
        }
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
    // TODO: 實作匯出功能
    alert('匯出功能開發中...');
  };

  const getActionBadge = (action: string) => {
    const actionMap: Record<string, { label: string; class: string }> = {
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

export default AuditLogPage;

