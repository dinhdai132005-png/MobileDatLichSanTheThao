// ============================================================
// DANH_GIA SERVICE — Nghiệp vụ đánh giá sân và chấm sao
// ============================================================
import { prisma } from '../lib/prisma';

export interface TaoDanhGiaDTO {
  userId: string;
  donDatId: string;
  soSao: number;
  noiDung?: string;
  anhUrl?: string;
}

export class DanhGiaService {
  /**
   * Tạo đánh giá mới cho đơn đặt đã hoàn thành và tính lại điểm sao của sân
   */
  static async taoDanhGia(dto: TaoDanhGiaDTO) {
    const { userId, donDatId, soSao, noiDung, anhUrl } = dto;

    // Kiểm tra đơn đã hoàn thành và thuộc về người dùng này
    const don = await prisma.donDat.findFirst({
      where: { id: donDatId, nguoiDungId: userId, trangThai: 'HOAN_THANH' },
    });

    if (!don) {
      throw { status: 403, message: 'Chỉ được đánh giá đơn đã hoàn thành của chính bạn.' };
    }

    const danhGia = await prisma.danhGia.create({
      data: {
        donDatId,
        sanId: don.sanId,
        nguoiDungId: userId,
        soSao,
        noiDung,
        anhUrl,
      },
    });

    // Cập nhật điểm trung bình của sân
    const ketQua = await prisma.danhGia.aggregate({
      where: { sanId: don.sanId, isHidden: false },
      _avg: { soSao: true },
      _count: true,
    });

    await prisma.san.update({
      where: { id: don.sanId },
      data: {
        diemDanhGia: ketQua._avg.soSao ?? 0,
        soLuotDanhGia: ketQua._count,
      },
    });

    return danhGia;
  }

  /**
   * Phản hồi đánh giá (Admin)
   */
  static async phanHoi(danhGiaId: string, noiDungPhanHoi: string) {
    return await prisma.danhGia.update({
      where: { id: danhGiaId },
      data: { phanHoiAdmin: noiDungPhanHoi },
    });
  }

  /**
   * Ẩn đánh giá vi phạm (Admin)
   */
  static async anDanhGia(danhGiaId: string) {
    return await prisma.danhGia.update({
      where: { id: danhGiaId },
      data: { isHidden: true },
    });
  }
}
