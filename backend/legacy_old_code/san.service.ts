// ============================================================
// SAN SERVICE — Xử lý nghiệp vụ sân thể thao & sinh slot khả dụng
// ============================================================
import { prisma } from '../lib/prisma';
import { tinhGiaTheoGio } from '../utils/pricing';

export interface SanFilterDTO {
  monTheThao?: string;
  sapXep?: string;
  tuKhoa?: string;
}

export interface DonDaDatInfo {
  gioKhoa: string;
  soGioThue: number;
  trangThai: string;
  thoiGianGiuCho: Date | null;
}

export interface KhungGioCauHinhInfo {
  ngayTrongTuan: number;
  gioTu: string;
  gioDen: string;
  laCaoDiem: boolean;
}

export class SanService {
  /**
   * Lấy danh sách sân theo bộ lọc và sắp xếp
   */
  static async layDanhSachSan(filter: SanFilterDTO) {
    const { monTheThao, sapXep, tuKhoa } = filter;

    return await prisma.san.findMany({
      where: {
        trangThai: 'HOAT_DONG',
        ...(monTheThao && monTheThao !== 'Tất cả'
          ? { loaiSan: { ten: monTheThao } }
          : {}),
        ...(tuKhoa ? { tenSan: { contains: tuKhoa } } : {}),
      },
      include: {
        loaiSan: true,
        anhSanList: { orderBy: { thuTu: 'asc' }, take: 1 },
      },
      orderBy:
        sapXep === 'giaTien' ? { giaTienThapDiem: 'asc' } :
        sapXep === 'danhGia' ? { diemDanhGia: 'desc' } :
        { soLuotDat: 'desc' },
    });
  }

  /**
   * Lấy danh mục các loại sân (môn thể thao)
   */
  static async layDanhSachLoaiSan() {
    return await prisma.loaiSan.findMany({
      orderBy: { thuTu: 'asc' },
    });
  }

  /**
   * Lấy chi tiết 1 sân theo ID kèm ảnh, cấu hình giá, đánh giá
   */
  static async layChiTietSan(sanId: string) {
    const san = await prisma.san.findUnique({
      where: { id: sanId },
      include: {
        loaiSan: true,
        anhSanList: { orderBy: { thuTu: 'asc' } },
        khungGioCauHinh: true,
        danhGiaList: {
          where: { isHidden: false },
          include: { nguoiDung: { select: { hoTen: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!san) {
      throw { status: 404, message: 'Không tìm thấy thông tin sân.' };
    }

    return san;
  }

  /**
   * Tính toán danh sách slot khả dụng và giá theo ngày (real-time)
   */
  static async laySlotsTheoNgay(sanId: string, ngay: string) {
    const san = await prisma.san.findUnique({
      where: { id: sanId },
      include: { khungGioCauHinh: true },
    });

    if (!san) {
      throw { status: 404, message: 'Không tìm thấy thông tin sân.' };
    }

    const ngayDate = new Date(ngay);
    const donDaDat = await prisma.donDat.findMany({
      where: {
        sanId: san.id,
        ngayDat: {
          gte: new Date(ngayDate.toDateString()),
          lt: new Date(new Date(ngayDate).setDate(ngayDate.getDate() + 1)),
        },
        trangThai: {
          in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_CHOI'],
        },
      },
      select: { gioKhoa: true, soGioThue: true, trangThai: true, thoiGianGiuCho: true },
    });

    return this.sinhDanhSachSlot(
      san.gioMoCua,
      san.gioDongCua,
      san.soPhutMoiSlot,
      donDaDat,
      san.khungGioCauHinh,
      ngayDate,
      san.giaTienThapDiem,
      san.giaTienCaoDiem
    );
  }

  /**
   * Helper sinh danh sách slot trong ngày
   */
  private static sinhDanhSachSlot(
    gioMoCua: string,
    gioDongCua: string,
    soPhutMoiSlot: number,
    donDaDat: DonDaDatInfo[],
    cauHinhGia: KhungGioCauHinhInfo[],
    ngayDate: Date,
    giaTienThapDiem: number,
    giaTienCaoDiem: number
  ) {
    const slots = [];
    const [hMo, pMo] = gioMoCua.split(':').map(Number);
    const [hDong, pDong] = gioDongCua.split(':').map(Number);
    const tongPhutMoCua = hMo * 60 + pMo;
    const tongPhutDongCua = hDong * 60 + pDong;

    const now = new Date();
    const isToday = ngayDate.toDateString() === now.toDateString();

    for (let phut = tongPhutMoCua; phut < tongPhutDongCua; phut += soPhutMoiSlot) {
      const h = Math.floor(phut / 60).toString().padStart(2, '0');
      const p = (phut % 60).toString().padStart(2, '0');
      const gioHienTai = `${h}:${p}`;

      // Kiểm tra slot có bị đặt không
      const biBat = donDaDat.some((don) => {
        const [dH, dP] = don.gioKhoa.split(':').map(Number);
        const batDauPhut = dH * 60 + dP;
        const ketThucPhut = batDauPhut + Math.round(don.soGioThue * 60);
        return phut >= batDauPhut && phut < ketThucPhut;
      });

      // Kiểm tra slot đang được giữ chỗ (CHO_XAC_NHAN, còn trong 5 phút)
      const dangGiuCho = donDaDat.some((don) => {
        if (don.trangThai !== 'CHO_XAC_NHAN' || !don.thoiGianGiuCho) return false;
        const conHan = new Date(don.thoiGianGiuCho) > now;
        if (!conHan) return false;
        const [dH, dP] = don.gioKhoa.split(':').map(Number);
        const batDauPhut = dH * 60 + dP;
        const ketThucPhut = batDauPhut + Math.round(don.soGioThue * 60);
        return phut >= batDauPhut && phut < ketThucPhut;
      });

      // Kiểm tra đã qua giờ hiện tại (nếu là hôm nay)
      const daQua = isToday && phut <= now.getHours() * 60 + now.getMinutes();

      // Tính giá theo Peak/Off-peak
      const giaTien = tinhGiaTheoGio(gioHienTai, cauHinhGia, ngayDate.getDay(), giaTienThapDiem, giaTienCaoDiem);

      slots.push({
        gio: gioHienTai,
        conTrong: !biBat && !dangGiuCho && !daQua,
        dangGiuCho,
        daQua,
        giaTien,
        laCaoDiem: giaTien === giaTienCaoDiem,
      });
    }

    return slots;
  }

  /**
   * Tạo sân mới (Admin)
   */
  static async taoSan(data: any) {
    return await prisma.san.create({ data });
  }

  /**
   * Cập nhật thông tin sân (Admin)
   */
  static async capNhatSan(sanId: string, data: any) {
    return await prisma.san.update({
      where: { id: sanId },
      data,
    });
  }
}
