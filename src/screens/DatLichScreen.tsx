// ============================================================
// ĐẶT LỊCH SÂN - Màn hình xác nhận thông tin & Thanh toán VietQR
// Tích hợp: TypeScript, Axios HTTP API, VietQR Modal & Socket.io Real-time
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { San, PhuongThucThanhToan } from '../types';
import { donDatService } from '../services/donDatService';
import { socketService } from '../services/socketService';
import VietQRCodeModal from '../components/VietQRCodeModal';

type RootStackParamList = {
  DatLich: { san: San; ngay: string; gio: string };
  TrangChuTab: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'DatLich'>;

const MAU = {
  nen: '#F4F6F9',
  the: '#FFFFFF',
  chinh: '#00B884',
  chu: '#1A1A2E',
  phu: '#6B7280',
  vien: '#E8EAED',
};

const DANH_SACH_SO_GIO = [1, 1.5, 2, 3];

export default function DatLichScreen({ navigation, route }: Props) {
  const { san, ngay, gio } = route.params;

  // State Form
  const [soGio, setSoGio] = useState<number>(1);
  const [hoTen, setHoTen] = useState<string>('Đinh Ngọc Đại');
  const [soDT, setSoDT] = useState<string>('0912 345 678');
  const [ghiChu, setGhiChu] = useState<string>('');
  const [thanhToan, setThanhToan] = useState<PhuongThucThanhToan>('tienMat');

  // State Modal VietQR
  const [showVietQRModal, setShowVietQRModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const tongTien = san.giaTien * soGio;

  // Xử lý nút Đặt Sân / Thanh Toán
  const handleBookingSubmit = async () => {
    if (!hoTen.trim() || !soDT.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
      return;
    }

    // Nếu chọn thanh toán Chuyển khoản hoặc MoMo -> Mở Modal VietQR trước
    if (thanhToan === 'chuyenKhoan' || thanhToan === 'momo') {
      setShowVietQRModal(true);
      return;
    }

    // Nếu là tiền mặt -> Thực hiện đặt ngay
    await executeCreateBooking();
  };

  // Thực hiện gọi Axios API gửi đơn đặt sân & phát Socket event
  const executeCreateBooking = async () => {
    try {
      setIsSubmitting(true);

      // 1. Gọi Axios HTTP Client tạo đơn đặt
      const donDat = await donDatService.taoDonDatSan({
        sanId: san.id,
        tenSan: san.tenSan,
        monTheThao: san.monTheThao,
        emoji: san.emoji,
        ngayDat: ngay,
        gioDat: gio,
        soGioThue: soGio,
        tongTien,
        hoTen,
        soDT,
        ghiChu,
        phuongThucThanhToan: thanhToan,
        mauSac: san.mauSac,
      });

      // 2. Đồng bộ Socket.io Event cập nhật khung giờ real-time cho các thiết bị khác
      socketService.emitSlotUpdate(san.id, gio, false);

      setShowVietQRModal(false);

      // 3. Thông báo thành công
      Alert.alert(
        'Đặt sân thành công! 🎉',
        `Mã đơn: ${donDat.id}\nSân: ${san.tenSan}\nThời gian: ${gio} (${soGio}h) ngày ${ngay}\nTổng tiền: ${tongTien.toLocaleString('vi-VN')}đ\n\nSMS/Zalo xác nhận đã gửi đến ${soDT}.`,
        [
          {
            text: 'Về trang chủ',
            onPress: () => navigation.navigate('TrangChuTab'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi đặt sân', 'Không thể hoàn tất đơn đặt. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MAU.the} />

      {/* HEADER */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.nutQuayLai} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={MAU.chu} />
        </TouchableOpacity>
        <Text style={styles.tieuDe}>Xác nhận & Thanh toán</Text>
        <View style={{ width: 36 }} />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {/* TÓM TẮT SÂN */}
        <View style={styles.the}>
          <Text style={{ fontSize: 36 }}>{san.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tenSan}>{san.tenSan}</Text>
            <Text style={styles.chuPhu}>
              Bắt đầu lúc {gio} · Ngày {ngay}
            </Text>
          </View>
        </View>

        {/* CHỌN SỐ GIỜ THUÊ */}
        <Text style={styles.tieuDeMuc}>Thời gian thuê</Text>
        <View style={styles.hangGio}>
          {DANH_SACH_SO_GIO.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setSoGio(g)}
              style={[styles.nutGio, soGio === g && styles.nutGioChon]}
            >
              <Text style={[styles.chuGio, soGio === g && { color: '#fff' }]}>{g}h</Text>
              <Text style={[styles.giaGio, soGio === g && { color: 'rgba(255,255,255,0.8)' }]}>
                {(san.giaTien * g).toLocaleString('vi-VN')}đ
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FORM THÔNG TIN LIÊN HỆ */}
        <Text style={styles.tieuDeMuc}>Thông tin liên hệ (Axios DTO)</Text>
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
              placeholder="Ví dụ: cần mượn 2 vợt, mở đèn trước 5 phút..."
              placeholderTextColor={MAU.phu}
            />
          </View>
        </View>

        {/* CHỌN PHƯƠNG THỨC THANH TOÁN */}
        <Text style={styles.tieuDeMuc}>Phương thức thanh toán</Text>
        {[
          { ma: 'tienMat' as PhuongThucThanhToan, nhan: 'Tiền mặt tại sân', icon: 'cash-outline', tag: '' },
          { ma: 'chuyenKhoan' as PhuongThucThanhToan, nhan: 'Chuyển khoản VietQR', icon: 'qr-code-outline', tag: 'Khuyên dùng' },
          { ma: 'momo' as PhuongThucThanhToan, nhan: 'Ví MoMo / Chuyển nhanh', icon: 'wallet-outline', tag: 'Tự động' },
        ].map((pt) => (
          <TouchableOpacity
            key={pt.ma}
            style={[styles.theTT, thanhToan === pt.ma && styles.theTTChon]}
            onPress={() => setThanhToan(pt.ma)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={pt.icon as any} size={18} color={thanhToan === pt.ma ? MAU.chinh : MAU.phu} />
              <View>
                <Text style={{ fontSize: 14, color: MAU.chu, fontWeight: '500' }}>{pt.nhan}</Text>
                {pt.tag ? <Text style={{ fontSize: 10, color: MAU.chinh, fontWeight: '700' }}>{pt.tag}</Text> : null}
              </View>
            </View>
            <View style={[styles.radio, thanhToan === pt.ma && styles.radioChon]}>
              {thanhToan === pt.ma && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Nút mở trực tiếp VietQR preview nếu chọn chuyển khoản */}
        {(thanhToan === 'chuyenKhoan' || thanhToan === 'momo') && (
          <TouchableOpacity
            style={styles.btnMoVietQR}
            onPress={() => setShowVietQRModal(true)}
          >
            <Ionicons name="qr-code" size={16} color="#00B884" />
            <Text style={styles.textMoVietQR}>Xem trước Mã VietQR Quét Ngay</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: MAU.phu }}>Tổng thanh toán</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: MAU.chinh }}>
            {tongTien.toLocaleString('vi-VN')}đ
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.nutXacNhan, isSubmitting && { opacity: 0.6 }]}
          disabled={isSubmitting}
          onPress={handleBookingSubmit}
        >
          <Text style={styles.chuNutXacNhan}>
            {thanhToan === 'tienMat' ? 'Xác nhận đặt sân' : 'Quét mã VietQR đặt sân'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL VIETQR CODE */}
      <VietQRCodeModal
        visible={showVietQRModal}
        onClose={() => setShowVietQRModal(false)}
        onConfirmPayment={executeCreateBooking}
        config={{
          bankId: 'MB',
          accountNo: '0912345678',
          accountName: 'DINH NGOC DAI',
          amount: tongTien,
          addInfo: `DAT SAN ${san.tenSan.toUpperCase().slice(0, 15)}`,
        }}
        tenSan={san.tenSan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MAU.nen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MAU.the,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: MAU.vien,
  },
  nutQuayLai: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: MAU.nen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tieuDe: { flex: 1, fontSize: 16, fontWeight: '700', color: MAU.chu, textAlign: 'center' },
  the: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MAU.the,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: MAU.vien,
    gap: 12,
    marginBottom: 20,
  },
  tenSan: { fontSize: 15, fontWeight: '700', color: MAU.chu, marginBottom: 3 },
  chuPhu: { fontSize: 13, color: MAU.phu },
  tieuDeMuc: { fontSize: 15, fontWeight: '700', color: MAU.chu, marginBottom: 10, marginTop: 4 },
  hangGio: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  nutGio: {
    flex: 1,
    backgroundColor: MAU.the,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MAU.vien,
  },
  nutGioChon: { backgroundColor: MAU.chinh, borderColor: MAU.chinh },
  chuGio: { fontSize: 15, fontWeight: '700', color: MAU.chu },
  giaGio: { fontSize: 10, color: MAU.phu, marginTop: 2 },
  khungForm: {
    backgroundColor: MAU.the,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: MAU.vien,
    marginBottom: 20,
  },
  nhanInput: { fontSize: 13, color: MAU.phu, fontWeight: '500', marginBottom: 6, marginTop: 10 },
  oInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MAU.nen,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: MAU.vien,
    height: 44,
  },
  input: { flex: 1, color: MAU.chu, fontSize: 14 },
  theTT: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MAU.the,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: MAU.vien,
  },
  theTTChon: { borderColor: MAU.chinh },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: MAU.vien,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioChon: { borderColor: MAU.chinh },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: MAU.chinh },
  btnMoVietQR: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E6F8F3',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#00B884',
  },
  textMoVietQR: { fontSize: 13, fontWeight: '700', color: '#00B884' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: MAU.the,
    borderTopWidth: 1,
    borderTopColor: MAU.vien,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nutXacNhan: { flex: 2, backgroundColor: MAU.chinh, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  chuNutXacNhan: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
