// =====================================================================
// EXPRESS APPLICATION — Tham chiếu: Plant/07-architecture.md & AGENT.md
// Pattern: Route -> Controller -> Service -> DB
// =====================================================================
import express from 'express';
import cors from 'cors';
import path from 'path';
import { ENV } from './config/env';
import apiV1Router from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { ok, sendError } from './utils/response';

const app = express();

// --- Middlewares chuẩn ---
app.use(
  cors({
    origin: ENV.CORS_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Giao diện Web Admin tĩnh ---
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// --- T01: Health check endpoint ---
app.get('/health', (_req, res) => {
  return ok(res, { status: 'OK', timestamp: new Date().toISOString() }, 'Hệ thống hoạt động bình thường');
});

// --- API Routes theo chuẩn Plant/06-api.md (Base URL: /api/v1) ---
app.use('/api/v1', apiV1Router);

// Hỗ trợ tương thích ngược /api -> /api/v1
app.use('/api', apiV1Router);

// --- 404 handler ---
app.use((_req, res) => {
  return sendError(res, 'Endpoint không tồn tại hoặc sai phương thức HTTP', 404, 'NOT_FOUND');
});

// --- Global error handler ---
app.use(errorHandler);

export default app;
