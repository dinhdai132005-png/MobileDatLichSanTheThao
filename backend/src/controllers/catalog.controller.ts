// =====================================================================
// BỘ ĐIỀU KHIỂN DANH MỤC (CATALOG CONTROLLER) — TIẾNG VIỆT KHÔNG DẤU
// Tham chiếu: Plant/06-api.md mục 4.1
// =====================================================================
import { Request, Response } from 'express';
import { CatalogService } from '../services/catalog.service';
import { ok } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

export class CatalogController {
  static getCourtTypes = asyncHandler(async (_req: Request, res: Response) => {
    const ketQua = await CatalogService.getCourtTypes();
    return ok(res, ketQua);
  });

  static getCourts = asyncHandler(async (req: Request, res: Response) => {
    const loaiSanId = req.query.loaiSanId || req.query.courtTypeId;
    const ketQua = await CatalogService.getCourts(loaiSanId ? Number(loaiSanId) : undefined);
    return ok(res, ketQua);
  });

  static getCourtById = asyncHandler(async (req: Request, res: Response) => {
    const sanId = Number(req.params.id);
    const ketQua = await CatalogService.getCourtById(sanId);
    return ok(res, ketQua);
  });

  static getTimeSlots = asyncHandler(async (_req: Request, res: Response) => {
    const ketQua = await CatalogService.getTimeSlots();
    return ok(res, ketQua);
  });

  static getPublicConfig = asyncHandler(async (_req: Request, res: Response) => {
    const ketQua = await CatalogService.getPublicConfig();
    return ok(res, ketQua);
  });
}
