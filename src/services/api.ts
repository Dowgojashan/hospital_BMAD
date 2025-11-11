import axios from 'axios'
import type { 
  LoginRequest, 
  RegisterRequest, 
  Appointment, 
  Schedule, 
  Checkin,
  QueueStatus,
  MedicalRecord,
  LeaveRequest,
  AuditLog,
  User
} from '../types'
import {
  mockUsers,
  mockAppointments,
  mockSchedules,
  mockMedicalRecords,
  mockLeaveRequests,
  mockAuditLogs,
  mockLogin,
  mockRegister,
} from './mockData'

// 使用模擬模式（設為 true 使用假資料，false 使用真實 API）
const USE_MOCK_DATA = true

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 請求攔截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 響應攔截器 - 處理錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 模擬延遲
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 認證 API
export const authAPI = {
  login: async (data: LoginRequest) => {
    if (USE_MOCK_DATA) {
      await delay(500) // 模擬網路延遲
      const result = mockLogin(data.email, data.password)
      if (result) {
        return { data: result } as any
      }
      throw { response: { data: { message: '帳號或密碼錯誤' } } }
    }
    return api.post<{ token: string; user: User }>('/auth/login', data)
  },
  register: async (data: RegisterRequest) => {
    if (USE_MOCK_DATA) {
      await delay(500)
      const result = mockRegister(data)
      return { data: result } as any
    }
    return api.post<{ token: string; user: User }>('/auth/register', data)
  },
  logout: () => {
    if (USE_MOCK_DATA) {
      return Promise.resolve({ data: {} } as any)
    }
    return api.post('/auth/logout')
  },
  getCurrentUser: async () => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return { data: user } as any
      }
      throw { response: { status: 401 } }
    }
    return api.get<User>('/auth/me')
  },
}

// 預約 API
export const appointmentAPI = {
  create: async (data: Partial<Appointment>) => {
    if (USE_MOCK_DATA) {
      await delay(500)
      const newAppt: Appointment = {
        appointmentId: `apt-${Date.now()}`,
        patientId: data.patientId || 'patient-1',
        doctorId: data.doctorId || 'doctor-1',
        doctorName: mockSchedules.find(s => s.doctorId === data.doctorId)?.doctorName || '醫生',
        specialty: mockSchedules.find(s => s.doctorId === data.doctorId)?.specialty || '一般科',
        date: data.date || new Date().toISOString().split('T')[0],
        timePeriod: (data.timePeriod as any) || 'morning',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      }
      mockAppointments.push(newAppt)
      return { data: newAppt } as any
    }
    return api.post<Appointment>('/appointments', data)
  },
  getAll: async () => {
    if (USE_MOCK_DATA) {
      await delay(300)
      return { data: mockAppointments } as any
    }
    return api.get<Appointment[]>('/appointments')
  },
  getById: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(200)
      const apt = mockAppointments.find(a => a.appointmentId === id)
      if (apt) return { data: apt } as any
      throw { response: { status: 404 } }
    }
    return api.get<Appointment>(`/appointments/${id}`)
  },
  update: async (id: string, data: Partial<Appointment>) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const index = mockAppointments.findIndex(a => a.appointmentId === id)
      if (index >= 0) {
        mockAppointments[index] = { ...mockAppointments[index], ...data }
        return { data: mockAppointments[index] } as any
      }
      throw { response: { status: 404 } }
    }
    return api.put<Appointment>(`/appointments/${id}`, data)
  },
  cancel: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const index = mockAppointments.findIndex(a => a.appointmentId === id)
      if (index >= 0) {
        mockAppointments[index].status = 'cancelled'
        return { data: {} } as any
      }
      throw { response: { status: 404 } }
    }
    return api.delete(`/appointments/${id}`)
  },
}

// 班表 API
export const scheduleAPI = {
  getAll: async (params?: { specialty?: string; doctorId?: string; date?: string }) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      let filtered = [...mockSchedules]
      if (params?.date) {
        filtered = filtered.filter(s => s.date === params.date)
      }
      if (params?.specialty) {
        filtered = filtered.filter(s => s.specialty === params.specialty)
      }
      if (params?.doctorId) {
        filtered = filtered.filter(s => s.doctorId === params.doctorId)
      }
      return { data: filtered } as any
    }
    return api.get<Schedule[]>('/schedules', { params })
  },
  getById: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(200)
      const schedule = mockSchedules.find(s => s.scheduleId === id)
      if (schedule) return { data: schedule } as any
      throw { response: { status: 404 } }
    }
    return api.get<Schedule>(`/schedules/${id}`)
  },
  create: async (data: Partial<Schedule>) => {
    if (USE_MOCK_DATA) {
      await delay(500)
      const newSchedule: Schedule = {
        scheduleId: `sch-${Date.now()}`,
        doctorId: data.doctorId || 'doctor-1',
        doctorName: mockUsers.find(u => u.id === data.doctorId)?.name || '醫生',
        specialty: mockUsers.find(u => u.id === data.doctorId)?.specialty || '一般科',
        date: data.date || new Date().toISOString().split('T')[0],
        start: data.start || '09:00',
        end: data.end || '12:00',
        status: 'active',
        availableSlots: (data as any).totalSlots || 20,
        totalSlots: (data as any).totalSlots || 20,
      }
      mockSchedules.push(newSchedule)
      return { data: newSchedule } as any
    }
    return api.post<Schedule>('/schedules', data)
  },
  update: async (id: string, data: Partial<Schedule>) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const index = mockSchedules.findIndex(s => s.scheduleId === id)
      if (index >= 0) {
        mockSchedules[index] = { ...mockSchedules[index], ...data }
        return { data: mockSchedules[index] } as any
      }
      throw { response: { status: 404 } }
    }
    return api.put<Schedule>(`/schedules/${id}`, data)
  },
  delete: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const index = mockSchedules.findIndex(s => s.scheduleId === id)
      if (index >= 0) {
        mockSchedules.splice(index, 1)
        return { data: {} } as any
      }
      throw { response: { status: 404 } }
    }
    return api.delete(`/schedules/${id}`)
  },
}

