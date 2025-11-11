import api from './api';
import { User } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  dob: string;
  card_number: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ========== 測試用：寫死的測試帳密 ==========
const TEST_ACCOUNTS = {
  // 病患帳號
  'patient@test.com': {
    password: 'patient123',
    user: {
      id: 'patient-1',
      name: '測試病患',
      email: 'patient@test.com',
      role: 'patient' as const,
      phone: '0912345678',
      dob: '1990-01-01',
      card_number: '1234567890',
    },
  },
  // 醫師帳號
  'doctor@test.com': {
    password: 'doctor123',
    user: {
      id: 'doctor-1',
      name: '測試醫師',
      email: 'doctor@test.com',
      role: 'doctor' as const,
      specialty: '內科',
    },
  },
  // 管理員帳號
  'admin@test.com': {
    password: 'admin123',
    user: {
      id: 'admin-1',
      name: '測試管理員',
      email: 'admin@test.com',
      role: 'admin' as const,
    },
  },
};

// 登入
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  // ========== 測試用：寫死的登入邏輯 ==========
  const testAccount = TEST_ACCOUNTS[credentials.email as keyof typeof TEST_ACCOUNTS];
  
  if (testAccount && testAccount.password === credentials.password) {
    const token = `dev-token-${Date.now()}`;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(testAccount.user));
    return {
      token,
      user: testAccount.user,
    };
  }
  
  throw new Error('帳號或密碼錯誤');
  
  // ========== 未來要用的 API 呼叫（已註解） ==========
  // const response = await api.post<AuthResponse>('/auth/login', credentials);
  // if (response.data.token) {
  //   localStorage.setItem('token', response.data.token);
  //   localStorage.setItem('user', JSON.stringify(response.data.user));
  // }
  // return response.data;
};

// 註冊
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  // ========== 測試用：寫死的註冊邏輯 ==========
  // 檢查是否已存在
  if (TEST_ACCOUNTS[data.email as keyof typeof TEST_ACCOUNTS]) {
    throw new Error('此電子郵件已被註冊');
  }
  
  // 模擬註冊成功
  const newUser: User = {
    id: `patient-${Date.now()}`,
    name: data.name,
    email: data.email,
    role: 'patient',
    phone: data.phone,
    dob: data.dob,
    card_number: data.card_number,
  };
  
  const token = `dev-token-${Date.now()}`;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(newUser));
  
  return {
    token,
    user: newUser,
  };
  
  // ========== 未來要用的 API 呼叫（已註解） ==========
  // const response = await api.post<AuthResponse>('/auth/register', data);
  // if (response.data.token) {
  //   localStorage.setItem('token', response.data.token);
  //   localStorage.setItem('user', JSON.stringify(response.data.user));
  // }
  // return response.data;
};

// 登出
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// 取得當前使用者
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// 檢查是否已登入
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};