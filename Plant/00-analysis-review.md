# 00 — PHẦN A: PHÂN TÍCH VÀ GÓP Ý

> **Cơ sở phân tích:** chưa có source code, schema DB, API hay file Markdown cũ nào được cung cấp. Các mục về "project hiện tại" vì vậy ghi **CHƯA ĐỦ DỮ LIỆU**. Phần phản biện dựa trên (1) định hướng kỹ thuật trong đề bài và (2) thực tế vận hành sân thể thao. Mọi đề xuất đều có lý do.

---

## 1. Project hiện tại đang làm gì — CHƯA ĐỦ DỮ LIỆU

Từ đề bài suy ra mục tiêu: "Hệ thống quản lý và đặt sân thể thao" gồm Mobile cho người dùng dịch vụ và Web Admin cho vận hành. Hiện trạng code, DB, API: **CHƯA ĐỦ DỮ LIỆU**.

## 2. Kiến trúc hiện tại — định hướng theo đề bài

```
Mobile / Web  →  REST API  →  Node.js + Express  →  MySQL
```
Đây là kiến trúc client–server 3 tầng chuẩn. Việc code đã theo đúng chưa: **CHƯA ĐỦ DỮ LIỆU**.

## 3. Công nghệ — theo đề bài

| Công nghệ | Quyết định |
|---|---|
| React Native + Expo + TS | **Giữ** (bắt buộc) |
| ReactJS + TS | **Giữ** (bắt buộc) |
| Node.js + Express + TS | **Giữ** (bắt buộc) |
| MySQL | **Giữ** (bắt buộc) |
| Thư viện khác đang có trong project | **CHƯA ĐỦ DỮ LIỆU** (xem `07-architecture.md` mục 4 để biết thư viện nào nên giữ, nên bỏ) |

## 4. Những điểm đúng trong định hướng

| Điểm | Lý do đúng |
|---|---|
| Mobile cho khách, Web cho quản trị | Khách cần tiện lợi, nhân viên cần màn hình lớn để xem lịch lưới |
| Một backend dùng chung | Một nơi chứa nghiệp vụ, tránh lệch logic. Đề bài đã nêu đúng |
| Pattern Route → Controller → Service | Đủ tách lớp mà không over-engineer |
| MySQL (quan hệ) | Dữ liệu đặt sân rất quan hệ (sân–giờ–đơn–thanh toán), cần transaction và ràng buộc |
| Yêu cầu "không over-engineer", "dễ bảo vệ" | Đúng ưu tiên cho đồ án |
| Yêu cầu tự phản biện nghiệp vụ | Hướng tư duy tốt: nghiệp vụ quyết định chất lượng đồ án |

## 5. Những điểm chưa hợp lý / rủi ro trong định hướng

| # | Vấn đề | Vì sao có vấn đề | Đề xuất |
|---|---|---|---|
| 5.1 | Đề bài để mở "hỗ trợ nhiều nghiệp vụ" (dịch vụ cơ sở, thanh toán nếu phù hợp...) | Không chốt phạm vi dễ phình scope, kết quả là nhiều thứ làm dở | Chốt P0/P1/P2 (xem README mục 5). P0 phải chạy hoàn chỉnh trước |
| 5.2 | Nhiều role "thực tế" (chủ sân, quản lý, kế toán, lễ tân, kỹ thuật...) | Mỗi role thêm ma trận quyền, màn hình, test. Đồ án 1 cơ sở không cần | **3 role: CUSTOMER, STAFF, ADMIN** |
| 5.3 | "Thanh toán" mơ hồ (có tích hợp cổng không?) | Tích hợp thật (VNPay, MoMo) tốn thời gian, phụ thuộc mạng, khó demo | Baseline: tiền mặt + chuyển khoản có xác nhận. VNPay sandbox là P2 |
| 5.4 | Chống trùng lịch nếu chỉ kiểm tra ở code | Hai request đồng thời cùng qua bước kiểm tra, cả hai INSERT thành công | UNIQUE KEY ở DB + transaction (D4) |
| 5.5 | Giờ đặt tự do (bắt đầu/kết thúc bất kỳ) | Phải kiểm tra chồng lấn khoảng thời gian, bảng giá phức tạp, khó test | Khung giờ cố định 1 giờ (D3) |
| 5.6 | Không có nhân viên đặt hộ | Thực tế rất nhiều khách gọi điện hoặc đến trực tiếp. Hệ thống chỉ có app sẽ lệch thực tế | Thêm "đặt tại quầy" (STF-04) |
| 5.7 | Mobile cho cả nhân viên | Nhân viên cần lịch lưới lớn, không hợp màn hình nhỏ. Thêm một bộ màn hình | Mobile chỉ cho khách (BR-18) |

