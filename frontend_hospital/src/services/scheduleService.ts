import api from './api';
import { Schedule, Doctor } from '../types';

export interface CreateScheduleRequest {
  doctor_id: string;
  date: string;
  start: string;
  end: string;
}

// 查詢班表
export const getSchedules = async (params?: {
  doctor_id?: string;
  specialty?: string;
  date?: string;
}): Promise<Schedule[]> => {
  const response = await api.get<Schedule[]>('/schedules', { params });
  return response.data;
};

// 取得醫生列表
export const getDoctors = async (params?: {
  specialty?: string;
}): Promise<Doctor[]> => {
  const response = await api.get<Doctor[]>('/doctors', { params });
  return response.data;
};

// 管理員新增班表
export const createSchedule = async (
  data: CreateScheduleRequest
): Promise<Schedule> => {
  const response = await api.post<Schedule>('/schedules', data);
  return response.data;
};

// 管理員修改班表
export const updateSchedule = async (
  scheduleId: string,
  data: Partial<CreateScheduleRequest>
): Promise<Schedule> => {
  const response = await api.put<Schedule>(`/schedules/${scheduleId}`, data);
  return response.data;
};

// 管理員刪除班表
export const deleteSchedule = async (scheduleId: string): Promise<void> => {
  await api.delete(`/schedules/${scheduleId}`);
};

// 醫生查看個人班表
export const getDoctorSchedules = async (): Promise<Schedule[]> => {
  const response = await api.get<Schedule[]>('/schedules/doctor');
  return response.data;
};

