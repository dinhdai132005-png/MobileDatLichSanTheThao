// ============================================================
// CHI TIẾT SÂN - Hiển thị thông tin chi tiết & Lắng nghe Socket.io Real-time
// Tính năng: TypeScript, Chọn lịch, Socket.io live slot update, VietQR Quick Access
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { San, KhungGio } from '../types';
import { socketService } from '../services/socketService';
import { sanService } from '../services/sanService';
import { apiClient } from '../services/apiClient';

type RootStackParamList = {
  ChiTietSan: { san: San };
  DatLich: { san: San; ngay: string; gio: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChiTietSan'>;

const MAU = {
  nen: '#F4F6F9',
  the: '#FFFFFF',
  chinh: '#00B884',
  chu: '#1A1A2E',
  phu: '#6B7280',
  vien: '#E8EAED',
};

const DANH_SACH_THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

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
      ngayDayDu: d.toISOString().split('T')[0],
    });
  }
  return ds;
}

export default function ChiTietSanScreen({ navigation, route }: Props) {
  const { san } = route.params;

  const danhSachNgay = taoDanhSachNgay();
  const [ngayChon, setNgayChon] = useState<string>(danhSachNgay[0].ngayDayDu);
  const [gioChon, setGioChon] = useState<string | null>(null);

  // State quản lý danh sách khung giờ real-time
  const [khungGioList, setKhungGioList] = useState<KhungGio[]>(san.danhSachKhungGio || []);
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  // Lắng nghe kết nối Socket.io Real-time
  useEffect(() => {
    socketService.connect();

    // Đăng ký nhận thông báo slot_updated
    const unsubscribe = socketService.onSlotUpdate((payload) => {
      if (payload.sanId === san.id) {
        setKhungGioList((prevList) =>
          prevList.map((kg) =>
            kg.gio === payload.gio ? { ...kg, conTrong: payload.conTrong } : kg
          )
        );

        const statusText = payload.conTrong ? 'vừa trống trở lại' : 'vừa có người đặt';
        const msg = `⚡ Real-time: Khung giờ ${payload.gio} ${statusText}!`;
        setRealtimeNotification(msg);
        setTimeout(() => setRealtimeNotification(null), 4000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [san.id]);

  // Tải danh sách khung giờ thực tế từ MySQL Backend theo ngày chọn
  useEffect(() => {
    let isMounted = true;
    async function loadRealSlots() {
      try {
        const slots = await sanService.getSlotsTheoNgay(san.id, ngayChon);
        if (isMounted && slots && slots.length > 0) {
          setKhungGioList(
            slots.map((s) => ({
              gio: s.gio,
              conTrong: s.conTrong && !s.dangGiuCho && !s.daQua,
            }))
          );
        }
      } catch (err) {
        console.log('Chuyển sang fallback khung giờ local:', err);
      }
    }
    loadRealSlots();
    return () => {
      isMounted = false;
    };
  }, [san.id, ngayChon]);

  // T29 & CUS-10: Tải đánh giá của sân
  const [danhSachDanhGia, setDanhSachDanhGia] = useState<any[]>([]);
  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await apiClient.get<any>(`/courts/${san.id}/reviews`);
        if (res.data?.data?.items) {
          setDanhSachDanhGia(res.data.data.items);
        }
      } catch (err) {
        // reviews optional
      }
    }
    loadReviews();
  }, [san.id]);

  // Hàm test giả lập Socket event
  const handleTestSocketSimulation = () => {
    const availableSlots = khungGioList.filter((k) => k.conTrong);
    if (availableSlots.length > 0) {
      const targetSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
      socketService.simulateIncomingSlotUpdate(san.id, targetSlot.gio, false);
    } else {
      socketService.simulateIncomingSlotUpdate(san.id, '19:00', true);
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
        <Text style={styles.tieuDe} numberOfLines={1}>
          {san.tenSan}
        </Text>
        <View style={{ width: 36 }} />
      </SafeAreaView>

      {/* BANNER THÔNG BÁO SOCKET REAL-TIME */}
      {realtimeNotification && (
        <View style={styles.bannerRealtime}>
          <Ionicons name="flash" size={16} color="#FFFFFF" />
          <Text style={styles.textRealtime}>{realtimeNotification}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO EMOJI */}
        <View style={[styles.heroEmoji, { backgroundColor: san.mauSac + '18' }]}>
          <Text style={{ fontSize: 72 }}>{san.emoji}</Text>
          <View style={[styles.tagMon, { borderColor: san.mauSac }]}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: san.mauSac }}>
              {san.monTheThao}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* TÊN SÂN & GIÁ */}
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

          {/* CÁC THÔNG TIN NỔI BẬT */}
          <View style={styles.the}>
            <View style={styles.dongThongTin}>
              <Ionicons name="location-outline" size={15} color={MAU.phu} />
              <Text style={styles.chuThongTin}>{san.diaChi}</Text>
            </View>
            <View style={styles.dongThongTin}>
              <Ionicons name="time-outline" size={15} color={MAU.phu} />
              <Text style={styles.chuThongTin}>
                {san.gioMoCua} – {san.gioDongCua}
              </Text>
            </View>
            <View style={styles.dongThongTin}>
              <Ionicons name="navigate-outline" size={15} color={MAU.phu} />
              <Text style={styles.chuThongTin}>{san.khoangCach} từ vị trí của bạn</Text>
            </View>
          </View>

          {/* TIỆN ÍCH */}
          <Text style={styles.tieuDeMuc}>Tiện ích</Text>
          <View style={styles.khungTienIch}>
            {san.tienIch.map((t, i) => (
              <View key={i} style={styles.theTienIch}>
                <Ionicons name="checkmark-circle" size={14} color={MAU.chinh} />
                <Text style={styles.chuTienIch}>{t}</Text>
              </View>
            ))}
          </View>

          {/* CHỌN NGÀY THUÊ */}
          <Text style={styles.tieuDeMuc}>Chọn ngày</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {danhSachNgay.map((d) => (
              <TouchableOpacity
                key={d.ngayDayDu}
                onPress={() => setNgayChon(d.ngayDayDu)}
                style={[styles.theNgay, ngayChon === d.ngayDayDu && styles.theNgayChon]}
              >
                <Text style={[styles.chuThu, ngayChon === d.ngayDayDu && { color: '#fff' }]}>
                  {d.thu}
                </Text>
                <Text style={[styles.chuNgay, ngayChon === d.ngayDayDu && { color: '#fff' }]}>
                  {d.ngay}
                </Text>
                <Text style={[styles.chuThang, ngayChon === d.ngayDayDu && { color: '#fff' }]}>
                  T{d.thang}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* CHỌN KHUNG GIỜ REAL-TIME */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 }}>
            <Text style={styles.tieuDeMucNoMargin}>Chọn khung giờ (Socket Live)</Text>
            <TouchableOpacity style={styles.btnSimulate} onPress={handleTestSocketSimulation}>
              <Ionicons name="refresh-circle-outline" size={14} color="#3B82F6" />
              <Text style={styles.textSimulate}>Giả lập Socket</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.luoiGio}>
            {khungGioList.map((slot, i) => (
              <TouchableOpacity
                key={i}
                disabled={!slot.conTrong}
                onPress={() => setGioChon(slot.gio)}
                style={[
                  styles.nutGio,
                  !slot.conTrong && styles.nutGioHet,
                  gioChon === slot.gio && styles.nutGioChon,
                ]}
              >
                <Text
                  style={[
                    styles.chuGio,
                    !slot.conTrong && { color: '#CBD5E1' },
                    gioChon === slot.gio && { color: '#fff' },
                  ]}
                >
                  {slot.gio}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* T29 & CUS-10: ĐÁNH GIÁ TỪ KHÁCH HÀNG */}
          <Text style={styles.tieuDeMuc}>
            Đánh giá từ khách hàng ({san.soLuotDanhGia || danhSachDanhGia.length})
          </Text>
          {danhSachDanhGia.length === 0 ? (
            <Text style={{ fontSize: 13, color: MAU.phu, marginTop: 4 }}>
              Chưa có nhận xét nào. Hãy là người đầu tiên trải nghiệm và đánh giá sân này!
            </Text>
          ) : (
            <View style={{ gap: 10, marginTop: 8 }}>
              {danhSachDanhGia.slice(0, 5).map((item, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: MAU.vien,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: MAU.chu }}>
                      {item.tenNguoiDung || 'Khách hàng'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= item.soSao ? 'star' : 'star-outline'}
                          size={14}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                  </View>
                  {item.noiDungDanhGia ? (
                    <Text style={{ fontSize: 12.5, color: '#4B5563', marginTop: 4, lineHeight: 17 }}>
                      {item.noiDungDanhGia}
                    </Text>
                  ) : null}
                  <Text style={{ fontSize: 10.5, color: MAU.phu, marginTop: 4 }}>
                    {item.thoiGian ? String(item.thoiGian).split('T')[0] : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: MAU.phu }}>Giờ đã chọn</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: MAU.chu }}>
            {gioChon ?? '--:--'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.nutDat, (!gioChon || !san.conSan) && { opacity: 0.4 }]}
          disabled={!gioChon || !san.conSan}
          onPress={() => navigation.navigate('DatLich', { san, ngay: ngayChon, gio: gioChon! })}
        >
          <Text style={styles.chuNutDat}>Đặt sân ngay</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
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
  bannerRealtime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textRealtime: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', flex: 1 },
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
  the: {
    backgroundColor: MAU.the,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: MAU.vien,
    marginBottom: 16,
    gap: 10,
  },
  dongThongTin: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chuThongTin: { fontSize: 13, color: MAU.chu, flex: 1 },
  tieuDeMuc: { fontSize: 15, fontWeight: '700', color: MAU.chu, marginBottom: 10 },
  tieuDeMucNoMargin: { fontSize: 15, fontWeight: '700', color: MAU.chu },
  btnSimulate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  textSimulate: { fontSize: 11, color: '#3B82F6', fontWeight: '600' },
  khungTienIch: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  theTienIch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: MAU.the,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MAU.vien,
  },
  chuTienIch: { fontSize: 12, color: MAU.chu },
  theNgay: {
    alignItems: 'center',
    width: 52,
    height: 68,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: MAU.the,
    marginRight: 8,
    borderWidth: 1,
    borderColor: MAU.vien,
  },
  theNgayChon: { backgroundColor: MAU.chinh, borderColor: MAU.chinh },
  chuThu: { fontSize: 11, color: MAU.phu, fontWeight: '600' },
  chuNgay: { fontSize: 18, fontWeight: '800', color: MAU.chu, marginVertical: 2 },
  chuThang: { fontSize: 10, color: MAU.phu },
  luoiGio: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nutGio: {
    width: '22%',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: MAU.the,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MAU.vien,
  },
  nutGioHet: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  nutGioChon: { backgroundColor: MAU.chinh, borderColor: MAU.chinh },
  chuGio: { fontSize: 13, fontWeight: '600', color: MAU.chu },
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
  nutDat: {
    flex: 2,
    backgroundColor: MAU.chinh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  chuNutDat: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