// 報到 API
export const checkinAPI = {
  onlineCheckin: async (appointmentId: string) => {
    if (USE_MOCK_DATA) {
      await delay(500)
      const appointment = mockAppointments.find(a => a.appointmentId === appointmentId)
      if (appointment) {
        appointment.status = 'checked_in'
        const checkin: Checkin = {
          checkinId: `checkin-${Date.now()}`,
          appointmentId,
          patientId: appointment.patientId,
          checkinTime: new Date().toISOString(),
          checkinMethod: 'online',
          ticketSequence: Math.floor(Math.random() * 20) + 1,
          ticketNumber: `A${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
        }
        return { data: checkin } as any
      }
      throw { response: { status: 404, data: { message: '找不到預約記錄' } } }
    }
    return api.post<Checkin>('/checkin/online', { appointmentId })
  },
  onsiteCheckin: async (cardNumber: string) => {
    if (USE_MOCK_DATA) {
      await delay(500)
      const user = mockUsers.find(u => u.cardNumber === cardNumber)
      if (user) {
        const checkin: Checkin = {
          checkinId: `checkin-${Date.now()}`,
          patientId: user.id,
          checkinTime: new Date().toISOString(),
          checkinMethod: 'onsite',
          ticketSequence: Math.floor(Math.random() * 20) + 1,
          ticketNumber: `A${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`,
        }
        return { data: checkin } as any
      }
      throw { response: { status: 404, data: { message: '找不到病患記錄' } } }
    }
    return api.post<Checkin>('/checkin/onsite', { cardNumber })
  },
  getQueueStatus: async (appointmentId: string) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const appointment = mockAppointments.find(a => a.appointmentId === appointmentId)
      if (appointment) {
        const queueStatus: QueueStatus = {
          currentNumber: Math.floor(Math.random() * 5) + 1,
          myNumber: Math.floor(Math.random() * 10) + 6,
          waitingAhead: Math.floor(Math.random() * 5) + 1,
          estimatedWaitTime: Math.floor(Math.random() * 30) + 15,
        }
        return { data: queueStatus } as any
      }
      throw { response: { status: 404 } }
    }
    return api.get<QueueStatus>(`/checkin/queue/${appointmentId}`)
  },
}

// 病歷 API
export const medicalRecordAPI = {
  getAll: async (params?: { patientId?: string; doctorId?: string }) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      let filtered = [...mockMedicalRecords]
      if (params?.patientId) {
        filtered = filtered.filter(r => r.patientId === params.patientId)
      }
      if (params?.doctorId) {
        filtered = filtered.filter(r => r.doctorId === params.doctorId)
      }
      return { data: filtered } as any
    }
    return api.get<MedicalRecord[]>('/medical-records', { params })
  },
  getById: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(200)
      const record = mockMedicalRecords.find(r => r.recordId === id)
      if (record) return { data: record } as any
      throw { response: { status: 404 } }
    }
    return api.get<MedicalRecord>(`/medical-records/${id}`)
  },
  create: async (data: Partial<MedicalRecord>) => {
    if (USE_MOCK_DATA) {
      await delay(500)
      const patient = mockUsers.find(u => u.id === data.patientId)
      const doctor = mockUsers.find(u => u.role === 'doctor')
      const newRecord: MedicalRecord = {
        recordId: `rec-${Date.now()}`,
        patientId: data.patientId || 'patient-1',
        patientName: patient?.name || '病患',
        doctorId: doctor?.id || 'doctor-1',
        doctorName: doctor?.name || '醫生',
        createdAt: new Date().toISOString(),
        summary: data.summary || '',
      }
      mockMedicalRecords.push(newRecord)
      return { data: newRecord } as any
    }
    return api.post<MedicalRecord>('/medical-records', data)
  },
  update: async (id: string, data: Partial<MedicalRecord>) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const index = mockMedicalRecords.findIndex(r => r.recordId === id)
      if (index >= 0) {
        mockMedicalRecords[index] = { ...mockMedicalRecords[index], ...data }
        return { data: mockMedicalRecords[index] } as any
      }
      throw { response: { status: 404 } }
    }
    return api.put<MedicalRecord>(`/medical-records/${id}`, data)
  },
  delete: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const index = mockMedicalRecords.findIndex(r => r.recordId === id)
      if (index >= 0) {
        mockMedicalRecords.splice(index, 1)
        return { data: {} } as any
      }
      throw { response: { status: 404 } }
    }
    return api.delete(`/medical-records/${id}`)
  },
}

// 停診申請 API
export const leaveRequestAPI = {
  create: async (data: Partial<LeaveRequest>) => {
    if (USE_MOCK_DATA) {
      await delay(500)
      const doctor = mockUsers.find(u => u.role === 'doctor')
      const newRequest: LeaveRequest = {
        requestId: `lr-${Date.now()}`,
        doctorId: doctor?.id || 'doctor-1',
        doctorName: doctor?.name || '醫生',
        date: data.date || new Date().toISOString().split('T')[0],
        timePeriod: data.timePeriod || 'morning',
        reason: data.reason || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      mockLeaveRequests.push(newRequest)
      return { data: newRequest } as any
    }
    return api.post<LeaveRequest>('/leave-requests', data)
  },
  getAll: async () => {
    if (USE_MOCK_DATA) {
      await delay(300)
      return { data: mockLeaveRequests } as any
    }
    return api.get<LeaveRequest[]>('/leave-requests')
  },
  approve: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const request = mockLeaveRequests.find(r => r.requestId === id)
      if (request) {
        request.status = 'approved'
        return { data: request } as any
      }
      throw { response: { status: 404 } }
    }
    return api.post(`/leave-requests/${id}/approve`)
  },
  reject: async (id: string, reason: string) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const request = mockLeaveRequests.find(r => r.requestId === id)
      if (request) {
        request.status = 'rejected'
        return { data: request } as any
      }
      throw { response: { status: 404 } }
    }
    return api.post(`/leave-requests/${id}/reject`, { reason })
  },
}

// 審計日誌 API
export const auditLogAPI = {
  getAll: async (params?: { startDate?: string; endDate?: string; userId?: string; action?: string }) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      let filtered = [...mockAuditLogs]
      if (params?.userId) {
        filtered = filtered.filter(l => l.userId === params.userId)
      }
      if (params?.action) {
        filtered = filtered.filter(l => l.action === params.action)
      }
      if (params?.startDate) {
        filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(params.startDate!))
      }
      if (params?.endDate) {
        filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(params.endDate!))
      }
      return { data: filtered } as any
    }
    return api.get<AuditLog[]>('/audit-logs', { params })
  },
  export: async (params?: { startDate?: string; endDate?: string; format?: 'csv' | 'json' }) => {
    if (USE_MOCK_DATA) {
      await delay(500)
      // 模擬匯出功能
      const logs = mockAuditLogs
      const content = params?.format === 'json' 
        ? JSON.stringify(logs, null, 2)
        : logs.map(l => `${l.timestamp},${l.userName},${l.action},${l.targetId || ''}`).join('\n')
      const blob = new Blob([content], { type: 'text/plain' })
      return { data: blob } as any
    }
    return api.get('/audit-logs/export', { params, responseType: 'blob' })
  },
}

// 帳號管理 API (管理員)
export const accountAPI = {
  getAll: async (params?: { role?: string }) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      let filtered = [...mockUsers]
      if (params?.role) {
        filtered = filtered.filter(u => u.role === params.role)
      }
      return { data: filtered } as any
    }
    return api.get<User[]>('/accounts', { params })
  },
  create: async (data: Partial<User & { password: string }>) => {
    if (USE_MOCK_DATA) {
      await delay(500)
      const newUser: User = {
        id: `${data.role || 'patient'}-${Date.now()}`,
        name: data.name || '',
        email: data.email || '',
        role: (data.role as any) || 'patient',
        cardNumber: data.cardNumber,
        specialty: data.specialty,
      }
      mockUsers.push(newUser)
      return { data: newUser } as any
    }
    return api.post<User>('/accounts', data)
  },
  update: async (id: string, data: Partial<User>) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const index = mockUsers.findIndex(u => u.id === id)
      if (index >= 0) {
        mockUsers[index] = { ...mockUsers[index], ...data }
        return { data: mockUsers[index] } as any
      }
      throw { response: { status: 404 } }
    }
    return api.put<User>(`/accounts/${id}`, data)
  },
  delete: async (id: string) => {
    if (USE_MOCK_DATA) {
      await delay(300)
      const index = mockUsers.findIndex(u => u.id === id)
      if (index >= 0) {
        mockUsers.splice(index, 1)
        return { data: {} } as any
      }
      throw { response: { status: 404 } }
    }
    return api.delete(`/accounts/${id}`)
  },
}

export default api

