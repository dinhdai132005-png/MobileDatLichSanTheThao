// ============================================================
// MÀN HÌNH GỌI DỊCH VỤ / ĐỒ UỐNG / THUÊ ĐỒ (GoiDichVuScreen.tsx)
// Đáp ứng: plant/08-development-plan.md T28A, CUS-11, CUS-12; BR-23..BR-25
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DichVuItem, DonDat } from '../types';
import { dichVuService } from '../services/dichVuService';

interface GoiDichVuScreenProps {
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

export default function GoiDichVuScreen({ route, navigation }: GoiDichVuScreenProps) {
  const { donDatId, donDat } = route.params;

  const [danhSachDichVu, setDanhSachDichVu] = useState<DichVuItem[]>([]);
  const [dangTai, setDangTai] = useState<boolean>(true);
  const [tabHienTai, setTabHienTai] = useState<'ALL' | 'DRINK' | 'RENTAL' | 'PACKAGE'>('ALL');
  const [gioHang, setGioHang] = useState<{ [serviceId: number]: number }>({});
  const [ghiChu, setGhiChu] = useState<string>('');
  const [dangGui, setDangGui] = useState<boolean>(false);

  useEffect(() => {
    taiDanhSachDichVu();
  }, []);

  const taiDanhSachDichVu = async () => {
    try {
      setDangTai(true);
      const data = await dichVuService.getDanhSachDichVu();
      setDanhSachDichVu(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải danh mục dịch vụ');
    } finally {
      setDangTai(false);
    }
  };

  const thayDoiSoLuong = (serviceId: number, thayDoi: number) => {
    setGioHang((prev) => {
      const soLuongCu = prev[serviceId] || 0;
      const soLuongMoi = Math.max(0, soLuongCu + thayDoi);
      if (soLuongMoi === 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return { ...prev, [serviceId]: soLuongMoi };
    });
  };

  // Tính tổng số lượng và tạm tính
  const tongSoLuong = Object.values(gioHang).reduce((sum, qty) => sum + qty, 0);
  const tongTamTinh = Object.entries(gioHang).reduce((sum, [serviceId, qty]) => {
    const item = danhSachDichVu.find((d) => d.id === Number(serviceId));
    return sum + (item ? item.unitPrice * qty : 0);
  }, 0);

  const xuLyGuiYeuCau = async () => {
    if (tongSoLuong === 0) {
      Alert.alert('Chưa chọn món', 'Vui lòng chọn ít nhất 1 dịch vụ hoặc đồ uống.');
      return;
    }

    const items = Object.entries(gioHang).map(([serviceId, quantity]) => ({
      serviceId: Number(serviceId),
      quantity,
    }));

    try {
      setDangGui(true);
      await dichVuService.goiDichVu(donDatId, items, ghiChu.trim() || undefined);
      Alert.alert(
        'Gọi dịch vụ thành công! 🎉',
        'Yêu cầu của bạn đã được gửi tới quầy nhân viên. Nhân viên sẽ chuẩn bị và giao ra sân cho bạn sớm nhất.',
        [
          {
            text: 'Xem hóa đơn',
            onPress: () => {
              navigation.replace('HoaDon', { donDatId, donDat });
            },
          },
          {
            text: 'Đóng',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Không thể gửi yêu cầu', err.message || 'Lỗi khi gọi dịch vụ');
    } finally {
      setDangGui(false);
    }
  };

  const danhSachLoc = danhSachDichVu.filter((d) => {
    if (tabHienTai === 'ALL') return true;
    return d.type === tabHienTai;
  });

  return (
    <SafeAreaView style={styles.khungChinh}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.nutBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={MAU_SAC.chuChinh} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.tieuDeHeader}>Gọi Dịch Vụ & Đồ Uống</Text>
          <Text style={styles.phuDeHeader}>
            {donDat?.tenSan ? `Phục vụ tại: ${donDat.tenSan}` : `Đơn #${donDatId}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.nutHoaDonTop}
          onPress={() => navigation.navigate('HoaDon', { donDatId, donDat })}
        >
          <Ionicons name="receipt-outline" size={22} color={MAU_SAC.chinh} />
        </TouchableOpacity>
      </View>

      {/* TABS LỌC */}
      <View style={styles.thanhTabs}>
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'DRINK', label: '🥤 Nước uống' },
          { key: 'RENTAL', label: '🏸 Thuê dụng cụ' },
          { key: 'PACKAGE', label: '🎉 Gói sự kiện' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.oTab,
              tabHienTai === tab.key && styles.oTabKichHoat,
            ]}
            onPress={() => setTabHienTai(tab.key as any)}
          >
            <Text
              style={[
                styles.chuTab,
                tabHienTai === tab.key && styles.chuTabKichHoat,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* DANH SÁCH MÓN */}
      {dangTai ? (
        <View style={styles.vungDangTai}>
          <ActivityIndicator size="large" color={MAU_SAC.chinh} />
          <Text style={styles.chuDangTai}>Đang tải thực đơn dịch vụ...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.noiDungCuon} showsVerticalScrollIndicator={false}>
          {danhSachLoc.map((item) => {
            const isOutOfStock = item.status === 'OUT_OF_STOCK' || item.status === 'INACTIVE';
            const soLuong = gioHang[item.id] || 0;

            return (
              <View
                key={item.id}
                style={[
                  styles.theMon,
                  isOutOfStock && styles.theMonHetHang,
                ]}
              >
                <View style={styles.iconMon}>
                  <Text style={{ fontSize: 28 }}>
                    {item.type === 'DRINK' ? '🧃' : item.type === 'RENTAL' ? '🏸' : '🎁'}
                  </Text>
                </View>

                <View style={styles.thongTinMon}>
                  <Text style={styles.tenMon}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.moTaMon} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <View style={styles.hangGia}>
                    <Text style={styles.giaMon}>
                      {item.unitPrice.toLocaleString('vi-VN')} ₫
                    </Text>
                    <Text style={styles.donViTinh}>/ {item.unit}</Text>
                  </View>
                </View>

                {/* BỘ CHỌN SỐ LƯỢNG */}
                {isOutOfStock ? (
                  <View style={styles.badgeHetHang}>
                    <Text style={styles.chuHetHang}>Tạm hết</Text>
                  </View>
                ) : (
                  <View style={styles.boChonSoLuong}>
                    {soLuong > 0 ? (
                      <>
                        <TouchableOpacity
                          style={styles.nutTangGiam}
                          onPress={() => thayDoiSoLuong(item.id, -1)}
                        >
                          <Ionicons name="remove" size={16} color={MAU_SAC.chuChinh} />
                        </TouchableOpacity>
                        <Text style={styles.soLuong}>{soLuong}</Text>
                      </>
                    ) : null}
                    <TouchableOpacity
                      style={[styles.nutTangGiam, styles.nutCong]}
                      onPress={() => thayDoiSoLuong(item.id, 1)}
                    >
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {/* Ô NHẬP GHI CHÚ */}
          <View style={styles.khungGhiChu}>
            <Text style={styles.tieuDeGhiChu}>Ghi chú cho nhân viên</Text>
            <TextInput
              style={styles.oNhapGhiChu}
              placeholder="Ví dụ: Mang 2 chai nước lạnh ra sân số 2..."
              placeholderTextColor="#9CA3AF"
              value={ghiChu}
              onChangeText={setGhiChu}
              multiline
              numberOfLines={2}
            />
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* THANH TỔNG KẾT & GỬI YÊU CẦU Ở ĐÁY */}
      {tongSoLuong > 0 && (
        <View style={styles.thanhDayTongKet}>
          <View>
            <Text style={styles.chuNhanTamTinh}>
              Đã chọn: <Text style={{ fontWeight: '700', color: MAU_SAC.chuChinh }}>{tongSoLuong} món</Text>
            </Text>
            <Text style={styles.soTienTamTinh}>{tongTamTinh.toLocaleString('vi-VN')} ₫</Text>
          </View>
          <TouchableOpacity
            style={styles.nutGuiYeuCau}
            onPress={xuLyGuiYeuCau}
            disabled={dangGui}
          >
            {dangGui ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#FFFFFF" />
                <Text style={styles.chuNutGui}>Gửi yêu cầu</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  nutHoaDonTop: { padding: 6, backgroundColor: MAU_SAC.chinhNhat, borderRadius: 20 },
  tieuDeHeader: { fontSize: 16, fontWeight: '700', color: MAU_SAC.chuChinh },
  phuDeHeader: { fontSize: 12, color: MAU_SAC.chuMo, marginTop: 2 },
  thanhTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MAU_SAC.vien,
  },
  oTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    backgroundColor: '#F3F4F6',
  },
  oTabKichHoat: { backgroundColor: MAU_SAC.chinh },
  chuTab: { fontSize: 12, fontWeight: '600', color: MAU_SAC.chuMo },
  chuTabKichHoat: { color: '#FFFFFF' },
  noiDungCuon: { padding: 16 },
  vungDangTai: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  chuDangTai: { marginTop: 10, fontSize: 13, color: MAU_SAC.chuMo },
  theMon: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
  },
  theMonHetHang: { opacity: 0.6, backgroundColor: '#F9FAFB' },
  iconMon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thongTinMon: { flex: 1 },
  tenMon: { fontSize: 14, fontWeight: '700', color: MAU_SAC.chuChinh },
  moTaMon: { fontSize: 11, color: MAU_SAC.chuMo, marginTop: 2 },
  hangGia: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  giaMon: { fontSize: 14, fontWeight: '700', color: MAU_SAC.chinh },
  donViTinh: { fontSize: 11, color: MAU_SAC.chuMo, marginLeft: 4 },
  badgeHetHang: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  chuHetHang: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  boChonSoLuong: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nutTangGiam: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutCong: { backgroundColor: MAU_SAC.chinh },
  soLuong: { fontSize: 14, fontWeight: '700', minWidth: 18, textAlign: 'center' },
  khungGhiChu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
  },
  tieuDeGhiChu: { fontSize: 13, fontWeight: '600', color: MAU_SAC.chuChinh, marginBottom: 6 },
  oNhapGhiChu: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    color: MAU_SAC.chuChinh,
    borderWidth: 1,
    borderColor: MAU_SAC.vien,
    textAlignVertical: 'top',
  },
  thanhDayTongKet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: MAU_SAC.vien,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
  },
  chuNhanTamTinh: { fontSize: 11, color: MAU_SAC.chuMo },
  soTienTamTinh: { fontSize: 17, fontWeight: '800', color: MAU_SAC.chinh },
  nutGuiYeuCau: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MAU_SAC.chinh,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chuNutGui: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