## 6. Mô hình nghiệp vụ được đề xuất

Chi tiết ở `03-actors-functions.md`. Tóm tắt:

- **Một cơ sở, nhiều sân thuộc nhiều loại sân.**
- **Khung giờ cố định 1 giờ** (06:00–22:00, cấu hình được). Giá theo `loại sân × khung giờ × ngày thường/cuối tuần`.
- **Đơn đặt sân** gồm 1–3 khung giờ liền kề, cùng sân, cùng ngày.
- **Vòng đời đơn:** `PENDING → CONFIRMED → COMPLETED`, nhánh `CANCELLED`, `EXPIRED`, `NO_SHOW`.
- **Thanh toán toàn phần**, hai kênh: tiền mặt tại sân hoặc chuyển khoản (nhân viên xác nhận).
- **Hủy:** khách hủy được nếu còn ≥ 6 giờ. Đơn đã trả được hoàn 100% (nhân viên xác nhận đã hoàn).
- **Đặt tại quầy:** nhân viên nhập hộ, khách không cần tài khoản.

## 7. Actor / role được đề xuất

| Role | Lý do tồn tại | Lý do không tách nhỏ hơn |
|---|---|---|
| CUSTOMER | Người dùng dịch vụ | — |
| STAFF | Vận hành hằng ngày: lịch, thu tiền, hoàn thành | Gộp lễ tân + thu ngân + quản lý ca |
| ADMIN | Cấu hình, tài khoản, báo cáo | Gộp chủ sân + quản lý. ADMIN ⊃ STAFF |
| Scheduler (hệ thống) | Hết hạn giữ chỗ tự động | Không phải người dùng |

Ranh giới dễ nhớ: **STAFF = "việc hôm nay"**, **ADMIN = "cấu hình và con số tổng"**.

## 8. Chức năng được đề xuất

Danh mục đầy đủ ở `03-actors-functions.md` mục 4 (mã CUS-xx, STF-xx, ADM-xx, SYS-xx).

## 9. Database được đề xuất

8 bảng P0 + 2 bảng P1 (+ 2 bảng P2):

- **P0:** `users`, `court_types`, `courts`, `time_slots`, `slot_prices`, `bookings`, `booking_slots`, `payments`
- **P1:** `booking_status_logs`, `reviews`
- **P2:** `services`, `booking_services`

Mỗi bảng đều có lý do nghiệp vụ (xem `01-database.md` mục 4). Không có bảng "cho đẹp sơ đồ". **Không có** bảng `roles`, `permissions`, `notifications`, `vouchers`, `branches`. Lý do ở mục 11.

## 10. API được đề xuất

REST `/api/v1`, chia theo đối tượng: **public/auth**, **customer**, `/staff/*` (STAFF + ADMIN), `/admin/*` (ADMIN). Khoảng 55 endpoint, đặc tả ở `06-api.md`.

## 11. Những phần nên BỎ (và lý do)

| Bỏ | Lý do |
|---|---|
| Marketplace nhiều chủ sân/chi nhánh | Kéo theo duyệt chủ sân, hoa hồng, đối soát, phân quyền theo cơ sở |
| RBAC động (bảng roles/permissions) | 3 role cố định là đủ, giải thích dễ |
| Voucher, khuyến mãi, tích điểm | Logic giá phức tạp, ảnh hưởng toàn bộ luồng tính tiền |
| Đặt định kỳ (cố định thứ 3 hằng tuần) | Sinh nhiều đơn tự động, xử lý ngoại lệ (lễ, bảo trì) rất rắc rối |
| Ghép đội/tìm đối thủ, giải đấu, chat | Là một sản phẩm khác |
| Thanh toán một phần/đặt cọc | Thêm trạng thái thanh toán, chính sách hoàn tiền phức tạp |
| Realtime (WebSocket) | Làm mới lưới bằng nút "Tải lại" hoặc polling 30 giây là đủ |
| Refresh token, quên mật khẩu qua email | Cần SMTP, thêm bảng và luồng. Admin có thể đặt lại mật khẩu thủ công |
| Chặn bảo trì theo giờ/ngày (court_blocks) | Dùng trạng thái sân `MAINTENANCE` đơn giản hơn (BR-05) |
| Quản lý tồn kho dịch vụ | Dịch vụ (P2) chỉ có giá, không tồn kho |
| Đa ngôn ngữ, dark mode | Không phải trọng tâm |

