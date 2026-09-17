// ============================================================
// AXIOS HTTP CLIENT - CẤU HÌNH BASE CLIENT & INTERCEPTORS
// Tính năng: Interceptor JWT, Fallback Mock Data, Log Request/Response
// ============================================================

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Cấu hình URL mặc định cho Backend Server
export const API_BASE_URL = 'http://10.0.2.2:5000/api';

// Khởi tạo instance Axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

let authToken: string | null = 'mock-jwt-bearer-token-xyz789';

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// --- 1. REQUEST INTERCEPTOR ---
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (authToken && config.headers) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    console.log(`🚀 [Axios Request] ${config.method?.toUpperCase()} -> ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [Axios Request Error]', error);
    return Promise.reject(error);
  }
);

// --- 2. RESPONSE INTERCEPTOR ---
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ [Axios Response] ${response.status} <- ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.warn(`⚠️ [Axios Response Error] Status ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.warn('📡 [Axios Network Warning] Backend Server offline -> Fallback mock data.');
    } else {
      console.error('💥 [Axios Error]', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Utility wrapper giúp tự động gọi Axios API,
 * nếu Backend offline hoặc lỗi mạng thì tự động Fallback về Mock Data local
 */
export async function executeWithFallback<T>(
  apiCall: () => Promise<AxiosResponse<T> | T>,
  mockFallback: () => T
): Promise<T> {
  try {
    const res = await apiCall();
    if (res && typeof res === 'object' && 'data' in res && 'status' in res) {
      return (res as AxiosResponse<T>).data;
    }
    return res as T;
  } catch (error) {
    console.log('🔄 Backend Server chưa sẵn sàng -> Tự động chuyển sang Mock Data Local.');
    return mockFallback();
  }
}
