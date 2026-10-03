// ============================================================
// MÀN HÌNH LỊCH ĐẶT SÂN (LichDatScreen.tsx) — CHUẨN PLANT / T28 (CUS-08)
// 3 Tab: Sắp tới / Hoàn thành / Đã hủy
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DonDat, TrangThaiDonDat } from '../types';
import { donDatService } from '../services/donDatService';

interface LichDatScreenProps {
  navigation: any;
}

type TabLoc = 'sapToi' | 'hoanThanh' | 'daHuy';

const MAU_SAC = {
  chinh: '#00B884',
  chinhNhat: 'rgba(0, 184, 132, 0.12)',
  nen: '#F8F9FA',
  the: '#FFFFFF',
  chuChinh: '#111827',
  chuMo: '#6B7280',
  vien: '#E5E7EB',
  canhBao: '#F59E0B',
  thanhCong: '#10B981',
  nguyHiem: '#EF4444',
  xanhDuong: '#3B82F6',
};

export default function LichDatScreen({ navigation }: LichDatScreenProps) {
  const [tabHienTai, setTabHienTai] = useState<TabLoc>('sapToi');
  const [danhSachDon, setDanhSachDon] = useState<DonDat[]>([]);
  const [dangTai, setDangTai] = useState<boolean>(true);
  const [lamMoi, setLamMoi] = useState<boolean>(false);

  const taiDuLieu = useCallback(async () => {
    try {
      const ketQua = await donDatService.getLichSuDatSan();
      setDanhSachDon(ketQua);
    } catch (error) {
      console.log('Lỗi tải lịch sử đặt sân:', error);
    } finally {
      setDangTai(false);
      setLamMoi(false);
    }
  }, []);

  useEffect(() => {
    taiDuLieu();
    const unsubscribe = navigation.addListener('focus', () => {
      taiDuLieu();
    });
    return unsubscribe;
  }, [navigation, taiDuLieu]);

  const onRefresh = () => {
    setLamMoi(true);
    taiDuLieu();
  };

  // Lọc đơn theo tab hiện tại
  const danhSachLoc = danhSachDon.filter((item) => {
    if (tabHienTai === 'sapToi') return item.trangThai === 'sapToi';
    if (tabHienTai === 'hoanThanh') return item.trangThai === 'hoanThanh';
    if (tabHienTai === 'daHuy') return item.trangThai === 'daHuy';
    return true;
  });

  const formatTien = (soTien: number) => {
    return soTien.toLocaleString('vi-VN') + ' ₫';
  };

  const layBadgeTrangThai = (don: DonDat) => {
    const raw = don.trangThaiGoc;
    if (raw === 'PENDING') {
      return { nhan: 'Chờ thanh toán', bg: '#FEF3C7', color: '#D97706' };
    }
    if (raw === 'CONFIRMED') {
      return { nhan: 'Đã xác nhận', bg: '#D1FAE5', color: '#059669' };
    }
    if (raw === 'COMPLETED') {
      return { nhan: 'Hoàn thành', bg: '#E0E7FF', color: '#4338CA' };
    }
    if (raw === 'EXPIRED') {
      return { nhan: 'Hết hạn', bg: '#F3F4F6', color: '#6B7280' };
    }
    if (raw === 'NO_SHOW') {
      return { nhan: 'Vắng mặt', bg: '#FEE2E2', color: '#B91C1C' };
    }
    if (don.trangThai === 'daHuy') {
      return { nhan: 'Đã hủy', bg: '#FEE2E2', color: '#DC2626' };
    }
    return { nhan: 'Đã xác nhận', bg: '#D1FAE5', color: '#059669' };
  };

  const renderDonItem = ({ item }: { item: DonDat }) => {
    const badge = layBadgeTrangThai(item);

    return (
      <TouchableOpacity
        style={styles.theDon}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ChiTietDonDat', { donDatId: item.id, donDat: item })}
      >
        <View style={styles.theDonHeader}>
          <View style={styles.thongTinSanNho}>
            <Text style={styles.emojiSan}>{item.emoji || '🏸'}</Text>
            <View>
              <Text style={styles.tenSan}>{item.tenSan}</Text>
              <Text style={styles.monTheThao}>{item.monTheThao}</Text>
            </View>
          </View>
          <View style={[styles.badgeContainer, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.nhan}</Text>
          </View>
        </View>

        <View style={styles.duongKe} />

        <View style={styles.theDonBody}>
          <View style={styles.dongThongTin}>
            <Ionicons name="calendar-outline" size={15} color={MAU_SAC.chuMo} />
            <Text style={styles.chuThongTin}>{item.ngayDat}</Text>
          </View>
          <View style={styles.dongThongTin}>
            <Ionicons name="time-outline" size={15} color={MAU_SAC.chuMo} />
            <Text style={styles.chuThongTin}>
              {item.gioDat} ({item.soGioThue} giờ)
            </Text>
          </View>
        </View>

        <View style={styles.theDonFooter}>
          <View>
            <Text style={styles.nhanTongTien}>Tổng thanh toán</Text>
            <Text style={styles.soTien}>{formatTien(item.tongTien)}</Text>
          </View>
          <View style={styles.nutChiTiet}>
            <Text style={styles.chuNutChiTiet}>Chi tiết</Text>
            <Ionicons name="chevron-forward" size={14} color={MAU_SAC.chinh} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.khungChinh}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.tieuDeHeader}>Lịch Đặt Của Tôi</Text>
        <Text style={styles.phuDeHeader}>Quản lý lịch trình và đơn đặt sân</Text>
      </View>

      {/* 3 TABS LỌC (CUS-08) */}
      <View style={styles.thanhTab}>
        <TouchableOpacity
          style={[styles.tabItem, tabHienTai === 'sapToi' && styles.tabItemKichHoat]}
          onPress={() => setTabHienTai('sapToi')}
        >
          <Text style={[styles.chuTab, tabHienTai === 'sapToi' && styles.chuTabKichHoat]}>Sắp tới</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, tabHienTai === 'hoanThanh' && styles.tabItemKichHoat]}
          onPress={() => setTabHienTai('hoanThanh')}
        >
          <Text style={[styles.chuTab, tabHienTai === 'hoanThanh' && styles.chuTabKichHoat]}>Hoàn thành</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, tabHienTai === 'daHuy' && styles.tabItemKichHoat]}
          onPress={() => setTabHienTai('daHuy')}
        >
          <Text style={[styles.chuTab, tabHienTai === 'daHuy' && styles.chuTabKichHoat]}>Đã hủy</Text>
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH ĐƠN */}
      {dangTai ? (
        <View style={styles.vungDangTai}>
          <ActivityIndicator size="large" color={MAU_SAC.chinh} />
          <Text style={styles.chuDangTai}>Đang tải lịch đặt sân...</Text>
        </View>
      ) : (
        <FlatList
          data={danhSachLoc}
          keyExtractor={(item) => item.id}
          renderItem={renderDonItem}
          contentContainerStyle={styles.danhSachNoiDung}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={lamMoi} onRefresh={onRefresh} colors={[MAU_SAC.chinh]} />
          }
          ListEmptyComponent={
            <View style={styles.vungTrong}>
              <Ionicons name="calendar-clear-outline" size={54} color="#D1D5DB" />
              <Text style={styles.tieuDeTrong}>Chưa có đơn đặt nào</Text>
              <Text style={styles.moTaTrong}>
                {tabHienTai === 'sapToi'
                  ? 'Bạn hiện không có lịch đặt sân nào sắp tới.'
                  : tabHienTai === 'hoanThanh'
                  ? 'Chưa có đơn đặt nào đã hoàn thành.'
                  : 'Không có đơn đặt nào bị hủy.'}
              </Text>
              {tabHienTai === 'sapToi' && (
                <TouchableOpacity
                  style={styles.nutDatNgay}
                  onPress={() => navigation.navigate('DanhSachSanTab')}
                >
                  <Text style={styles.chuNutDatNgay}>Khám phá đặt sân ngay</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  khungChinh: {
    flex: 1,
    backgroundColor: MAU_SAC.nen,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: MAU_SAC.vien,
  },
  tieuDeHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: MAU_SAC.chuChinh,
  },
  phuDeHeader: {
    fontSize: 13,
    color: MAU_SAC.chuMo,
    marginTop: 2,
  },
  thanhTab: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MAU_SAC.vien,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemKichHoat: {
    backgroundColor: MAU_SAC.chinhNhat,
  },
  chuTab: {
    fontSize: 14,
    fontWeight: '600',
    color: MAU_SAC.chuMo,
  },
  chuTabKichHoat: {
    color: MAU_SAC.chinh,
    fontWeight: '700',
  },
  danhSachNoiDung: {
    padding: 16,
    paddingBottom: 24,
  },
  theDon: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  theDonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thongTinSanNho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  emojiSan: {
    fontSize: 26,
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tenSan: {
    fontSize: 16,
    fontWeight: '700',
    color: MAU_SAC.chuChinh,
  },
  monTheThao: {
    fontSize: 12,
    color: MAU_SAC.chuMo,
    marginTop: 1,
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  duongKe: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  theDonBody: {
    flexDirection: 'row',
    gap: 20,
  },
  dongThongTin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chuThongTin: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  theDonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nhanTongTien: {
    fontSize: 11,
    color: MAU_SAC.chuMo,
  },
  soTien: {
    fontSize: 15,
    fontWeight: '800',
    color: MAU_SAC.chinh,
    marginTop: 1,
  },
  nutChiTiet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  chuNutChiTiet: {
    fontSize: 13,
    fontWeight: '600',
    color: MAU_SAC.chinh,
  },
  vungDangTai: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  chuDangTai: {
    marginTop: 12,
    color: MAU_SAC.chuMo,
    fontSize: 14,
  },
  vungTrong: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  tieuDeTrong: {
    fontSize: 17,
    fontWeight: '700',
    color: MAU_SAC.chuChinh,
    marginTop: 14,
  },
  moTaTrong: {
    fontSize: 13,
    color: MAU_SAC.chuMo,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  nutDatNgay: {
    backgroundColor: MAU_SAC.chinh,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 18,
  },
  chuNutDatNgay: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
