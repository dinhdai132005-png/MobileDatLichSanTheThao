// ============================================================
// VIETQR CODE MODAL COMPONENT
// Tích hợp react-native-qrcode-svg & VietQR QuickLink Image Fallback
// ============================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { VietQRConfig } from '../types';
import {
  generateVietQRQuickLink,
  generateVietQRPayloadString,
  DANH_SACH_NGAN_HANG,
  VIETQR_MAC_DINH,
} from '../services/vietqr';

interface VietQRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmPayment?: () => void;
  config: Partial<VietQRConfig>;
  tenSan?: string;
}

export default function VietQRCodeModal({
  visible,
  onClose,
  onConfirmPayment,
  config,
  tenSan = 'Sân Thể Thao',
}: VietQRCodeModalProps) {
  const [renderError, setRenderError] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  const bankId = config.bankId || VIETQR_MAC_DINH.bankId;
  const bank = DANH_SACH_NGAN_HANG.find((b) => b.id === bankId) || DANH_SACH_NGAN_HANG[0];
  const accountNo = config.accountNo || VIETQR_MAC_DINH.accountNo;
  const accountName = config.accountName || VIETQR_MAC_DINH.accountName;
  const amount = config.amount || 0;
  const addInfo = config.addInfo || `DAT SAN ${tenSan.toUpperCase()}`;

  // Chuỗi QR Payload cho react-native-qrcode-svg
  const qrPayload = generateVietQRPayloadString({
    bankId,
    accountNo,
    amount,
    addInfo,
  });

  // URL VietQR QuickLink (dự phòng)
  const qrImageUrl = generateVietQRQuickLink({
    bankId,
    accountNo,
    accountName,
    amount,
    addInfo,
  });

  const saoChep = (noiDung: string, nhan: string) => {
    Alert.alert('Đã sao chép', `Đã chép ${nhan}: ${noiDung}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Modal */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 24 }}>⚡</Text>
              <View>
                <Text style={styles.tieuDeHeader}>Thanh toán VietQR</Text>
                <Text style={styles.subHeader}>Quét mã QR bằng ứng dụng Ngân hàng / MoMo</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.nutDong} onPress={onClose}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Khung QR Code */}
            <View style={styles.khungQR}>
              <View style={styles.qrWrapper}>
                {!renderError && QRCode ? (
                  <QRCode
                    value={qrPayload}
                    size={200}
                    color="#1A1A2E"
                    backgroundColor="#FFFFFF"
                    onError={() => setRenderError(true)}
                  />
                ) : (
                  <View style={{ width: 200, height: 200, justifyContent: 'center', alignItems: 'center' }}>
                    {imageLoading && <ActivityIndicator size="small" color="#00B884" />}
                    <Image
                      source={{ uri: qrImageUrl }}
                      style={{ width: 200, height: 200, borderRadius: 12 }}
                      onLoadEnd={() => setImageLoading(false)}
                      onError={() => setRenderError(true)}
                    />
                  </View>
                )}
              </View>
              <Text style={styles.ghiChuQR}>Quét mã để tự động điền STK & Số tiền</Text>
            </View>

            {/* Chi tiết thông tin chuyển khoản */}
            <View style={styles.theThongTin}>
              <View style={styles.hangChiTiet}>
                <Text style={styles.nhanText}>Ngân hàng</Text>
                <Text style={styles.giaTriText}>{bank.logo} {bank.name}</Text>
              </View>

              <View style={styles.duongKe} />

              <View style={styles.hangChiTiet}>
                <Text style={styles.nhanText}>Chủ tài khoản</Text>
                <Text style={[styles.giaTriText, { fontWeight: '700' }]}>{accountName}</Text>
              </View>

              <View style={styles.duongKe} />

              <View style={styles.hangChiTiet}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nhanText}>Số tài khoản</Text>
                  <Text style={styles.giaTriNoiBat}>{accountNo}</Text>
                </View>
                <TouchableOpacity
                  style={styles.nutSaoChep}
                  onPress={() => saoChep(accountNo, 'Số tài khoản')}
                >
                  <Ionicons name="copy-outline" size={14} color="#00B884" />
                  <Text style={styles.chuSaoChep}>Sao chép</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.duongKe} />

              <View style={styles.hangChiTiet}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nhanText}>Số tiền thanh toán</Text>
                  <Text style={styles.giaTriTien}>{amount.toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>

              <View style={styles.duongKe} />

              <View style={styles.hangChiTiet}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nhanText}>Nội dung chuyển khoản</Text>
                  <Text style={styles.giaTriNoiDung}>{addInfo}</Text>
                </View>
                <TouchableOpacity
                  style={styles.nutSaoChep}
                  onPress={() => saoChep(addInfo, 'Nội dung')}
                >
                  <Ionicons name="copy-outline" size={14} color="#00B884" />
                  <Text style={styles.chuSaoChep}>Sao chép</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Nút hành động */}
            <TouchableOpacity
              style={styles.nutXacNhanTT}
              onPress={() => {
                if (onConfirmPayment) onConfirmPayment();
                else onClose();
              }}
            >
              <Text style={styles.chuNutXacNhan}>Tôi đã chuyển khoản thành công</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  tieuDeHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  subHeader: {
    fontSize: 11,
    color: '#6B7280',
  },
  nutDong: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F6F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 16,
  },
  khungQR: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ghiChuQR: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 10,
    fontWeight: '500',
  },
  theThongTin: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EAED',
    padding: 14,
    marginBottom: 20,
  },
  hangChiTiet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  duongKe: {
    height: 1,
    backgroundColor: '#F4F6F9',
    marginVertical: 8,
  },
  nhanText: {
    fontSize: 12,
    color: '#6B7280',
  },
  giaTriText: {
    fontSize: 13,
    color: '#1A1A2E',
    fontWeight: '600',
  },
  giaTriNoiBat: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 2,
  },
  giaTriTien: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B884',
    marginTop: 2,
  },
  giaTriNoiDung: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 2,
  },
  nutSaoChep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F8F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chuSaoChep: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B884',
  },
  nutXacNhanTT: {
    backgroundColor: '#00B884',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  chuNutXacNhan: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
