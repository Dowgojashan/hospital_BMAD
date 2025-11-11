import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  Settings, 
  LogOut,
  Stethoscope,
  Users,
  BarChart3,
  ClipboardList
} from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getNavItems = () => {
    if (!user) return []

    switch (user.role) {
      case 'patient':
        return [
          { path: '/patient', label: '首頁', icon: Home },
          { path: '/patient/appointments', label: '我的掛號', icon: Calendar },
          { path: '/patient/schedule', label: '查詢班表', icon: Clock },
          { path: '/patient/checkin', label: '報到', icon: User },
          { path: '/patient/medical-records', label: '病歷', icon: FileText },
        ]
      case 'doctor':
        return [
          { path: '/doctor', label: '首頁', icon: Home },
          { path: '/doctor/schedule', label: '我的班表', icon: Calendar },
          { path: '/doctor/leave-request', label: '停診申請', icon: Clock },
          { path: '/doctor/medical-records', label: '病歷管理', icon: FileText },
        ]
      case 'admin':
        return [
          { path: '/admin', label: '儀表板', icon: BarChart3 },
          { path: '/admin/accounts', label: '帳號管理', icon: Users },
          { path: '/admin/schedules', label: '班表管理', icon: Calendar },
          { path: '/admin/audit-logs', label: '審計日誌', icon: ClipboardList },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Stethoscope className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">醫院掛號系統</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.name}</span>
                <span className="text-xs text-gray-500">({user?.role === 'patient' ? '病患' : user?.role === 'doctor' ? '醫生' : '管理員'})</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <LogOut className="h-4 w-4 mr-1" />
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

