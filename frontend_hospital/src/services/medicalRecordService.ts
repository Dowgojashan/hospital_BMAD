import api from './api';
import { MedicalRecord, AuditLog } from '../types';

export interface CreateMedicalRecordRequest {
  patient_id: string;
  summary: string;
}

// 取得病患的病歷
export const getPatientRecords = async (
  patientId?: string
): Promise<MedicalRecord[]> => {
  const params = patientId ? { patient_id: patientId } : {};
  const response = await api.get<MedicalRecord[]>('/medical-records', {
    params,
  });
  return response.data;
};

// 醫生新增病歷
export const createMedicalRecord = async (
  data: CreateMedicalRecordRequest
): Promise<MedicalRecord> => {
  const response = await api.post<MedicalRecord>('/medical-records', data);
  return response.data;
};

// 醫生修改病歷
export const updateMedicalRecord = async (
  recordId: string,
  data: Partial<CreateMedicalRecordRequest>
): Promise<MedicalRecord> => {
  const response = await api.put<MedicalRecord>(
    `/medical-records/${recordId}`,
    data
  );
  return response.data;
};

// 醫生刪除病歷
export const deleteMedicalRecord = async (recordId: string): Promise<void> => {
  await api.delete(`/medical-records/${recordId}`);
};

// 取得審計日誌
export const getAuditLogs = async (params?: {
  start_date?: string;
  end_date?: string;
  user_id?: string;
  action?: string;
  target_id?: string;
}): Promise<AuditLog[]> => {
  const response = await api.get<AuditLog[]>('/audit-logs', { params });
  return response.data;
};

