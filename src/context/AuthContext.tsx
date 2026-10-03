// ============================================================
// BỘ QUẢN LÝ TRẠNG THÁI XÁC THỰC (AuthContext)
// Quản lý đăng nhập, đăng xuất, phiên làm việc người dùng
// ============================================================
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NguoiDung } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: NguoiDung | null;
  dangNhap: (soDienThoai: string, matKhau: string) => Promise<NguoiDung>;
  dangKy: (duLieu: { hoTen: string; soDienThoai: string; email: string; matKhau: string }) => Promise<NguoiDung>;
  dangXuat: () => void;
  capNhatNguoiDung: (nguoiDung: NguoiDung) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<NguoiDung | null>(null);

  const dangNhap = async (soDienThoai: string, matKhau: string): Promise<NguoiDung> => {
    const ketQua = await authService.dangNhap(soDienThoai, matKhau);
    setIsAuthenticated(true);
    setCurrentUser(ketQua.nguoiDung);
    return ketQua.nguoiDung;
  };

  const dangKy = async (duLieu: { hoTen: string; soDienThoai: string; email: string; matKhau: string }): Promise<NguoiDung> => {
    const ketQua = await authService.dangKy(duLieu);
    setIsAuthenticated(true);
    setCurrentUser(ketQua.nguoiDung);
    return ketQua.nguoiDung;
  };

  const dangXuat = () => {
    authService.dangXuat();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const capNhatNguoiDung = (nguoiDung: NguoiDung) => {
    setCurrentUser(nguoiDung);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
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
