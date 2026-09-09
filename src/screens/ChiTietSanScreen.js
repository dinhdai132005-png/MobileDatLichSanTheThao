// ============================================================
// CHI TIẾT SÂN - Hiển thị thông tin chi tiết của 1 sân cụ thể
// Tính năng: Xem thông tin, chọn ngày thuê, chọn giờ thuê
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

// --- Bảng màu ---
const MAU = {
  nen: '#F4F6F9',
  the: '#FFFFFF',
  chinh: '#00B884',
  chu: '#1A1A2E',
  phu: '#6B7280',
  vien: '#E8EAED',
};

const DANH_SACH_THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Hàm tiện ích: Tạo danh sách 7 ngày tới để người dùng chọn lịch
function taoDanhSachNgay() {
  const ds = [];
  const homNay = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(homNay);
    d.setDate(homNay.getDate() + i);
    ds.push({
      thu: DANH_SACH_THU[d.getDay()],
      ngay: d.getDate(),
      thang: d.getMonth() + 1,
      ngayDayDu: d.toISOString().split('T')[0], // format: YYYY-MM-DD
    });
  }
  return ds;
}

export default function ChiTietSanScreen({ navigation, route }) {
  // Lấy dữ liệu sân được truyền từ màn hình trước (Danh sách sân / Trang chủ)
  const { san } = route.params;
  
  // State: Lưu trữ ngày và giờ người dùng chọn
  const danhSachNgay = taoDanhSachNgay();
  const [ngayChon, setNgayChon] = useState(danhSachNgay[0].ngayDayDu); // mặc định chọn hôm nay
  const [gioChon, setGioChon] = useState(null); // chưa chọn giờ nào

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MAU.the} />

      {/* === HEADER: Nút quay lại và Tên sân === */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.nutQuayLai} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={MAU.chu} />
        </TouchableOpacity>
        <Text style={styles.tieuDe} numberOfLines={1}>{san.tenSan}</Text>
        {/* Khối trống để căn giữa tiêu đề */}
        <View style={{ width: 36 }} />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Màn hình hiển thị emoji đại diện thay vì hình ảnh thật để đơn giản */}
        <View style={[styles.heroEmoji, { backgroundColor: san.mauSac + '18' }]}>
          <Text style={{ fontSize: 72 }}>{san.emoji}</Text>
          <View style={[styles.tagMon, { borderColor: san.mauSac }]}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: san.mauSac }}>
              {san.monTheThao}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Tên sân và Giá */}
          <View style={styles.hangTieuDe}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tenSan}>{san.tenSan}</Text>
              <View style={styles.danhGiaRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.soDG}>{san.danhGia}</Text>
                <Text style={styles.soLuot}>({san.soLuotDanhGia} đánh giá)</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.giaTien}>{san.giaTien.toLocaleString('vi-VN')}đ</Text>
              <Text style={styles.donViGia}>/giờ</Text>
            </View>
          </View>

          {/* Các thông tin cơ bản: Địa chỉ, Giờ mở cửa, Khoảng cách */}
          <View style={styles.the}>
            <View style={styles.dongThongTin}>
              <Ionicons name="location-outline" size={15} color={MAU.phu} />
              <Text style={styles.chuThongTin}>{san.diaChi}</Text>
            </View>
            <View style={styles.dongThongTin}>
              <Ionicons name="time-outline" size={15} color={MAU.phu} />
              <Text style={styles.chuThongTin}>{san.gioMoCua} – {san.gioDongCua}</Text>
            </View>
            <View style={styles.dongThongTin}>
              <Ionicons name="navigate-outline" size={15} color={MAU.phu} />
              <Text style={styles.chuThongTin}>{san.khoangCach} từ vị trí của bạn</Text>
            </View>
          </View>

          {/* Tiện ích của sân (Wifi, Căng tin, Bóng...) */}
          <Text style={styles.tieuDeMuc}>Tiện ích</Text>
          <View style={styles.khungTienIch}>
            {san.tienIch.map((t, i) => (
              <View key={i} style={styles.theTienIch}>
                <Ionicons name="checkmark-circle" size={14} color={MAU.chinh} />
                <Text style={styles.chuTienIch}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Component: Chọn ngày thuê */}
          <Text style={styles.tieuDeMuc}>Chọn ngày</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {danhSachNgay.map((d) => (
              <TouchableOpacity
                key={d.ngayDayDu}
                onPress={() => setNgayChon(d.ngayDayDu)} // Cập nhật state ngày chọn
                style={[styles.theNgay, ngayChon === d.ngayDayDu && styles.theNgayChon]}
              >
                <Text style={[styles.chuThu, ngayChon === d.ngayDayDu && { color: '#fff' }]}>{d.thu}</Text>
                <Text style={[styles.chuNgay, ngayChon === d.ngayDayDu && { color: '#fff' }]}>{d.ngay}</Text>
                <Text style={[styles.chuThang, ngayChon === d.ngayDayDu && { color: '#fff' }]}>T{d.thang}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Component: Chọn khung giờ thuê */}
          <Text style={[styles.tieuDeMuc, { marginTop: 20 }]}>Chọn khung giờ</Text>
          <View style={styles.luoiGio}>
            {san.danhSachKhungGio.map((slot, i) => (
              <TouchableOpacity
                key={i}
                disabled={!slot.conTrong} // Không cho bấm nếu đã hết sân
                onPress={() => setGioChon(slot.gio)} // Cập nhật state giờ chọn
                style={[
                  styles.nutGio,
                  !slot.conTrong && styles.nutGioHet,
                  gioChon === slot.gio && styles.nutGioChon,
                ]}
              >
                <Text style={[
                  styles.chuGio,
                  !slot.conTrong && { color: '#CBD5E1' },
                  gioChon === slot.gio && { color: '#fff' },
                ]}>
                  {slot.gio}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Đệm khoảng trống cuối trang cho Footer */}
          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      {/* === FOOTER: Nút chuyển sang màn Đặt sân === */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: MAU.phu }}>Giờ đã chọn</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: MAU.chu }}>
            {gioChon ?? '--:--'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.nutDat, (!gioChon || !san.conSan) && { opacity: 0.4 }]}
          disabled={!gioChon || !san.conSan} // Nút chỉ bấm được khi đã chọn giờ
          onPress={() => navigation.navigate('DatLich', { san, ngay: ngayChon, gio: gioChon })}
        >
          <Text style={styles.chuNutDat}>Đặt sân ngay</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MAU.nen },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: MAU.the, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: MAU.vien },
  nutQuayLai: { width: 36, height: 36, borderRadius: 10, backgroundColor: MAU.nen, alignItems: 'center', justifyContent: 'center' },
  tieuDe: { flex: 1, fontSize: 16, fontWeight: '700', color: MAU.chu, textAlign: 'center' },
  heroEmoji: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  tagMon: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  body: { paddingHorizontal: 16 },
  hangTieuDe: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, marginBottom: 14 },
  tenSan: { fontSize: 18, fontWeight: '800', color: MAU.chu, marginBottom: 4 },
  danhGiaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  soDG: { fontSize: 13, fontWeight: '700', color: MAU.chu },
  soLuot: { fontSize: 12, color: MAU.phu },
  giaTien: { fontSize: 20, fontWeight: '800', color: MAU.chinh },
  donViGia: { fontSize: 12, color: MAU.phu },
  the: { backgroundColor: MAU.the, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: MAU.vien, marginBottom: 16, gap: 10 },
  dongThongTin: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chuThongTin: { fontSize: 13, color: MAU.chu, flex: 1 },
  tieuDeMuc: { fontSize: 15, fontWeight: '700', color: MAU.chu, marginBottom: 10 },
  khungTienIch: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  theTienIch: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: MAU.the, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: MAU.vien },
  chuTienIch: { fontSize: 12, color: MAU.chu },
  theNgay: { alignItems: 'center', width: 52, height: 68, justifyContent: 'center', borderRadius: 12, backgroundColor: MAU.the, marginRight: 8, borderWidth: 1, borderColor: MAU.vien },
  theNgayChon: { backgroundColor: MAU.chinh, borderColor: MAU.chinh },
  chuThu: { fontSize: 11, color: MAU.phu, fontWeight: '600' },
  chuNgay: { fontSize: 18, fontWeight: '800', color: MAU.chu, marginVertical: 2 },
  chuThang: { fontSize: 10, color: MAU.phu },
  luoiGio: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nutGio: { width: '22%', paddingVertical: 9, borderRadius: 10, backgroundColor: MAU.the, alignItems: 'center', borderWidth: 1, borderColor: MAU.vien },
  nutGioHet: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  nutGioChon: { backgroundColor: MAU.chinh, borderColor: MAU.chinh },
  chuGio: { fontSize: 13, fontWeight: '600', color: MAU.chu },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: MAU.the, borderTopWidth: 1, borderTopColor: MAU.vien, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nutDat: { flex: 2, backgroundColor: MAU.chinh, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12, gap: 8 },
  chuNutDat: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
