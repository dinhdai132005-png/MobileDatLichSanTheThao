# HỆ THỐNG QUẢN LÝ VÀ ĐẶT SÂN THỂ THAO

> Tài liệu nguồn tham chiếu (single source of truth) cho toàn bộ project. **Phiên bản 1.2** (xem mục 8 Lịch sử thay đổi).
> Đối tượng đọc: sinh viên (chủ đồ án), giảng viên, và **công cụ AI được giao code**.

---

## 0. Chú thích trạng thái (dùng xuyên suốt mọi file)

| Nhãn | Ý nghĩa |
|---|---|
| **ĐÃ CÓ** | Đã tồn tại trong project và đã được đối chiếu |
| **CHƯA TRIỂN KHAI** | Đã thiết kế, chưa có code |
| **ĐỀ XUẤT** | Quyết định thiết kế do phân tích đưa ra, cần chủ project chấp thuận |
| **CHƯA ĐỦ DỮ LIỆU** | Cần thông tin từ chủ project mới chốt được |

**Hiện trạng tài liệu này:** bộ tài liệu được lập khi **chưa có source code, schema DB hay file Markdown cũ nào được cung cấp để đối chiếu**. Vì vậy:

- Toàn bộ nội dung là **ĐỀ XUẤT**, toàn bộ code là **CHƯA TRIỂN KHAI**.
- Nếu repo của bạn đã có phần nào đó, hãy dùng `10-sync-check.md` mục 6 (Checklist đối chiếu) để cập nhật nhãn thành **ĐÃ CÓ** hoặc sửa tài liệu cho khớp.
- Các điểm cần chủ project xác nhận nằm ở `10-sync-check.md` mục 7 (**CHƯA ĐỦ DỮ LIỆU**). Mỗi điểm đều đã có giá trị mặc định, nên AI có thể code ngay mà không bị chặn.

---

## 1. Hệ thống làm gì (ĐỀ XUẤT)

Một đơn vị vận hành **một cơ sở thể thao có nhiều sân** (bóng đá mini, cầu lông, tennis, pickleball...).

- **Khách hàng** dùng **ứng dụng Mobile** để xem sân, xem lịch trống và giá, đặt sân theo khung giờ, thanh toán, hủy, xem lịch sử, đánh giá.
- **Nhân viên** dùng **Web** để điều hành hằng ngày: xem lịch sân, đặt sân tại quầy hoặc qua điện thoại, ghi nhận thanh toán, hoàn thành hoặc đánh dấu vắng mặt, xử lý hủy và hoàn tiền.
- **Quản trị viên** dùng **Web** để cấu hình (loại sân, sân, khung giờ, bảng giá, tài khoản nhân viên) và xem báo cáo.

**Dịch vụ phát sinh (góp ý giảng viên):** trong buổi chơi, khách gọi **đồ uống, thuê đồ (vợt, giày...) hoặc gói tiệc** ngay trên app; **nhân viên mang ra**; khi khách trả đồ và ra về, các khoản đã giao được **cộng vào hóa đơn** và nhân viên thu tiền tại quầy. **Khu tổ chức sự kiện/tiệc** (phòng tiệc, khu BBQ) được đặt theo giờ như sân thể thao và thu thêm phí thuê khu vực.

Mô hình đặt sân: **khung giờ cố định 1 giờ**, giá theo **loại sân × khung giờ × (ngày thường/cuối tuần)**, thanh toán **tại sân (tiền mặt)** hoặc **chuyển khoản có nhân viên xác nhận**. VNPay sandbox là phần mở rộng (P2).

## 2. Actor / Role (ĐỀ XUẤT)

| Role | Nền tảng | Mô tả ngắn |
|---|---|---|
| `CUSTOMER` | Mobile | Đặt và quản lý đặt sân của chính mình |
| `STAFF` | Web | Vận hành hằng ngày |
| `ADMIN` | Web | Toàn quyền của STAFF, cộng cấu hình, tài khoản, báo cáo |
| Scheduler | Hệ thống (không phải người) | Job tự hết hạn giữ chỗ |

## 3. Bản đồ tài liệu

