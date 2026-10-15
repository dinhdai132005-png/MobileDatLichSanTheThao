// ============================================================
// DỊCH VỤ SỰ KIỆN SÂN & GÓI TIỆC TRỌN GÓI (Mobile Client Service)
// ============================================================
import { apiClient, requestApi, ApiResponse } from './apiClient';
import { SuKienSan, GoiTiecSuKien } from '../types';

/** Dữ liệu dự phòng phong phú cho sự kiện của sân */
export const FALLBACK_SU_KIEN: SuKienSan[] = [
  {
    id: 1,
    tieuDe: 'Giải Vô Địch Cầu Lông Đôi Nam Nữ Sân 24/7 Mở Rộng 2026',
    moTaNgan: 'Giải đấu phong trào quy mô lớn nhất năm quy tụ 32 cặp VĐV xuất sắc toàn thành phố.',
    noiDung: 'Thể thức thi đấu vòng bảng loại trực tiếp theo chuẩn Liên đoàn Cầu lông. Mỗi bảng 4 cặp lấy 2 cặp nhất nhì vào tứ kết. Cơ sở tài trợ 100% nước uống, trái cây và hỗ trợ trọng tài chính thức. Cơ hội cọ xát, nâng cao kỹ chiến thuật và kết nối cộng đồng yêu cầu lông.',
    hinhAnh: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    ngayBatDau: '2026-10-25 08:00:00',
    ngayKetThuc: '2026-10-25 18:30:00',
    diaDiem: 'Nhà thi đấu Cầu lông (Sân CL1, CL2, CL3)',
    sanId: 3,
    sanTen: 'Sân CL1',
    phiThamGia: 200000,
    phanThuong: 'Cúp vô địch + Huy chương vàng + 10.000.000 ₫ tiền mặt',
    trangThai: 'UPCOMING',
    hotlineLh: '0900000001',
  },
  {
    id: 2,
    tieuDe: 'Cúp Tứ Hùng Bóng Đá Mini 5 Người - Mùa Thu 2026',
    moTaNgan: 'Giải đấu tranh cúp giao hữu giữa 8 câu lạc bộ thể thao phong trào cuối tuần sôi động.',
    noiDung: 'Đá knock-out trực tiếp hai hiệp 25 phút. Đội vô địch nhận cúp vàng danh giá và bộ trang phục thi đấu cao cấp. Có bình luận viên trực tiếp, quay phát livestream và chụp ảnh kỷ niệm chuyên nghiệp cho toàn bộ các trận đấu.',
    hinhAnh: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    ngayBatDau: '2026-10-18 17:30:00',
    ngayKetThuc: '2026-10-18 21:30:00',
    diaDiem: 'Cụm Sân Bóng Đá Mini 5A & 5B',
    sanId: 1,
    sanTen: 'Sân 5A',
    phiThamGia: 500000,
    phanThuong: 'Cúp vàng + Cờ lưu niệm + 15.000.000 ₫ giải nhất',
    trangThai: 'HAPPENING',
    hotlineLh: '0900000001',
  },
  {
    id: 3,
    tieuDe: 'Workshop & Ngày Hội Giao Lưu Pickleball Miễn Phí',
    moTaNgan: 'Trải nghiệm môn thể thao hot nhất năm cùng Huấn luyện viên chuyên nghiệp có bằng quốc tế.',
    noiDung: 'Chương trình hoàn toàn MIỄN PHÍ dành cho người mới bắt đầu và người chơi muốn hoàn thiện cú dink, smash. Được mượn vợt Pickleball và bóng thi đấu miễn phí. Có mini game bốc thăm trúng thưởng vợt cao cấp cuối buổi.',
    hinhAnh: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    ngayBatDau: '2026-10-22 15:00:00',
    ngayKetThuc: '2026-10-22 18:00:00',
    diaDiem: 'Khu Sân Pickleball 1 & 2',
    sanId: 7,
    sanTen: 'Sân Pickleball 1',
    phiThamGia: 0,
    phanThuong: 'Tặng 3 vợt Pickleball carbon cho người may mắn',
    trangThai: 'UPCOMING',
    hotlineLh: '0900000002',
  },
  {
    id: 4,
    tieuDe: 'Đêm Hội Thể Thao & Đại Tiệc Âm Nhạc BBQ Cuối Tuần',
    moTaNgan: 'Giao lưu thể thao kết hợp nướng BBQ sân vườn, ca nhạc Acoustic và rút thăm may mắn.',
    noiDung: 'Khách tham gia được chơi thể thao tự do (bóng đá, cầu lông, pickleball) từ 16h-18h, sau đó cùng thưởng thức tiệc BBQ hải sản nướng ngoài trời, bia tươi và thưởng thức đêm nhạc Acoustic lãng mạn dưới ánh đèn trang trí lung linh.',
    hinhAnh: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    ngayBatDau: '2026-10-31 16:30:00',
    ngayKetThuc: '2026-10-31 22:30:00',
    diaDiem: 'Khu BBQ ngoài trời & Phòng tiệc A',
    sanId: 9,
    sanTen: 'Khu BBQ ngoài trời',
    phiThamGia: 350000,
    phanThuong: 'Voucher 1.000.000 ₫ đặt sân & quà tặng lưu niệm',
    trangThai: 'UPCOMING',
    hotlineLh: '0900000001',
  },
];

