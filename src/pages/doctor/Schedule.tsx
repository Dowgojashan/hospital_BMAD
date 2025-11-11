import { useEffect, useState } from 'react'
import { scheduleAPI } from '../../services/api'
import type { Schedule } from '../../types'
import { Calendar, Clock } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function DoctorSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    loadSchedules()
  }, [selectedDate])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const response = await scheduleAPI.getAll({ date: selectedDate })
      setSchedules(response.data)
    } catch (error) {
      console.error('載入班表失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeDate = (days: number) => {
    const newDate = addDays(new Date(selectedDate), days)
    setSelectedDate(format(newDate, 'yyyy-MM-dd'))
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">我的班表</h1>
        <p className="mt-2 text-gray-600">查看您的門診排班</p>
      </div>

      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">班表查詢</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => changeDate(-1)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                前一天
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                onClick={() => changeDate(1)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                後一天
              </button>
              <button
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                今天
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>此日期沒有班表</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.scheduleId}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {format(new Date(schedule.date), 'yyyy年MM月dd日', { locale: zhTW })}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          schedule.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : schedule.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.status === 'active' ? '進行中' : schedule.status === 'cancelled' ? '已取消' : schedule.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {schedule.start} - {schedule.end}
                        </span>
                        <span className="text-gray-700">
                          已預約: {schedule.totalSlots - schedule.availableSlots} / {schedule.totalSlots}
                        </span>
                      </div>
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

