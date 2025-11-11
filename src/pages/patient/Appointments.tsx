import { useEffect, useState } from 'react'
import { appointmentAPI } from '../../services/api'
import type { Appointment } from '../../types'
import { Calendar, Clock, X, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const response = await appointmentAPI.getAll()
      setAppointments(response.data)
    } catch (error) {
      console.error('載入掛號失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('確定要取消這個掛號嗎？')) return

    try {
      await appointmentAPI.cancel(id)
      loadAppointments()
    } catch (error) {
      alert('取消掛號失敗')
    }
  }

  const getFilteredAppointments = () => {
    const today = new Date()
    switch (filter) {
      case 'upcoming':
        return appointments.filter(apt => new Date(apt.date) >= today && apt.status !== 'cancelled')
      case 'past':
        return appointments.filter(apt => new Date(apt.date) < today || apt.status === 'completed')
      default:
        return appointments
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      confirmed: { label: '已確認', color: 'bg-green-100 text-green-800' },
      scheduled: { label: '已預約', color: 'bg-blue-100 text-blue-800' },
      waitlist: { label: '候補', color: 'bg-yellow-100 text-yellow-800' },
      checked_in: { label: '已報到', color: 'bg-purple-100 text-purple-800' },
      waiting: { label: '候診中', color: 'bg-orange-100 text-orange-800' },
      called: { label: '已叫號', color: 'bg-indigo-100 text-indigo-800' },
      in_consult: { label: '看診中', color: 'bg-pink-100 text-pink-800' },
      completed: { label: '已完成', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
      no_show: { label: '未到診', color: 'bg-red-100 text-red-800' },
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

  const filteredAppointments = getFilteredAppointments()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">我的掛號</h1>
        <p className="mt-2 text-gray-600">查看和管理您的所有掛號記錄</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">掛號列表</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm rounded-md ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 text-sm rounded-md ${
                  filter === 'upcoming'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                即將到來
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-4 py-2 text-sm rounded-md ${
                  filter === 'past'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                歷史記錄
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>目前沒有掛號記錄</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.appointmentId}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{apt.doctorName}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{apt.specialty}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(apt.date), 'yyyy年MM月dd日', { locale: zhTW })}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {getTimePeriodLabel(apt.timePeriod)}
                        </span>
                        <span>掛號編號: {apt.appointmentId.slice(0, 8)}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {['confirmed', 'scheduled'].includes(apt.status) && (
                        <>
                          <button
                            onClick={() => handleCancel(apt.appointmentId)}
                            className="px-4 py-2 border border-red-300 text-red-700 text-sm rounded-md hover:bg-red-50 flex items-center"
                          >
                            <X className="h-4 w-4 mr-1" />
                            取消
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

