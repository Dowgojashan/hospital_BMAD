import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // Use existing auth store
import HospitalLogo from './HospitalLogo'; // Assuming HospitalLogo exists or will be created
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user); // Get user from auth store
  const clearToken = useAuthStore((s) => s.clearToken); // Get clearToken from auth store

  const handleLogout = () => {
    clearToken(); // Use clearToken from authStore
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <HospitalLogo size={40} showText={true} />
        </Link>
        <ul className="navbar-nav">
          {user ? (
            <>
              {user.role === 'patient' && !user.is_verified ? (
                <>
                  <li className="nav-item">
                    <span className="nav-link unverified-message">請驗證您的電子郵件</span>
                  </li>
                  <li className="nav-item">
                    <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>
                      個人資料
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '8px' }}>
                      登出
                    </button>
                  </li>
                </>
              ) : (
                <>
                  {user.role === 'patient' && (
                    <>
                      <li className="nav-item">
                        <Link to="/appointments" className={`nav-link ${isActive('/appointments')}`}>
                          我的預約
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/book" className={`nav-link ${isActive('/book')}`}>
                          線上掛號/查詢班表
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/checkin" className={`nav-link ${isActive('/checkin')}`}>
                          報到
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/records" className={`nav-link ${isActive('/records')}`}>
                          我的病歷
                        </Link>
                      </li>
                    </>
                  )}
                  {user.role === 'doctor' && (
                    <>
                      <li className="nav-item">
                        <Link to="/doctor/schedules" className={`nav-link ${isActive('/doctor/schedules')}`}>
                          我的班表
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/doctor/clinic-management" className={`nav-link ${isActive('/doctor/clinic-management')}`}>
                          診間管理
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/doctor/leave" className={`nav-link ${isActive('/doctor/leave')}`}>
                          停診申請
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/doctor/records" className={`nav-link ${isActive('/doctor/records')}`}>
                          病歷管理
                        </Link>
                      </li>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <li className="nav-item">
                        <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard')}`}>
                          儀表板
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/admin/schedules" className={`nav-link ${isActive('/admin/schedules')}`}>
                          班表管理
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/admin/leave-management" className={`nav-link ${isActive('/admin/leave-management')}`}>
                          停診管理
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/admin/users" className={`nav-link ${isActive('/admin/users')}`}>
                          帳號管理
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/admin/audit" className={`nav-link ${isActive('/admin/audit')}`}>
                          審計日誌
                        </Link>
                      </li>
                    </>
                  )}
                  <li className="nav-item">
                    <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>
                      個人資料
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '8px' }}>
                      登出
                    </button>
                  </li>
                </>
              )}
            </>
          ) : (
            <li className="nav-item">
              <Link to="/login" className={`nav-link ${isActive('/login')}`}>
                登入
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;