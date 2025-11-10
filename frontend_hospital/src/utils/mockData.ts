import { Appointment, Schedule, Doctor, MedicalRecord, DashboardStats, AuditLog, QueueStatus } from '../types';

// 假資料：預約
export const mockAppointments: Appointment[] = [
  {
    appointment_id: 'APT-2024-001',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 後天
    time_period: '早上',
    status: 'confirmed',
    created_at: new Date().toISOString(),
    doctor_name: '王大明',
    specialty: '內科',
  },
  {
    appointment_id: 'APT-2024-002',
    patient_id: 'patient-1',
    doctor_id: 'doctor-2',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5天後
    time_period: '下午',
    status: 'scheduled',
    created_at: new Date().toISOString(),
    doctor_name: '李美麗',
    specialty: '小兒科',
  },
  {
    appointment_id: 'APT-2024-003',
    patient_id: 'patient-1',
    doctor_id: 'doctor-3',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7天前
    time_period: '早上',
    status: 'completed',
    created_at: new Date().toISOString(),
    doctor_name: '張志強',
    specialty: '骨科',
  },
  {
    appointment_id: 'APT-2024-004',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    date: new Date().toISOString().split('T')[0], // 今天
    time_period: '下午',
    status: 'checked_in',
    created_at: new Date().toISOString(),
    doctor_name: '王大明',
    specialty: '內科',
  },
];

// 假資料：醫師列表
export const mockDoctors: Doctor[] = [
  {
    doctor_id: 'doctor-1',
    doctor_login_id: 'DOC001',
    name: '王大明',
    specialty: '內科',
    created_at: new Date().toISOString(),
  },
  {
    doctor_id: 'doctor-2',
    doctor_login_id: 'DOC002',
    name: '李美麗',
    specialty: '小兒科',
    created_at: new Date().toISOString(),
  },
  {
    doctor_id: 'doctor-3',
    doctor_login_id: 'DOC003',
    name: '張志強',
    specialty: '骨科',
    created_at: new Date().toISOString(),
  },
  {
    doctor_id: 'doctor-4',
    doctor_login_id: 'DOC004',
    name: '陳雅文',
    specialty: '婦產科',
    created_at: new Date().toISOString(),
  },
  {
    doctor_id: 'doctor-5',
    doctor_login_id: 'DOC005',
    name: '劉建宏',
    specialty: '眼科',
    created_at: new Date().toISOString(),
  },
];

// 假資料：班表
export const mockSchedules: Schedule[] = [
  {
    schedule_id: 'SCH-001',
    doctor_id: 'doctor-1',
    doctor_name: '王大明',
    specialty: '內科',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    start: '09:00',
    end: '12:00',
    created_at: new Date().toISOString(),
  },
  {
    schedule_id: 'SCH-002',
    doctor_id: 'doctor-1',
    doctor_name: '王大明',
    specialty: '內科',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    start: '14:00',
    end: '17:00',
    created_at: new Date().toISOString(),
  },
  {
    schedule_id: 'SCH-003',
    doctor_id: 'doctor-2',
    doctor_name: '李美麗',
    specialty: '小兒科',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    start: '09:00',
    end: '12:00',
    created_at: new Date().toISOString(),
  },
  {
    schedule_id: 'SCH-004',
    doctor_id: 'doctor-3',
    doctor_name: '張志強',
    specialty: '骨科',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    start: '14:00',
    end: '17:00',
    created_at: new Date().toISOString(),
  },
];

// 假資料：病歷
export const mockMedicalRecords: MedicalRecord[] = [
  {
    record_id: 'REC-001',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    patient_name: '測試病患',
    doctor_name: '王大明',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    summary: '主訴：頭痛、發燒三天\n診斷：上呼吸道感染\n處方：\n1. 普拿疼 500mg，每日三次，飯後服用\n2. 多休息、多喝水\n3. 若症狀持續請回診',
  },
  {
    record_id: 'REC-002',
    patient_id: 'patient-1',
    doctor_id: 'doctor-3',
    patient_name: '測試病患',
    doctor_name: '張志強',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    summary: '主訴：右膝關節疼痛，運動後加劇\n診斷：右膝關節炎\n處方：\n1. 非類固醇消炎藥，每日兩次\n2. 物理治療建議\n3. 避免劇烈運動，兩週後回診追蹤',
  },
  {
    record_id: 'REC-003',
    patient_id: 'patient-1',
    doctor_id: 'doctor-2',
    patient_name: '測試病患',
    doctor_name: '李美麗',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    summary: '主訴：咳嗽、流鼻水一週\n診斷：過敏性鼻炎\n處方：\n1. 抗組織胺藥物，每日一次\n2. 鼻噴劑，每日兩次\n3. 避免接觸過敏原',
  },
];

// 假資料：儀表板統計
export const mockDashboardStats: DashboardStats = {
  total_appointments_today: 45,
  checked_in_count: 32,
  waiting_count: 8,
  completed_count: 25,
  clinic_load: [
    {
      clinic_id: 'clinic-1',
      clinic_name: '內科診間 A',
      current_patients: 5,
      waiting_count: 3,
    },
    {
      clinic_id: 'clinic-2',
      clinic_name: '小兒科診間 B',
      current_patients: 8,
      waiting_count: 12,
    },
    {
      clinic_id: 'clinic-3',
      clinic_name: '骨科診間 C',
      current_patients: 3,
      waiting_count: 2,
    },
    {
      clinic_id: 'clinic-4',
      clinic_name: '婦產科診間 D',
      current_patients: 4,
      waiting_count: 5,
    },
    {
      clinic_id: 'clinic-5',
      clinic_name: '眼科診間 E',
      current_patients: 2,
      waiting_count: 1,
    },
  ],
};

// 假資料：審計日誌
export const mockAuditLogs: AuditLog[] = [
  {
    log_id: 'LOG-001',
    user_id: 'doctor-1',
    user_name: '王大明',
    action: 'CREATE',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    target_id: 'REC-010',
  },
  {
    log_id: 'LOG-002',
    user_id: 'doctor-2',
    user_name: '李美麗',
    action: 'UPDATE',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    target_id: 'REC-009',
  },
  {
    log_id: 'LOG-003',
    user_id: 'admin-1',
    user_name: '測試管理員',
    action: 'VIEW',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    target_id: 'REC-008',
  },
  {
    log_id: 'LOG-004',
    user_id: 'doctor-3',
    user_name: '張志強',
    action: 'CREATE',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    target_id: 'REC-007',
  },
  {
    log_id: 'LOG-005',
    user_id: 'doctor-1',
    user_name: '王大明',
    action: 'DELETE',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    target_id: 'REC-006',
  },
];

// 假資料：候診資訊
export const mockQueueStatus: QueueStatus = {
  current_number: 15,
  my_position: 18,
  waiting_count: 3,
  estimated_wait_time: 25,
};