## 12. Những phần nên BỔ SUNG (so với một thiết kế "ngây thơ")

| Bổ sung | Lý do |
|---|---|
| Hết hạn giữ chỗ (`expires_at` + job) | Không có thì đơn chờ thanh toán giữ sân mãi |
| Chính sách hủy/hoàn tiền rõ ràng | Giảng viên chắc chắn hỏi "hủy thì sao?" |
| Giá snapshot trong `booking_slots` | Đổi giá không làm sai lịch sử |
| `booking_status_logs` | Truy vết, tranh chấp |
| Đặt tại quầy (guest) | Sát thực tế |
| Giới hạn số đơn đang hoạt động/khách | Chống chiếm chỗ ảo bằng đơn trả tại sân |
| `no_show` | Có thực tế vận hành, cần để thống kê |
| Quy tắc "không đổi trạng thái sân khi còn đơn tương lai" | Tránh đơn mồ côi |
| Múi giờ cố định `+07:00` | Tránh lỗi lệch ngày khi server chạy UTC |

## 13. Những phần quá phức tạp — cảnh báo

| Phần | Mức rủi ro | Cách giữ đơn giản |
|---|---|---|
| Tích hợp VNPay | Cao | Để P2, chỉ sandbox |
| Báo cáo tỷ lệ lấp đầy | Trung bình | Một truy vết SQL, không làm biểu đồ phức tạp |
| Lưới lịch sân (Web) | Trung bình | Bảng HTML thuần: hàng = khung giờ, cột = sân |
| Đa chi nhánh | Cao | Không làm. Ghi vào "hướng mở rộng" |
| Ma trận giá | Thấp–Trung bình | Màn hình bảng sửa tại chỗ + nút "sao chép từ ngày thường sang cuối tuần" |

## 14. Rủi ro khi bảo vệ (G)

| Rủi ro | Cách phòng |
|---|---|
| Không giải thích được chống trùng lịch | Học thuộc: UNIQUE KEY `uq_slot_active` + `is_locked NULL` khi hủy. Có test đồng thời (T-case 5) |
| Bị hỏi "tại sao không dùng ORM" | Câu trả lời trong `09-defense-guide.md` |
| Sơ đồ UML không khớp DB/API | Dùng `10-sync-check.md` để kiểm tra trước khi nộp |
| Demo thanh toán lỗi do mạng | Baseline không phụ thuộc cổng ngoài |
| Hỏi "hệ thống có xử lý người dùng đặt cùng lúc không" | Chuẩn bị demo 2 trình duyệt |
| Hỏi quyền, bảo mật | Nắm: JWT, bcrypt, role middleware server-side, SQL tham số hóa |
| Hỏi "nếu server sập giữa lúc đặt" | Transaction: hoặc có cả `bookings`+`booking_slots` hoặc không có gì |

Danh sách 30 câu hỏi và đáp án: `09-defense-guide.md`.

---

## KẾT LUẬN (theo mục 17 của đề bài)

| # | Nội dung | Ở đâu |
|---|---|---|
| 1 | Mô hình nghiệp vụ đề xuất | Mục 6 ở trên, `03` mục 1 |
| 2 | Actor/role | Mục 7, `03` mục 2–3 |
| 3 | Chức năng | `03` mục 4 |
| 4 | Kiến trúc | `07` |
| 5 | Công nghệ | `README` mục 4, `07` mục 4 |
| 6 | Database MySQL | `01` |
| 7 | Bộ Markdown cần có | `README` mục 3 |
| 8 | Vấn đề cần xử lý trước khi code tiếp | Bên dưới |
| 9 | Thứ tự triển khai | `08` |
| 10 | Câu hỏi giảng viên | `09` |

### Vấn đề cần xử lý trước khi code tiếp (mục 17.8)

1. **Đối chiếu repo hiện có với bộ tài liệu này** (`10-sync-check.md` mục 6). Nếu đã có code theo nghiệp vụ khác, quyết định giữ hay chuyển.
2. **Chốt các câu hỏi mở** (`10` mục 7). Mỗi câu đã có mặc định nên không chặn việc code.
3. **Chốt schema DB** theo `01-database.md` trước khi viết API. Đây là nền móng, sửa sau rất tốn.
4. **Tạo `seed.sql`** (loại sân, sân, khung giờ, giá) để demo và test có dữ liệu.
5. **Đặt múi giờ** server và MySQL về `+07:00`.
