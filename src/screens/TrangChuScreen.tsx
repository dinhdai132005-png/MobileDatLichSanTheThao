// ============================================================
// TRANG CHỦ - Màn hình chính ứng dụng Đặt Lịch Sân Thể Thao
// Tích hợp: TypeScript & Axios API Service (sanService)
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { San, MonTheThao } from '../types';
import { sanService } from '../services/sanService';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const MAU = {
  nen: '#F4F6F9',
  the: '#FFFFFF',
  chinh: '#00B884',
  chu: '#1A1A2E',
  phu: '#6B7280',
  vien: '#E8EAED',
};

export default function TrangChuScreen({ navigation }: Props) {
  const [monTheThaoList, setMonTheThaoList] = useState<MonTheThao[]>([]);
  const [sanConTrong, setSanConTrong] = useState<San[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [mons, sans] = await Promise.all([
          sanService.getDanhSachMonTheThao(),
          sanService.getDanhSachSan(),
        ]);
        setMonTheThaoList(mons);
        setSanConTrong(sans.filter((s) => s.conSan).slice(0, 4));
      } catch (err) {
        console.error('Lỗi tải dữ liệu TrangChu:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MAU.the} />

      {/* HEADER */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View>
          <Text style={styles.tenApp}>Đặt Lịch Sân</Text>
          <Text style={styles.moTaApp}>Rèn luyện sức khỏe & thi đấu mỗi ngày</Text>
        </View>
        <TouchableOpacity
          style={styles.nutTimSan}
          onPress={() => navigation.navigate('DanhSachSanTab')}
        >
          <Ionicons name="search" size={18} color={MAU.chinh} />
          <Text style={styles.chuTimSan}>Tìm sân</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={MAU.chinh} />
          <Text style={{ marginTop: 10, color: MAU.phu, fontSize: 13 }}>Đang cập nhật danh sách sân...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* MÔN THỂ THAO */}
          <Text style={styles.tieuDeMuc}>Môn thể thao</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cuonNgang}
          >
            {monTheThaoList.map((mon) => (
              <TouchableOpacity
                key={mon.id}
                style={styles.theMonTheThao}
                onPress={() => navigation.navigate('DanhSachSanTab')}
              >
                <View style={[styles.khungEmoji, { backgroundColor: mon.mauSac + '20' }]}>
                  <Text style={{ fontSize: 26 }}>{mon.bieuTuongEmoji}</Text>
                </View>
                <Text style={styles.tenMon}>{mon.ten}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* SÂN CÒN TRỐNG HÔM NAY */}
          <View style={styles.hangTieuDe}>
            <Text style={styles.tieuDeMuc}>Sân còn trống hôm nay</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DanhSachSanTab')}>
              <Text style={styles.xemTatCa}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          {sanConTrong.map((san) => (
            <TouchableOpacity
              key={san.id}
              style={styles.theSan}
              onPress={() => navigation.navigate('ChiTietSan', { san })}
            >
              <View style={[styles.khungEmojiSan, { backgroundColor: san.mauSac + '18' }]}>
                <Text style={{ fontSize: 36 }}>{san.emoji}</Text>
              </View>

              <View style={styles.thongTinSan}>
                <Text style={styles.tenSan} numberOfLines={1}>{san.tenSan}</Text>

                <Text style={styles.diaChi} numberOfLines={1}>
                  📍 {san.khoangCach} · {san.diaChi}
                </Text>

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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MAU.nen },
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
  tenApp: { fontSize: 20, fontWeight: '700', color: MAU.chu },
  moTaApp: { fontSize: 12, color: MAU.phu, marginTop: 2 },
  nutTimSan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MAU.chinh + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chuTimSan: { fontSize: 14, fontWeight: '600', color: MAU.chinh },
  tieuDeMuc: { fontSize: 16, fontWeight: '700', color: MAU.chu, marginTop: 20, marginBottom: 12, paddingHorizontal: 16 },
  hangTieuDe: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 },
  xemTatCa: { fontSize: 13, color: MAU.chinh, fontWeight: '600', marginTop: 20, marginBottom: 12 },
  cuonNgang: { paddingLeft: 16, paddingRight: 8, paddingBottom: 4 },
  theMonTheThao: { alignItems: 'center', marginRight: 14, width: 68 },
  khungEmoji: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  tenMon: { fontSize: 12, color: MAU.chu, textAlign: 'center', fontWeight: '500' },
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
  khungEmojiSan: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  thongTinSan: { flex: 1, padding: 12, justifyContent: 'space-between' },
  tenSan: { fontSize: 14, fontWeight: '700', color: MAU.chu, marginBottom: 4 },
  diaChi: { fontSize: 12, color: MAU.phu, marginBottom: 6 },
  hangDuoi: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  danhGia: { fontSize: 12, color: MAU.chu, fontWeight: '500' },
  giaTien: { fontSize: 14, fontWeight: '700', color: MAU.chinh },
});
