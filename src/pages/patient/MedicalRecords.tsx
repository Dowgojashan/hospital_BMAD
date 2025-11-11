import { useEffect, useState } from 'react'
import { medicalRecordAPI } from '../../services/api'
import type { MedicalRecord } from '../../types'
import { FileText, Download, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleDownload = async (recordId: string) => {
    try {
      // 這裡應該調用下載 API
      alert('下載功能開發中')
    } catch (error) {
      alert('下載失敗')
    }
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">我的病歷</h1>
        <p className="mt-2 text-gray-600">查看您的就診記錄和病歷摘要</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">病歷記錄</h2>
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
                        <h3 className="text-lg font-semibold text-gray-900">{record.doctorName}</h3>
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
                    <div className="ml-4">
                      <button
                        onClick={() => handleDownload(record.recordId)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        下載
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

