// ============================================================
// TRANG CHỦ - Màn hình đầu tiên người dùng thấy khi mở app
// Hiển thị: danh mục môn thể thao + sân còn trống hôm nay
// ============================================================

import React from 'react';
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
import { DANH_SACH_MON_THE_THAO, DANH_SACH_SAN } from '../data/mockData';

// --- Bảng màu chính của ứng dụng ---
const MAU = {
  nen: '#F4F6F9',      // nền xám nhạt
  the: '#FFFFFF',      // nền thẻ trắng
  chinh: '#00B884',    // màu xanh lá chủ đạo
  chu: '#1A1A2E',      // chữ đậm
  phu: '#6B7280',      // chữ phụ/mờ
  vien: '#E8EAED',     // viền nhạt
};

export default function TrangChuScreen({ navigation }) {
  // Lọc ra 3 sân đang còn trống để hiển thị nổi bật
  const sanConTrong = DANH_SACH_SAN.filter((san) => san.conSan).slice(0, 3);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MAU.the} />

      {/* Header: tên app + nút tìm sân */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View>
          <Text style={styles.tenApp}>Đặt Lịch Sân</Text>
          <Text style={styles.moTaApp}>Thể thao dễ dàng mỗi ngày</Text>
        </View>
        {/* Nút tìm kiếm nhanh */}
        <TouchableOpacity
          style={styles.nutTimSan}
          onPress={() => navigation.navigate('DanhSachSanTab')}
        >
          <Ionicons name="search" size={18} color={MAU.chinh} />
          <Text style={styles.chuTimSan}>Tìm sân</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* === PHẦN 1: Danh mục môn thể thao === */}
        <Text style={styles.tieuDeMuc}>Môn thể thao</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cuonNgang}
        >
          {DANH_SACH_MON_THE_THAO.map((mon) => (
            <TouchableOpacity
              key={mon.id}
              style={styles.theMonTheThao}
              onPress={() => navigation.navigate('DanhSachSanTab')}
            >
              {/* Khung emoji môn thể thao */}
              <View style={[styles.khungEmoji, { backgroundColor: mon.mauSac + '20' }]}>
                <Text style={{ fontSize: 26 }}>{mon.biểuTượngEmoji}</Text>
              </View>
              <Text style={styles.tenMon}>{mon.ten}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* === PHẦN 2: Sân còn trống hôm nay === */}
        <View style={styles.hangTieuDe}>
          <Text style={styles.tieuDeMuc}>Sân còn trống hôm nay</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DanhSachSanTab')}>
            <Text style={styles.xemTatCa}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách 3 sân nổi bật */}
        {sanConTrong.map((san) => (
          <TouchableOpacity
            key={san.id}
            style={styles.theSan}
            onPress={() => navigation.navigate('ChiTietSan', { san })}
          >
            {/* Emoji đại diện môn */}
            <View style={[styles.khungEmojiSan, { backgroundColor: san.mauSac + '18' }]}>
              <Text style={{ fontSize: 36 }}>{san.emoji}</Text>
            </View>

            {/* Thông tin sân */}
            <View style={styles.thongTinSan}>
              <Text style={styles.tenSan} numberOfLines={1}>{san.tenSan}</Text>

              <Text style={styles.diaChi} numberOfLines={1}>
                📍 {san.khoangCach} · {san.diaChi}
              </Text>

              {/* Đánh giá và giá tiền */}
              <View style={styles.hangDuoi}>
                <Text style={styles.danhGia}>⭐ {san.danhGia}</Text>
                <Text style={styles.giaTien}>
                  {san.giaTien.toLocaleString('vi-VN')}đ/h
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MAU.nen,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: MAU.the,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: MAU.vien,
  },
  tenApp: {
    fontSize: 20,
    fontWeight: '700',
    color: MAU.chu,
  },
  moTaApp: {
    fontSize: 12,
    color: MAU.phu,
    marginTop: 2,
  },
  nutTimSan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MAU.chinh + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chuTimSan: {
    fontSize: 14,
    fontWeight: '600',
    color: MAU.chinh,
  },
  tieuDeMuc: {
    fontSize: 16,
    fontWeight: '700',
    color: MAU.chu,
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  hangTieuDe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  xemTatCa: {
    fontSize: 13,
    color: MAU.chinh,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  cuonNgang: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 4,
  },
  theMonTheThao: {
    alignItems: 'center',
    marginRight: 14,
    width: 68,
  },
  khungEmoji: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tenMon: {
    fontSize: 12,
    color: MAU.chu,
    textAlign: 'center',
    fontWeight: '500',
  },
  theSan: {
    flexDirection: 'row',
    backgroundColor: MAU.the,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MAU.vien,
    overflow: 'hidden',
  },
  khungEmojiSan: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thongTinSan: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  tenSan: {
    fontSize: 14,
    fontWeight: '700',
    color: MAU.chu,
    marginBottom: 4,
  },
  diaChi: {
    fontSize: 12,
    color: MAU.phu,
    marginBottom: 6,
  },
  hangDuoi: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  danhGia: {
    fontSize: 12,
    color: MAU.chu,
    fontWeight: '500',
  },
  giaTien: {
    fontSize: 14,
    fontWeight: '700',
    color: MAU.chinh,
  },
});
