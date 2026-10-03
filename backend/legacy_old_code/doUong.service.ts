// ============================================================
// DO_UONG SERVICE — Xử lý nghiệp vụ đồ uống & tồn kho
// ============================================================
import { prisma } from '../lib/prisma';

export class DoUongService {
  /**
   * Lấy danh sách đồ uống đang bán
   */
  static async layDanhSach() {
    return await prisma.doUong.findMany({
      where: { isActive: true },
      orderBy: [{ danhMuc: 'asc' }, { ten: 'asc' }],
    });
  }

  /**
   * Tạo sản phẩm đồ uống mới (Admin)
   */
  static async taoMoi(data: any) {
    return await prisma.doUong.create({ data });
  }

  /**
   * Cập nhật thông tin đồ uống (Admin)
   */
  static async capNhat(id: string, data: any) {
    return await prisma.doUong.update({
      where: { id },
      data,
    });
  }

  /**
   * Nhập thêm số lượng vào kho (Admin)
   */
  static async nhapKho(id: string, soLuong: number) {
    return await prisma.doUong.update({
      where: { id },
      data: { tonKho: { increment: soLuong } },
    });
  }
}
