// ============================================================
// TRANG CHỦ - Màn hình chính ứng dụng Đặt Lịch Sân Thể Thao
// Bao gồm:
// 1. Phân hệ Danh mục môn thể thao & Sân trống
// 2. Phân hệ Trọn gói đặt tiệc & sự kiện (Package Deals)
// 3. Phân hệ Sự kiện & Giải đấu của sân (Venue Events)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  Linking,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { San, MonTheThao, SuKienSan, GoiTiecSuKien } from '../types';
import { sanService } from '../services/sanService';
import { suKienService } from '../services/suKienService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const MAU = {
  nen: '#F8FAFC',
  the: '#FFFFFF',
  chinh: '#00B884',
  chinhDam: '#009568',
  chu: '#0F172A',
  phu: '#64748B',
  vien: '#E2E8F0',
  cam: '#EA580C',
  camNhat: '#FFF7ED',
  do: '#EF4444',
  doNhat: '#FEF2F2',
  xanhDuong: '#3B82F6',
  xanhNhat: '#EFF6FF',
  tim: '#6366F1',
  timNhat: '#EEF2FF',
  vang: '#F59E0B',
};

export default function TrangChuScreen({ navigation }: Props) {
  const [monTheThaoList, setMonTheThaoList] = useState<MonTheThao[]>([]);
  const [sanConTrong, setSanConTrong] = useState<San[]>([]);
  const [danhSachGoiTiec, setDanhSachGoiTiec] = useState<GoiTiecSuKien[]>([]);
  const [danhSachSuKien, setDanhSachSuKien] = useState<SuKienSan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modal State
  const [selectedGoiTiec, setSelectedGoiTiec] = useState<GoiTiecSuKien | null>(null);
  const [selectedSuKien, setSelectedSuKien] = useState<SuKienSan | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [mons, sans, goiTiecs, suKiens] = await Promise.all([
        sanService.getDanhSachMonTheThao(),
        sanService.getDanhSachSan(),
        suKienService.getDanhSachGoiTiec(),
        suKienService.getDanhSachSuKien(),
      ]);
      setMonTheThaoList(mons);
      setSanConTrong(sans.filter((s) => s.conSan).slice(0, 4));
      setDanhSachGoiTiec(goiTiecs);
      setDanhSachSuKien(suKiens);
    } catch (err) {
      console.error('Lỗi tải dữ liệu TrangChu:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLienHeHotline = (soDienThoai: string) => {
    Linking.openURL(`tel:${soDienThoai}`).catch(() => {
      Alert.alert('Thông báo', `Vui lòng liên hệ ban tổ chức theo số điện thoại: ${soDienThoai}`);
    });
  };

  const handleDangKySuKien = (suKien: SuKienSan) => {
    Alert.alert(
      'Đăng ký tham gia',
      `Bạn muốn đăng ký tham gia "${suKien.tieuDe}"?\n\nPhí tham gia: ${
        suKien.phiThamGia > 0 ? suKien.phiThamGia.toLocaleString('vi-VN') + ' đ' : 'Miễn phí'
      }\n\nLiên hệ hotline: ${suKien.hotlineLh}`,
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Gọi Hotline Ngay',
          style: 'default',
          onPress: () => handleLienHeHotline(suKien.hotlineLh),
        },
      ]
    );
  };

  const handleChonDatGoiTiec = (_goi: GoiTiecSuKien) => {
    setSelectedGoiTiec(null);
    // Chuyển sang màn hình danh sách khu vực sự kiện & tiệc
    navigation.navigate('DanhSachSanTab', { category: 'EVENT' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MAU.the} />

      {/* HEADER */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.hangLogo}>
            <View style={styles.chamXanh} />
            <Text style={styles.tenApp}>SPORTS & EVENTS</Text>
          </View>
          <Text style={styles.moTaApp}>Tổ hợp thể thao & Tiệc sự kiện 24/7</Text>
        </View>
        <TouchableOpacity
          style={styles.nutTimSan}
          onPress={() => navigation.navigate('DanhSachSanTab')}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={17} color={MAU.chinh} />
          <Text style={styles.chuTimSan}>Tìm sân</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={MAU.chinh} />
          <Text style={styles.chuLoading}>Đang cập nhật sự kiện & dịch vụ mới nhất...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[MAU.chinh]} />}
        >
          {/* PHẦN 1: MÔN THỂ THAO TRẢI NGHIỆM */}
          <View style={styles.khoiMuc}>
            <Text style={styles.tieuDeMuc}>Môn thể thao trải nghiệm</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cuonNgangMon}
            >
              {monTheThaoList.map((mon) => (
                <TouchableOpacity
                  key={mon.id}
                  style={styles.theMonTheThao}
                  onPress={() => navigation.navigate('DanhSachSanTab')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.khungEmoji, { backgroundColor: mon.mauSac + '18' }]}>
                    <Text style={{ fontSize: 26 }}>{mon.bieuTuongEmoji}</Text>
                  </View>
                  <Text style={styles.tenMon} numberOfLines={1}>
                    {mon.ten}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ============================================================ */}
          {/* PHẦN 2: TRỌN GÓI ĐẶT TIỆC & SỰ KIỆN (YÊU CẦU MỚI ĐỒNG BỘ) */}
          {/* ============================================================ */}
          <View style={styles.khoiMuc}>
            <View style={styles.hangTieuDe}>
              <View>
                <View style={styles.hangBadge}>
                  <Text style={styles.iconMuc}>✨</Text>
                  <Text style={styles.tieuDeMucLienKet}>Trọn Gói Đặt Tiệc & Sự Kiện</Text>
                </View>
                <Text style={styles.phuDeMuc}>Ẩm thực, BBQ sân vườn & decor trọn vẹn mọi khoảnh khắc</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('DanhSachSanTab', { category: 'EVENT' })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.chuXemThem}>Xem khu tiệc →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cuonNgangGoiTiec}
            >
              {danhSachGoiTiec.map((goi) => (
                <TouchableOpacity
                  key={goi.id}
                  style={styles.theGoiTiec}
                  onPress={() => setSelectedGoiTiec(goi)}
                  activeOpacity={0.9}
                >
                  <View style={styles.khungAnhGoi}>
                    <Image
                      source={{
                        uri:
                          goi.imageUrl ||
                          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
                      }}
                      style={styles.anhGoiTiec}
                      resizeMode="cover"
                    />
                    <View style={styles.badgeGoiTronGoi}>
                      <Ionicons name="sparkles" size={12} color="#FFF" style={{ marginRight: 3 }} />
                      <Text style={styles.chuBadgeTronGoi}>TRỌN GÓI</Text>
                    </View>
                    <View style={styles.badgeSucChua}>
                      <Ionicons name="people-outline" size={12} color="#0F172A" style={{ marginRight: 4 }} />
                      <Text style={styles.chuBadgeSucChua}>{goi.sucChua || '15 - 30 khách'}</Text>
                    </View>
                  </View>

                  <View style={styles.thongTinGoiTiec}>
                    <Text style={styles.tenGoiTiec} numberOfLines={2}>
                      {goi.name}
                    </Text>
                    <Text style={styles.moTaGoiTiec} numberOfLines={2}>
                      {goi.description}
                    </Text>

                    {/* Tiện ích nổi bật preview */}
                    <View style={styles.hangTienIchNho}>
                      {(goi.tienIch || ['Phục vụ trọn gói', 'Bàn ghế setup', 'Loa âm thanh']).slice(0, 2).map((ti, idx) => (
                        <View key={idx} style={styles.chipTienIch}>
                          <Ionicons name="checkmark-circle" size={12} color={MAU.chinh} style={{ marginRight: 3 }} />
                          <Text style={styles.chuChipTienIch} numberOfLines={1}>
                            {ti}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.hangGiaVaNut}>
                      <View>
                        <Text style={styles.nhanGiaGoi}>Giá trọn gói từ</Text>
                        <Text style={styles.giaGoiTiec}>
                          {goi.price.toLocaleString('vi-VN')}
                          <Text style={styles.donViGoi}> đ/{goi.unit}</Text>
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.nutChiTietGoi}
                        onPress={() => setSelectedGoiTiec(goi)}
                      >
                        <Text style={styles.chuNutChiTietGoi}>Chi tiết</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ============================================================ */}
          {/* PHẦN 3: SỰ KIỆN & GIẢI ĐẤU CỦA SÂN (YÊU CẦU MỚI ĐỒNG BỘ) */}
          {/* ============================================================ */}
          <View style={styles.khoiMuc}>
            <View style={styles.hangTieuDe}>
              <View>
                <View style={styles.hangBadge}>
                  <Text style={styles.iconMuc}>🏆</Text>
                  <Text style={styles.tieuDeMucLienKet}>Sự Kiện & Giải Đấu Tại Sân</Text>
                </View>
                <Text style={styles.phuDeMuc}>Giao lưu, thi đấu cọ xát & bùng nổ đam mê thể thao</Text>
              </View>
            </View>

            <View style={styles.danhSachSuKienDoc}>
              {danhSachSuKien.map((sk) => {
                const isHappening = sk.trangThai === 'HAPPENING';
                const isUpcoming = sk.trangThai === 'UPCOMING';

                return (
                  <TouchableOpacity
                    key={sk.id}
                    style={styles.theSuKien}
                    onPress={() => setSelectedSuKien(sk)}
                    activeOpacity={0.92}
                  >
                    <View style={styles.khungPoster}>
                      <Image
                        source={{
                          uri:
                            sk.hinhAnh ||
                            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
                        }}
                        style={styles.posterSuKien}
                        resizeMode="cover"
                      />
                      <View
                        style={[
                          styles.badgeTrangThaiSuKien,
                          isHappening && styles.badgeHappening,
                          isUpcoming && styles.badgeUpcoming,
                        ]}
                      >
                        <View
                          style={[
                            styles.chamTrangThai,
                            { backgroundColor: isHappening ? '#DC2626' : isUpcoming ? '#059669' : '#6B7280' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.chuBadgeTrangThai,
                            { color: isHappening ? '#991B1B' : isUpcoming ? '#065F46' : '#374151' },
                          ]}
                        >
                          {isHappening ? 'ĐANG DIỄN RA' : isUpcoming ? 'SẮP DIỄN RA' : 'ĐÃ KẾT THÚC'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.noiDungSuKien}>
                      <Text style={styles.tieuDeSuKien} numberOfLines={2}>
                        {sk.tieuDe}
                      </Text>

                      <View style={styles.hangThongTinSuKien}>
                        <Ionicons name="calendar-outline" size={14} color={MAU.phu} style={{ marginRight: 6 }} />
                        <Text style={styles.chuThongTinSuKien} numberOfLines={1}>
                          {sk.ngayBatDau ? new Date(sk.ngayBatDau).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : 'Liên hệ ban tổ chức'}
                        </Text>
                      </View>

                      <View style={styles.hangThongTinSuKien}>
                        <Ionicons name="location-outline" size={14} color={MAU.phu} style={{ marginRight: 6 }} />
                        <Text style={styles.chuThongTinSuKien} numberOfLines={1}>
                          {sk.diaDiem}
                        </Text>
                      </View>

                      {sk.phanThuong ? (
                        <View style={styles.hopPhanThuong}>
                          <Ionicons name="trophy" size={14} color="#D97706" style={{ marginRight: 6 }} />
                          <Text style={styles.chuPhanThuong} numberOfLines={1}>
                            {sk.phanThuong}
                          </Text>
                        </View>
                      ) : null}

                      <Text style={styles.moTaNganSuKien} numberOfLines={2}>
                        {sk.moTaNgan}
                      </Text>

                      <View style={styles.hangChanSuKien}>
                        <View>
                          <Text style={styles.nhanPhi}>Lệ phí tham gia</Text>
                          <Text style={styles.chuPhiThamGia}>
                            {sk.phiThamGia > 0
                              ? `${sk.phiThamGia.toLocaleString('vi-VN')} đ/VĐV`
                              : 'HOÀN TOÀN MIỄN PHÍ'}
                          </Text>
                        </View>

                        <View style={styles.nhomNutHanhDongSuKien}>
                          <TouchableOpacity
                            style={styles.nutChiTietSK}
                            onPress={() => setSelectedSuKien(sk)}
                          >
                            <Text style={styles.chuNutChiTietSK}>Chi tiết</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.nutDangKySK}
                            onPress={() => handleDangKySuKien(sk)}
                          >
                            <Text style={styles.chuNutDangKySK}>Đăng ký</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ============================================================ */}
          {/* PHẦN 4: SÂN CÒN TRỐNG HÔM NAY */}
          {/* ============================================================ */}
          <View style={[styles.khoiMuc, { marginBottom: 32 }]}>
            <View style={styles.hangTieuDe}>
              <View>
                <Text style={styles.tieuDeMucLienKet}>Sân còn trống hôm nay</Text>
                <Text style={styles.phuDeMuc}>Đặt ngay khung giờ đẹp nhất để luyện tập</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('DanhSachSanTab')}>
                <Text style={styles.chuXemThem}>Xem tất cả →</Text>
              </TouchableOpacity>
            </View>

            {sanConTrong.map((san) => (
              <TouchableOpacity
                key={san.id}
                style={styles.theSan}
                onPress={() => navigation.navigate('ChiTietSan', { san })}
                activeOpacity={0.88}
              >
                <View style={[styles.khungEmojiSan, { backgroundColor: (san.mauSac || '#00B884') + '15' }]}>
                  <Text style={{ fontSize: 34 }}>{san.emoji || '⚽'}</Text>
                </View>

                <View style={styles.thongTinSan}>
                  <View>
                    <Text style={styles.tenSan} numberOfLines={1}>
                      {san.tenSan}
                    </Text>
                    <Text style={styles.diaChi} numberOfLines={1}>
                      📍 {san.khoangCach} · {san.diaChi}
                    </Text>
                  </View>

                  <View style={styles.hangDuoiSan}>
                    <View style={styles.hangSao}>
                      <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: 3 }} />
                      <Text style={styles.danhGia}>{san.danhGia}</Text>
                      <Text style={styles.soLuotDanhGia}>({san.soLuotDanhGia || 12})</Text>
                    </View>
                    <Text style={styles.giaTien}>
                      {san.giaTien.toLocaleString('vi-VN')}
                      <Text style={styles.donViGio}> đ/h</Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ============================================================ */}
      {/* MODAL CHI TIẾT GÓI TIỆC & SỰ KIỆN */}
      {/* ============================================================ */}
      <Modal
        visible={!!selectedGoiTiec}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedGoiTiec(null)}
      >
        <View style={styles.overlayModal}>
          <View style={styles.hopModal}>
            {selectedGoiTiec ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.khungAnhModal}>
                  <Image
                    source={{
                      uri:
                        selectedGoiTiec.imageUrl ||
                        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
                    }}
                    style={styles.anhModal}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.nutDongModal}
                    onPress={() => setSelectedGoiTiec(null)}
                  >
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <View style={styles.badgeModalTronGoi}>
                    <Text style={styles.chuBadgeTronGoi}>GÓI TIỆC TRỌN GÓI</Text>
                  </View>
                </View>

                <View style={styles.noiDungModal}>
                  <Text style={styles.tenGoiModal}>{selectedGoiTiec.name}</Text>

                  <View style={styles.hopGiaModal}>
                    <View>
                      <Text style={styles.nhanGiaModal}>Giá trọn gói ưu đãi</Text>
                      <Text style={styles.giaTienModal}>
                        {selectedGoiTiec.price.toLocaleString('vi-VN')}
                        <Text style={styles.donViModal}> đ/{selectedGoiTiec.unit}</Text>
                      </Text>
                    </View>
                    <View style={styles.badgeSucChuaModal}>
                      <Ionicons name="people" size={14} color="#4F46E5" style={{ marginRight: 4 }} />
                      <Text style={styles.chuSucChuaModal}>{selectedGoiTiec.sucChua}</Text>
                    </View>
                  </View>

                  <Text style={styles.moTaChiTietModal}>{selectedGoiTiec.description}</Text>

                  {/* THỰC ĐƠN TIỆC */}
                  {selectedGoiTiec.thucDon && selectedGoiTiec.thucDon.length > 0 && (
                    <View style={styles.phanMucModal}>
                      <Text style={styles.tieuDePhanModal}>🍽️ Thực đơn món ăn thịnh soạn</Text>
                      {selectedGoiTiec.thucDon.map((mon, index) => (
                        <View key={index} style={styles.hangMonAn}>
                          <Ionicons name="restaurant-outline" size={15} color={MAU.cam} style={{ marginRight: 8 }} />
                          <Text style={styles.tenMonAn}>{mon}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* TIỆN ÍCH KÈM THEO */}
                  {selectedGoiTiec.tienIch && selectedGoiTiec.tienIch.length > 0 && (
                    <View style={styles.phanMucModal}>
                      <Text style={styles.tieuDePhanModal}>🎁 Tiện ích & Trang thiết bị đi kèm</Text>
                      {selectedGoiTiec.tienIch.map((ti, index) => (
                        <View key={index} style={styles.hangMonAn}>
                          <Ionicons name="checkmark-circle" size={16} color={MAU.chinh} style={{ marginRight: 8 }} />
                          <Text style={styles.tenMonAn}>{ti}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* NÚT HÀNH ĐỘNG */}
                  <View style={styles.nhomNutModal}>
                    <TouchableOpacity
                      style={styles.nutChinhModal}
                      onPress={() => handleChonDatGoiTiec(selectedGoiTiec)}
                    >
                      <Ionicons name="calendar" size={18} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.chuNutChinhModal}>Chọn Khu Vực Đặt Tiệc Ngay</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.nutPhuModal}
                      onPress={() => handleLienHeHotline('0900000001')}
                    >
                      <Ionicons name="call-outline" size={16} color={MAU.chinh} style={{ marginRight: 6 }} />
                      <Text style={styles.chuNutPhuModal}>Tư vấn Hotline (0900 000 001)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL CHI TIẾT SỰ KIỆN CỦA SÂN */}
      {/* ============================================================ */}
      <Modal
        visible={!!selectedSuKien}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedSuKien(null)}
      >
        <View style={styles.overlayModal}>
          <View style={styles.hopModal}>
            {selectedSuKien ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.khungAnhModal}>
                  <Image
                    source={{
                      uri:
                        selectedSuKien.hinhAnh ||
                        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
                    }}
                    style={styles.anhModal}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.nutDongModal}
                    onPress={() => setSelectedSuKien(null)}
                  >
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <View
                    style={[
                      styles.badgeModalTronGoi,
                      {
                        backgroundColor:
                          selectedSuKien.trangThai === 'HAPPENING'
                            ? '#DC2626'
                            : selectedSuKien.trangThai === 'UPCOMING'
                            ? '#059669'
                            : '#64748B',
                      },
                    ]}
                  >
                    <Text style={styles.chuBadgeTronGoi}>
                      {selectedSuKien.trangThai === 'HAPPENING'
                        ? '🔥 ĐANG DIỄN RA'
                        : selectedSuKien.trangThai === 'UPCOMING'
                        ? '⚡ SẮP DIỄN RA'
                        : 'ĐÃ KẾT THÚC'}
                    </Text>
                  </View>
                </View>

                <View style={styles.noiDungModal}>
                  <Text style={styles.tenGoiModal}>{selectedSuKien.tieuDe}</Text>

                  {/* BẢNG THÔNG TIN SỰ KIỆN */}
                  <View style={styles.bangThongTinSuKien}>
                    <View style={styles.hangThongTinModal}>
                      <Ionicons name="time-outline" size={17} color={MAU.chinh} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nhanTieuDeThongTin}>Thời gian diễn ra</Text>
                        <Text style={styles.giaTriThongTin}>
                          {selectedSuKien.ngayBatDau
                            ? `${new Date(selectedSuKien.ngayBatDau).toLocaleString('vi-VN', {
                                weekday: 'short',
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })} - ${new Date(selectedSuKien.ngayKetThuc).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`
                            : 'Theo thông báo BTC'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.hangThongTinModal}>
                      <Ionicons name="location-outline" size={17} color={MAU.chinh} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nhanTieuDeThongTin}>Địa điểm tổ chức</Text>
                        <Text style={styles.giaTriThongTin}>
                          {selectedSuKien.diaDiem}
                          {selectedSuKien.sanTen ? ` (${selectedSuKien.sanTen})` : ''}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.hangThongTinModal}>
                      <Ionicons name="cash-outline" size={17} color={MAU.cam} style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nhanTieuDeThongTin}>Lệ phí tham gia</Text>
                        <Text style={[styles.giaTriThongTin, { color: MAU.cam, fontWeight: '700' }]}>
                          {selectedSuKien.phiThamGia > 0
                            ? `${selectedSuKien.phiThamGia.toLocaleString('vi-VN')} đ / VĐV`
                            : 'HOÀN TOÀN MIỄN PHÍ'}
                        </Text>
                      </View>
                    </View>

                    {selectedSuKien.phanThuong ? (
                      <View style={styles.hangThongTinModal}>
                        <Ionicons name="trophy-outline" size={17} color="#D97706" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.nhanTieuDeThongTin}>Cơ cấu giải thưởng</Text>
                          <Text style={[styles.giaTriThongTin, { color: '#B45309', fontWeight: '700' }]}>
                            {selectedSuKien.phanThuong}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* THỂ LỆ & NỘI DUNG CHI TIẾT */}
                  <View style={styles.phanMucModal}>
                    <Text style={styles.tieuDePhanModal}>📝 Thể lệ & Chi tiết chương trình</Text>
                    <Text style={styles.doanVanChiTiet}>{selectedSuKien.noiDung || selectedSuKien.moTaNgan}</Text>
                  </View>

                  {/* BAN TỔ CHỨC & HOTLINE */}
                  <View style={styles.hopHotlineModal}>
                    <Ionicons name="headset" size={22} color={MAU.chinh} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nhanHotline}>Hotline Ban Tổ Chức</Text>
                      <Text style={styles.soHotline}>{selectedSuKien.hotlineLh}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.nutGoiNhanh}
                      onPress={() => handleLienHeHotline(selectedSuKien.hotlineLh)}
                    >
                      <Text style={styles.chuNutGoiNhanh}>Gọi ngay</Text>
                    </TouchableOpacity>
                  </View>

                  {/* NÚT HÀNH ĐỘNG */}
                  <View style={styles.nhomNutModal}>
                    <TouchableOpacity
                      style={styles.nutChinhModal}
                      onPress={() => {
                        const sk = selectedSuKien;
                        setSelectedSuKien(null);
                        handleDangKySuKien(sk);
                      }}
                    >
                      <Ionicons name="flag" size={18} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.chuNutChinhModal}>Đăng Ký Tham Gia Sự Kiện</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.nutPhuModal}
                      onPress={() => setSelectedSuKien(null)}
                    >
                      <Text style={styles.chuNutPhuModal}>Đóng</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
  hangLogo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chamXanh: { width: 8, height: 8, borderRadius: 4, backgroundColor: MAU.chinh },
  tenApp: { fontSize: 18, fontWeight: '800', color: MAU.chu, letterSpacing: 0.5 },
  moTaApp: { fontSize: 11, color: MAU.phu, marginTop: 2 },
  nutTimSan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MAU.chinh + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chuTimSan: { fontSize: 13, fontWeight: '700', color: MAU.chinh },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  chuLoading: { marginTop: 12, color: MAU.phu, fontSize: 13, textAlign: 'center' },

  khoiMuc: { marginTop: 18 },
  tieuDeMuc: { fontSize: 16, fontWeight: '800', color: MAU.chu, paddingHorizontal: 16, marginBottom: 12 },
  hangTieuDe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  hangBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconMuc: { fontSize: 18 },
  tieuDeMucLienKet: { fontSize: 16, fontWeight: '800', color: MAU.chu },
  phuDeMuc: { fontSize: 12, color: MAU.phu, marginTop: 2, maxWidth: SCREEN_WIDTH * 0.65 },
  chuXemThem: { fontSize: 13, color: MAU.chinh, fontWeight: '700', paddingTop: 2 },

  // MÔN THỂ THAO
  cuonNgangMon: { paddingLeft: 16, paddingRight: 8, paddingBottom: 4 },
  theMonTheThao: { alignItems: 'center', marginRight: 14, width: 68 },
  khungEmoji: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  tenMon: { fontSize: 12, color: MAU.chu, textAlign: 'center', fontWeight: '600' },

  // PHẦN 1: GÓI TIỆC TRỌN GÓI
  cuonNgangGoiTiec: { paddingLeft: 16, paddingRight: 8, paddingBottom: 6 },
  theGoiTiec: {
    width: 270,
    backgroundColor: MAU.the,
    borderRadius: 16,
    marginRight: 14,
    borderWidth: 1,
    borderColor: MAU.vien,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  khungAnhGoi: { width: '100%', height: 140, position: 'relative' },
  anhGoiTiec: { width: '100%', height: '100%' },
  badgeGoiTronGoi: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chuBadgeTronGoi: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  badgeSucChua: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chuBadgeSucChua: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  thongTinGoiTiec: { padding: 12 },
  tenGoiTiec: { fontSize: 15, fontWeight: '800', color: MAU.chu, marginBottom: 4, minHeight: 40 },
  moTaGoiTiec: { fontSize: 12, color: MAU.phu, lineHeight: 16, marginBottom: 8, minHeight: 32 },
  hangTienIchNho: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chipTienIch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    maxWidth: 120,
  },
  chuChipTienIch: { fontSize: 10, color: MAU.phu, fontWeight: '600' },
  hangGiaVaNut: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  nhanGiaGoi: { fontSize: 10, color: MAU.phu, textTransform: 'uppercase' },
  giaGoiTiec: { fontSize: 15, fontWeight: '800', color: MAU.cam },
  donViGoi: { fontSize: 11, fontWeight: '400', color: MAU.phu },
  nutChiTietGoi: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MAU.chinh,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 2,
  },
  chuNutChiTietGoi: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // PHẦN 2: SỰ KIỆN CỦA SÂN
  danhSachSuKienDoc: { paddingHorizontal: 16, gap: 14 },
  theSuKien: {
    backgroundColor: MAU.the,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MAU.vien,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  khungPoster: { width: '100%', height: 160, position: 'relative' },
  posterSuKien: { width: '100%', height: '100%' },
  badgeTrangThaiSuKien: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  badgeHappening: { backgroundColor: '#FEE2E2' },
  badgeUpcoming: { backgroundColor: '#D1FAE5' },
  chamTrangThai: { width: 7, height: 7, borderRadius: 3.5 },
  chuBadgeTrangThai: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  noiDungSuKien: { padding: 14 },
  tieuDeSuKien: { fontSize: 16, fontWeight: '800', color: MAU.chu, marginBottom: 8, lineHeight: 22 },
  hangThongTinSuKien: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  chuThongTinSuKien: { fontSize: 12, color: MAU.phu, flex: 1 },
  hopPhanThuong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginVertical: 6,
  },
  chuPhanThuong: { fontSize: 12, fontWeight: '700', color: '#92400E', flex: 1 },
  moTaNganSuKien: { fontSize: 12, color: MAU.phu, lineHeight: 17, marginTop: 4, marginBottom: 12 },
  hangChanSuKien: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  nhanPhi: { fontSize: 10, color: MAU.phu, textTransform: 'uppercase' },
  chuPhiThamGia: { fontSize: 14, fontWeight: '800', color: MAU.chinh },
  nhomNutHanhDongSuKien: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nutChiTietSK: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  chuNutChiTietSK: { fontSize: 12, fontWeight: '700', color: MAU.chu },
  nutDangKySK: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: MAU.chinh,
  },
  chuNutDangKySK: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // PHẦN 3: SÂN CÒN TRỐNG
  theSan: {
    flexDirection: 'row',
    backgroundColor: MAU.the,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MAU.vien,
    overflow: 'hidden',
  },
  khungEmojiSan: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  thongTinSan: { flex: 1, padding: 12, justifyContent: 'space-between' },
  tenSan: { fontSize: 14, fontWeight: '800', color: MAU.chu, marginBottom: 2 },
  diaChi: { fontSize: 12, color: MAU.phu, marginBottom: 6 },
  hangDuoiSan: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hangSao: { flexDirection: 'row', alignItems: 'center' },
  danhGia: { fontSize: 12, color: MAU.chu, fontWeight: '700' },
  soLuotDanhGia: { fontSize: 11, color: MAU.phu, marginLeft: 2 },
  giaTien: { fontSize: 14, fontWeight: '800', color: MAU.chinh },
  donViGio: { fontSize: 11, fontWeight: '400', color: MAU.phu },

  // MODAL CHUNG
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  hopModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  khungAnhModal: { width: '100%', height: 210, position: 'relative' },
  anhModal: { width: '100%', height: '100%' },
  nutDongModal: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeModalTronGoi: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  noiDungModal: { padding: 18, paddingBottom: 36 },
  tenGoiModal: { fontSize: 18, fontWeight: '800', color: MAU.chu, marginBottom: 12, lineHeight: 25 },
  hopGiaModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nhanGiaModal: { fontSize: 11, color: MAU.phu, textTransform: 'uppercase' },
  giaTienModal: { fontSize: 18, fontWeight: '800', color: MAU.cam },
  donViModal: { fontSize: 13, fontWeight: '400', color: MAU.phu },
  badgeSucChuaModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chuSucChuaModal: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  moTaChiTietModal: { fontSize: 13, color: MAU.chu, lineHeight: 20, marginBottom: 16 },

  phanMucModal: { marginTop: 8, marginBottom: 14 },
  tieuDePhanModal: { fontSize: 14, fontWeight: '800', color: MAU.chu, marginBottom: 10 },
  hangMonAn: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tenMonAn: { fontSize: 13, color: '#334155', flex: 1, lineHeight: 18 },

  bangThongTinSuKien: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  hangThongTinModal: { flexDirection: 'row', alignItems: 'flex-start' },
  nhanTieuDeThongTin: { fontSize: 11, color: MAU.phu },
  giaTriThongTin: { fontSize: 13, fontWeight: '600', color: MAU.chu, marginTop: 1 },
  doanVanChiTiet: { fontSize: 13, color: '#334155', lineHeight: 21 },

  hopHotlineModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  nhanHotline: { fontSize: 11, color: '#047857' },
  soHotline: { fontSize: 15, fontWeight: '800', color: '#065F46' },
  nutGoiNhanh: {
    backgroundColor: MAU.chinh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chuNutGoiNhanh: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  nhomNutModal: { marginTop: 10, gap: 10 },
  nutChinhModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MAU.chinh,
    paddingVertical: 14,
    borderRadius: 12,
  },
  chuNutChinhModal: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  nutPhuModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
  },
  chuNutPhuModal: { fontSize: 14, fontWeight: '700', color: MAU.chu },
});
