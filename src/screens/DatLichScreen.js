// ============================================================
// ĐẶT LỊCH SÂN - Màn hình xác nhận thông tin và thanh toán
// Tính năng: Chọn số giờ thuê, nhập thông tin liên hệ, chọn cách thanh toán
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
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

// Các tùy chọn số giờ có thể thuê
const DANH_SACH_SO_GIO = [1, 1.5, 2, 3];

export default function DatLichScreen({ navigation, route }) {
  // Lấy dữ liệu sân, ngày, giờ từ màn hình Chi Tiết Sân truyền sang
  const { san, ngay, gio } = route.params;

  // --- Các State lưu trữ thông tin form ---
  const [soGio, setSoGio] = useState(1);
  const [hoTen, setHoTen] = useState('Nguyễn Văn Minh');
  const [soDT, setSoDT] = useState('0912 345 678');
  const [ghiChu, setGhiChu] = useState('');
  const [thanhToan, setThanhToan] = useState('tienMat'); // Mặc định: Tiền mặt

  // Tính tổng tiền dựa vào giá sân và số giờ thuê
  const tongTien = san.giaTien * soGio;

  // Xử lý sự kiện khi nhấn nút "Xác nhận đặt sân"
  const xacNhan = () => {
    // Basic validation (kiểm tra nhập liệu cơ bản)
    if (!hoTen.trim() || !soDT.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      return;
    }

    // Hiển thị thông báo thành công
    Alert.alert(
      'Đặt sân thành công!',
      `${san.tenSan}\nGiờ: ${gio} (${soGio}h)\nTổng: ${tongTien.toLocaleString('vi-VN')}đ\n\nSMS xác nhận sẽ được gửi đến ${soDT}.`,
      [
        {
          text: 'Về trang chủ',
          // Quay về Tab Trang Chủ (Home) sau khi đặt thành công
          onPress: () => navigation.navigate('TrangChuTab'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MAU.the} />

      {/* === HEADER === */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.nutQuayLai} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={MAU.chu} />
        </TouchableOpacity>
        <Text style={styles.tieuDe}>Xác nhận đặt sân</Text>
        <View style={{ width: 36 }} /> {/* Dùng để căn giữa text */}
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        {/* --- PHẦN 1: Tóm tắt thông tin sân --- */}
        <View style={styles.the}>
          <Text style={{ fontSize: 36 }}>{san.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tenSan}>{san.tenSan}</Text>
            <Text style={styles.chuPhu}>Bắt đầu lúc {gio} · Ngày {ngay}</Text>
          </View>
        </View>

        {/* --- PHẦN 2: Chọn số giờ thuê --- */}
        <Text style={styles.tieuDeMuc}>Thời gian thuê</Text>
        <View style={styles.hangGio}>
          {DANH_SACH_SO_GIO.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setSoGio(g)} // Cập nhật số giờ khi chọn
              style={[styles.nutGio, soGio === g && styles.nutGioChon]}
            >
              <Text style={[styles.chuGio, soGio === g && { color: '#fff' }]}>{g}h</Text>
              <Text style={[styles.giaGio, soGio === g && { color: 'rgba(255,255,255,0.8)' }]}>
                {(san.giaTien * g).toLocaleString('vi-VN')}đ
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- PHẦN 3: Form thông tin liên hệ --- */}
        <Text style={styles.tieuDeMuc}>Thông tin liên hệ</Text>
        <View style={styles.khungForm}>
          
          <Text style={styles.nhanInput}>Họ và tên</Text>
          <View style={styles.oInput}>
            <Ionicons name="person-outline" size={15} color={MAU.phu} />
            <TextInput 
              value={hoTen} 
              onChangeText={setHoTen} 
              style={styles.input} 
              placeholderTextColor={MAU.phu} 
            />
          </View>

          <Text style={styles.nhanInput}>Số điện thoại</Text>
          <View style={styles.oInput}>
            <Ionicons name="call-outline" size={15} color={MAU.phu} />
            <TextInput 
              value={soDT} 
              onChangeText={setSoDT} 
              style={styles.input} 
              keyboardType="phone-pad" 
              placeholderTextColor={MAU.phu} 
            />
          </View>

          <Text style={styles.nhanInput}>Ghi chú (tùy chọn)</Text>
          <View style={[styles.oInput, { height: 72, alignItems: 'flex-start', paddingVertical: 10 }]}>
            <TextInput
              value={ghiChu}
              onChangeText={setGhiChu}
              style={[styles.input, { height: 52 }]}
              multiline
              placeholder="Ví dụ: cần 2 vợt, bật đèn sẵn..."
              placeholderTextColor={MAU.phu}
            />
          </View>
        </View>

        {/* --- PHẦN 4: Chọn phương thức thanh toán --- */}
        <Text style={styles.tieuDeMuc}>Thanh toán</Text>
        {[
          { ma: 'tienMat', nhan: 'Tiền mặt tại sân', icon: 'cash-outline' },
          { ma: 'momo', nhan: 'Ví MoMo', icon: 'wallet-outline' },
          { ma: 'chuyenKhoan', nhan: 'Chuyển khoản ngân hàng', icon: 'card-outline' },
        ].map((pt) => (
          <TouchableOpacity
            key={pt.ma}
            style={[styles.theTT, thanhToan === pt.ma && styles.theTTChon]}
            onPress={() => setThanhToan(pt.ma)} // Cập nhật phương thức TT
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={pt.icon} size={18} color={thanhToan === pt.ma ? MAU.chinh : MAU.phu} />
              <Text style={{ fontSize: 14, color: MAU.chu, fontWeight: '500' }}>{pt.nhan}</Text>
            </View>
            {/* Custom Radio Button */}
            <View style={[styles.radio, thanhToan === pt.ma && styles.radioChon]}>
              {thanhToan === pt.ma && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* === FOOTER: Hiển thị tổng tiền và Nút xác nhận === */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: MAU.phu }}>Tổng tiền</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: MAU.chinh }}>
            {tongTien.toLocaleString('vi-VN')}đ
          </Text>
        </View>
        <TouchableOpacity style={styles.nutXacNhan} onPress={xacNhan}>
          <Text style={styles.chuNutXacNhan}>Xác nhận đặt sân</Text>
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
  the: { flexDirection: 'row', alignItems: 'center', backgroundColor: MAU.the, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: MAU.vien, gap: 12, marginBottom: 20 },
  tenSan: { fontSize: 15, fontWeight: '700', color: MAU.chu, marginBottom: 3 },
  chuPhu: { fontSize: 13, color: MAU.phu },
  tieuDeMuc: { fontSize: 15, fontWeight: '700', color: MAU.chu, marginBottom: 10, marginTop: 4 },
  hangGio: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  nutGio: { flex: 1, backgroundColor: MAU.the, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: MAU.vien },
  nutGioChon: { backgroundColor: MAU.chinh, borderColor: MAU.chinh },
  chuGio: { fontSize: 15, fontWeight: '700', color: MAU.chu },
  giaGio: { fontSize: 10, color: MAU.phu, marginTop: 2 },
  khungForm: { backgroundColor: MAU.the, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: MAU.vien, marginBottom: 20 },
  nhanInput: { fontSize: 13, color: MAU.phu, fontWeight: '500', marginBottom: 6, marginTop: 10 },
  oInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: MAU.nen, borderRadius: 10, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: MAU.vien, height: 44 },
  input: { flex: 1, color: MAU.chu, fontSize: 14 },
  theTT: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: MAU.the, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: MAU.vien },
  theTTChon: { borderColor: MAU.chinh },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: MAU.vien, alignItems: 'center', justifyContent: 'center' },
  radioChon: { borderColor: MAU.chinh },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: MAU.chinh },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: MAU.the, borderTopWidth: 1, borderTopColor: MAU.vien, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nutXacNhan: { flex: 2, backgroundColor: MAU.chinh, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  chuNutXacNhan: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
