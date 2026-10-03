// ============================================================
// DON_DAT SERVICE — Nghiệp vụ Đặt Sân (Booking)
// Tính năng: Transaction chống double-booking, tính giá, voucher, socket emit
// ============================================================
import { prisma } from '../lib/prisma';
import { emitSlotUpdated, emitNewBooking } from '../socket';
import { tinhTongTienSan } from '../utils/pricing';

export interface TaoDonDatDTO {
  userId: string;
  sanId: string;
  tenKhach: string;
  soDienThoaiKhach: string;
  ghiChu?: string;
  ngayDat: string;
  gioKhoa: string;
  soGioThue: number;
  phuongThucThanhToan: 'TIEN_MAT' | 'MOMO' | 'ZALO_PAY' | 'VN_PAY' | 'PAY_OS' | 'CHUYEN_KHOAN';
  maVoucher?: string;
}

export class DonDatService {
  /**
   * Tạo đơn đặt sân mới với Prisma Transaction đảm bảo tính toàn vẹn (Anti Double-Booking)
   */
  static async taoDonDat(dto: TaoDonDatDTO) {
    const {
      userId,
      sanId,
      tenKhach,
      soDienThoaiKhach,
      ghiChu,
      ngayDat,
      gioKhoa,
      soGioThue,
      phuongThucThanhToan,
      maVoucher,
    } = dto;

    const ngayDate = new Date(ngayDat);

    const donDat = await prisma.$transaction(async (tx) => {
      // 1. Lấy thông tin sân & cấu hình giá (trong transaction)
      const san = await tx.san.findUnique({
        where: { id: sanId },
        include: { khungGioCauHinh: true },
      });

      if (!san || san.trangThai !== 'HOAT_DONG') {
        throw { status: 400, message: 'Sân hiện không hoạt động hoặc không tồn tại.' };
      }

      // 2. Tính khoảng giờ kết thúc của đơn mới
      const [gH, gP] = gioKhoa.split(':').map(Number);
      const phutBatDau = gH * 60 + gP;
      const phutKetThuc = phutBatDau + Math.round(soGioThue * 60);

      const hKT = Math.floor(phutKetThuc / 60).toString().padStart(2, '0');
      const pKT = (phutKetThuc % 60).toString().padStart(2, '0');
      const gioKetThuc = `${hKT}:${pKT}`;

      const now = new Date();
      const ngayStart = new Date(ngayDate.toDateString());
      const ngayEnd = new Date(new Date(ngayDate).setDate(ngayDate.getDate() + 1));

      // 3. Kiểm tra trùng slot — TRANSACTION LOCK CHỐNG DOUBLE-BOOKING
      const trungSlot = await tx.donDat.findFirst({
        where: {
          sanId,
          ngayDat: { gte: ngayStart, lt: ngayEnd },
          trangThai: { in: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_CHOI'] },
          AND: [
            { gioKhoa: { lt: gioKetThuc } },
            { gioKetThuc: { gt: gioKhoa } },
          ],
        },
      });

      if (trungSlot) {
        throw { status: 409, message: 'Slot này đã được đặt bởi người khác. Vui lòng chọn giờ khác.' };
      }

      // 4. Tính toán tiền thuê sân
      const tongTienSan = tinhTongTienSan(
        gioKhoa,
        soGioThue,
        san.khungGioCauHinh,
        ngayDate.getDay(),
        san.giaTienThapDiem,
        san.giaTienCaoDiem
      );

      // 5. Kiểm tra và áp dụng mã voucher (nếu có)
      let giamGia = 0;
      let voucherId: string | undefined;
      if (maVoucher) {
        const voucher = await tx.voucher.findFirst({
          where: {
            maVoucher,
            isActive: true,
            ngayBatDau: { lte: now },
            ngayKetThuc: { gte: now },
          },
        });

        if (voucher && tongTienSan >= voucher.giaTriDonToiThieu && voucher.soLanDaSuDung < voucher.soLanToiDa) {
          giamGia = voucher.loai === 'FIXED'
            ? voucher.giaTriGiam
            : Math.round((tongTienSan * voucher.giaTriGiam) / 100);
          voucherId = voucher.id;

          await tx.voucher.update({
            where: { id: voucher.id },
            data: { soLanDaSuDung: { increment: 1 } },
          });
        }
      }

      const tongCong = Math.max(0, tongTienSan - giamGia);

      // 6. Tạo đơn với thời gian giữ chỗ 5 phút
      const thoiGianGiuCho = new Date(now.getTime() + 5 * 60 * 1000);
      const don = await tx.donDat.create({
        data: {
          sanId,
          nguoiDungId: userId,
          tenKhach,
          soDienThoaiKhach,
          ghiChu,
          ngayDat: ngayDate,
          gioKhoa,
          soGioThue,
          gioKetThuc,
          donGia: san.giaTienThapDiem,
          tongTienSan,
          giamGia,
          tongCong,
          phuongThucThanhToan: phuongThucThanhToan as any,
          thoiGianGiuCho,
          ...(voucherId
            ? {
                voucherDonDat: { create: { voucherId, soTienGiam: giamGia } },
              }
            : {}),
        },
        include: { san: { select: { tenSan: true } } },
      });

      return don;
    });

    // 7. Phát Socket.io events realtime sau transaction
    emitSlotUpdated(sanId, { gio: gioKhoa, trangThai: 'DANG_GIU', ngayDat: ngayDat.toString() });
    emitNewBooking(donDat.id, sanId, tenKhach);

    return donDat;
  }

  /**
   * Lấy danh sách toàn bộ đơn đặt sân (Staff/Admin)
   */
  static async layTatCaDon(trangThai?: string) {
    return await prisma.donDat.findMany({
      where: trangThai ? { trangThai: trangThai as any } : {},
      include: {
        san: { select: { tenSan: true, loaiSan: { select: { ten: true, emoji: true } } } },
        nguoiDung: { select: { hoTen: true, soDienThoai: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Lấy lịch sử đặt sân của khách hàng
   */
  static async layLichSuCuaKhach(userId: string, trangThai?: string) {
    return await prisma.donDat.findMany({
      where: {
        nguoiDungId: userId,
        ...(trangThai ? { trangThai: trangThai as any } : {}),
      },
      include: {
        san: { select: { tenSan: true, loaiSan: { select: { ten: true, emoji: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lấy chi tiết đơn đặt sân theo ID
   */
  static async layChiTietDon(donId: string, currentUser: { userId: string; vaiTro: string }) {
    const don = await prisma.donDat.findUnique({
      where: { id: donId },
      include: {
        san: true,
        chiTietFnB: { include: { doUong: true } },
        chiTietDungCu: { include: { dungCu: true } },
        danhGia: true,
        voucherDonDat: { include: { voucher: true } },
      },
    });

    if (!don) {
      throw { status: 404, message: 'Không tìm thấy đơn đặt sân.' };
    }

    // Bảo mật: Chỉ khách hàng sở hữu đơn hoặc nhân viên/admin mới được xem
    if (don.nguoiDungId !== currentUser.userId && currentUser.vaiTro === 'CUSTOMER') {
      throw { status: 403, message: 'Bạn không có quyền xem đơn này.' };
    }

    return don;
  }

  /**
   * Staff/Admin xác nhận đơn đặt sân
   */
  static async xacNhanDon(donId: string) {
    const don = await prisma.donDat.update({
      where: { id: donId },
      data: { trangThai: 'DA_XAC_NHAN', thoiGianXacNhan: new Date() },
    });

    emitSlotUpdated(don.sanId, {
      gio: don.gioKhoa,
      trangThai: 'DA_DAT',
      ngayDat: don.ngayDat.toISOString(),
    });

    return don;
  }

  /**
   * Staff/Admin từ chối đơn đặt sân
   */
  static async tuChoiDon(donId: string, lyDo: string) {
    const don = await prisma.donDat.update({
      where: { id: donId },
      data: { trangThai: 'TU_CHOI', lyDoHuy: lyDo, thoiGianHuy: new Date() },
    });

    emitSlotUpdated(don.sanId, {
      gio: don.gioKhoa,
      trangThai: 'TRONG',
      ngayDat: don.ngayDat.toISOString(),
    });

    return don;
  }

  /**
   * Staff check-in cho khách đến sân
   */
  static async checkInDon(donId: string) {
    return await prisma.donDat.update({
      where: { id: donId },
      data: { trangThai: 'DANG_CHOI', thoiGianCheckIn: new Date() },
    });
  }

  /**
   * Staff/Admin hoàn thành đơn đặt sân khi ca chơi kết thúc
   * Tự động cộng tổng lượt đặt, tính điểm tích lũy và cập nhật cấp bậc thành viên cho khách hàng
   */
  static async hoanThanhDon(donId: string) {
    const don = await prisma.donDat.findUnique({
      where: { id: donId },
      include: { nguoiDung: true },
    });

    if (!don) {
      throw { status: 404, message: 'Không tìm thấy đơn đặt sân.' };
    }

    if (don.trangThai !== 'DANG_CHOI') {
      throw { status: 400, message: 'Chỉ có thể hoàn thành các đơn đang trong ca chơi (Đang chơi).' };
    }

    // 1. Cập nhật đơn thành HOAN_THANH
    const updatedDon = await prisma.donDat.update({
      where: { id: donId },
      data: { trangThai: 'HOAN_THANH', thoiGianKetThuc: new Date() },
    });

    // 2. Tự động tính điểm tích lũy (10.000 VND = 1 điểm) & tăng tổng lượt đặt cho khách hàng
    if (don.nguoiDungId) {
      const diemThuong = Math.floor(don.tongCong / 10000);
      const user = await prisma.nguoiDung.findUnique({ where: { id: don.nguoiDungId } });
      if (user) {
        const newTongLuot = user.tongLuotDat + 1;
        const newDiem = user.diemTichLuy + diemThuong;
        let newCapDo: 'THUONG' | 'BAC' | 'VANG' | 'KIM_CUONG' = 'THUONG';
        if (newTongLuot >= 60) newCapDo = 'KIM_CUONG';
        else if (newTongLuot >= 30) newCapDo = 'VANG';
        else if (newTongLuot >= 10) newCapDo = 'BAC';

        await prisma.nguoiDung.update({
          where: { id: don.nguoiDungId },
          data: {
            tongLuotDat: newTongLuot,
            diemTichLuy: newDiem,
            capDoThanhVien: newCapDo,
          },
        });
      }
    }

    // 3. Giải phóng slot sang TRONG
    emitSlotUpdated(don.sanId, {
      gio: don.gioKhoa,
      trangThai: 'TRONG',
      ngayDat: don.ngayDat.toISOString(),
    });

    return updatedDon;
  }

  /**
   * Khách hàng yêu cầu hủy đơn
   */
  static async huyDon(donId: string, userId: string, lyDo: string) {
    const don = await prisma.donDat.findUnique({ where: { id: donId } });

    if (!don || don.nguoiDungId !== userId) {
      throw { status: 403, message: 'Không có quyền hủy đơn này.' };
    }

    if (!['CHO_XAC_NHAN', 'DA_XAC_NHAN'].includes(don.trangThai)) {
      throw { status: 400, message: 'Đơn ở trạng thái này không thể hủy.' };
    }

    const updated = await prisma.donDat.update({
      where: { id: donId },
      data: { trangThai: 'DA_HUY', lyDoHuy: lyDo, thoiGianHuy: new Date() },
    });

    emitSlotUpdated(don.sanId, {
      gio: don.gioKhoa,
      trangThai: 'TRONG',
      ngayDat: don.ngayDat.toISOString(),
    });

    return updated;
  }
}
