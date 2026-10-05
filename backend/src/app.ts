// =====================================================================
// KHỞI TẠO EXPRESS APP — Cấu hình CORS, parser, routes và middleware lỗi
// =====================================================================
import express, { Request, Response } from 'express';
import cors from 'cors';
import { apiV1Router } from './routes';
import { xuLyLoi } from './middlewares/loi.middleware';
import { LoiApi } from './utils/loi';

import path from 'path';

export const app = express();

// Middleware cơ bản
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ giao diện Web Admin tĩnh (plant/05-pages-sitemap.md & plant/08-development-plan.md)
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'DatLichSanTheThao Backend',
    timestamp: new Date().toISOString(),
  });
});

// Gắn toàn bộ REST API v1
app.use('/api/v1', apiV1Router);

// Bắt 404 cho các route không tồn tại
app.use((_req: Request, _res: Response, next) => {
  next(LoiApi.khongTimThay('Đường dẫn API không tồn tại'));
});

// Middleware xử lý lỗi toàn cục
app.use(xuLyLoi);
