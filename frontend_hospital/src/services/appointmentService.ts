import api from './api';
import { Appointment } from '../types';

export interface CreateAppointmentRequest {
  doctor_id: string;
  date: string;
  time_period: string;
}

// 取得病患的預約列表
export const getPatientAppointments = async (): Promise<Appointment[]> => {
  const response = await api.get<Appointment[]>('/appointments/patient');
  return response.data;
};

// 建立預約
export const createAppointment = async (
  data: CreateAppointmentRequest
): Promise<Appointment> => {
  const response = await api.post<Appointment>('/appointments', data);
  return response.data;
};

// 修改預約
export const updateAppointment = async (
  appointmentId: string,
  data: Partial<CreateAppointmentRequest>
): Promise<Appointment> => {
  const response = await api.put<Appointment>(
    `/appointments/${appointmentId}`,
    data
  );
  return response.data;
};

// 取消預約
export const cancelAppointment = async (
  appointmentId: string
): Promise<void> => {
  await api.delete(`/appointments/${appointmentId}`);
};