| File | Nội dung | Đọc khi |
|---|---|---|
| `README.md` | Tổng quan, quyết định chính, bảng tra cứu | Luôn đọc đầu tiên |
| `AGENT.md` | **Luật chơi cho AI code**: quy ước, mẫu code, điều cấm | AI bắt đầu bất kỳ task nào |
| `00-analysis-review.md` | Phần A: phân tích, phản biện, rủi ro bảo vệ | Hiểu *vì sao* thiết kế như vậy |
| `01-database.md` | ER, DDL MySQL, enum, truy vấn quan trọng | Làm DB, backend, hoặc hỏi về dữ liệu |
| `02-uml-diagrams.md` | Use Case, Activity, Sequence, State, Class (Mermaid) | Báo cáo, bảo vệ, hiểu luồng |
| `03-actors-functions.md` | Role, ma trận quyền, danh mục chức năng, **quy tắc nghiệp vụ BR-xx** | Mọi lúc cần biết "được làm gì" |
| `04-function-details-flows.md` | Luồng chi tiết từng chức năng (bước, lỗi, hậu điều kiện) | Cài đặt service/screen |
| `05-pages-sitemap.md` | Sitemap Web và Mobile, wireframe, quy ước UI | Làm frontend |
| `06-api.md` | Đặc tả REST API (hợp đồng giữa FE và BE) | Làm API hoặc gọi API |
| `07-architecture.md` | Kiến trúc, cấu trúc thư mục, tech stack, dữ liệu dùng chung | Khởi tạo project |
| `08-development-plan.md` | **Danh sách task có thứ tự cho AI**, tiêu chí nghiệm thu, test case | Lập kế hoạch và giao việc |
| `09-defense-guide.md` | Kịch bản demo, câu hỏi giảng viên và đáp án | Chuẩn bị bảo vệ |
| `10-sync-check.md` | Ma trận truy vết, kiểm tra đồng bộ, câu hỏi còn mở | Review và kiểm tra |
| `11-end-to-end-flows.md` | **Luồng liền mạch Mobile ↔ API ↔ DB ↔ Web**: 9 kịch bản E2E, ma trận bàn giao, điểm lệch đã sửa | Nghiệm thu, demo, hiểu hệ thống chạy trọn vẹn |

**Thứ tự đọc cho AI:** `README` → `AGENT` → `03` → `01` → `06` → `04` → `05` → `07` → `11` (để hiểu bức tranh liền mạch) → `08`.

**Ghi chú về tên file:** file `06-css-rules.md` trong danh sách cũ được gộp thành mục "Quy ước giao diện" trong `05-pages-sitemap.md` (nội dung ngắn, không đáng một file riêng). `02-class-diagram.md` được mở rộng thành `02-uml-diagrams.md` để chứa đủ các loại sơ đồ.

## 4. Công nghệ (ĐỀ XUẤT, bắt buộc theo yêu cầu đề bài)

| Lớp | Công nghệ |
|---|---|
| Mobile | React Native + Expo + TypeScript (Expo Router) |
| Web | ReactJS + TypeScript (Vite) |
| Backend | Node.js + Express + TypeScript, REST API |
| Database | MySQL 8 (driver `mysql2`, viết SQL thuần, không ORM) |
| Xác thực | JWT (Bearer token) + bcrypt |

Chi tiết và danh sách thư viện: xem `07-architecture.md`.

```
 Mobile (Expo)  ─┐
                 ├──►  REST API  ──►  Node.js + Express  ──►  MySQL
 Web (ReactJS)  ─┘   (/api/v1)       Route→Controller→Service
```

Mobile và Web dùng **chung một Backend**.

## 5. Phạm vi triển khai

| Mức | Ý nghĩa | Nội dung |
|---|---|---|
| **P0** | Bắt buộc, không có là hỏng đồ án | Đăng ký, đăng nhập, danh mục sân, lịch trống, đặt sân (chống trùng), hết hạn giữ chỗ, thanh toán tiền mặt hoặc chuyển khoản, hủy, hoàn tiền, lịch sân cho nhân viên, đặt tại quầy, hoàn thành hoặc no-show, CRUD cấu hình của admin |
| **P1★** | Theo góp ý giảng viên, nên làm ngay sau P0 | **Dịch vụ phát sinh:** danh mục dịch vụ (đồ uống, thuê đồ, gói tiệc), khách gọi dịch vụ trên app, nhân viên giao và nhận lại đồ thuê, hóa đơn, thu tiền dịch vụ; **khu sự kiện/tiệc** |
| **P1** | Nên có nếu còn thời gian | Đánh giá sân, báo cáo doanh thu và tỷ lệ lấp đầy, quản lý khách hàng (khóa/mở), tra cứu khách, nhật ký trạng thái booking |
| **P2** | Tùy chọn | VNPay sandbox, thông báo trong app |

