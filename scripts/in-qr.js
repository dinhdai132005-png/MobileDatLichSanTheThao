const qr = require('qrcode');
const os = require('os');

// Tự động tìm IP mạng LAN
function layIpLan() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254')) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = layIpLan();
const port = 8081;
const expoUrl = `exp://${ip}:${port}`;

console.clear();
console.log('\n=============================================================');
console.log('       📱 MÃ QR KẾT NỐI EXPO GO (ĐẶT LỊCH SÂN THỂ THAO)       ');
console.log('=============================================================');
console.log(`📡 Địa chỉ IP LAN: ${ip}`);
console.log(`🔗 Đường dẫn Expo: ${expoUrl}\n`);

qr.toString(expoUrl, { type: 'terminal', small: true }, (err, qrText) => {
  if (err) {
    console.error('Lỗi sinh mã QR:', err);
    return;
  }
  console.log(qrText);
  console.log('-------------------------------------------------------------');
  console.log('👉 HƯỚNG DẪN QUÉT:');
  console.log(' 1. Đảm bảo điện thoại và máy tính kết nối CÙNG MẠNG WI-FI.');
  console.log(' 2. Mở app EXPO GO trên điện thoại.');
  console.log(' 3. Bấm "Scan QR code" và quét mã QR trên màn hình terminal.');
  console.log('    (Hoặc nhập URL: ' + expoUrl + ')');
  console.log(' 4. Tài khoản khách mẫu: 0911111111 | Mật khẩu: 123456');
  console.log('=============================================================\n');
});
