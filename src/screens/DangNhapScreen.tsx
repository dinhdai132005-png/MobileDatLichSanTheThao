// ============================================================
// MÀN HÌNH ĐĂNG NHẬP & ĐĂNG KÝ (DangNhapScreen.tsx)
// Tự động yêu cầu đăng nhập khi quét QR mở ứng dụng
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const MAU = {
  chinh: '#00B884',
  chinhDam: '#008F66',
  nen: '#F8FAFC',
  the: '#FFFFFF',
  chu: '#0F172A',
  phu: '#64748B',
  vien: '#E2E8F0',
  nguyHiem: '#EF4444',
  sang: 'rgba(0, 184, 132, 0.1)',
};

export default function DangNhapScreen() {
  const { dangNhap, dangKy } = useAuth();

  const [cheDo, setCheDo] = useState<'dangNhap' | 'dangKy'>('dangNhap');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);

  // Form Đăng ký
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');

  const [dangXuLy, setDangXuLy] = useState(false);

  // Điền tài khoản mẫu nhanh
  const chonTaiKhoanMau = (sdt: string, mk: string) => {
    setSoDienThoai(sdt);
    setMatKhau(mk);
    setCheDo('dangNhap');
  };

  const xuLyXacThuc = async () => {
    if (!soDienThoai.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại');
      return;
    }
    if (!matKhau.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu');
      return;
    }

    setDangXuLy(true);
    try {
      if (cheDo === 'dangNhap') {
        const user = await dangNhap(soDienThoai.trim(), matKhau.trim());
        Alert.alert('Thành công', `Chào mừng ${user.hoTen} đã đăng nhập!`);
      } else {
        if (!hoTen.trim()) {
          Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên của bạn');
          setDangXuLy(false);
          return;
        }
        if (matKhau.length < 6) {
          Alert.alert('Mật khẩu yếu', 'Mật khẩu phải có ít nhất 6 ký tự');
          setDangXuLy(false);
          return;
        }
        const user = await dangKy({
          hoTen: hoTen.trim(),
          soDienThoai: soDienThoai.trim(),
          email: email.trim() || `${soDienThoai.trim()}@gmail.com`,
          matKhau: matKhau.trim(),
        });
        Alert.alert('Đăng ký thành công', `Chào mừng ${user.hoTen} đến với hệ thống!`);
      }
    } catch (err: any) {
      Alert.alert('Lỗi xác thực', err.message || 'Số điện thoại hoặc mật khẩu không chính xác');
    } finally {
      setDangXuLy(false);
    }
  };

  return (
    <SafeAreaView style={styles.khungChinh}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.noiDungCuon}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER LOGO & APP INFO */}
          <View style={styles.khoiLogo}>
            <View style={styles.hinhLogo}>
              <Ionicons name="football" size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.tenApp}>ĐẶT LỊCH SÂN THỂ THAO</Text>
            <Text style={styles.khauHieu}>Hệ thống đặt sân thông minh & tiện lợi</Text>
          </View>

          {/* TAB CHUYỂN ĐỔI ĐĂNG NHẬP / ĐĂNG KÝ */}
          <View style={styles.thanhTab}>
            <TouchableOpacity
              style={[styles.nutTab, cheDo === 'dangNhap' && styles.nutTabKichHoat]}
              onPress={() => setCheDo('dangNhap')}
            >
              <Text style={[styles.chuTab, cheDo === 'dangNhap' && styles.chuTabKichHoat]}>
                Đăng Nhập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nutTab, cheDo === 'dangKy' && styles.nutTabKichHoat]}
              onPress={() => setCheDo('dangKy')}
            >
              <Text style={[styles.chuTab, cheDo === 'dangKy' && styles.chuTabKichHoat]}>
                Đăng Ký Mới
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM NHẬP THÔNG TIN */}
          <View style={styles.theForm}>
            {cheDo === 'dangKy' && (
              <View style={styles.oNhap}>
                <Text style={styles.nhanO}>Họ và tên *</Text>
                <View style={styles.hopNhap}>
                  <Ionicons name="person-outline" size={20} color={MAU.phu} style={styles.iconNhap} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor="#94A3B8"
                    value={hoTen}
                    onChangeText={setHoTen}
                  />
                </View>
              </View>
            )}

            <View style={styles.oNhap}>
              <Text style={styles.nhanO}>Số điện thoại *</Text>
              <View style={styles.hopNhap}>
                <Ionicons name="call-outline" size={20} color={MAU.phu} style={styles.iconNhap} />
                <TextInput
                  style={styles.input}
                  placeholder="0911111111"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={soDienThoai}
                  onChangeText={setSoDienThoai}
                />
              </View>
            </View>

            {cheDo === 'dangKy' && (
              <View style={styles.oNhap}>
                <Text style={styles.nhanO}>Email (không bắt buộc)</Text>
                <View style={styles.hopNhap}>
                  <Ionicons name="mail-outline" size={20} color={MAU.phu} style={styles.iconNhap} />
                  <TextInput
                    style={styles.input}
                    placeholder="khachhang@gmail.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>
            )}

            <View style={styles.oNhap}>
              <Text style={styles.nhanO}>Mật khẩu *</Text>
              <View style={styles.hopNhap}>
                <Ionicons name="lock-closed-outline" size={20} color={MAU.phu} style={styles.iconNhap} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!hienMatKhau}
                  value={matKhau}
                  onChangeText={setMatKhau}
                />
                <TouchableOpacity onPress={() => setHienMatKhau(!hienMatKhau)}>
                  <Ionicons
                    name={hienMatKhau ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={MAU.phu}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* NÚT SUBMIT */}
            <TouchableOpacity
              style={[styles.nutChinh, dangXuLy && { opacity: 0.7 }]}
              onPress={xuLyXacThuc}
              disabled={dangXuLy}
            >
              {dangXuLy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.chuNutChinh}>
                  {cheDo === 'dangNhap' ? 'ĐĂNG NHẬP NGAY' : 'TẠO TÀI KHOẢN'}
                </Text>
              )}
            </TouchableOpacity>

            {/* PHẦN TÀI KHOẢN MẪU DÀNH CHO GIÁO VIÊN / TEST NHANH */}
            {cheDo === 'dangNhap' && (
              <View style={styles.khoiTaiKhoanMau}>
                <View style={styles.dongTieuDeMau}>
                  <Ionicons name="flash" size={16} color="#F59E0B" />
                  <Text style={styles.tieuDeMau}>Tài khoản mẫu để test nhanh:</Text>
                </View>
                <TouchableOpacity
                  style={styles.nutChonMau}
                  onPress={() => chonTaiKhoanMau('0911111111', '123456')}
                >
                  <View>
                    <Text style={styles.tenMau}>Khách Hàng A</Text>
                    <Text style={styles.chiTietMau}>SĐT: 0911111111 • MK: 123456</Text>
                  </View>
                  <View style={styles.nhanChonMau}>
                    <Text style={styles.chuNhanChon}>Điền ngay</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.nutChonMau, { marginTop: 8 }]}
                  onPress={() => chonTaiKhoanMau('0922222222', '123456')}
                >
                  <View>
                    <Text style={styles.tenMau}>Khách Hàng B</Text>
                    <Text style={styles.chiTietMau}>SĐT: 0922222222 • MK: 123456</Text>
                  </View>
                  <View style={styles.nhanChonMau}>
                    <Text style={styles.chuNhanChon}>Điền ngay</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  khungChinh: {
    flex: 1,
    backgroundColor: MAU.nen,
  },
  noiDungCuon: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  khoiLogo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  hinhLogo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: MAU.chinh,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: MAU.chinh,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 14,
  },
  tenApp: {
    fontSize: 22,
    fontWeight: '800',
    color: MAU.chu,
    letterSpacing: 0.5,
  },
  khauHieu: {
    fontSize: 13,
    color: MAU.phu,
    marginTop: 4,
  },
  thanhTab: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  nutTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 11,
  },
  nutTabKichHoat: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chuTab: {
    fontSize: 14,
    fontWeight: '600',
    color: MAU.phu,
  },
  chuTabKichHoat: {
    color: MAU.chinh,
    fontWeight: '700',
  },
  theForm: {
    backgroundColor: MAU.the,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  oNhap: {
    marginBottom: 16,
  },
  nhanO: {
    fontSize: 13,
    fontWeight: '600',
    color: MAU.chu,
    marginBottom: 7,
  },
  hopNhap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MAU.vien,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: '#F8FAFC',
  },
  iconNhap: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: MAU.chu,
  },
  nutChinh: {
    backgroundColor: MAU.chinh,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: MAU.chinh,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  chuNutChinh: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  khoiTaiKhoanMau: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dongTieuDeMau: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tieuDeMau: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 6,
  },
  nutChonMau: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  tenMau: {
    fontSize: 13,
    fontWeight: '700',
    color: MAU.chu,
  },
  chiTietMau: {
    fontSize: 12,
    color: MAU.phu,
    marginTop: 2,
  },
  nhanChonMau: {
    backgroundColor: MAU.sang,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chuNhanChon: {
    fontSize: 12,
    fontWeight: '600',
    color: MAU.chinhDam,
  },
});
