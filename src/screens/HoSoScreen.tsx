// ============================================================
// HỒ SƠ (HoSoScreen.tsx) — CHUẨN PLANT / T25, T28 (CUS-01, CUS-02, CUS-03)
// Quản lý thông tin cá nhân, sửa hồ sơ, đổi mật khẩu, đăng nhập/đăng ký & đăng xuất
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DonDat, NguoiDung } from '../types';
import { donDatService } from '../services/donDatService';
import { authService } from '../services/authService';

const MAU = {
  nen: '#F4F6F9',
  the: '#FFFFFF',
  chinh: '#00B884',
  chu: '#1A1A2E',
  phu: '#6B7280',
  vien: '#E8EAED',
  nguyHiem: '#EF4444',
  canhBao: '#F59E0B',
};

const TRANG_THAI = {
  hoanThanh: { nhan: 'Hoàn thành', mau: '#16A34A', nen: '#DCFCE7' },
  sapToi: { nhan: 'Sắp tới', mau: '#D97706', nen: '#FEF3C7' },
  daHuy: { nhan: 'Đã hủy', mau: '#DC2626', nen: '#FEE2E2' },
};

export default function HoSoScreen({ navigation }: { navigation?: any }) {
  const [tab, setTab] = useState<number>(0);
  const [nguoiDung, setNguoiDung] = useState<NguoiDung | null>(null);
  const [lichSu, setLichSu] = useState<DonDat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Sửa hồ sơ
  const [hienModalSua, setHienModalSua] = useState<boolean>(false);
  const [hoTenMoi, setHoTenMoi] = useState<string>('');
  const [emailMoi, setEmailMoi] = useState<string>('');
  const [dangLuuHoSo, setDangLuuHoSo] = useState<boolean>(false);

  // Modal Đổi mật khẩu
  const [hienModalDoiMK, setHienModalDoiMK] = useState<boolean>(false);
  const [matKhauCu, setMatKhauCu] = useState<string>('');
  const [matKhauMoi, setMatKhauMoi] = useState<string>('');
  const [dangDoiMK, setDangDoiMK] = useState<boolean>(false);

  // Modal Đăng nhập / Đăng ký
  const [hienModalAuth, setHienModalAuth] = useState<boolean>(false);
  const [cheDoAuth, setCheDoAuth] = useState<'dangNhap' | 'dangKy'>('dangNhap');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authFullName, setAuthFullName] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [dangXuLyAuth, setDangXuLyAuth] = useState<boolean>(false);

  async function loadProfile() {
    try {
      setLoading(true);
      const [user, bookings] = await Promise.all([
        authService.getThongTinNguoiDung(),
        donDatService.getLichSuDatSan(),
      ]);
      setNguoiDung(user);
      setLichSu(bookings);
      setHoTenMoi(user.hoTen);
      setEmailMoi(user.email);
    } catch (err) {
      console.error('Lỗi tải thông tin profile:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  // Xử lý Cập nhật hồ sơ (PUT /auth/me - CUS-03)
  const handleCapNhatHoSo = async () => {
    if (!hoTenMoi.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống.');
      return;
    }
    setDangLuuHoSo(true);
    try {
      const userCapNhat = await authService.capNhatHoSo({
        hoTen: hoTenMoi.trim(),
        email: emailMoi.trim() || undefined,
      });
      setNguoiDung(userCapNhat);
      setHienModalSua(false);
      Alert.alert('Thành công', 'Thông tin hồ sơ đã được cập nhật!');
    } catch (err: any) {
      Alert.alert('Không thể cập nhật', err.message || 'Lỗi khi sửa hồ sơ');
    } finally {
      setDangLuuHoSo(false);
    }
  };

  // Xử lý Đổi mật khẩu (PUT /auth/change-password - CUS-03)
  const handleDoiMatKhau = async () => {
    if (!matKhauCu.trim() || !matKhauMoi.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (matKhauMoi.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setDangDoiMK(true);
    try {
      await authService.doiMatKhau({
        matKhauHienTai: matKhauCu,
        matKhauMoi: matKhauMoi,
      });
      setHienModalDoiMK(false);
      setMatKhauCu('');
      setMatKhauMoi('');
      Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
    } catch (err: any) {
      Alert.alert('Không thể đổi mật khẩu', err.message || 'Mật khẩu hiện tại không đúng');
    } finally {
      setDangDoiMK(false);
    }
  };

  // Xử lý Đăng nhập / Đăng ký (CUS-01, CUS-02)
  const handleAuthSubmit = async () => {
    if (!authPhone.trim() || !authPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại và mật khẩu.');
      return;
    }

    setDangXuLyAuth(true);
    try {
      if (cheDoAuth === 'dangNhap') {
        const res = await authService.dangNhap(authPhone.trim(), authPassword.trim());
        setNguoiDung(res.nguoiDung);
        Alert.alert('Chào mừng', `Đăng nhập thành công! Chào ${res.nguoiDung.hoTen}`);
      } else {
        if (!authFullName.trim()) {
          Alert.alert('Lỗi', 'Vui lòng nhập họ và tên của bạn.');
          setDangXuLyAuth(false);
          return;
        }
        const res = await authService.dangKy({
          hoTen: authFullName.trim(),
          soDienThoai: authPhone.trim(),
          email: authEmail.trim() || `${authPhone.trim()}@gmail.com`,
          matKhau: authPassword.trim(),
        });
        setNguoiDung(res.nguoiDung);
        Alert.alert('Thành công', `Đăng ký tài khoản thành công!`);
      }
      setHienModalAuth(false);
      loadProfile();
    } catch (err: any) {
      Alert.alert('Thất bại', err.message || 'Thao tác không thành công');
    } finally {
      setDangXuLyAuth(false);
    }
  };

  if (loading || !nguoiDung) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={MAU.chinh} />
        <Text style={{ marginTop: 10, color: MAU.phu, fontSize: 13 }}>Đang tải thông tin hồ sơ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MAU.the} />

      {/* HEADER */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.tieuDe}>Hồ sơ cá nhân</Text>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AVATAR & SUMMARY */}
        <View style={styles.khoiProfile}>
          <View style={styles.avatar}>
            <Text style={styles.chuAvatar}>{nguoiDung.hoTen.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tenND}>{nguoiDung.hoTen}</Text>
            <Text style={styles.emailND}>{nguoiDung.email || nguoiDung.soDienThoai}</Text>
            <View style={styles.badgeTV}>
              <Ionicons name="star" size={12} color="#D97706" />
              <Text style={styles.chuBadge}>{nguoiDung.capDoThanhVien}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.nutSuaNho}
            onPress={() => setHienModalSua(true)}
          >
            <Ionicons name="create-outline" size={18} color={MAU.chinh} />
          </TouchableOpacity>
        </View>

        {/* TAB MENU */}
        <View style={styles.hangTab}>
          {['Thông tin', 'Lịch sử đặt sân'].map((t, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setTab(i)}
              style={[styles.nutTab, tab === i && styles.nutTabChon]}
            >
              <Text style={[styles.chuTab, tab === i && { color: MAU.chinh }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TAB CONTENT */}
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          {tab === 0 ? (
            <>
              {[
                { icon: 'person-outline', nhan: 'Họ và tên', gt: nguoiDung.hoTen },
                { icon: 'mail-outline', nhan: 'Email', gt: nguoiDung.email || 'Chưa cập nhật' },
                { icon: 'call-outline', nhan: 'Số điện thoại', gt: nguoiDung.soDienThoai },
                { icon: 'calendar-outline', nhan: 'Thành viên từ', gt: nguoiDung.ngayThamGia },
                { icon: 'trophy-outline', nhan: 'Môn yêu thích', gt: nguoiDung.monYeuThich },
                { icon: 'checkmark-done-outline', nhan: 'Tổng lượt đặt', gt: `${nguoiDung.tongLuotDat} lần` },
              ].map((item, i) => (
                <View key={i} style={styles.dongThongTin}>
                  <View style={styles.khungIcon}>
                    <Ionicons name={item.icon as any} size={16} color={MAU.chinh} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nhanTT}>{item.nhan}</Text>
                    <Text style={styles.giaTri}>{item.gt}</Text>
                  </View>
                </View>
              ))}

              {/* HÀNH ĐỘNG TÀI KHOẢN (CUS-03) */}
              <View style={styles.khoiHanhDong}>
                <TouchableOpacity
                  style={styles.nutHanhDong}
                  onPress={() => setHienModalSua(true)}
                >
                  <Ionicons name="pencil-outline" size={18} color={MAU.chinh} />
                  <Text style={styles.chuNutHanhDong}>Chỉnh sửa thông tin cá nhân</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.nutHanhDong}
                  onPress={() => setHienModalDoiMK(true)}
                >
                  <Ionicons name="key-outline" size={18} color="#4F46E5" />
                  <Text style={[styles.chuNutHanhDong, { color: '#4F46E5' }]}>Đổi mật khẩu tài khoản</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.nutHanhDong}
                  onPress={() => {
                    setCheDoAuth('dangNhap');
                    setHienModalAuth(true);
                  }}
                >
                  <Ionicons name="log-in-outline" size={18} color="#059669" />
                  <Text style={[styles.chuNutHanhDong, { color: '#059669' }]}>Đổi tài khoản đăng nhập</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.nutHanhDong, { borderColor: '#FECACA' }]}
                  onPress={() => {
                    authService.dangXuat();
                    Alert.alert('Đăng xuất', 'Bạn đã đăng xuất tài khoản.');
                    setCheDoAuth('dangNhap');
                    setHienModalAuth(true);
                  }}
                >
                  <Ionicons name="log-out-outline" size={18} color={MAU.nguyHiem} />
                  <Text style={[styles.chuNutHanhDong, { color: MAU.nguyHiem }]}>Đăng xuất</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {lichSu.length === 0 ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
                  <Text style={{ marginTop: 10, color: MAU.phu, fontSize: 13 }}>Chưa có đơn đặt sân nào</Text>
                </View>
              ) : (
                lichSu.map((item) => {
                  const tt = TRANG_THAI[item.trangThai] || TRANG_THAI.sapToi;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => navigation?.navigate('ChiTietDonDat', { donDatId: item.id, donDat: item })}
                      style={[styles.theLichSu, { borderLeftColor: item.mauSac }]}
                    >
                      <View style={styles.hangDauLS}>
                        <Text style={{ fontSize: 28, marginRight: 10 }}>{item.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tenSanLS}>{item.tenSan}</Text>
                          <Text style={styles.monLS}>{item.monTheThao}</Text>
                        </View>
                        <View style={[styles.badgeTrangThai, { backgroundColor: tt.nen }]}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: tt.mau }}>{tt.nhan}</Text>
                        </View>
                      </View>
                      <View style={styles.hangCuoiLS}>
                        <Text style={styles.thoiGianLS}>
                          {item.ngayDat} · {item.gioDat} ({item.soGioThue}h)
                        </Text>
                        <Text style={styles.tongTienLS}>{item.tongTien.toLocaleString('vi-VN')}đ</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL SỬA THÔNG TIN */}
      <Modal visible={hienModalSua} transparent animationType="fade">
        <View style={styles.lopPhuModal}>
          <View style={styles.hopModal}>
            <Text style={styles.tieuDeModal}>Chỉnh Sửa Hồ Sơ</Text>
            <Text style={styles.nhanInput}>Họ và tên</Text>
            <TextInput
              style={styles.oNhap}
              value={hoTenMoi}
              onChangeText={setHoTenMoi}
              placeholder="Nhập họ và tên"
            />
            <Text style={styles.nhanInput}>Email</Text>
            <TextInput
              style={styles.oNhap}
              value={emailMoi}
              onChangeText={setEmailMoi}
              placeholder="Nhập địa chỉ email"
              keyboardType="email-address"
            />
            <View style={styles.hangNutModal}>
              <TouchableOpacity
                style={styles.nutDongModal}
                onPress={() => setHienModalSua(false)}
              >
                <Text style={styles.chuNutDongModal}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nutLuuModal}
                onPress={handleCapNhatHoSo}
                disabled={dangLuuHoSo}
              >
                {dangLuuHoSo ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.chuNutLuuModal}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ĐỔI MẬT KHẨU */}
      <Modal visible={hienModalDoiMK} transparent animationType="fade">
        <View style={styles.lopPhuModal}>
          <View style={styles.hopModal}>
            <Text style={styles.tieuDeModal}>Đổi Mật Khẩu</Text>
            <Text style={styles.nhanInput}>Mật khẩu hiện tại</Text>
            <TextInput
              style={styles.oNhap}
              value={matKhauCu}
              onChangeText={setMatKhauCu}
              secureTextEntry
              placeholder="••••••••"
            />
            <Text style={styles.nhanInput}>Mật khẩu mới (≥ 6 ký tự)</Text>
            <TextInput
              style={styles.oNhap}
              value={matKhauMoi}
              onChangeText={setMatKhauMoi}
              secureTextEntry
              placeholder="••••••••"
            />
            <View style={styles.hangNutModal}>
              <TouchableOpacity
                style={styles.nutDongModal}
                onPress={() => setHienModalDoiMK(false)}
              >
                <Text style={styles.chuNutDongModal}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nutLuuModal}
                onPress={handleDoiMatKhau}
                disabled={dangDoiMK}
              >
                {dangDoiMK ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.chuNutLuuModal}>Đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ */}
      <Modal visible={hienModalAuth} transparent animationType="fade">
        <View style={styles.lopPhuModal}>
          <View style={styles.hopModal}>
            <Text style={styles.tieuDeModal}>
              {cheDoAuth === 'dangNhap' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản'}
            </Text>

            {cheDoAuth === 'dangKy' && (
              <>
                <Text style={styles.nhanInput}>Họ và tên</Text>
                <TextInput
                  style={styles.oNhap}
                  value={authFullName}
                  onChangeText={setAuthFullName}
                  placeholder="Nguyễn Văn A"
                />
              </>
            )}

            <Text style={styles.nhanInput}>Số điện thoại</Text>
            <TextInput
              style={styles.oNhap}
              value={authPhone}
              onChangeText={setAuthPhone}
              placeholder="0911111111"
              keyboardType="phone-pad"
            />

            <Text style={styles.nhanInput}>Mật khẩu</Text>
            <TextInput
              style={styles.oNhap}
              value={authPassword}
              onChangeText={setAuthPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
              <TouchableOpacity
                onPress={() =>
                  setCheDoAuth(cheDoAuth === 'dangNhap' ? 'dangKy' : 'dangNhap')
                }
              >
                <Text style={{ fontSize: 13, color: MAU.chinh, fontWeight: '600' }}>
                  {cheDoAuth === 'dangNhap'
                    ? 'Chưa có tài khoản? Đăng ký ngay'
                    : 'Đã có tài khoản? Đăng nhập ngay'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hangNutModal}>
              <TouchableOpacity
                style={styles.nutDongModal}
                onPress={() => setHienModalAuth(false)}
              >
                <Text style={styles.chuNutDongModal}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nutLuuModal}
                onPress={handleAuthSubmit}
                disabled={dangXuLyAuth}
              >
                {dangXuLyAuth ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.chuNutLuuModal}>
                    {cheDoAuth === 'dangNhap' ? 'Đăng nhập' : 'Tạo tài khoản'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MAU.nen },
  header: { backgroundColor: MAU.the, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: MAU.vien },
  tieuDe: { fontSize: 20, fontWeight: '700', color: MAU.chu },
  khoiProfile: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: MAU.the, padding: 16, borderBottomWidth: 1, borderBottomColor: MAU.vien },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: MAU.chinh, alignItems: 'center', justifyContent: 'center' },
  chuAvatar: { fontSize: 26, fontWeight: '800', color: '#fff' },
  tenND: { fontSize: 18, fontWeight: '700', color: MAU.chu, marginBottom: 2 },
  emailND: { fontSize: 13, color: MAU.phu, marginBottom: 6 },
  badgeTV: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  chuBadge: { fontSize: 11, color: '#D97706', fontWeight: '700' },
  nutSuaNho: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(0, 184, 132, 0.1)' },
  hangTab: { flexDirection: 'row', marginHorizontal: 16, marginTop: 14, marginBottom: 8, backgroundColor: MAU.the, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: MAU.vien },
  nutTab: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  nutTabChon: { backgroundColor: MAU.chinh + '18' },
  chuTab: { fontSize: 14, fontWeight: '600', color: MAU.phu },
  dongThongTin: { flexDirection: 'row', alignItems: 'center', backgroundColor: MAU.the, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: MAU.vien, gap: 12 },
  khungIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: MAU.chinh + '15', alignItems: 'center', justifyContent: 'center' },
  nhanTT: { fontSize: 12, color: MAU.phu, marginBottom: 2 },
  giaTri: { fontSize: 14, fontWeight: '600', color: MAU.chu },
  khoiHanhDong: { marginTop: 12, gap: 8 },
  nutHanhDong: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', padding: 13, borderRadius: 10, borderWidth: 1, borderColor: MAU.vien },
  chuNutHanhDong: { fontSize: 13.5, fontWeight: '600', color: MAU.chinh },
  theLichSu: { backgroundColor: MAU.the, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: MAU.vien, borderLeftWidth: 3 },
  hangDauLS: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tenSanLS: { fontSize: 14, fontWeight: '700', color: MAU.chu },
  monLS: { fontSize: 12, color: MAU.phu },
  badgeTrangThai: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  hangCuoiLS: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  thoiGianLS: { fontSize: 12, color: MAU.phu },
  tongTienLS: { fontSize: 14, fontWeight: '700', color: MAU.chinh },
  lopPhuModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  hopModal: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  tieuDeModal: { fontSize: 17, fontWeight: '800', color: MAU.chu, marginBottom: 14, textAlign: 'center' },
  nhanInput: { fontSize: 12.5, fontWeight: '600', color: MAU.chu, marginBottom: 4, marginTop: 8 },
  oNhap: { borderWidth: 1, borderColor: MAU.vien, borderRadius: 8, padding: 10, fontSize: 13 },
  hangNutModal: { flexDirection: 'row', gap: 12, marginTop: 18 },
  nutDongModal: { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: MAU.vien, alignItems: 'center' },
  chuNutDongModal: { fontSize: 13, fontWeight: '600', color: MAU.phu },
  nutLuuModal: { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: MAU.chinh, alignItems: 'center' },
  chuNutLuuModal: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
