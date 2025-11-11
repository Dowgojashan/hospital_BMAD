import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { scheduleAPI } from '../../services/api'
import type { Schedule } from '../../types'
import { Calendar, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodaySchedules()
  }, [])

  const loadTodaySchedules = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const response = await scheduleAPI.getAll({ date: today })
      setTodaySchedules(response.data)
    } catch (error) {
      console.error('載入班表失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">歡迎回來，{user?.name} 醫師</h1>
        <p className="mt-2 text-gray-600">以下是您今日的班表資訊</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">今日班表</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : todaySchedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>今日沒有班表</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaySchedules.map((schedule) => (
                    <div
                      key={schedule.scheduleId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <Clock className="h-8 w-8 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {schedule.start} - {schedule.end}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {format(new Date(schedule.date), 'yyyy年MM月dd日', { locale: zhTW })}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              已預約: {schedule.totalSlots - schedule.availableSlots} / {schedule.totalSlots}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          schedule.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.status === 'active' ? '進行中' : schedule.status}
                        </span>
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
                onClick={() => navigate('/doctor/schedule')}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <Calendar className="h-5 w-5 mr-2" />
                查看完整班表
              </button>
              <button
                onClick={() => navigate('/doctor/leave-request')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                申請停診
              </button>
              <button
                onClick={() => navigate('/doctor/medical-records')}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                病歷管理
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