/** Dữ liệu dự phòng phong phú cho gói tiệc trọn gói */
export const FALLBACK_GOI_TIEC: GoiTiecSuKien[] = [
  {
    id: 12,
    name: 'Gói Đại Tiệc BBQ Sân Vườn Hoàng Hôn',
    type: 'PACKAGE',
    unit: 'gói',
    price: 2500000,
    description: 'Thịt bò Mỹ ướp sẵn, tôm càng nướng, xúc xích Đức, rau củ quả, bếp nướng than hoa, phục vụ bàn ghế sân vườn cho 15-25 khách',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    isAvailable: true,
    sucChua: '15 - 25 người',
    thucDon: ['Bò Mỹ sốt tiêu đen', 'Tôm càng xanh nướng muối ớt', 'Xúc xích Đức xông khói', 'Salad rau củ sốt mè', 'Ngô & Khoai nướng bơ'],
    tienIch: ['Bếp than hoa cao cấp', 'Nhân viên phục vụ nướng', 'Bàn ghế sân vườn chuẩn tiệc', 'Loa Bluetooth ngoài trời'],
  },
  {
    id: 13,
    name: 'Gói Tiệc Sinh Nhật / Thôi Nôi Thể Thao',
    type: 'PACKAGE',
    unit: 'gói',
    price: 3200000,
    description: 'Backdrop bóng bay thiết kế theo yêu cầu, bánh kem 3 tầng Tous Les Jours, nước ngọt, phòng tiệc máy lạnh riêng tư 20-35 khách',
    imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    isAvailable: true,
    sucChua: '20 - 35 người',
    thucDon: ['Bánh kem sinh nhật cao cấp', 'Finger food & Mini burgers', 'Gà rán giòn rụm', 'Khoai tây lốc xoáy', 'Nước ép & Nước ngọt thả ga'],
    tienIch: ['Backdrop bóng bay thiết kế riêng', 'Phòng tiệc máy lạnh riêng tư', 'Bàn decor ảnh kỷ niệm', 'Nến pháo sáng & Mũ tiệc'],
  },
  {
    id: 14,
    name: 'Gói Gala Dinner & Team Building Doanh Nghiệp',
    type: 'PACKAGE',
    unit: 'gói',
    price: 5500000,
    description: 'Dàn âm thanh karaoke công suất lớn, MC dẫn chương trình thể thao, tiệc mặn 6 món thịnh soạn, sân khấu riêng 30-60 khách',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    isAvailable: true,
    sucChua: '30 - 60 người',
    thucDon: ['Súp hải sản bắp ngọt', 'Gà hấp lá chanh', 'Cá hồi áp chảo bơ chanh', 'Sườn heo nướng mật ong', 'Cơm chiên hoàng bào', 'Chè sen long nhãn'],
    tienIch: ['Sân khấu & Màn hình LED', 'Dàn âm thanh Karaoke chuyên nghiệp', 'MC hoạt náo viên thể thao', 'Nhiếp ảnh gia ghi lại sự kiện'],
  },
  {
    id: 15,
    name: 'Gói Tiệc Trà & Giao Lưu Thi Đấu',
    type: 'PACKAGE',
    unit: 'gói',
    price: 800000,
    description: 'Trà hoa quả nhiệt đới, đĩa trái cây tươi nhập khẩu, bánh ngọt teabreak, không gian giao lưu ấm cúng cho 10-15 khách',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    isAvailable: true,
    sucChua: '10 - 15 người',
    thucDon: ['Trà đào cam sả / Trà ổi hồng', 'Bánh mousse chanh dây', 'Tiramisu mini', 'Trái cây theo mùa (dưa lưới, nho, táo)', 'Hạt dinh dưỡng tổng hợp'],
    tienIch: ['Bàn tiệc decor hoa tươi', 'Không gian phòng VIP thư giãn', 'Bình trà ủ giữ nhiệt 100%', 'Nhân viên hỗ trợ setup'],
  },
];

