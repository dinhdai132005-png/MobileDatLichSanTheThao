# Project Rules & Guidelines: ĐẶT LỊCH SÂN THỂ THAO

> **Triết lý cốt lõi**: *"Strict where correctness matters, autonomous where the scope is clear."*  
> Nghiêm ngặt ở nơi quyết định tính đúng đắn — Tự chủ linh hoạt ở nơi phạm vi đã rõ ràng.

---

## 🏛️ LAYER 1: NGUYÊN TẮC BẤT BIẾN (ALWAYS APPLIED)

### 1.1. Điều tra trước khi hỏi (Investigate First)
AI tuyệt đối **KHÔNG** hỏi những câu hỏi mà câu trả lời đã có sẵn trong:
- Codebase, Schema Firebase/Supabase, migrations hiện có.
- Bộ cẩm nang đặc tả: [`CHUC_NANG_HE_THONG.md`](file:///d:/MonHoc/DatLichSanTheThao/CHUC_NANG_HE_THONG.md), [`BAO_CAO_NGHIEP_VU.md`](file:///d:/MonHoc/DatLichSanTheThao/BAO_CAO_NGHIEP_VU.md), [`BAO_CAO_TUAN_1.md`](file:///d:/MonHoc/DatLichSanTheThao/BAO_CAO_TUAN_1.md).
- Lịch sử Git hoặc các test cases hiện tại.

### 1.2. Hàng rào phạm vi (Scope Guard & Enabling Changes)
- **Không mở rộng phạm vi (No Scope Creep)**: Không tự ý đổi kiến trúc, quy tắc nghiệp vụ đặt sân, tiền tệ (VND) hoặc thêm thư viện lạ ngoài stack đã định (React Native / Expo).
- **Ngoại lệ hợp lệ (Enabling Changes)**: Được phép thực hiện các sửa đổi phụ trợ tối thiểu (như export thêm Type chung trong `types.ts`, chỉnh prop dùng chung) nếu đó là điều kiện tiên quyết để task hiện tại hoạt động.
- **Phát hiện bug ngoài phạm vi**: Ghi chú lại và báo cáo sau task, không sửa chen ngang làm gãy luồng chính.

### 1.3. Bảo mật & An toàn dữ liệu
- Không bao giờ commit secrets (`.env*`, Firebase API keys, Supabase keys), build outputs, cache.
- Tách biệt tuyệt đối giữa môi trường `development` và `production`. Dữ liệu test không bao giờ được ghi đè hay xóa dữ liệu thật của người dùng và chủ sân.

### 1.4. Quy chuẩn Git Commit
- Sử dụng **Conventional Commits tiếng Việt không dấu**: `feat(...)`, `fix(...)`, `test(...)`, `chore(...)`, `refactor(...)`, `style(...)`, `docs(...)`.
- Luôn chạy `git status` và `git add <tệp_cụ_thể>` trước khi commit.

### 1.5. Quy trình Hậu Sửa Lỗi & Đúc Rút Kinh Nghiệm (Post-Fix Retrospective & Prevention)
Sau mỗi lần xử lý bug, lỗ hổng bảo mật, lỗi schema hoặc lỗi kiểm thử (Post-Task Audit / Bug Fix), AI **BẮT BUỘC** tuân thủ quy trình 4 bước:
1. **Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis - RCA)**: Xác định rõ tại sao lỗi xảy ra (do thiết kế schema đặt sân, thiếu guard state slot, thiếu middleware xác thực, hay vấn đề môi trường runtime Expo).
2. **Khóa Lỗi bằng Regression Test**: Viết bổ sung ít nhất 1 test case tái hiện lỗi và chứng minh lỗi đã được khắc phục hoàn toàn (ví dụ: test double-booking cùng ô giờ, 401 unauth, 403 forbidden khi User cố vào màn Admin).
3. **Quét Phòng ngừa Toàn diện (Horizontal Scan)**: Lập tức rà soát các module, screens, components còn lại trong dự án xem có tồn tại mô hình lỗi tương tự hay không để xử lý đồng bộ.
4. **Ghi chép Bài học vào [`BAO_CAO_TUAN_1.md`](file:///d:/MonHoc/DatLichSanTheThao/BAO_CAO_TUAN_1.md)**: Ghi nhận chi tiết nguyên nhân, giải pháp và nguyên tắc phòng ngừa vào Mục "Bài học kinh nghiệm & Quy tắc phòng ngừa lỗi" để các task tiếp theo tuyệt đối không tái phạm.

---

## ⚡ LAYER 2: QUY CHUẨN THỰC THI THEO RỦI RO (RISK-BASED WORKFLOW)

| Cấp độ Task | Phạm vi công việc | Quy trình Code (TDD) | Phương pháp Kiểm chứng (Verification) | Cập nhật Tiến độ |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Nhỏ / UI / Docs** | Sửa style, màu sắc, font, text nhãn, layout màn hình tĩnh, cập nhật tài liệu. | **Không cần TDD**. Triển khai ngay và kiểm tra trực quan trên Expo Go. | Chạy `npx expo lint` (hoặc lint file sửa). **Không cần chạy full test/doctor.** | Ghi chú ngắn vào [`BAO_CAO_TUAN_1.md`](file:///d:/MonHoc/DatLichSanTheThao/BAO_CAO_TUAN_1.md). |
| **Tier 2: Logic / API / State** | Viết logic đặt sân, tính tiền theo giờ/ca, kiểm tra ô giờ trống (slot availability), phân quyền User/Admin, xử lý state, fix bug logic. | **Bắt buộc TDD**: Viết test đỏ $\rightarrow$ Code xanh $\rightarrow$ Tối ưu. | Chạy test suite liên quan + `npx expo lint` pass 100%. | Ghi log chi tiết vào [`BAO_CAO_TUAN_1.md`](file:///d:/MonHoc/DatLichSanTheThao/BAO_CAO_TUAN_1.md). |
| **Tier 3: Schema / Contract** | Thay đổi cấu trúc Collection Firestore/Supabase, API DTO, cấu trúc dữ liệu đặt sân, thông báo (Push Notification events). | **Spec-First**: Đối soát [`BAO_CAO_NGHIEP_VU.md`](file:///d:/MonHoc/DatLichSanTheThao/BAO_CAO_NGHIEP_VU.md) $\rightarrow$ Viết Migration $\rightarrow$ Viết Test. | Chạy test contract + DB integration test + Lint. | Ghi log chi tiết vào [`BAO_CAO_TUAN_1.md`](file:///d:/MonHoc/DatLichSanTheThao/BAO_CAO_TUAN_1.md). |

### 2.1. Quy tắc làm rõ nghiệp vụ (Business Ambiguity)
* Khi phát hiện điểm mơ hồ về **tiền tệ (VND), chính sách hủy đặt sân và hoàn tiền, quy tắc khóa ô giờ (Slot Locking), hoặc logic tính giá cao điểm/thấp điểm (Peak/Off-peak Pricing)**: Bắt buộc dừng lại và hỏi người dùng trước khi code.

### 2.2. Kích hoạt Kỹ năng (Pragmatic Skills Usage)
* Chỉ invoke kỹ năng trong `.agents/skills/` khi: (1) Skill thực sự tồn tại, (2) Liên quan trực tiếp đến domain của task (UI/UX mobile, TDD, Debugging, Expo), và (3) Lợi ích đem lại lớn hơn chi phí overhead. Không gọi skill chỉ để đối phó hình thức.

---

## 🏁 LAYER 3: NGHIỆM THU MILESTONE & RELEASE GATES

Khi hoàn thành toàn bộ một **Module (M-1 đến M-N)** hoặc một **Vertical Slice lớn**:

1. **Full Quality Check**:
   - Bắt buộc chạy lệnh tổng hợp: `npm run check` (hoặc tương đương trong Expo)
   - Điều kiện đạt:
     * `npx tsc --noEmit` pass 100% không lỗi TypeScript.
     * `npx expo-doctor` xác nhận 100% tương thích thư viện Expo SDK hiện tại.
     * `npx expo lint` sạch lỗi ESLint và React Hooks rules.
     * `npm test` vượt qua toàn bộ test suite (Jest + React Native Testing Library).
2. **Đồng bộ hóa Tài Liệu Tiến Độ**:
   - [`BAO_CAO_TUAN_1.md`](file:///d:/MonHoc/DatLichSanTheThao/BAO_CAO_TUAN_1.md): Cập nhật bảng % tổng thể, checklist hoàn thành và ghi log nhật ký công việc.
   - [`BAO_CAO_NGHIEP_VU.md`](file:///d:/MonHoc/DatLichSanTheThao/BAO_CAO_NGHIEP_VU.md): Đối chiếu lại các use case đã triển khai đúng nghiệp vụ.
3. **Commit & Push**:
   - Thực hiện Git commit theo chuẩn Conventional Commits và đẩy mã nguồn lên nhánh chính trên GitHub.