## 6. Các quyết định thiết kế chính (và lý do)

| # | Quyết định | Lý do ngắn |
|---|---|---|
| D1 | **1 cơ sở, nhiều sân**, không làm marketplace nhiều chủ sân | Marketplace kéo theo hoa hồng, duyệt chủ sân, đối soát. Không phù hợp đồ án |
| D2 | **3 role cố định** lưu trong cột `users.role`, không làm bảng role/permission động | Quyền đơn giản, giải thích được trong 1 slide |
| D3 | **Khung giờ cố định 1 giờ** (bảng `time_slots`), không cho chọn giờ tự do | Chống trùng lịch bằng ràng buộc DB, bảng giá dạng ma trận dễ hiểu |
| D4 | **Chống trùng lịch bằng UNIQUE KEY ở DB** (`booking_slots`), không chỉ kiểm tra ở code | Race condition: hai người bấm đặt cùng lúc vẫn chỉ một người thành công |
| D5 | Tách `bookings` (đơn) và `booking_slots` (từng giờ) | Một đơn có thể gồm 1–3 giờ liền kề, mỗi giờ có giá snapshot riêng |
| D6 | **Giá snapshot** trong `booking_slots.price` | Đổi bảng giá sau này không làm sai đơn cũ |
| D7 | Thanh toán: **tiền mặt tại sân** và **chuyển khoản + nhân viên xác nhận**. VNPay là P2 | Không phụ thuộc cổng thanh toán, demo ổn định |
| D8 | **Giữ chỗ 30 phút** cho đơn chuyển khoản, quá hạn tự `EXPIRED` | Tránh giữ sân vô hạn |
| D9 | Chính sách hủy đơn giản: khách hủy trước ≥ 6 giờ, hoàn 100% nếu đã trả. Nhân viên hủy bất kỳ lúc nào | Dễ cài đặt, dễ kiểm thử |
| D10 | **Nhân viên đặt hộ tại quầy**, khách không cần tài khoản (`guest_name`, `guest_phone`) | Thực tế sân thể thao có khách vãng lai và đặt qua điện thoại |
| D11 | Không xóa cứng, chỉ vô hiệu hóa | Giữ lịch sử và toàn vẹn khóa ngoại |
| D12 | Có `booking_status_logs` | Truy vết ai đổi trạng thái lúc nào, giải quyết tranh chấp |
| D13 | Tiền lưu `INT UNSIGNED` (VND, không có phần lẻ) | `DECIMAL` trả về string trong `mysql2`, dễ lỗi |
| D14 | **Dịch vụ phát sinh gắn với đơn sân** qua `service_orders` / `service_order_items`, vòng đời `REQUESTED → DELIVERED / CANCELLED` | Khớp quy trình thực tế: khách gọi, nhân viên mang ra, tính tiền khi giao |
| D15 | **Hóa đơn không phải bảng riêng**: `grandTotal = court_amount + service_amount`, tính khi đọc từ dữ liệu có sẵn | Tránh dữ liệu trùng lặp, luôn khớp với `payments` |
| D16 | Chỉ yêu cầu **đã giao** mới tính tiền; tiền dịch vụ **thu tại quầy**, có thể thu nhiều lần; tiền sân vẫn thu như cũ | Giữ nguyên quy tắc tiền sân (BR-11), không xung đột với việc gọi thêm đồ sau khi đã trả sân |
| D17 | **Khu sự kiện/tiệc = loại sân `category = EVENT`**, không làm module riêng; phần ăn uống = dịch vụ `PACKAGE`/`DRINK` | Dùng lại toàn bộ cơ chế khung giờ, giá, chống trùng, thanh toán, hủy; thu thêm phí mà không thêm bảng đặt chỗ mới |
| D18 | **Không quản lý tồn kho**, thuê đồ tính **một lần theo buổi**, nhân viên bật tắt "tạm hết hàng" | Giữ phạm vi vừa đủ; đền bù mất/hỏng xử lý ngoài hệ thống |
| D19 | **Đóng đơn có công nợ** do ADMIN thực hiện, không xóa nợ bằng cách tạo `payments` giả | Không có lối này, đơn đã giao dịch vụ mà khách bỏ đi sẽ kẹt `CONFIRMED` vĩnh viễn; giữ nguyên số liệu doanh thu thật |
| D20 | **Không realtime**: tự làm mới 30 giây ở cả Mobile và Web; server là nguồn sự thật | Đủ liền mạch cho nghiệp vụ sân, tránh WebSocket |

