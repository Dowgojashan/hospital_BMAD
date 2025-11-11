import type { User, Appointment, Schedule, MedicalRecord, LeaveRequest, AuditLog, QueueStatus, Checkin } from '../types'

// 模擬用戶資料
export const mockUsers: User[] = [
  {
    id: 'patient-1',
    name: '王小明',
    email: 'patient@test.com',
    role: 'patient',
    cardNumber: '1234567890123',
  },
  {
    id: 'doctor-1',
    name: '李醫師',
    email: 'doctor@test.com',
    role: 'doctor',
    specialty: '內科',
  },
  {
    id: 'doctor-2',
    name: '陳醫師',
    email: 'doctor2@test.com',
    role: 'doctor',
    specialty: '外科',
  },
  {
    id: 'doctor-3',
    name: '張醫師',
    email: 'doctor3@test.com',
    role: 'doctor',
    specialty: '小兒科',
  },
  {
    id: 'doctor-4',
    name: '林醫師',
    email: 'doctor4@test.com',
    role: 'doctor',
    specialty: '婦產科',
  },
  {
    id: 'admin-1',
    name: '系統管理員',
    email: 'admin@test.com',
    role: 'admin',
  },
]

// 模擬預約資料
export const mockAppointments: Appointment[] = [
  {
    appointmentId: 'apt-1',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    doctorName: '李醫師',
    specialty: '內科',
    date: new Date().toISOString().split('T')[0],
    timePeriod: 'morning',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    appointmentId: 'apt-2',
    patientId: 'patient-1',
    doctorId: 'doctor-2',
    doctorName: '陳醫師',
    specialty: '外科',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timePeriod: 'afternoon',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  },
  {
    appointmentId: 'apt-3',
    patientId: 'patient-1',
    doctorId: 'doctor-3',
    doctorName: '張醫師',
    specialty: '小兒科',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    timePeriod: 'morning',
    status: 'completed',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
]

// 模擬班表資料
export const mockSchedules: Schedule[] = [
  {
    scheduleId: 'sch-1',
    doctorId: 'doctor-1',
    doctorName: '李醫師',
    specialty: '內科',
    date: new Date().toISOString().split('T')[0],
    start: '09:00',
    end: '12:00',
    status: 'active',
    availableSlots: 15,
    totalSlots: 20,
  },
  {
    scheduleId: 'sch-2',
    doctorId: 'doctor-2',
    doctorName: '陳醫師',
    specialty: '外科',
    date: new Date().toISOString().split('T')[0],
    start: '14:00',
    end: '17:00',
    status: 'active',
    availableSlots: 8,
    totalSlots: 15,
  },
  {
    scheduleId: 'sch-3',
    doctorId: 'doctor-3',
    doctorName: '張醫師',
    specialty: '小兒科',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    start: '09:00',
    end: '12:00',
    status: 'active',
    availableSlots: 12,
    totalSlots: 20,
  },
  {
    scheduleId: 'sch-4',
    doctorId: 'doctor-4',
    doctorName: '林醫師',
    specialty: '婦產科',
    date: new Date().toISOString().split('T')[0],
    start: '18:00',
    end: '21:00',
    status: 'active',
    availableSlots: 5,
    totalSlots: 10,
  },
  {
    scheduleId: 'sch-5',
    doctorId: 'doctor-1',
    doctorName: '李醫師',
    specialty: '內科',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    start: '14:00',
    end: '17:00',
    status: 'active',
    availableSlots: 18,
    totalSlots: 20,
  },
]

// 模擬病歷資料
export const mockMedicalRecords: MedicalRecord[] = [
  {
    recordId: 'rec-1',
    patientId: 'patient-1',
    patientName: '王小明',
    doctorId: 'doctor-1',
    doctorName: '李醫師',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    summary: '病患主訴：頭痛、發燒\n診斷：感冒\n處方：退燒藥、止痛藥\n建議：多休息、多喝水',
  },
  {
    recordId: 'rec-2',
    patientId: 'patient-1',
    patientName: '王小明',
    doctorId: 'doctor-2',
    doctorName: '陳醫師',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    summary: '病患主訴：腹痛\n診斷：腸胃炎\n處方：腸胃藥\n建議：清淡飲食',
  },
]

// 模擬停診申請
export const mockLeaveRequests: LeaveRequest[] = [
  {
    requestId: 'lr-1',
    doctorId: 'doctor-1',
    doctorName: '李醫師',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    timePeriod: 'morning',
    reason: '個人事務',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
]

// 模擬審計日誌
export const mockAuditLogs: AuditLog[] = [
  {
    logId: 'log-1',
    userId: 'patient-1',
    userName: '王小明',
    action: 'CREATE',
    timestamp: new Date().toISOString(),
    targetId: 'apt-1',
    metadata: { appointmentId: 'apt-1', doctorId: 'doctor-1' },
  },
  {
    logId: 'log-2',
    userId: 'doctor-1',
    userName: '李醫師',
    action: 'UPDATE',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    targetId: 'rec-1',
    metadata: { recordId: 'rec-1' },
  },
  {
    logId: 'log-3',
    userId: 'admin-1',
    userName: '系統管理員',
    action: 'DELETE',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    targetId: 'sch-1',
    metadata: { scheduleId: 'sch-1' },
  },
]

// 模擬候診資訊
export const mockQueueStatus: QueueStatus = {
  currentNumber: 5,
  myNumber: 8,
  waitingAhead: 3,
  estimatedWaitTime: 45,
}

// 模擬報到資料
export const mockCheckin: Checkin = {
  checkinId: 'checkin-1',
  appointmentId: 'apt-1',
  patientId: 'patient-1',
  checkinTime: new Date().toISOString(),
  checkinMethod: 'online',
  ticketSequence: 8,
  ticketNumber: 'A008',
}

// 登入驗證（簡單的假驗證）
export function mockLogin(email: string, password: string): { user: User; token: string } | null {
  const user = mockUsers.find(u => u.email === email)
  if (user && password === '123456') { // 所有測試帳號密碼都是 123456
    return {
      user,
      token: `mock-token-${user.id}`,
    }
  }
  return null
}

// 註冊（簡單的假註冊）
export function mockRegister(data: { name: string; email: string; password: string; phone: string; dob: string; cardNumber: string }): { user: User; token: string } {
  const newUser: User = {
    id: `patient-${Date.now()}`,
    name: data.name,
    email: data.email,
    role: 'patient',
    cardNumber: data.cardNumber,
  }
  mockUsers.push(newUser)
  return {
    user: newUser,
    token: `mock-token-${newUser.id}`,
  }
}

