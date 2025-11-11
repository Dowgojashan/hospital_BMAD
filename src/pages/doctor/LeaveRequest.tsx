import { useState, useEffect } from 'react'
import { leaveRequestAPI, scheduleAPI } from '../../services/api'
import type { LeaveRequest, Schedule } from '../../types'
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function DoctorLeaveRequest() {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: '',
    timePeriod: 'morning',
    reason: '',
  })
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadSchedules = async () => {
    if (!formData.date) return
    setLoading(true)
    try {
      const response = await scheduleAPI.getAll({ date: formData.date })
      setSchedules(response.data)
    } catch (error) {
      console.error('載入班表失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (formData.date) {
      loadSchedules()
    }
  }, [formData.date])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.date || !formData.reason) {
      setError('請填寫所有必填欄位')
      return
    }

    setLoading(true)
    try {
      await leaveRequestAPI.create({
        date: formData.date,
        timePeriod: formData.timePeriod,
        reason: formData.reason,
      })
      alert('停診申請已送出，等待管理員審核')
      setShowForm(false)
      setFormData({ date: '', timePeriod: 'morning', reason: '' })
    } catch (err: any) {
      setError(err.response?.data?.message || '申請失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">停診申請</h1>
            <p className="mt-2 text-gray-600">申請停診並說明原因</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {showForm ? '取消' : '新增申請'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">填寫停診申請</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">時段</label>
              <select
                value={formData.timePeriod}
                onChange={(e) => setFormData({ ...formData, timePeriod: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="morning">上午</option>
                <option value="afternoon">下午</option>
                <option value="evening">晚上</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">停診原因</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="請說明停診原因..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? '送出中...' : '送出申請'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">我的申請記錄</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>目前沒有申請記錄</p>
          </div>
        </div>
      </div>
    </div>
  )
}