## 7. Thuật ngữ

| Thuật ngữ | Nghĩa |
|---|---|
| Court / Sân | Một sân cụ thể (VD: "Sân 5A") |
| Court type / Loại sân | Môn hoặc loại (VD: "Bóng đá mini 5 người") |
| Time slot / Khung giờ | Một khoảng 1 giờ cố định (VD: 18:00–19:00) |
| Booking / Đơn đặt sân | Một lần đặt gồm 1–3 khung giờ liền kề của một sân trong một ngày |
| Dịch vụ phát sinh | Đồ uống, thuê đồ hoặc gói tiệc khách gọi trong lúc sử dụng sân; tính vào hóa đơn khi đã giao |
| Yêu cầu dịch vụ (service order) | Một lần gọi dịch vụ gồm nhiều dòng, gắn với một đơn sân |
| Hóa đơn | Tiền sân + tiền dịch vụ đã giao, tính khi đọc (không lưu thành bảng) |
| Đóng đơn có công nợ | Thao tác của ADMIN khi khách đã dùng dịch vụ/sân nhưng bỏ đi không trả đủ; đơn thành `COMPLETED`, ghi nợ, không tạo `payments` |
| Khu sự kiện/tiệc | Loại sân đặc biệt (`category = EVENT`) như phòng tiệc, khu BBQ, đặt theo giờ |
| Walk-in | Khách đặt tại quầy hoặc qua điện thoại do nhân viên nhập |
| Giữ chỗ (hold) | Thời gian đơn `PENDING` được giữ slot chờ thanh toán |
| No-show | Khách đã đặt nhưng không đến |

## 8. Lịch sử thay đổi

| Phiên bản | Nội dung |
|---|---|
| 1.0 | Bộ tài liệu đầu tiên: đặt sân, thanh toán tiền sân, hủy/hoàn tiền, vận hành bởi nhân viên, báo cáo |
| 1.1 | **Theo góp ý giảng viên:** thêm dịch vụ phát sinh (khách gọi đồ uống/thuê đồ/gói tiệc trên app, nhân viên mang ra, tính vào hóa đơn khi trả đồ), khu tổ chức sự kiện/tiệc, hóa đơn. Thay đổi: bảng `services`, `service_orders`, `service_order_items` (thay `booking_services` P2); `bookings.total_amount` đổi tên thành `court_amount` và thêm `service_amount`; `payments.purpose`; `court_types.category`, `courts.capacity`; quy tắc BR-12 cập nhật, thêm BR-23..BR-32; thêm CUS-11..13, STF-11..15, ADM-08; mốc M3B; test case TC-41..TC-59 |
| 1.2 | **Rà luồng liền mạch Mobile–Web (mô phỏng hành trình + đối chiếu API/màn hình):** thêm `11-end-to-end-flows.md`; sửa 8 điểm lệch: **đóng đơn có công nợ** (ADM-09, BR-33; cột `bookings.closed_with_debt`) để đơn không kẹt khi khách bỏ đi không trả; **`refundInfo`** khi hủy đơn đã trả (BR-34); `GET /staff/courts/:id/availability` cho quy tắc nhân viên; tìm khách theo SĐT chuyển sang P0; đặt lại mật khẩu khách; widget **đơn quá giờ** + `overdue=true`; **tự làm mới 30 giây** ở hai nền tảng; bổ sung seed dịch vụ và khu sự kiện. Thêm TC-60..TC-66 và task T18F |
