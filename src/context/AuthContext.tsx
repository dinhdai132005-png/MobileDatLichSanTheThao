// ============================================================
// BỘ QUẢN LÝ TRẠNG THÁI XÁC THỰC (AuthContext)
// Lưu trữ phiên đăng nhập bền vững qua AsyncStorage
// ============================================================
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NguoiDung } from '../types';
import { authService } from '../services/authService';
import { setAuthToken } from '../services/apiClient';

const TOKEN_STORAGE_KEY = 'sport_mobile_jwt_token';
const USER_STORAGE_KEY = 'sport_mobile_user_info';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  currentUser: NguoiDung | null;
  dangNhap: (soDienThoai: string, matKhau: string) => Promise<NguoiDung>;
  dangKy: (duLieu: { hoTen: string; soDienThoai: string; email: string; matKhau: string }) => Promise<NguoiDung>;
  dangXuat: () => void;
  capNhatNguoiDung: (nguoiDung: NguoiDung) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<NguoiDung | null>(null);

  // Khôi phục phiên làm việc khi mở ứng dụng
  useEffect(() => {
    async function restoreSession() {
      try {
        const [savedToken, savedUserStr] = await Promise.all([
          AsyncStorage.getItem(TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);

        if (savedToken && savedUserStr) {
          setAuthToken(savedToken);
          const parsedUser = JSON.parse(savedUserStr);
          setCurrentUser(parsedUser);
          setIsAuthenticated(true);
          console.log('🔑 [Auth] Khôi phục phiên làm việc thành công cho:', parsedUser.hoTen);
        }
      } catch (err) {
        console.log('⚠️ [Auth] Không thể khôi phục phiên:', err);
      } finally {
        setIsLoadingSession(false);
      }
    }
    restoreSession();
  }, []);

  const dangNhap = async (soDienThoai: string, matKhau: string): Promise<NguoiDung> => {
    const ketQua = await authService.dangNhap(soDienThoai, matKhau);
    setAuthToken(ketQua.token);
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, ketQua.token);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(ketQua.nguoiDung));
    setIsAuthenticated(true);
    setCurrentUser(ketQua.nguoiDung);
    return ketQua.nguoiDung;
  };

  const dangKy = async (duLieu: { hoTen: string; soDienThoai: string; email: string; matKhau: string }): Promise<NguoiDung> => {
    const ketQua = await authService.dangKy(duLieu);
    setAuthToken(ketQua.token);
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, ketQua.token);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(ketQua.nguoiDung));
    setIsAuthenticated(true);
    setCurrentUser(ketQua.nguoiDung);
    return ketQua.nguoiDung;
  };

  const dangXuat = () => {
    authService.dangXuat();
    AsyncStorage.removeItem(TOKEN_STORAGE_KEY).catch(() => {});
    AsyncStorage.removeItem(USER_STORAGE_KEY).catch(() => {});
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const capNhatNguoiDung = (nguoiDung: NguoiDung) => {
    setCurrentUser(nguoiDung);
    AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nguoiDung)).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoadingSession,
        currentUser,
        dangNhap,
        dangKy,
        dangXuat,
        capNhatNguoiDung,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
