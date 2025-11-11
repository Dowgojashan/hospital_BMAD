import api from './api';
import { DashboardStats } from '../types';

// 取得儀表板統計
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<DashboardStats>('/dashboard/stats');
  return response.data;
};

