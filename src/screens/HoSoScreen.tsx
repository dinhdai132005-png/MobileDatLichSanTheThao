// ============================================================
// HỒ SƠ - Màn hình Hồ sơ cá nhân và Lịch sử đặt sân
// Tích hợp: TypeScript, Axios API Service (donDatService, authService)
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
};

const TRANG_THAI = {
  hoanThanh: { nhan: 'Hoàn thành', mau: '#16A34A', nen: '#DCFCE7' },
  sapToi: { nhan: 'Sắp tới', mau: '#D97706', nen: '#FEF3C7' },
  daHuy: { nhan: 'Đã hủy', mau: '#DC2626', nen: '#FEE2E2' },
};

export default function HoSoScreen() {
  const [tab, setTab] = useState<number>(0);
  const [nguoiDung, setNguoiDung] = useState<NguoiDung | null>(null);
  const [lichSu, setLichSu] = useState<DonDat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const [user, bookings] = await Promise.all([
          authService.getThongTinNguoiDung(),
          donDatService.getLichSuDatSan(),
        ]);
        setNguoiDung(user);
        setLichSu(bookings);
      } catch (err) {
        console.error('Lỗi tải thông tin profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

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
          <View>
            <Text style={styles.tenND}>{nguoiDung.hoTen}</Text>
            <Text style={styles.emailND}>{nguoiDung.email}</Text>
            <View style={styles.badgeTV}>
              <Ionicons name="star" size={12} color="#D97706" />
              <Text style={styles.chuBadge}>{nguoiDung.capDoThanhVien}</Text>
            </View>
          </View>
        </View>

        {/* TAB MENU */}
        <View style={styles.hangTab}>
          {['Thông tin', 'Lịch sử đặt sân (Axios API)'].map((t, i) => (
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
                { icon: 'mail-outline', nhan: 'Email', gt: nguoiDung.email },
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
            </>
          ) : (
            <>
              {lichSu.map((item) => {
                const tt = TRANG_THAI[item.trangThai] || TRANG_THAI.sapToi;
                return (
                  <View key={item.id} style={[styles.theLichSu, { borderLeftColor: item.mauSac }]}>
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
                  </View>
                );
              })}
            </>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
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
  hangTab: { flexDirection: 'row', marginHorizontal: 16, marginTop: 14, marginBottom: 8, backgroundColor: MAU.the, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: MAU.vien },
  nutTab: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  nutTabChon: { backgroundColor: MAU.chinh + '18' },
  chuTab: { fontSize: 14, fontWeight: '600', color: MAU.phu },
  dongThongTin: { flexDirection: 'row', alignItems: 'center', backgroundColor: MAU.the, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: MAU.vien, gap: 12 },
  khungIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: MAU.chinh + '15', alignItems: 'center', justifyContent: 'center' },
  nhanTT: { fontSize: 12, color: MAU.phu, marginBottom: 2 },
  giaTri: { fontSize: 14, fontWeight: '600', color: MAU.chu },
  theLichSu: { backgroundColor: MAU.the, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: MAU.vien, borderLeftWidth: 3 },
  hangDauLS: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tenSanLS: { fontSize: 14, fontWeight: '700', color: MAU.chu },
  monLS: { fontSize: 12, color: MAU.phu },
  badgeTrangThai: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  hangCuoiLS: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  thoiGianLS: { fontSize: 12, color: MAU.phu },
  tongTienLS: { fontSize: 14, fontWeight: '700', color: MAU.chinh },
});
