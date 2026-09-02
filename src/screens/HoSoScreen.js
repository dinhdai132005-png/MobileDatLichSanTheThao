// ============================================================
// HỒ SƠ - Màn hình thông tin cá nhân và lịch sử đặt sân
// Tính năng: Xem thông tin user, Xem lịch sử đặt sân với tab chuyển đổi
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LICH_SU_DAT_SAN, THONG_TIN_NGUOI_DUNG } from '../data/mockData';

// --- Bảng màu ---
const MAU = {
  nen: '#F4F6F9',
  the: '#FFFFFF',
  chinh: '#00B884',
  chu: '#1A1A2E',
  phu: '#6B7280',
  vien: '#E8EAED',
};

// Định nghĩa màu sắc và nhãn cho từng loại trạng thái đặt sân
const TRANG_THAI = {
  hoanThanh: { nhan: 'Hoàn thành', mau: '#16A34A', nen: '#DCFCE7' },
  sapToi: { nhan: 'Sắp tới', mau: '#D97706', nen: '#FEF3C7' },
  daHuy: { nhan: 'Đã hủy', mau: '#DC2626', nen: '#FEE2E2' },
};

export default function HoSoScreen() {
  // State quản lý tab đang chọn: 0 (Thông tin), 1 (Lịch sử)
  const [tab, setTab] = useState(0);
  const nd = THONG_TIN_NGUOI_DUNG;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MAU.the} />
      
      {/* Header đơn giản */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.tieuDe}>Hồ sơ cá nhân</Text>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* --- PHẦN 1: Avatar và thông tin tóm tắt --- */}
        <View style={styles.khoiProfile}>
          <View style={styles.avatar}>
            {/* Lấy chữ cái đầu của tên làm avatar */}
            <Text style={styles.chuAvatar}>{nd.hoTen.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.tenND}>{nd.hoTen}</Text>
            <Text style={styles.emailND}>{nd.email}</Text>
            <View style={styles.badgeTV}>
              <Ionicons name="star" size={12} color="#D97706" />
              <Text style={styles.chuBadge}>{nd.capDoThanhVien}</Text>
            </View>
          </View>
        </View>

        {/* --- PHẦN 2: Tab Menu (Thông tin / Lịch sử) --- */}
        <View style={styles.hangTab}>
          {['Thông tin', 'Lịch sử đặt sân'].map((t, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setTab(i)} // Đổi tab
              style={[styles.nutTab, tab === i && styles.nutTabChon]}
            >
              <Text style={[styles.chuTab, tab === i && { color: MAU.chinh }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- PHẦN 3: Nội dung của Tab tương ứng --- */}
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          {tab === 0 ? (
            // TAB 0: Danh sách thông tin cá nhân
            <>
              {[
                { icon: 'person-outline', nhan: 'Họ và tên', gt: nd.hoTen },
                { icon: 'mail-outline', nhan: 'Email', gt: nd.email },
                { icon: 'call-outline', nhan: 'Số điện thoại', gt: nd.soDienThoai },
                { icon: 'calendar-outline', nhan: 'Thành viên từ', gt: nd.ngayThamGia },
                { icon: 'trophy-outline', nhan: 'Môn yêu thích', gt: nd.monYeuThich },
                { icon: 'checkmark-done-outline', nhan: 'Tổng lượt đặt', gt: `${nd.tongLuotDat} lần` },
              ].map((item, i) => (
                <View key={i} style={styles.dongThongTin}>
                  <View style={styles.khungIcon}>
                    <Ionicons name={item.icon} size={16} color={MAU.chinh} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nhanTT}>{item.nhan}</Text>
                    <Text style={styles.giaTri}>{item.gt}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            // TAB 1: Danh sách Lịch sử đặt sân
            <>
              {LICH_SU_DAT_SAN.map((item) => {
                const tt = TRANG_THAI[item.trangThai];
                return (
                  <View key={item.id} style={[styles.theLichSu, { borderLeftColor: item.mauSac }]}>
                    <View style={styles.hangDauLS}>
                      <Text style={{ fontSize: 28, marginRight: 10 }}>{item.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tenSanLS}>{item.tenSan}</Text>
                        <Text style={styles.monLS}>{item.monTheThao}</Text>
                      </View>
                      {/* Badge trạng thái */}
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

// --- StyleSheet ---
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
  nhanTT: { fontSize: 12, color: MAU.phu, marginBottom: 2 }, // Đã sửa lỗi trùng lặp tên nhanTT
  giaTri: { fontSize: 14, fontWeight: '600', color: MAU.chu },
  theLichSu: { backgroundColor: MAU.the, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: MAU.vien, borderLeftWidth: 3 },
  hangDauLS: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tenSanLS: { fontSize: 14, fontWeight: '700', color: MAU.chu },
  monLS: { fontSize: 12, color: MAU.phu },
  badgeTrangThai: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }, // Đổi tên style để tránh trùng lặp với nhanTT
  hangCuoiLS: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  thoiGianLS: { fontSize: 12, color: MAU.phu },
  tongTienLS: { fontSize: 14, fontWeight: '700', color: MAU.chinh },
});
