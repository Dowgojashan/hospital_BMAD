export type UserRole = 'patient' | 'doctor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  cardNumber?: string
  specialty?: string
  suspendedUntil?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone: string
  dob: string
  cardNumber: string
}

export interface Appointment {
  appointmentId: string
  patientId: string
  doctorId: string
  doctorName: string
  specialty: string
  date: string
  timePeriod: 'morning' | 'afternoon' | 'evening'
  status: 'scheduled' | 'confirmed' | 'waitlist' | 'cancelled' | 'checked_in' | 'waiting' | 'called' | 'in_consult' | 'completed' | 'no_show'
  createdAt: string
}

export interface Schedule {
  scheduleId: string
  doctorId: string
  doctorName: string
  specialty: string
  date: string
  start: string
  end: string
  status: 'active' | 'cancelled' | 'closed'
  availableSlots: number
  totalSlots: number
}

export interface Checkin {
  checkinId: string
  appointmentId?: string
  patientId: string
  checkinTime: string
  checkinMethod: 'online' | 'onsite'
  ticketSequence: number
  ticketNumber: string
}

export interface QueueStatus {
  currentNumber: number
  myNumber: number
  waitingAhead: number
  estimatedWaitTime: number
}

export interface MedicalRecord {
  recordId: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  createdAt: string
  summary: string
}

export interface LeaveRequest {
  requestId: string
  doctorId: string
  doctorName: string
  date: string
  timePeriod: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface AuditLog {
  logId: string
  userId: string
  userName: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  timestamp: string
  targetId?: string
  metadata?: Record<string, any>
}

