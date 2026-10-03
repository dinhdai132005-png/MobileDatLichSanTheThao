// =====================================================================
// REAL-TIME SOCKET.IO GATEWAY — Tham chiếu: Plant/07-architecture.md
// Quản lý kết nối WebSocket, đồng bộ trạng thái khung giờ và đơn đặt tức thì
// =====================================================================
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface ThongDiepKhungGioRealtime {
  sanId: string | number;
  gio: string;
  conTrong: boolean;
  ngayDat?: string;
  nguoiCapNhat?: string;
  timestamp: string;
}

export interface ThongDiepDonDatMoiRealtime {
  maDon: string;
  sanId: number;
  tenSan?: string;
  tongTien: number;
  trangThai: string;
  gioBatDau: string;
  gioKetThuc: string;
  ngayDat: string;
  timestamp: string;
}

let ioInstance: SocketIOServer | null = null;

/**
 * Khởi tạo Socket.io Server gắn liền với HTTP Server
 */
export function initSocket(server: http.Server): SocketIOServer {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: false,
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  ioInstance.on('connection', (socket: Socket) => {
    console.log(`🔌 [Socket.io Gateway] Client kết nối: ${socket.id} (IP: ${socket.handshake.address})`);

    // Khi có một client thông báo đổi trạng thái khung giờ (VD: user đang chọn/giữ)
    socket.on('slot_updated', (duLieu: ThongDiepKhungGioRealtime) => {
      console.log('⚡ [Socket.io Gateway] Nhận slot_updated từ client:', duLieu);
      // Phát lại cho tất cả client khác (trừ người gửi)
      socket.broadcast.emit('slot_updated', {
        ...duLieu,
        timestamp: duLieu.timestamp || new Date().toISOString(),
      });
    });

    // Client tham gia phòng theo sân (nếu muốn tối ưu kênh sau này)
    socket.on('join_court', (sanId: string | number) => {
      socket.join(`court_${sanId}`);
      console.log(`🏟️ [Socket.io Gateway] Socket ${socket.id} tham gia phòng court_${sanId}`);
    });

    socket.on('disconnect', (lyDo) => {
      console.log(`👋 [Socket.io Gateway] Client ngắt kết nối: ${socket.id} (${lyDo})`);
    });
  });

  return ioInstance;
}

/**
 * Lấy đối tượng Socket.io Server hiện tại
 */
export function getIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Phát sự kiện thay đổi trạng thái khung giờ tới TOÀN BỘ các client (Mobile & Web Admin)
 */
export function broadcastSlotUpdate(sanId: string | number, gio: string, conTrong: boolean, ngayDat?: string) {
  if (!ioInstance) return;

  const thongDiep: ThongDiepKhungGioRealtime = {
    sanId: String(sanId),
    gio,
    conTrong,
    ngayDat,
    timestamp: new Date().toISOString(),
  };

  ioInstance.emit('slot_updated', thongDiep);
  console.log(`📢 [Socket.io Broadcast] Đã phát slot_updated cho Sân ${sanId} - Giờ ${gio} (Còn trống: ${conTrong})`);
}

/**
 * Phát sự kiện có đơn đặt sân mới tới Web Admin và các client
 */
export function broadcastNewBooking(thongTinDon: Omit<ThongDiepDonDatMoiRealtime, 'timestamp'>) {
  if (!ioInstance) return;

  const thongDiep: ThongDiepDonDatMoiRealtime = {
    ...thongTinDon,
    timestamp: new Date().toISOString(),
  };

  ioInstance.emit('new_booking', thongDiep);
  console.log(`🔔 [Socket.io Broadcast] Đã phát new_booking: Đơn ${thongTinDon.maDon}`);
}
