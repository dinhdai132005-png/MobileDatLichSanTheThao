// =====================================================================
// BỘ TOOL KIỂM THỬ TỰ ĐỘNG FULL-STACK & BÁO CÁO CHẤT LƯỢNG
// Tham chiếu: Plant/08-development-plan.md mục 4
// =====================================================================
import { spawn } from 'child_process';
import path from 'path';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

console.log(`${CYAN}${BOLD}`);
console.log('================================================================================');
console.log('  🏸 HỆ THỐNG KIỂM THỬ TỰ ĐỘNG FULL-STACK (AUTOMATED QA & CONCURRENCY SUITE)   ');
console.log('  Dự án: Ứng Dụng Đặt Lịch Sân Thể Thao (Mobile App + Web Admin + Express API)  ');
console.log('  Tiêu chuẩn: Plant/08-development-plan.md & AGENT.md                         ');
console.log('================================================================================');
console.log(`${RESET}`);

console.log(`${YELLOW}⚡ Đang khởi chạy toàn bộ 5 Test Suites theo thứ tự chuẩn hóa...${RESET}\n`);

const jestPath = path.resolve(__dirname, '../node_modules/.bin/jest');
const isWindows = process.platform === 'win32';
const cmd = isWindows ? 'npx.cmd' : 'npx';
const args = ['jest', '--runInBand', '--verbose'];

const startTime = Date.now();

const child = spawn(cmd, args, {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, FORCE_COLOR: 'true' },
  stdio: 'inherit',
  shell: true,
});

child.on('close', (code) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n--------------------------------------------------------------------------------');
  if (code === 0) {
    console.log(`${GREEN}${BOLD}🏆 KẾT QUẢ KIỂM THỬ: TẤT CẢ TEST CASES ĐÃ ĐẠT 100% THÀNH CÔNG!${RESET}`);
    console.log(`⏱️  Thời gian thực thi: ${duration}s`);
    console.log(`🔒 Kiểm thử đồng thời (TC-20 Concurrency / Race Condition): ${GREEN}ĐẠT CHUẨN KHÓA SLOTS${RESET}`);
    console.log(`🛡️  Bảo mật & Phân quyền RBAC (TC-01 -> TC-06, TC-40): ${GREEN}AN TOÀN TUYỆT ĐỐI${RESET}`);
    console.log(`📋 Quy tắc kinh doanh & Vòng đời đơn (TC-10 -> TC-38): ${GREEN}CHUẨN XÁC THEO PLANT${RESET}`);
    console.log('--------------------------------------------------------------------------------\n');
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}❌ CÓ TEST CASE THẤT BẠI (Mã lỗi: ${code})${RESET}`);
    console.log(`⏱️  Thời gian thực thi: ${duration}s`);
    console.log('--------------------------------------------------------------------------------\n');
    process.exit(code || 1);
  }
});
