import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { appointmentAPI } from '../../services/api'
import type { Appointment } from '../../types'
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function PatientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const response = await appointmentAPI.getAll()
      const today = new Date()
      const upcoming = response.data
        .filter(apt => new Date(apt.date) >= today && apt.status !== 'cancelled')
        .slice(0, 3)
      setAppointments(upcoming)
    } catch (error) {
      console.error('載入掛號失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      confirmed: { label: '已確認', color: 'bg-green-100 text-green-800' },
      scheduled: { label: '已預約', color: 'bg-blue-100 text-blue-800' },
      waitlist: { label: '候補', color: 'bg-yellow-100 text-yellow-800' },
      checked_in: { label: '已報到', color: 'bg-purple-100 text-purple-800' },
      completed: { label: '已完成', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
    }
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const getTimePeriodLabel = (period: string) => {
    const periodMap: Record<string, string> = {
      morning: '上午',
      afternoon: '下午',
      evening: '晚上',
    }
    return periodMap[period] || period
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">歡迎回來，{user?.name}</h1>
        <p className="mt-2 text-gray-600">以下是您的近期掛號資訊</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">近期掛號</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>目前沒有掛號記錄</p>
                  <button
                    onClick={() => navigate('/patient/schedule')}
                    className="mt-4 text-primary-600 hover:text-primary-700"
                  >
                    立即預約掛號
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div
                      key={apt.appointmentId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{apt.doctorName}</h3>
                            {getStatusBadge(apt.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{apt.specialty}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(new Date(apt.date), 'yyyy年MM月dd日', { locale: zhTW })}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {getTimePeriodLabel(apt.timePeriod)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          {apt.status === 'confirmed' && (
                            <button
                              onClick={() => navigate('/patient/checkin')}
                              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
                            >
                              報到
                            </button>
                          )}
                          <button
                            onClick={() => navigate('/patient/appointments')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                          >
                            查看詳情
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/patient/schedule')}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <Calendar className="h-5 w-5 mr-2" />
                預約掛號
              </button>
              <button
                onClick={() => navigate('/patient/appointments')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                查看所有掛號
              </button>
              <button
                onClick={() => navigate('/patient/checkin')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                線上報到
              </button>
              <button
                onClick={() => navigate('/patient/medical-records')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                查看病歷
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

