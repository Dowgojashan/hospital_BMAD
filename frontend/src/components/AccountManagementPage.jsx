import React, { useState } from 'react';
import DoctorManagement from './DoctorManagement';
import AdminManagement from './AdminManagement';

export default function AccountManagementPage() {
  const [activeTab, setActiveTab] = useState('doctors'); // 'doctors' or 'admins'

  return (
    <div style={{ padding: '20px' }}>
      <h2>帳號管理</h2>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('doctors')}
          style={{
            marginRight: '10px',
            padding: '10px 15px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'doctors' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'doctors' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          醫生管理
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          style={{
            padding: '10px 15px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'admins' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'admins' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          管理員管理
        </button>
      </div>

      <div>
        {activeTab === 'doctors' && <DoctorManagement />}
        {activeTab === 'admins' && <AdminManagement />}
      </div>
    </div>
  );
}
