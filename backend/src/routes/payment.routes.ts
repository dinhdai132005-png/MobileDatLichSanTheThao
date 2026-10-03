// =====================================================================
// PAYMENT & WEBHOOK ROUTES — Xử lý IPN Webhook từ cổng thanh toán VietQR
// =====================================================================
import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db';
import { withTransaction } from '../utils/transaction';
import { ApiError } from '../utils/errors';
import { sendError, ok } from '../utils/response';
import { broadcastNewBooking } from '../socket';

const router = Router();
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'VIETQR_SECRET_KEY_123';

/**
 * POST /api/v1/payments/vietqr-webhook
 * Endpoint nhận IPN tự động từ cổng thanh toán hoặc hệ thống ngân hàng VietQR
 */
router.post('/vietqr-webhook', async (req: Request, res: Response) => {
  const { bookingCode, amount, transactionRef, secureSignature } = req.body;

  // 1. Kiểm tra chữ ký bảo mật
  if (!secureSignature || secureSignature !== WEBHOOK_SECRET) {
    return sendError(res, 'Chữ ký webhook không hợp lệ', 401, 'INVALID_SIGNATURE');
  }

  if (!bookingCode || !amount || !transactionRef) {
    return sendError(res, 'Thiếu thông tin bắt buộc trong payload webhook', 400, 'VALIDATION_ERROR');
  }

  try {
    const result = await withTransaction(async (conn) => {
      // 2. Tìm đơn đặt theo mã
      const [bookings] = await conn.execute<RowDataPacket[]>(
        'SELECT * FROM bookings WHERE booking_code = ? FOR UPDATE',
        [bookingCode]
      );

      if (bookings.length === 0) {
        throw ApiError.notFound('Không tìm thấy đơn đặt với mã đã cho', 'BOOKING_NOT_FOUND');
      }

      const booking = bookings[0];

      // 3. Cơ chế Idempotent: Nếu giao dịch này đã được ghi nhận trước đó
      const [existingPayments] = await conn.execute<RowDataPacket[]>(
        'SELECT id FROM payments WHERE transaction_ref = ? LIMIT 1',
        [transactionRef]
      );

      if (existingPayments.length > 0 || booking.payment_status === 'PAID') {
        return {
          alreadyProcessed: true,
          bookingId: booking.id,
          bookingCode: booking.booking_code,
          message: 'Giao dịch đã được xử lý trước đó (Idempotent)',
        };
      }

      // 4. Kiểm tra số tiền chuyển khoản
      if (Number(amount) !== Number(booking.total_amount)) {
        throw ApiError.unprocessable(
          `Số tiền chuyển khoản (${amount} ₫) không khớp với giá trị đơn hàng (${booking.total_amount} ₫)`,
          'AMOUNT_MISMATCH'
        );
      }

      // 5. Cập nhật trạng thái đơn sang CONFIRMED và PAID
      await conn.execute(
        `UPDATE bookings
         SET status = 'CONFIRMED', payment_status = 'PAID', expires_at = NULL
         WHERE id = ?`,
        [booking.id]
      );

      // 6. Ghi nhận giao dịch thanh toán thành công
      await conn.execute(
        `INSERT INTO payments (
           booking_id, type, method, amount, status, transaction_ref, processed_by, processed_at, note
         ) VALUES (?, 'PAYMENT', 'BANK_TRANSFER', ?, 'SUCCESS', ?, NULL, NOW(), 'VietQR IPN Webhook tự động xác nhận')`,
        [booking.id, amount, transactionRef]
      );

      // 7. Ghi nhật ký trạng thái
      if (booking.status === 'PENDING') {
        await conn.execute(
          `INSERT INTO booking_status_logs (booking_id, from_status, to_status, changed_by, note)
           VALUES (?, 'PENDING', 'CONFIRMED', NULL, 'Cổng VietQR Webhook tự động khớp giao dịch chuyển khoản')`,
          [booking.id]
        );
      }

      return {
        alreadyProcessed: false,
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        message: 'Xác nhận thanh toán tự động qua VietQR thành công',
      };
    });

    if (!result.alreadyProcessed) {
      try {
        broadcastNewBooking({
          maDon: result.bookingCode,
          sanId: 1,
          tongTien: 0,
          trangThai: 'CONFIRMED',
          gioBatDau: '',
          gioKetThuc: '',
          ngayDat: '',
        });
      } catch (e) {
        // Safe guard
      }
    }

    return ok(res, result, result.message, 200);
  } catch (error: any) {
    if (error instanceof ApiError) {
      return sendError(res, error.message, error.statusCode, error.errorCode);
    }
    return sendError(res, 'Lỗi xử lý webhook nội bộ', 500, 'INTERNAL_ERROR');
  }
});

export default router;
