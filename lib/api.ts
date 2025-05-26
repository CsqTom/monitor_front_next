import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:61301/api';

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
    Cookies.remove('access_token', { path: '/' });
    Cookies.remove('refresh_token', { path: '/' });
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

// TODO: Implement token refresh logic if needed
// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       const { refreshToken } = getTokenData();
//       if (refreshToken) {
//         try {
//           // const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
//           // setTokenData(data.access_token, data.refresh_token);
//           // apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
//           // return apiClient(originalRequest);
//         } catch (refreshError) {
//           clearTokenData();
//           // Optionally redirect to login or show an error
//           if (typeof window !== 'undefined') window.location.href = '/login';
//           return Promise.reject(refreshError);
//         }
//       }
//     }
//     return Promise.reject(error);
//   }
// );

interface ApiResponse<T = any> {
  code: number;
  data?: T;
  msg: string;
}

const request = async <T = any>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<ApiResponse<T>>> => {
  return apiClient(config);
};

export { request, getTokenData, setTokenData, clearTokenData, API_BASE_URL };
export type { ApiResponse };