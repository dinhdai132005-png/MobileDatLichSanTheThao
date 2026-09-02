// ============================================================
// DANH SÁCH SÂN - Tìm kiếm và lọc sân thể thao
// Tính năng: tìm kiếm theo tên, lọc theo môn, sắp xếp
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DANH_SACH_SAN } from '../data/mockData';

// --- Bảng màu ---
const MAU = {
  nen: '#F4F6F9',
  the: '#FFFFFF',
  chinh: '#00B884',
  chu: '#1A1A2E',
  phu: '#6B7280',
  vien: '#E8EAED',
};

// Danh sách bộ lọc môn thể thao
const BO_LOC = ['Tất cả', 'Cầu Lông', 'Bóng Đá', 'Tennis', 'Bóng Rổ', 'Pickleball'];

export default function DanhSachSanScreen({ navigation }) {
  // --- State (trạng thái) ---
  const [tuKhoa, setTuKhoa] = useState('');         // từ khóa tìm kiếm
  const [monChon, setMonChon] = useState('Tất cả'); // môn thể thao đang lọc
  const [sapXep, setSapXep] = useState('khoangCach'); // tiêu chí sắp xếp

  // --- Lọc danh sách sân ---
  const danhSachDaLoc = DANH_SACH_SAN.filter((san) => {
    const khopTen = san.tenSan.toLowerCase().includes(tuKhoa.toLowerCase());
    const khopMon = monChon === 'Tất cả' || san.monTheThao === monChon;
    return khopTen && khopMon;
  });

  // --- Sắp xếp danh sách ---
  const danhSachHienThi = [...danhSachDaLoc].sort((a, b) => {
    if (sapXep === 'giaTien') return a.giaTien - b.giaTien;
    if (sapXep === 'danhGia') return b.danhGia - a.danhGia;
    // Mặc định: sắp theo khoảng cách gần nhất
    return parseFloat(a.khoangCach) - parseFloat(b.khoangCach);
  });

  // --- Render mỗi thẻ sân trong danh sách ---
  const renderTheSan = ({ item }) => (
    <TouchableOpacity
      style={styles.theSan}
      onPress={() => navigation.navigate('ChiTietSan', { san: item })}
    >
      {/* Emoji đại diện */}
      <View style={[styles.khungEmoji, { backgroundColor: item.mauSac + '18' }]}>
        <Text style={{ fontSize: 40 }}>{item.emoji}</Text>
      </View>

      {/* Thông tin sân */}
      <View style={styles.thongTin}>
        {/* Tên + trạng thái còn/hết sân */}
        <View style={styles.hangTen}>
          <Text style={styles.tenSan} numberOfLines={1}>{item.tenSan}</Text>
          <View style={[
            styles.nhanTrangThai,
            { backgroundColor: item.conSan ? '#DCFCE7' : '#FEE2E2' },
          ]}>
            <Text style={{
              fontSize: 10,
              fontWeight: '700',
              color: item.conSan ? '#16A34A' : '#DC2626',
            }}>
              {item.conSan ? 'Còn sân' : 'Hết sân'}
            </Text>
          </View>
        </View>

        <Text style={styles.diaChi} numberOfLines={1}>
          📍 {item.khoangCach} · {item.diaChi}
        </Text>
        <Text style={styles.gioMo}>🕐 {item.gioMoCua} – {item.gioDongCua}</Text>

        {/* Đánh giá và giá */}
        <View style={styles.hangDuoi}>
          <Text style={styles.danhGia}>⭐ {item.danhGia} ({item.soLuotDanhGia})</Text>
          <Text style={styles.giaTien}>
            {item.giaTien.toLocaleString('vi-VN')}đ/h
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MAU.the} />

      {/* === PHẦN HEADER: tìm kiếm + lọc === */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.tieuDe}>Tìm Sân Thể Thao</Text>
        <Text style={styles.soKetQua}>{danhSachHienThi.length} sân tìm thấy</Text>

        {/* Ô tìm kiếm */}
        <View style={styles.oTimKiem}>
          <Ionicons name="search-outline" size={18} color={MAU.phu} />
          <TextInput
            placeholder="Nhập tên sân cần tìm..."
            placeholderTextColor={MAU.phu}
            value={tuKhoa}
            onChangeText={setTuKhoa}
            style={styles.input}
          />
          {/* Nút xóa tìm kiếm */}
          {tuKhoa.length > 0 && (
            <TouchableOpacity onPress={() => setTuKhoa('')}>
              <Ionicons name="close-circle" size={18} color={MAU.phu} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bộ lọc môn thể thao */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}
        >
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {BO_LOC.map((mon) => (
              <TouchableOpacity
                key={mon}
                onPress={() => setMonChon(mon)}
                style={[styles.chip, monChon === mon && styles.chipDuocChon]}
              >
                <Text style={[
                  styles.chuChip,
                  monChon === mon && styles.chuChipDuocChon,
                ]}>
                  {mon}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Sắp xếp */}
        <View style={styles.hangSapXep}>
          <Text style={styles.chuSapXepNhan}>Sắp xếp:</Text>
          {[
            ['khoangCach', 'Gần nhất'],
            ['giaTien', 'Giá thấp'],
            ['danhGia', 'Đánh giá'],
          ].map(([ma, nhan]) => (
            <TouchableOpacity
              key={ma}
              onPress={() => setSapXep(ma)}
              style={[styles.nutSapXep, sapXep === ma && styles.nutSapXepChon]}
            >
              <Text style={[
                styles.chuSapXep,
                sapXep === ma && { color: MAU.chinh },
              ]}>
                {nhan}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* === PHẦN NỘI DUNG: Danh sách sân === */}
      <FlatList
        data={danhSachHienThi}
        keyExtractor={(item) => item.id}
        renderItem={renderTheSan}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        // Hiển thị khi không có kết quả
        ListEmptyComponent={
          <View style={styles.khongCoKetQua}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text style={styles.chuKhongCo}>Không tìm thấy sân nào</Text>
            <Text style={styles.goiYTimLai}>Thử thay đổi từ khóa hoặc bộ lọc</Text>
          </View>
        }
      />
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
    backgroundColor: MAU.the,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: MAU.vien,
  },
  tieuDe: {
    fontSize: 20,
    fontWeight: '700',
    color: MAU.chu,
    marginBottom: 2,
  },
  soKetQua: {
    fontSize: 13,
    color: MAU.phu,
    marginBottom: 12,
  },
  oTimKiem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MAU.nen,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: MAU.vien,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    color: MAU.chu,
    fontSize: 15,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: MAU.nen,
    borderWidth: 1,
    borderColor: MAU.vien,
  },
  chipDuocChon: {
    backgroundColor: MAU.chinh,
    borderColor: MAU.chinh,
  },
  chuChip: {
    fontSize: 13,
    color: MAU.phu,
    fontWeight: '500',
  },
  chuChipDuocChon: {
    color: '#fff',
  },
  hangSapXep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chuSapXepNhan: {
    fontSize: 12,
    color: MAU.phu,
  },
  nutSapXep: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: MAU.nen,
    borderWidth: 1,
    borderColor: MAU.vien,
  },
  nutSapXepChon: {
    borderColor: MAU.chinh,
  },
  chuSapXep: {
    fontSize: 12,
    color: MAU.phu,
    fontWeight: '500',
  },
  theSan: {
    backgroundColor: MAU.the,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MAU.vien,
    flexDirection: 'row',
  },
  khungEmoji: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thongTin: {
    flex: 1,
    padding: 12,
  },
  hangTen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tenSan: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: MAU.chu,
    marginRight: 6,
  },
  nhanTrangThai: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diaChi: {
    fontSize: 12,
    color: MAU.phu,
    marginBottom: 3,
  },
  gioMo: {
    fontSize: 12,
    color: MAU.phu,
    marginBottom: 8,
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
  khongCoKetQua: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  chuKhongCo: {
    fontSize: 16,
    fontWeight: '600',
    color: MAU.chu,
  },
  goiYTimLai: {
    fontSize: 13,
    color: MAU.phu,
  },
});
