import { apiRequest, getTokenData, setTokenData, clearTokenData, type ApiResponse } from './api_client';

// 用户相关接口类型定义
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user_info: {
    id: number;
    username: string;
    email?: string;
    role?: string;
  };
}

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  old_password?: string;
  new_password?: string;
}

// 用户API函数
export const userApi = {
  // 用户登录
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>({
      url: '/user/login',
      method: 'POST',
      data,
    });
  },

  // 获取用户信息
  getProfile: async (): Promise<UserProfile> => {
    return apiRequest<UserProfile>({
      url: '/user/profile',
      method: 'GET',
    });
  },

  // 更新用户信息
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    return apiRequest<UserProfile>({
      url: '/user/profile',
      method: 'PUT',
      data,
    });
  },

  // 用户登出
  logout: async (): Promise<void> => {
    try {
      await apiRequest<void>({
        url: '/user/logout',
        method: 'POST',
      });
    } finally {
      clearTokenData();
    }
  },

  // 刷新token
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>({
      url: '/user/refresh_token',
      method: 'POST',
      data: { refresh_token: refreshToken },
    });
  },
};

// 导出token相关工具函数
export { getTokenData, setTokenData, clearTokenData };
export type { ApiResponse };