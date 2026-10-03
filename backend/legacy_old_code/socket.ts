// ============================================================
// SOCKET.IO SERVER — Real-time đồng bộ khung giờ
// Events phát ra: slot_updated, new_booking, booking_confirmed
// ============================================================
import { Server, Socket } from 'socket.io';
import http from 'http';

let io: Server;

export function initSocket(httpServer: http.Server): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 [Socket.io] Client kết nối: ${socket.id}`);

    // Client join vào room của sân cụ thể để nhận update
    socket.on('join_san', (sanId: string) => {
      socket.join(`san:${sanId}`);
      console.log(`📌 [Socket.io] Client ${socket.id} join room san:${sanId}`);
    });

    socket.on('leave_san', (sanId: string) => {
      socket.leave(`san:${sanId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Client ngắt kết nối: ${socket.id}`);
    });
  });

  return io;
}

/** Phát sự kiện cập nhật slot về cho tất cả client đang xem sân đó */
export function emitSlotUpdated(sanId: string, payload: {
  gio: string;
  trangThai: string;
  ngayDat: string;
}) {
  if (!io) return;
  io.to(`san:${sanId}`).emit('slot_updated', { sanId, ...payload, timestamp: new Date().toISOString() });
  console.log(`📡 [Socket.io] Emit slot_updated → san:${sanId}`, payload);
}

/** Phát sự kiện đơn mới đến tất cả Admin/Staff */
export function emitNewBooking(donDatId: string, sanId: string, tenKhach: string) {
  if (!io) return;
  io.emit('new_booking', { donDatId, sanId, tenKhach, timestamp: new Date().toISOString() });
}
