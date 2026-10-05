// ============================================================
// MÀN HÌNH HÓA ĐƠN & DỊCH VỤ PHÁT SINH (HoaDonScreen.tsx)
// Đáp ứng: plant/08-development-plan.md T28B, CUS-13; BR-25..BR-27
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HoaDonDonDat, DonDat } from '../types';
import { dichVuService } from '../services/dichVuService';

interface HoaDonScreenProps {
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
  xanhDuong: '#3B82F6',
};

export default function HoaDonScreen({ route, navigation }: HoaDonScreenProps) {
  const { donDatId, donDat } = route.params;

  const [hoaDon, setHoaDon] = useState<HoaDonDonDat | null>(null);
  const [dangTai, setDangTai] = useState<boolean>(true);
  const [dangLamMoi, setDangLamMoi] = useState<boolean>(false);
  const [dangHuyOrderId, setDangHuyOrderId] = useState<number | null>(null);

  const taiHoaDon = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setDangLamMoi(true);
      else setDangTai(true);

      const data = await dichVuService.getHoaDon(donDatId);
      setHoaDon(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải hóa đơn');
    } finally {
      setDangTai(false);
      setDangLamMoi(false);
    }
  }, [donDatId]);

  useEffect(() => {
    taiHoaDon();
  }, [taiHoaDon]);

  const xuLyHuyYeuCau = (orderId: number) => {
    Alert.alert(
      'Hủy yêu cầu dịch vụ',
      'Bạn có chắc chắn muốn hủy yêu cầu dịch vụ này? (Chỉ có thể hủy khi nhân viên chưa giao)',
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            try {
              setDangHuyOrderId(orderId);
              await dichVuService.huyYeuCauDichVu(donDatId, orderId);
              Alert.alert('Thành công', 'Đã hủy yêu cầu dịch vụ.');
              taiHoaDon(true);
            } catch (err: any) {
              Alert.alert('Không thể hủy', err.message || 'Lỗi khi hủy yêu cầu');
            } finally {
              setDangHuyOrderId(null);
            }
          },
        },
      ]
    );
  };

  const formatTien = (soTien: number) => {
    return (soTien || 0).toLocaleString('vi-VN') + ' ₫';
  };

  if (dangTai && !hoaDon) {
    return (
      <SafeAreaView style={styles.khungChinh}>
        <View style={styles.vungDangTai}>
          <ActivityIndicator size="large" color={MAU_SAC.chinh} />
          <Text style={styles.chuDangTai}>Đang tải bảng kê hóa đơn...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.khungChinh}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.nutBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={MAU_SAC.chuChinh} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.tieuDeHeader}>Hóa Đơn & Dịch Vụ</Text>
          <Text style={styles.phuDeHeader}>
            {hoaDon?.courtName || donDat?.tenSan || 'Sân Thể Thao'} · Đơn #{donDatId}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.nutLamMoi}
          onPress={() => taiHoaDon(true)}
          disabled={dangLamMoi}
        >
          <Ionicons name="refresh" size={20} color={MAU_SAC.chinh} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.noiDungCuon}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dangLamMoi}
            onRefresh={() => taiHoaDon(true)}
            colors={[MAU_SAC.chinh]}
          />
        }
      >
        {/* BẢNG TỔNG HỢP HÓA ĐƠN */}
        <View style={styles.theTongHop}>
          <Text style={styles.tieuDeTheTongHop}>Bảng kê chi phí thanh toán</Text>

          <View style={styles.dongChiPhi}>
            <Text style={styles.nhanChiPhi}>1. Tiền thuê sân</Text>
            <Text style={styles.giaTriChiPhi}>{formatTien(hoaDon?.courtAmount || 0)}</Text>
          </View>

          <View style={styles.dongChiPhi}>
            <Text style={styles.nhanChiPhi}>2. Dịch vụ & đồ uống (đã giao)</Text>
            <Text style={styles.giaTriChiPhi}>{formatTien(hoaDon?.serviceAmount || 0)}</Text>
          </View>

          <View style={styles.duongKe} />

          <View style={styles.dongChiPhi}>
            <Text style={styles.nhanTongHoaDon}>Tổng cộng hóa đơn</Text>
            <Text style={styles.giaTriTongHoaDon}>{formatTien(hoaDon?.grandTotal || 0)}</Text>
          </View>

          <View style={styles.dongChiPhi}>
            <Text style={styles.nhanChiPhi}>Đã thanh toán</Text>
            <Text style={[styles.giaTriChiPhi, { color: '#059669', fontWeight: '700' }]}>
              {formatTien(hoaDon?.paidAmount || 0)}
            </Text>
          </View>

          <View style={styles.dongChiPhi}>
            <Text style={styles.nhanChiPhi}>Còn lại cần thanh toán</Text>
            <Text
              style={[
                styles.giaTriChiPhi,
                {
                  color: (hoaDon?.balance || 0) > 0 ? '#DC2626' : '#059669',
                  fontWeight: '800',
                  fontSize: 16,
                },
              ]}
            >
              {formatTien(hoaDon?.balance || 0)}
            </Text>
          </View>

          {/* CẢNH BÁO ĐỒ THUÊ CHƯA TRẢ */}
          {(hoaDon?.unreturnedRentalsCount || 0) > 0 && (
            <View style={styles.canhBaoDoThue}>
              <Ionicons name="alert-circle" size={18} color="#D97706" />
              <Text style={styles.chuCanhBaoDoThue}>
                Bạn đang thuê {hoaDon?.unreturnedRentalsCount} dụng cụ chưa hoàn trả tại quầy.
              </Text>
            </View>
          )}
        </View>

        {/* NÚT GỌI THÊM DỊCH VỤ (NẾU ĐƠN CÒN HỢP LỆ) */}
        {hoaDon?.canOrderService && (
          <TouchableOpacity
            style={styles.nutGoiThemDichVu}
            onPress={() => navigation.navigate('GoiDichVu', { donDatId, donDat })}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.chuNutGoiThem}>Gọi thêm nước uống / Thuê đồ</Text>
          </TouchableOpacity>
        )}

        {/* DANH SÁCH CÁC LẦN GỌI DỊCH VỤ */}
        <Text style={styles.tieuDePhan}>Lịch sử gọi dịch vụ ({hoaDon?.serviceOrders?.length || 0})</Text>

        {(!hoaDon?.serviceOrders || hoaDon.serviceOrders.length === 0) ? (
          <View style={styles.vungTrong}>
            <Ionicons name="fast-food-outline" size={40} color="#D1D5DB" />
            <Text style={styles.chuVungTrong}>Chưa có dịch vụ hoặc đồ uống nào được gọi.</Text>
          </View>
        ) : (
          hoaDon.serviceOrders.map((order, idx) => {
            const isRequested = order.status === 'REQUESTED';
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED';

            return (
              <View key={order.id} style={styles.theYeuCau}>
                <View style={styles.hangDauYeuCau}>
                  <View>
                    <Text style={styles.maYeuCau}>Đợt gọi #{order.id}</Text>
                    <Text style={styles.thoiGianYeuCau}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.badgeTrangThai,
                      {
                        backgroundColor: isDelivered
                          ? '#D1FAE5'
                          : isRequested
                          ? '#FEF3C7'
                          : '#F3F4F6',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chuBadgeTrangThai,
                        {
                          color: isDelivered
                            ? '#059669'
                            : isRequested
                            ? '#D97706'
                            : '#6B7280',
                        },
                      ]}
                    >
                      {isDelivered ? '✓ Đã giao' : isRequested ? '⏳ Chờ giao' : 'Đã hủy'}
                    </Text>
                  </View>
                </View>

                {/* CÁC MÓN TRONG ĐỢT */}
                <View style={styles.danhSachMonTrongYeuCau}>
                  {order.items?.map((item) => (
                    <View key={item.id} style={styles.dongMon}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tenMon}>{item.serviceName}</Text>
                        <Text style={styles.chiTietGia}>
                          {item.quantity} {item.unit} × {formatTien(item.unitPrice)}
                        </Text>
                        {item.type === 'RENTAL' && isDelivered && (
                          <Text
                            style={[
                              styles.nhanDoThue,
                              { color: item.isReturned ? '#059669' : '#DC2626' },
                            ]}
                          >
                            {item.isReturned ? '✓ Đã trả đồ' : '⚠️ Chưa hoàn trả'}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.thanhTienMon}>{formatTien(item.amount)}</Text>
                    </View>
                  ))}
                </View>

                {/* NÚT HỦY KHI CHỜ GIAO */}
                {isRequested && (
                  <TouchableOpacity
                    style={styles.nutHuyYeuCau}
                    onPress={() => xuLyHuyYeuCau(order.id)}
                    disabled={dangHuyOrderId === order.id}
                  >
                    {dangHuyOrderId === order.id ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={14} color="#DC2626" />
                        <Text style={styles.chuNutHuyYeuCau}>Hủy yêu cầu này</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  khungChinh: { flex: 1, backgroundColor: MAU_SAC.nen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MAU_SAC.vien,
  },
  nutBack: { padding: 4 },
  nutLamMoi: { padding: 4 },
  tieuDeHeader: { fontSize: 16, fontWeight: '700', color: MAU_SAC.chuChinh },
  phuDeHeader: { fontSize: 12, color: MAU_SAC.chuMo, marginTop: 2 },
  noiDungCuon: { padding: 16 },
  vungDangTai: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  chuDangTai: { marginTop: 10, fontSize: 13, color: MAU_SAC.chuMo },
  theTongHop: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
    marginBottom: 16,
  },
  tieuDeTheTongHop: { fontSize: 15, fontWeight: '700', color: MAU_SAC.chuChinh, marginBottom: 14 },
  dongChiPhi: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nhanChiPhi: { fontSize: 13, color: MAU_SAC.chuMo },
  giaTriChiPhi: { fontSize: 13, fontWeight: '600', color: MAU_SAC.chuChinh },
  duongKe: { height: 1, backgroundColor: MAU_SAC.vien, marginVertical: 10 },
  nhanTongHoaDon: { fontSize: 15, fontWeight: '700', color: MAU_SAC.chuChinh },
  giaTriTongHoaDon: { fontSize: 17, fontWeight: '800', color: MAU_SAC.chinh },
  canhBaoDoThue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  chuCanhBaoDoThue: { fontSize: 12, color: '#B45309', fontWeight: '500', flex: 1 },
  nutGoiThemDichVu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: MAU_SAC.chinh,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  chuNutGoiThem: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  tieuDePhan: { fontSize: 15, fontWeight: '700', color: MAU_SAC.chuChinh, marginBottom: 10 },
  vungTrong: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
  },
  chuVungTrong: { fontSize: 13, color: MAU_SAC.chuMo, marginTop: 8 },
  theYeuCau: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
  },
  hangDauYeuCau: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  maYeuCau: { fontSize: 13, fontWeight: '700', color: MAU_SAC.chuChinh },
  thoiGianYeuCau: { fontSize: 11, color: MAU_SAC.chuMo, marginTop: 2 },
  badgeTrangThai: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chuBadgeTrangThai: { fontSize: 11, fontWeight: '700' },
  danhSachMonTrongYeuCau: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 },
  dongMon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tenMon: { fontSize: 13, fontWeight: '600', color: MAU_SAC.chuChinh },
  chiTietGia: { fontSize: 11, color: MAU_SAC.chuMo, marginTop: 2 },
  nhanDoThue: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  thanhTienMon: { fontSize: 13, fontWeight: '700', color: MAU_SAC.chuChinh },
  nutHuyYeuCau: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    marginTop: 6,
  },
  chuNutHuyYeuCau: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
});
