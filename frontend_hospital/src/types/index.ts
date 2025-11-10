// 使用者角色
export type UserRole = 'patient' | 'doctor' | 'admin';

// 使用者介面
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  dob?: string;
  card_number?: string;
  specialty?: string; // 醫生專科
  suspended_until?: string; // 病患限制線上報到日期
}

// 預約狀態
export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'waitlist'
  | 'cancelled'
  | 'checked_in'
  | 'waiting'
  | 'called'
  | 'in_consult'
  | 'completed'
  | 'no_show';

// 預約介面
export interface Appointment {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  time_period: string; // 早上、下午、晚上
  status: AppointmentStatus;
  created_at: string;
  patient_name?: string;
  doctor_name?: string;
  specialty?: string;
}

// 醫生介面
export interface Doctor {
  doctor_id: string;
  doctor_login_id: string;
  name: string;
  specialty: string;
  created_at: string;
}

// 班表介面
export interface Schedule {
  schedule_id: string;
  doctor_id: string;
  doctor_name?: string;
  specialty?: string;
  date: string;
  start: string;
  end: string;
  created_at: string;
}

// 病歷介面
export interface MedicalRecord {
  record_id: string;
  patient_id: string;
  doctor_id: string;
  patient_name?: string;
  doctor_name?: string;
  created_at: string;
  summary: string;
}

// 審計日誌介面
export interface AuditLog {
  log_id: string;
  user_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  timestamp: string;
  target_id?: string;
  user_name?: string;
}

// 報到資訊介面
export interface CheckIn {
  checkin_time?: string;
  checkin_method?: 'onsite' | 'online';
  ticket_sequence?: number;
  ticket_number?: string;
}

// 候診資訊介面
export interface QueueStatus {
  current_number: number;
  my_position: number;
  waiting_count: number;
  estimated_wait_time: number; // 分鐘
}

// 停診申請介面
export interface LeaveRequest {
  request_id: string;
  doctor_id: string;
  doctor_name?: string;
  date: string;
  time_period: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// 儀表板統計介面
export interface DashboardStats {
  total_appointments_today: number;
  checked_in_count: number;
  waiting_count: number;
  completed_count: number;
  clinic_load: {
    clinic_id: string;
    clinic_name: string;
    current_patients: number;
    waiting_count: number;
  }[];
}

