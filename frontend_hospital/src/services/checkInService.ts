import api from './api';
import { QueueStatus, CheckIn } from '../types';

// 線上報到
export const onlineCheckIn = async (
  appointmentId: string
): Promise<CheckIn> => {
  const response = await api.post<CheckIn>(
    `/checkin/online/${appointmentId}`
  );
  return response.data;
};

// 現場報到
export const onsiteCheckIn = async (
  appointmentId: string,
  cardNumber?: string
): Promise<CheckIn> => {
  const response = await api.post<CheckIn>(`/checkin/onsite/${appointmentId}`, {
    card_number: cardNumber,
  });
  return response.data;
};

// 取得候診資訊
export const getQueueStatus = async (
  appointmentId: string
): Promise<QueueStatus> => {
  const response = await api.get<QueueStatus>(
    `/checkin/queue/${appointmentId}`
  );
  return response.data;
};

