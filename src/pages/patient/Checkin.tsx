import { useEffect, useState } from 'react'
import { checkinAPI, appointmentAPI } from '../../services/api'
import type { Appointment, QueueStatus } from '../../types'
import { User, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function PatientCheckin() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAppointments()
  }, [])

  useEffect(() => {
    if (selectedAppointment) {
      loadQueueStatus()
      const interval = setInterval(loadQueueStatus, 30000) // 每30秒更新一次
      return () => clearInterval(interval)
    }
  }, [selectedAppointment])

  const loadAppointments = async () => {
    try {
      const response = await appointmentAPI.getAll()
      const today = new Date().toISOString().split('T')[0]
      const todayAppointments = response.data.filter(
        apt => apt.date === today && ['confirmed', 'scheduled'].includes(apt.status)
      )
      setAppointments(todayAppointments)
    } catch (error) {
      console.error('載入掛號失敗:', error)
    }
  }

  const loadQueueStatus = async () => {
    if (!selectedAppointment) return
    try {
      const response = await checkinAPI.getQueueStatus(selectedAppointment.appointmentId)
      setQueueStatus(response.data)
    } catch (error) {
      console.error('載入候診資訊失敗:', error)
    }
  }

  const handleOnlineCheckin = async () => {
    if (!selectedAppointment) return

    setLoading(true)
    setError('')

    try {
      await checkinAPI.onlineCheckin(selectedAppointment.appointmentId)
      alert('報到成功！')
      loadAppointments()
      loadQueueStatus()
    } catch (err: any) {
      setError(err.response?.data?.message || '報到失敗，請稍後再試或至現場機台報到')
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">線上報到</h1>
        <p className="mt-2 text-gray-600">選擇今日的掛號進行線上報到</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">今日掛號</h2>
          </div>
          <div className="p-6">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>今日沒有可報到的掛號</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <button
                    key={apt.appointmentId}
                    onClick={() => setSelectedAppointment(apt)}
                    className={`w-full text-left border rounded-lg p-4 transition-all ${
                      selectedAppointment?.appointmentId === apt.appointmentId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{apt.doctorName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{apt.specialty}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {getTimePeriodLabel(apt.timePeriod)}
                        </p>
                      </div>
                      {apt.status === 'checked_in' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">報到資訊</h2>
          </div>
          <div className="p-6">
            {!selectedAppointment ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>請選擇一個掛號</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedAppointment.doctorName}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedAppointment.specialty}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(selectedAppointment.date), 'yyyy年MM月dd日', { locale: zhTW })} {' '}
                    {getTimePeriodLabel(selectedAppointment.timePeriod)}
                  </p>
                </div>

                {selectedAppointment.status === 'checked_in' && queueStatus ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">候診資訊</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">目前看診號碼</span>
                        <span className="font-semibold text-blue-900">{queueStatus.currentNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">我的號碼</span>
                        <span className="font-semibold text-blue-900">{queueStatus.myNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">前方等候人數</span>
                        <span className="font-semibold text-blue-900">{queueStatus.waitingAhead} 人</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">預估等候時間</span>
                        <span className="font-semibold text-blue-900">{queueStatus.estimatedWaitTime} 分鐘</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleOnlineCheckin}
                      disabled={loading || selectedAppointment.status === 'checked_in'}
                      className="w-full px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          報到中...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          線上報到
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

