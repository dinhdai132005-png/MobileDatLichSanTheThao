// ============================================================
// API CLIENT — Cấu hình HTTP Client tập trung (Axios)
// Tính năng: Quản lý JWT Token, Interceptors, Xử lý Response chuẩn hóa
// ============================================================
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, getApiBaseUrl } from './config';

export { API_BASE_URL };

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// Khởi tạo instance Axios dùng chung
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let authToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const setOnUnauthorizedCallback = (callback: (() => void) | null) => {
  onUnauthorizedCallback = callback;
};

// --- 1. REQUEST INTERCEPTOR: Tự động gắn JWT Token & Cập nhật BaseURL động ---
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiBaseUrl();
    if (authToken && config.headers) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    console.log(`🚀 [API Request] ${config.method?.toUpperCase()} -> ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// --- 2. RESPONSE INTERCEPTOR: Xử lý dữ liệu phản hồi ---
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ [API Response] ${response.status} <- ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra kết nối mạng!';
    console.warn(`⚠️ [API Error] ${error.config?.url}:`, errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

/**
 * Helper gọi API trả về trường `data` trong format chuẩn { success, message, data }
 */
export async function requestApi<T>(
  promise: Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> {
  const res = await promise;
  if (res.data && res.data.success !== undefined) {
    if (!res.data.success) {
      throw new Error(res.data.message || 'Thao tác không thành công');
    }
    return res.data.data;
  }
  return (res.data as any) as T;
}
