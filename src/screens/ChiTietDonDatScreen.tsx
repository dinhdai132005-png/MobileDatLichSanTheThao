// ============================================================
// MÀN HÌNH CHI TIẾT ĐƠN ĐẶT SÂN (ChiTietDonDatScreen.tsx)
// Chuẩn Plant / T27 (CUS-07, CUS-09) & T29 (CUS-10)
// Bao gồm: Đếm ngược giữ chỗ 30p, VietQR chuyển khoản, Hủy đơn > 6h, Đánh giá sân
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DonDat } from '../types';
import { donDatService } from '../services/donDatService';

interface ChiTietDonDatScreenProps {
  route: {
    params: {
      donDatId: string;
      donDat?: DonDat;
    };
  };
  navigation: any;
}

const MAU_SAC = {
  chinh: '#00B884',
  chinhNhat: 'rgba(0, 184, 132, 0.12)',
  nen: '#F8F9FA',
  the: '#FFFFFF',
  chuChinh: '#111827',
  chuMo: '#6B7280',
  vien: '#E5E7EB',
  nguyHiem: '#EF4444',
  canhBao: '#F59E0B',
  thanhCong: '#10B981',
};

export default function ChiTietDonDatScreen({ route, navigation }: ChiTietDonDatScreenProps) {
  const { donDatId, donDat: initialDonDat } = route.params;

  const [donDat, setDonDat] = useState<DonDat | null>(initialDonDat || null);
  const [dangTai, setDangTai] = useState<boolean>(!initialDonDat);
  const [thoiGianConLai, setThoiGianConLai] = useState<string>('');

  // State cho Modal Đánh Giá (T29 / CUS-10)
  const [hienModalDanhGia, setHienModalDanhGia] = useState<boolean>(false);
  const [soSao, setSoSao] = useState<number>(5);
  const [noiDungDanhGia, setNoiDungDanhGia] = useState<string>('');
  const [dangGuiDanhGia, setDangGuiDanhGia] = useState<boolean>(false);

  // State cho Modal Hủy đơn (CUS-09)
  const [hienModalHuy, setHienModalHuy] = useState<boolean>(false);
  const [lyDoHuy, setLyDoHuy] = useState<string>('');
  const [dangXuLyHuy, setDangXuLyHuy] = useState<boolean>(false);

  const taiChiTiet = async () => {
    try {
      const data = await donDatService.getChiTietDonDat(donDatId);
      setDonDat(data);
    } catch (err: any) {
      console.log('Lỗi tải chi tiết đơn:', err);
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiChiTiet();
  }, [donDatId]);

  // Bộ đếm ngược thời gian giữ chỗ 30 phút (BR-07 / SYS-01)
  useEffect(() => {
    if (!donDat?.expiresAt || donDat.trangThaiGoc !== 'PENDING') {
      setThoiGianConLai('');
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const expires = new Date(donDat.expiresAt!).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));

      if (diff <= 0) {
        setThoiGianConLai('00:00 (Hết hạn giữ chỗ)');
        clearInterval(interval);
        taiChiTiet();
      } else {
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setThoiGianConLai(
          `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [donDat?.expiresAt, donDat?.trangThaiGoc]);

  const xuLyHuyDon = async () => {
    if (!lyDoHuy.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập lý do bạn muốn hủy đơn.');
      return;
    }

    setDangXuLyHuy(true);
    try {
      await donDatService.huyDonDat(donDatId, lyDoHuy.trim());
      setHienModalHuy(false);
      Alert.alert('Thành công', 'Đơn đặt sân đã được hủy thành công.');
      taiChiTiet();
    } catch (err: any) {
      Alert.alert('Không thể hủy đơn', err.message || 'Lỗi khi hủy đơn');
    } finally {
      setDangXuLyHuy(false);
    }
  };

  const xuLyGuiDanhGia = async () => {
    setDangGuiDanhGia(true);
    try {
      await donDatService.danhGiaDonDat(donDatId, soSao, noiDungDanhGia.trim());
      setHienModalDanhGia(false);
      Alert.alert('Cảm ơn bạn', 'Đánh giá của bạn đã được ghi nhận!');
      taiChiTiet();
    } catch (err: any) {
      Alert.alert('Không thể gửi đánh giá', err.message || 'Lỗi khi đánh giá');
    } finally {
      setDangGuiDanhGia(false);
    }
  };

  const formatTien = (soTien: number) => {
    return soTien.toLocaleString('vi-VN') + ' ₫';
  };

  if (dangTai && !donDat) {
    return (
      <SafeAreaView style={styles.khungChinh}>
        <View style={styles.vungDangTai}>
          <ActivityIndicator size="large" color={MAU_SAC.chinh} />
          <Text style={styles.chuDangTai}>Đang tải chi tiết đơn đặt...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPending = donDat?.trangThaiGoc === 'PENDING';
  const isBankTransfer = donDat?.phuongThucThanhToan === 'chuyenKhoan';
  const isCompleted = donDat?.trangThaiGoc === 'COMPLETED';

  return (
    <SafeAreaView style={styles.khungChinh}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.nutBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={MAU_SAC.chuChinh} />
        </TouchableOpacity>
        <Text style={styles.tieuDeHeader}>Chi Tiết Đơn Đặt</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.noiDungCuon} showsVerticalScrollIndicator={false}>
        {/* BANNER ĐẾM NGƯỢC GIỮ CHỖ (NẾU ĐƠN PENDING) */}
        {isPending && isBankTransfer && (
          <View style={styles.bannerDemNguoc}>
            <View style={styles.hangDemNguoc}>
              <Ionicons name="timer-outline" size={22} color="#D97706" />
              <Text style={styles.chuDemNguoc}>
                Thời gian giữ chỗ còn: <Text style={styles.soDemNguoc}>{thoiGianConLai || '30:00'}</Text>
              </Text>
            </View>
            <Text style={styles.chuLuuY}>
              Vui lòng chuyển khoản thanh toán trước khi thời gian giữ chỗ kết thúc để đơn được xác nhận tự động.
            </Text>
          </View>
        )}

        {/* THẺ THÔNG TIN ĐƠN */}
        <View style={styles.theCard}>
          <View style={styles.theCardHeader}>
            <View>
              <Text style={styles.nhanMaDon}>Mã đơn đặt</Text>
              <Text style={styles.maDon}>{donDat?.maDonDat || donDat?.id}</Text>
            </View>
            <View
              style={[
                styles.badgeTrangThai,
                {
                  backgroundColor:
                    donDat?.trangThaiGoc === 'CONFIRMED'
                      ? '#D1FAE5'
                      : donDat?.trangThaiGoc === 'COMPLETED'
                      ? '#E0E7FF'
                      : donDat?.trangThaiGoc === 'PENDING'
                      ? '#FEF3C7'
                      : '#FEE2E2',
                },
              ]}
            >
              <Text
                style={[
                  styles.chuBadgeTrangThai,
                  {
                    color:
                      donDat?.trangThaiGoc === 'CONFIRMED'
                        ? '#059669'
                        : donDat?.trangThaiGoc === 'COMPLETED'
                        ? '#4338CA'
                        : donDat?.trangThaiGoc === 'PENDING'
                        ? '#D97706'
                        : '#DC2626',
                  },
                ]}
              >
                {donDat?.trangThaiGoc === 'CONFIRMED'
                  ? 'Đã xác nhận'
                  : donDat?.trangThaiGoc === 'COMPLETED'
                  ? 'Hoàn thành'
                  : donDat?.trangThaiGoc === 'PENDING'
                  ? 'Chờ thanh toán'
                  : 'Đã hủy / Hết hạn'}
              </Text>
            </View>
          </View>

          <View style={styles.duongKe} />

          {/* SÂN & MÔN */}
          <View style={styles.hangSan}>
            <Text style={styles.emojiSan}>{donDat?.emoji || '🏸'}</Text>
            <View>
              <Text style={styles.tenSan}>{donDat?.tenSan}</Text>
              <Text style={styles.monTheThao}>{donDat?.monTheThao}</Text>
            </View>
          </View>

          {/* CHI TIẾT THỜI GIAN */}
          <View style={styles.luoiThongTin}>
            <View style={styles.oThongTin}>
              <Text style={styles.nhanThongTin}>Ngày đặt sân</Text>
              <Text style={styles.giaTriThongTin}>{donDat?.ngayDat}</Text>
            </View>
            <View style={styles.oThongTin}>
              <Text style={styles.nhanThongTin}>Khung giờ</Text>
              <Text style={styles.giaTriThongTin}>
                {donDat?.gioDat} ({donDat?.soGioThue} giờ)
              </Text>
            </View>
            <View style={styles.oThongTin}>
              <Text style={styles.nhanThongTin}>Hình thức thanh toán</Text>
              <Text style={styles.giaTriThongTin}>
                {isBankTransfer ? 'Chuyển khoản VietQR' : 'Tiền mặt tại sân'}
              </Text>
            </View>
            <View style={styles.oThongTin}>
              <Text style={styles.nhanThongTin}>Trạng thái thanh toán</Text>
              <Text
                style={[
                  styles.giaTriThongTin,
                  {
                    color:
                      donDat?.trangThaiThanhToan === 'PAID'
                        ? '#10B981'
                        : donDat?.trangThaiThanhToan === 'REFUNDED'
                        ? '#6366F1'
                        : '#EF4444',
                    fontWeight: '700',
                  },
                ]}
              >
                {donDat?.trangThaiThanhToan === 'PAID'
                  ? 'Đã thanh toán'
                  : donDat?.trangThaiThanhToan === 'REFUNDED'
                  ? 'Đã hoàn tiền'
                  : 'Chưa thanh toán'}
              </Text>
            </View>
          </View>

          <View style={styles.duongKe} />

          <View style={styles.hangTongTien}>
            <Text style={styles.nhanTongTien}>Tổng thanh toán</Text>
            <Text style={styles.soTienTong}>{formatTien(donDat?.tongTien || 0)}</Text>
          </View>
        </View>

        {/* THÔNG TIN CHUYỂN KHOẢN VIETQR (NẾU CÓ) */}
        {donDat?.thongTinThanhToan && isPending && (
          <View style={styles.theVietQR}>
            <Text style={styles.tieuDeVietQR}>Mã VietQR Thanh Toán</Text>
            <Text style={styles.moTaVietQR}>
              Mở App Ngân hàng bất kỳ hoặc MoMo để quét mã VietQR chuyển khoản
            </Text>

            <View style={styles.khungAnhQR}>
              <Image
                source={{ uri: donDat.thongTinThanhToan.qrUrl }}
                style={styles.anhQR}
                resizeMode="contain"
              />
            </View>

            <View style={styles.bangNganHang}>
              <View style={styles.dongNganHang}>
                <Text style={styles.nhanNH}>Ngân hàng:</Text>
                <Text style={styles.giaTriNH}>{donDat.thongTinThanhToan.tenNganHang}</Text>
              </View>
              <View style={styles.dongNganHang}>
                <Text style={styles.nhanNH}>Số tài khoản:</Text>
                <Text style={[styles.giaTriNH, { color: MAU_SAC.chinh, fontWeight: '700' }]}>
                  {donDat.thongTinThanhToan.soTaiKhoan}
                </Text>
              </View>
              <View style={styles.dongNganHang}>
                <Text style={styles.nhanNH}>Chủ tài khoản:</Text>
                <Text style={styles.giaTriNH}>{donDat.thongTinThanhToan.tenChuTaiKhoan}</Text>
              </View>
              <View style={styles.dongNganHang}>
                <Text style={styles.nhanNH}>Số tiền:</Text>
                <Text style={[styles.giaTriNH, { color: MAU_SAC.chinh, fontWeight: '700' }]}>
                  {formatTien(donDat.thongTinThanhToan.soTien)}
                </Text>
              </View>
              <View style={styles.dongNganHang}>
                <Text style={styles.nhanNH}>Nội dung CK:</Text>
                <Text style={[styles.giaTriNH, { color: '#DC2626', fontWeight: '800' }]}>
                  {donDat.thongTinThanhToan.noiDungChuyenKhoan}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* NÚT ĐÁNH GIÁ (NẾU ĐƠN COMPLETED & CHƯA ĐÁNH GIÁ - T29) */}
        {isCompleted && !donDat?.daDanhGia && (
          <TouchableOpacity
            style={styles.nutDanhGia}
            onPress={() => setHienModalDanhGia(true)}
          >
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.chuNutDanhGia}>Đánh giá trải nghiệm sân (T29 / CUS-10)</Text>
          </TouchableOpacity>
        )}

        {/* NÚT HỦY ĐƠN (NẾU CÒN HẠN HỦY > 6H - BR-09) */}
        {donDat?.coTheHuy && (
          <TouchableOpacity
            style={styles.nutHuyDon}
            onPress={() => setHienModalHuy(true)}
          >
            <Ionicons name="close-circle-outline" size={18} color={MAU_SAC.nguyHiem} />
            <Text style={styles.chuNutHuy}>Hủy đơn đặt sân này</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* MODAL ĐÁNH GIÁ SÂN (T29 / CUS-10) */}
      <Modal visible={hienModalDanhGia} transparent animationType="fade">
        <View style={styles.lopPhuModal}>
          <View style={styles.hopModal}>
            <Text style={styles.tieuDeModal}>Đánh Giá Trải Nghiệm</Text>
            <Text style={styles.phuDeModal}>
              Bạn cảm thấy thế nào về sân {donDat?.tenSan}?
            </Text>

            {/* CHỌN SỐ SAO */}
            <View style={styles.hangChonSao}>
              {[1, 2, 3, 4, 5].map((sao) => (
                <TouchableOpacity key={sao} onPress={() => setSoSao(sao)}>
                  <Ionicons
                    name={sao <= soSao ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.oNhapDanhGia}
              placeholder="Chia sẻ nhận xét của bạn về chất lượng sân, ánh sáng, dịch vụ..."
              multiline
              numberOfLines={4}
              value={noiDungDanhGia}
              onChangeText={setNoiDungDanhGia}
            />

            <View style={styles.hangNutModal}>
              <TouchableOpacity
                style={styles.nutHuyModal}
                onPress={() => setHienModalDanhGia(false)}
              >
                <Text style={styles.chuNutHuyModal}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nutDongYModal}
                onPress={xuLyGuiDanhGia}
                disabled={dangGuiDanhGia}
              >
                {dangGuiDanhGia ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.chuNutDongYModal}>Gửi đánh giá</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL HỦY ĐƠN */}
      <Modal visible={hienModalHuy} transparent animationType="fade">
        <View style={styles.lopPhuModal}>
          <View style={styles.hopModal}>
            <Text style={styles.tieuDeModal}>Xác Nhận Hủy Đơn</Text>
            <Text style={styles.phuDeModal}>
              Bạn có chắc chắn muốn hủy đơn đặt này? Theo chính sách, nếu bạn đã thanh toán, hệ thống sẽ tự động tạo yêu cầu hoàn tiền (BR-10).
            </Text>

            <TextInput
              style={styles.oNhapLyDo}
              placeholder="Nhập lý do hủy đơn (bắt buộc)..."
              multiline
              numberOfLines={3}
              value={lyDoHuy}
              onChangeText={setLyDoHuy}
            />

            <View style={styles.hangNutModal}>
              <TouchableOpacity
                style={styles.nutHuyModal}
                onPress={() => setHienModalHuy(false)}
              >
                <Text style={styles.chuNutHuyModal}>Quay lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nutDongYModal, { backgroundColor: MAU_SAC.nguyHiem }]}
                onPress={xuLyHuyDon}
                disabled={dangXuLyHuy}
              >
                {dangXuLyHuy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.chuNutDongYModal}>Xác nhận hủy</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  khungChinh: {
    flex: 1,
    backgroundColor: MAU_SAC.nen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MAU_SAC.vien,
  },
  nutBack: {
    padding: 4,
  },
  tieuDeHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: MAU_SAC.chuChinh,
  },
  noiDungCuon: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerDemNguoc: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  hangDemNguoc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chuDemNguoc: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  soDemNguoc: {
    fontSize: 17,
    fontWeight: '900',
    color: '#B45309',
  },
  chuLuuY: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 6,
    lineHeight: 18,
  },
  theCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
    marginBottom: 16,
  },
  theCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nhanMaDon: {
    fontSize: 11,
    color: MAU_SAC.chuMo,
    textTransform: 'uppercase',
  },
  maDon: {
    fontSize: 18,
    fontWeight: '800',
    color: MAU_SAC.chinh,
    marginTop: 2,
  },
  badgeTrangThai: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chuBadgeTrangThai: {
    fontSize: 12,
    fontWeight: '700',
  },
  duongKe: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  hangSan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiSan: {
    fontSize: 32,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 12,
  },
  tenSan: {
    fontSize: 17,
    fontWeight: '700',
    color: MAU_SAC.chuChinh,
  },
  monTheThao: {
    fontSize: 13,
    color: MAU_SAC.chuMo,
    marginTop: 2,
  },
  luoiThongTin: {
    marginTop: 14,
    gap: 10,
  },
  oThongTin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nhanThongTin: {
    fontSize: 13,
    color: MAU_SAC.chuMo,
  },
  giaTriThongTin: {
    fontSize: 13,
    fontWeight: '600',
    color: MAU_SAC.chuChinh,
  },
  hangTongTien: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nhanTongTien: {
    fontSize: 14,
    fontWeight: '600',
    color: MAU_SAC.chuChinh,
  },
  soTienTong: {
    fontSize: 18,
    fontWeight: '900',
    color: MAU_SAC.chinh,
  },
  theVietQR: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
    marginBottom: 16,
    alignItems: 'center',
  },
  tieuDeVietQR: {
    fontSize: 16,
    fontWeight: '800',
    color: MAU_SAC.chuChinh,
  },
  moTaVietQR: {
    fontSize: 12,
    color: MAU_SAC.chuMo,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  khungAnhQR: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  anhQR: {
    width: 200,
    height: 200,
  },
  bangNganHang: {
    width: '100%',
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  dongNganHang: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nhanNH: {
    fontSize: 12.5,
    color: MAU_SAC.chuMo,
  },
  giaTriNH: {
    fontSize: 12.5,
    fontWeight: '600',
    color: MAU_SAC.chuChinh,
  },
  nutDanhGia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  chuNutDanhGia: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  nutHuyDon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  chuNutHuy: {
    fontSize: 14,
    fontWeight: '700',
    color: MAU_SAC.nguyHiem,
  },
  vungDangTai: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chuDangTai: {
    marginTop: 12,
    color: MAU_SAC.chuMo,
  },
  lopPhuModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  hopModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  tieuDeModal: {
    fontSize: 18,
    fontWeight: '800',
    color: MAU_SAC.chuChinh,
    textAlign: 'center',
  },
  phuDeModal: {
    fontSize: 13,
    color: MAU_SAC.chuMo,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  hangChonSao: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  oNhapDanhGia: {
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 16,
  },
  oNhapLyDo: {
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 16,
  },
  hangNutModal: {
    flexDirection: 'row',
    gap: 12,
  },
  nutHuyModal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
    alignItems: 'center',
  },
  chuNutHuyModal: {
    fontSize: 14,
    fontWeight: '600',
    color: MAU_SAC.chuMo,
  },
  nutDongYModal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: MAU_SAC.chinh,
    alignItems: 'center',
  },
  chuNutDongYModal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
