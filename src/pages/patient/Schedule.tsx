import { useEffect, useState } from 'react'
import { scheduleAPI, appointmentAPI } from '../../services/api'
import type { Schedule, Appointment } from '../../types'
import { Calendar, Clock, Search, CheckCircle } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function PatientSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [searchDoctor, setSearchDoctor] = useState('')
  const specialties = ['內科', '外科', '小兒科', '婦產科', '骨科', '眼科', '耳鼻喉科', '皮膚科']

  useEffect(() => {
    loadSchedules()
  }, [selectedDate, selectedSpecialty, searchDoctor])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const params: any = { date: selectedDate }
      if (selectedSpecialty) params.specialty = selectedSpecialty
      const response = await scheduleAPI.getAll(params)
      let filtered = response.data
      if (searchDoctor) {
        filtered = filtered.filter(s => s.doctorName.includes(searchDoctor))
      }
      setSchedules(filtered)
    } catch (error) {
      console.error('載入班表失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBook = async (schedule: Schedule) => {
    if (!confirm(`確定要預約 ${schedule.doctorName} 的 ${format(new Date(schedule.date), 'yyyy年MM月dd日', { locale: zhTW })} 班次嗎？`)) {
      return
    }

    try {
      const timePeriod = getTimePeriodFromSchedule(schedule)
      await appointmentAPI.create({
        doctorId: schedule.doctorId,
        date: schedule.date,
        timePeriod,
      })
      alert('掛號成功！')
      loadSchedules()
    } catch (error: any) {
      alert(error.response?.data?.message || '掛號失敗')
    }
  }

  const getTimePeriodFromSchedule = (schedule: Schedule): 'morning' | 'afternoon' | 'evening' => {
    const hour = parseInt(schedule.start.split(':')[0])
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">查詢班表</h1>
        <p className="mt-2 text-gray-600">選擇科別、日期和醫生進行掛號</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">科別</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">全部科別</option>
              {specialties.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">醫生姓名</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchDoctor}
                onChange={(e) => setSearchDoctor(e.target.value)}
                placeholder="搜尋醫生..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">可用班表</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>目前沒有可用的班表</p>
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
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{schedule.doctorName}</h3>
                      <p className="text-sm text-gray-600 mb-3">{schedule.specialty}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(schedule.date), 'yyyy年MM月dd日', { locale: zhTW })}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {schedule.start} - {schedule.end}
                        </span>
                        <span className="text-green-600 font-semibold">
                          剩餘名額: {schedule.availableSlots} / {schedule.totalSlots}
                        </span>
                      </div>
                    </div>
                    <div>
                      {schedule.availableSlots > 0 ? (
                        <button
                          onClick={() => handleBook(schedule)}
                          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          預約掛號
                        </button>
                      ) : (
                        <span className="px-6 py-2 bg-gray-200 text-gray-500 rounded-md">
                          已額滿
                        </span>
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

