import { useEffect, useState } from 'react'
import { medicalRecordAPI } from '../../services/api'
import type { MedicalRecord } from '../../types'
import { FileText, Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function DoctorMedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    patientId: '',
    summary: '',
  })

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const response = await medicalRecordAPI.getAll()
      setRecords(response.data)
    } catch (error) {
      console.error('載入病歷失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await medicalRecordAPI.create(formData)
      alert('病歷建立成功')
      setShowForm(false)
      setFormData({ patientId: '', summary: '' })
      loadRecords()
    } catch (error: any) {
      alert(error.response?.data?.message || '建立失敗')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此病歷嗎？')) return

    try {
      await medicalRecordAPI.delete(id)
      loadRecords()
    } catch (error) {
      alert('刪除失敗')
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">病歷管理</h1>
            <p className="mt-2 text-gray-600">管理病患的病歷記錄</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            新增病歷
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">新增病歷</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">病患 ID</label>
              <input
                type="text"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="輸入病患 ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">病歷摘要</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="輸入病歷內容..."
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
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                建立
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">病歷列表</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>目前沒有病歷記錄</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.recordId}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{record.patientName}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(record.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhTW })}
                        </span>
                      </p>
                      <div className="bg-gray-50 rounded-md p-4 mt-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.summary}</p>
                      </div>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => handleDelete(record.recordId)}
                        className="px-3 py-2 border border-red-300 text-red-700 text-sm rounded-md hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        刪除
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
  )
}

