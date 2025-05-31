import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

interface TokenData {
  accessToken: string | null;
  refreshToken: string | null;
}

const getTokenData = (): TokenData => {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  return { accessToken, refreshToken };
};

const setTokenData = (accessToken: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
};

const clearTokenData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = getTokenData();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken } = getTokenData();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/user/refresh_token`, { refresh_token: refreshToken });
          const { access_token, refresh_token } = response.data.data;
          setTokenData(access_token, refresh_token);
          if (apiClient.defaults.headers.common) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          }
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          clearTokenData();
          if (typeof window !== 'undefined') window.location.href = '/login';
          return Promise.reject(refreshError as Error);
        }
      }
    }
    return Promise.reject(error as Error);
  }
);

export interface ApiResponse<T = unknown> {
  code: number;
  data?: T;
  msg: string;
}

const request = async <T = unknown>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient(config);
};

// 简化的请求方法，直接返回业务数据
const apiRequest = async <T = unknown>(
  config: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient(config);
  if (response.data.code !== 200) {
    throw new Error(response.data.msg || '请求失败');
  }
  return response.data.data as T;
};

export { request, apiRequest, getTokenData, setTokenData, clearTokenData };
export type { ApiResponse };