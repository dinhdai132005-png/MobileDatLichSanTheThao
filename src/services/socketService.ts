// ============================================================
// SOCKET.IO CLIENT SERVICE - DỊCH VỤ KẾT NỐI VÀ LẮNG NGHE REAL-TIME
// Tính năng: Quản lý Socket.io client, Lắng nghe slot_updated, Real-time Simulation
// ============================================================

import { io, Socket } from 'socket.io-client';
import { SocketSlotUpdatePayload, SocketNewBookingPayload } from '../types';
import { SERVER_BASE_URL } from './config';

export const SOCKET_SERVER_URL = SERVER_BASE_URL;

class SocketService {
  private socket: Socket | null = null;
  private isConnectedState: boolean = false;
  private slotUpdateListeners: Array<(payload: SocketSlotUpdatePayload) => void> = [];
  private newBookingListeners: Array<(payload: SocketNewBookingPayload) => void> = [];

  /** Khởi tạo kết nối Socket.io Client an toàn */
  public connect(url: string = SERVER_BASE_URL): Socket | null {
    if (this.socket && this.socket.connected) {
      console.log('⚡ [Socket.io] Đã kết nối sẵn sàng:', this.socket.id);
      return this.socket;
    }

    try {
      console.log(`🔌 [Socket.io Client] Đang kết nối tới Gateway: ${url}...`);

      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnectionAttempts: 3,
        reconnectionDelay: 3000,
      });

      this.socket.connect();

      this.socket.on('connect', () => {
        this.isConnectedState = true;
        console.log(`✅ [Socket.io Client] Kết nối thành công! Socket ID: ${this.socket?.id}`);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnectedState = false;
        console.warn('⚠️ [Socket.io Client] Đã ngắt kết nối:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('📡 [Socket.io Client Warning] Lỗi kết nối Socket Gateway (Offline simulation active):', err.message);
      });

      this.socket.on('slot_updated', (payload: SocketSlotUpdatePayload) => {
        console.log('⚡ [Socket.io Event] Nhận slot_updated:', payload);
        this.slotUpdateListeners.forEach((fn) => fn(payload));
      });

      this.socket.on('new_booking', (payload: SocketNewBookingPayload) => {
        console.log('🔔 [Socket.io Event] Nhận new_booking:', payload);
        this.newBookingListeners.forEach((fn) => fn(payload));
      });
    } catch (err: any) {
      console.warn('🛡️ [Socket.io Safe Guard] Bắt lỗi khởi tạo Socket.io client:', err?.message || err);
    }

    return this.socket;
  }

  /** Lắng nghe sự kiện thay đổi khung giờ real-time */
  public onSlotUpdate(callback: (payload: SocketSlotUpdatePayload) => void): () => void {
    this.slotUpdateListeners.push(callback);
    return () => {
      this.slotUpdateListeners = this.slotUpdateListeners.filter((fn) => fn !== callback);
    };
  }

  /** Lắng nghe sự kiện đơn đặt hàng mới */
  public onNewBooking(callback: (payload: SocketNewBookingPayload) => void): () => void {
    this.newBookingListeners.push(callback);
    return () => {
      this.newBookingListeners = this.newBookingListeners.filter((fn) => fn !== callback);
    };
  }

  /** Phát sự kiện cập nhật khung giờ lên Socket Server */
  public emitSlotUpdate(sanId: string, gio: string, conTrong: boolean) {
    const payload: SocketSlotUpdatePayload = {
      sanId,
      gio,
      conTrong,
      timestamp: new Date().toISOString(),
    };

    try {
      if (this.socket && this.socket.connected) {
        console.log('📤 [Socket.io Emit] slot_updated -> Server:', payload);
        this.socket.emit('slot_updated', payload);
      } else {
        console.log('🧪 [Socket.io Simulation] Tự động phát sự kiện giả lập Local:', payload);
        this.slotUpdateListeners.forEach((fn) => fn(payload));
      }
    } catch (err) {
      console.log('🧪 [Socket.io Fallback Simulation]:', payload);
      this.slotUpdateListeners.forEach((fn) => fn(payload));
    }
  }

  /** Giả lập sự kiện Real-time từ xa để test UI trên Mobile */
  public simulateIncomingSlotUpdate(sanId: string, gio: string, conTrong: boolean) {
    const payload: SocketSlotUpdatePayload = {
      sanId,
      gio,
      conTrong,
      updatedBy: 'Người dùng khác (Real-time)',
      timestamp: new Date().toISOString(),
    };
    console.log('⚡ [Socket.io Simulator] Giả lập nhận event từ xa:', payload);
    this.slotUpdateListeners.forEach((fn) => fn(payload));
  }

  /** Ngắt kết nối socket */
  public disconnect() {
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (e) {}
      this.socket = null;
      this.isConnectedState = false;
    }
  }

  /** Kiểm tra trạng thái kết nối */
  public isConnected(): boolean {
    return this.isConnectedState || (this.socket?.connected ?? false);
  }
}

export const socketService = new SocketService();