export const suKienService = {
  /** Lấy danh sách sự kiện và giải đấu của sân */
  async getDanhSachSuKien(status?: string): Promise<SuKienSan[]> {
    try {
      const res = await requestApi<any[]>(
        apiClient.get<ApiResponse<any[]>>('/events', {
          params: status ? { status } : undefined,
        })
      );
      if (Array.isArray(res) && res.length > 0) {
        return res.map((r: any) => ({
          id: Number(r.id),
          tieuDe: r.tieuDe || r.ten || '',
          moTaNgan: r.moTaNgan || r.moTa || '',
          noiDung: r.noiDung || '',
          hinhAnh: r.hinhAnh || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
          ngayBatDau: r.ngayBatDau || '',
          ngayKetThuc: r.ngayKetThuc || '',
          diaDiem: r.diaDiem || 'Sân thể thao 24/7',
          sanId: r.sanId ? Number(r.sanId) : null,
          sanTen: r.sanTen || null,
          phiThamGia: Number(r.phiThamGia || 0),
          phanThuong: r.phanThuong || null,
          trangThai: r.trangThai || 'UPCOMING',
          hotlineLh: r.hotlineLh || '0900000001',
        }));
      }
      return FALLBACK_SU_KIEN;
    } catch (e) {
      console.warn('suKienService.getDanhSachSuKien fallback:', e);
      return FALLBACK_SU_KIEN;
    }
  },

  /** Lấy chi tiết sự kiện theo ID */
  async getChiTietSuKien(id: number): Promise<SuKienSan> {
    try {
      const res = await requestApi<any>(
        apiClient.get<ApiResponse<any>>(`/events/${id}`)
      );
      if (res && res.id) {
        return {
          id: Number(res.id),
          tieuDe: res.tieuDe || '',
          moTaNgan: res.moTaNgan || '',
          noiDung: res.noiDung || '',
          hinhAnh: res.hinhAnh || '',
          ngayBatDau: res.ngayBatDau || '',
          ngayKetThuc: res.ngayKetThuc || '',
          diaDiem: res.diaDiem || '',
          sanId: res.sanId ? Number(res.sanId) : null,
          sanTen: res.sanTen || null,
          phiThamGia: Number(res.phiThamGia || 0),
          phanThuong: res.phanThuong || null,
          trangThai: res.trangThai || 'UPCOMING',
          hotlineLh: res.hotlineLh || '0900000001',
        };
      }
      const found = FALLBACK_SU_KIEN.find((s) => s.id === id);
      if (found) return found;
      throw new Error('Không tìm thấy sự kiện');
    } catch (e) {
      const found = FALLBACK_SU_KIEN.find((s) => s.id === id);
      if (found) return found;
      throw e;
    }
  },

  /** Lấy danh sách các gói tiệc trọn gói & sự kiện của sân */
  async getDanhSachGoiTiec(): Promise<GoiTiecSuKien[]> {
    try {
      const res = await requestApi<any[]>(
        apiClient.get<ApiResponse<any[]>>('/services', {
          params: { type: 'PACKAGE' },
        })
      );
      if (Array.isArray(res) && res.length > 0) {
        // Lọc và làm giàu thêm thông tin cho các gói tiệc
        return res
          .filter((item: any) => item.status === 'ACTIVE' || item.status === undefined)
          .map((item: any) => {
            const fallbackMatch = FALLBACK_GOI_TIEC.find(
              (f) => f.id === Number(item.id) || f.name.toLowerCase() === (item.name || '').toLowerCase()
            );

            // Sức chứa ước lượng nếu có trong mô tả
            let sucChua = fallbackMatch?.sucChua || '10 - 30 người';
            if (item.description && item.description.match(/(\d+\s*-\s*\d+\s*khách|\d+\s*người)/i)) {
              const m = item.description.match(/(\d+\s*-\s*\d+\s*khách|\d+\s*người)/i);
              sucChua = m ? m[0] : sucChua;
            }

            return {
              id: Number(item.id),
              name: item.name || item.ten || '',
              type: 'PACKAGE' as const,
              unit: item.unit || item.donViTinh || 'gói',
              price: Number(item.price || item.donGia || item.unitPrice || 0),
              description: item.description || item.moTa || '',
              imageUrl:
                item.imageUrl ||
                item.hinhAnh ||
                fallbackMatch?.imageUrl ||
                'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
              status: item.status || 'ACTIVE',
              isAvailable: item.isAvailable !== false,
              sucChua,
              thucDon: fallbackMatch?.thucDon || ['Thực đơn thiết kế theo yêu cầu', 'Nước uống phục vụ suốt tiệc', 'Trái cây tráng miệng tươi ngon'],
              tienIch: fallbackMatch?.tienIch || ['Setup không gian riêng', 'Bàn ghế tiệc cao cấp', 'Nhân viên hỗ trợ'],
            };
          });
      }
      return FALLBACK_GOI_TIEC;
    } catch (e) {
      console.warn('suKienService.getDanhSachGoiTiec fallback:', e);
      return FALLBACK_GOI_TIEC;
    }
  },
};
