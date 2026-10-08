// ============================================================
// NETWORK CONFIG — Cấu hình tập trung địa chỉ máy chủ API & Socket
// Tự động nhận diện IP máy tính qua scriptURL khi test trên điện thoại thật
// ============================================================
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// IP mặc định của máy tính chạy Backend trên mạng WiFi nội bộ
export const DEFAULT_DEV_HOST = '10.129.233.192';
export const SERVER_PORT = 4000;

export function getDevHost(): string {
  if (Platform.OS === 'web') return 'localhost';

  // 1. Lấy từ Constants của Expo (chính xác nhất khi chạy Expo Go)
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
    if (typeof hostUri === 'string') {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
  } catch (err) {
    // fallback
  }

  // 2. Tự động lấy IP của máy tính từ URL gói Metro Bundler của React Native
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (typeof scriptURL === 'string') {
      const match = scriptURL.match(/https?:\/\/([^/:]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
  } catch (err) {
    // fallback
  }

  return DEFAULT_DEV_HOST;
}

// Nhận diện host theo nền tảng
export const SERVER_HOST = getDevHost();

// URL gốc của máy chủ Backend
export const SERVER_BASE_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

// URL tiền tố cho các REST APIs (Chuẩn Plant/06-api.md)
export const API_BASE_URL = `${SERVER_BASE_URL}/api/v1`;

export function getApiBaseUrl(): string {
  const host = getDevHost();
  return `http://${host}:${SERVER_PORT}/api/v1`;
}
