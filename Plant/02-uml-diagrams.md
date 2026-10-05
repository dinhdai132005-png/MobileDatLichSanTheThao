# 02 — UML DIAGRAMS (Mermaid)

> Trạng thái: **ĐỀ XUẤT / CHƯA TRIỂN KHAI** (v1.2: use case dịch vụ, activity 2.4–2.5, sequence 3.6–3.7, state 4.3, class Service; thêm đóng đơn có công nợ). Sơ đồ viết bằng Mermaid, xem trực tiếp trên GitHub, VS Code (extension Markdown Preview Mermaid) hoặc dán vào https://mermaid.live để xuất ảnh đưa vào báo cáo.
> Mọi sơ đồ khớp với `03-actors-functions.md` (BR-xx, mã chức năng), `01-database.md` (bảng, enum) và `06-api.md` (endpoint). ER Diagram nằm ở `01-database.md` mục 2.

## 1. Use Case Diagram

Mermaid không có sơ đồ use case chuẩn, nên dùng flowchart mô phỏng (actor là hình tròn, use case là hình bầu dục). Khi vẽ lại trong StarUML/draw.io, giữ nguyên danh sách use case và quan hệ.

```mermaid
flowchart LR
    C(["Khách hàng - Mobile"])
    S(["Nhân viên - Web"])
    A(["Quản trị viên - Web"])
    T(["Scheduler - Hệ thống"])

    subgraph UCC["Khách hàng"]
        C1(["CUS-01/02 Đăng ký, đăng nhập"])
        C2(["CUS-03 Quản lý hồ sơ"])
        C3(["CUS-04/05 Xem sân, lịch trống, giá"])
        C4(["CUS-06 Đặt sân"])
        C5(["CUS-07 Xem hướng dẫn chuyển khoản"])
        C6(["CUS-08 Xem lịch sử đơn"])
        C7(["CUS-09 Hủy đơn"])
        C8(["CUS-10 Đánh giá sân"])
        C9(["CUS-11..13 Gọi dịch vụ, xem hóa đơn"])
    end

    subgraph UCS["Nhân viên"]
        S1(["STF-02/03 Dashboard, lịch lưới sân"])
        S2(["STF-04 Xem và lọc đơn"])
        S3(["STF-05 Đặt sân tại quầy"])
        S4(["STF-06 Ghi nhận thanh toán"])
        S5(["STF-07 Hoàn thành / No-show"])
        S6(["STF-08 Hủy đơn thay khách"])
        S7(["STF-09 Xác nhận hoàn tiền"])
        S8(["STF-10 Tra cứu khách hàng"])
        S9(["STF-11..13 Giao dịch vụ, nhận lại đồ thuê"])
        S10(["STF-12,14,15 Thêm dịch vụ, thu tiền dịch vụ, hết hàng"])
    end

    subgraph UCA["Quản trị viên"]
        A1(["ADM-01..04 Quản lý loại sân, sân, khung giờ, giá"])
        A2(["ADM-05 Quản lý tài khoản nhân viên"])
        A3(["ADM-06 Khóa/mở khách hàng"])
        A4(["ADM-07 Báo cáo"])
        A5(["ADM-08 Quản lý danh mục dịch vụ"])
        A6(["ADM-09 Đóng đơn có công nợ"])
        A7(["ADM-06 Đặt lại mật khẩu khách"])
    end

    subgraph UCT["Hệ thống"]
        T1(["SYS-01 Hết hạn đơn giữ chỗ"])
    end

    C --- C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 & C9
    S --- S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9 & S10
    A --- A1 & A2 & A3 & A4 & A5 & A6 & A7
    A -. "kế thừa quyền" .-> S
    T --- T1

    C4 -. "include" .-> C3
    C5 -. "extend (BANK_TRANSFER)" .-> C4
    C7 -. "extend (đã trả tiền)" .-> S7
    S3 -. "include" .-> S4
    C9 -. "cần đơn CONFIRMED" .-> C4
    C9 -. "tạo yêu cầu cho" .-> S9
    S10 -. "include" .-> S4
```

Ghi chú: `STF-08`/`STF-09` kích hoạt tạo/hoàn tất `REFUND` (BR-10). Admin kế thừa mọi use case của nhân viên. Đặt khu sự kiện/tiệc dùng lại use case đặt sân (CUS-04..09) với loại sân `EVENT` (BR-30), nên không có use case riêng.

## 2. Activity Diagram

### 2.1 Khách đặt sân từ Mobile (CUS-05 → CUS-07)

```mermaid
flowchart TD
    A(["Bắt đầu"]) --> B["Chọn sân và ngày"]
    B --> C["App tải lịch trống GET availability"]
    C --> D["Chọn 1-3 khung giờ liền kề"]
    D --> E{"Hợp lệ BR-02?"}
    E -- "Không" --> D
    E -- "Có" --> F["Chọn phương thức thanh toán"]
    F --> G["Gửi POST /bookings"]
    G --> H{"Server kiểm tra BR-03, BR-05, BR-08"}
    H -- "Vi phạm" --> X["Hiện lỗi cụ thể"]
    X --> B
    H -- "Hợp lệ" --> I{"INSERT booking_slots<br/>trùng UNIQUE?"}
    I -- "Trùng ER_DUP_ENTRY" --> J["409 SLOT_TAKEN<br/>Báo hết chỗ, tải lại lịch"]
    J --> C
    I -- "Không trùng" --> K{"Phương thức?"}
    K -- "CASH" --> L["Đơn CONFIRMED, UNPAID<br/>Trả tại sân"]
    K -- "BANK_TRANSFER" --> M["Đơn PENDING, expires_at = +30 phút<br/>Hiện thông tin chuyển khoản"]
    M --> N{"Nhân viên xác nhận<br/>trước hạn?"}
    N -- "Có" --> O["CONFIRMED, PAID"]
    N -- "Không" --> P["Job: EXPIRED, nhả slot"]
    L --> Q(["Kết thúc"])
    O --> Q
    P --> Q
```

### 2.2 Nhân viên xử lý đơn trong ngày (STF-04 → STF-07)

```mermaid
flowchart TD
    A(["Khách đến sân"]) --> B["Nhân viên mở lịch lưới, tìm đơn"]
    B --> C{"Đơn đã PAID?"}
    C -- "Chưa" --> D["Ghi nhận thanh toán CASH hoặc BANK_TRANSFER"]
    D --> E["payments SUCCESS, payment_status = PAID<br/>Nếu PENDING thì chuyển CONFIRMED"]
    C -- "Rồi" --> F["Khách chơi"]
    E --> F
    F --> G{"Khách có đến?"}
    G -- "Đến" --> H["Bấm Hoàn thành BR-12"]
    G -- "Không đến" --> I["Bấm No-show, không hoàn tiền"]
    H --> J(["COMPLETED"])
    I --> K(["NO_SHOW"])
```

### 2.3 Hủy đơn và hoàn tiền (CUS-09, STF-08, STF-09)

```mermaid
flowchart TD
    A(["Yêu cầu hủy"]) --> B{"Ai hủy?"}
    B -- "Khách" --> C{"Còn >= 6 giờ<br/>và PENDING/CONFIRMED?"}
    C -- "Không" --> D["422 CANCEL_DEADLINE_PASSED<br/>Liên hệ nhân viên"]
    C -- "Có" --> E["Hủy đơn"]
    B -- "Nhân viên" --> F["Nhập lý do bắt buộc"]
    F --> E
    E --> G["status = CANCELLED<br/>booking_slots.is_locked = NULL<br/>Ghi booking_status_logs"]
    G --> H{"payment_status = PAID?"}
    H -- "Không" --> I(["Xong, slot được nhả"])
    H -- "Có" --> J["Tạo payments REFUND PENDING"]
    J --> K["Nhân viên chuyển tiền và bấm Xác nhận đã hoàn"]
    K --> L["REFUND SUCCESS<br/>payment_status = REFUNDED"]
    L --> I
```

### 2.4 Gọi dịch vụ, giao, trả đồ và thanh toán dịch vụ (CUS-12 → STF-14)

```mermaid
flowchart TD
    A(["Đơn CONFIRMED, chưa quá giờ kết thúc"]) --> B["Khách mở Gọi dịch vụ và chọn đồ uống, thuê đồ, gói tiệc"]
    B --> C["POST /bookings/:id/service-orders"]
    C --> D{"Đơn hợp lệ và dịch vụ ACTIVE?"}
    D -- "Không" --> E["Báo lỗi BOOKING_NOT_ACTIVE_FOR_SERVICE hoặc SERVICE_NOT_AVAILABLE"]
    D -- "Có" --> F["Yêu cầu REQUESTED, chưa tính tiền"]
    F --> G["Nhân viên thấy trong hàng đợi"]
    G --> H{"Xử lý"}
    H -- "Hủy bởi khách hoặc nhân viên" --> I(["CANCELLED"])
    H -- "Mang ra và bấm Đã giao" --> J["DELIVERED, cộng vào service_amount"]
    J --> K{"Có đồ thuê?"}
    K -- "Có" --> L["Khách trả đồ, nhân viên bấm Đã nhận lại"]
    K -- "Không" --> M["Xem hóa đơn"]
    L --> M
    M --> N["Thu tiền sân nếu còn UNPAID và thu tiền dịch vụ"]
    N --> O["Bấm Hoàn thành, kiểm tra BR-12 và BR-28"]
    O --> P(["COMPLETED"])
```

### 2.5 Khách bỏ đi không thanh toán: đóng đơn có công nợ (ADM-09)

```mermaid
flowchart TD
    A(["Đơn CONFIRMED đã qua giờ, khách đã rời đi"]) --> B{"Đã có dịch vụ DELIVERED?"}
    B -- "Chưa" --> C["Nhân viên: Hoàn thành nếu đã PAID, hoặc No-show nếu khách không đến"]
    B -- "Rồi" --> D{"Khách thanh toán đủ và trả đồ thuê?"}
    D -- "Có" --> E["Nhân viên: nhận lại đồ, thu tiền, Hoàn thành BR-28"]
    D -- "Không" --> F["Hoàn thành, hủy, no-show đều bị chặn BR-12 BR-28 BR-29"]
    F --> G["ADMIN: Đóng đơn có công nợ, nhập lý do"]
    G --> H["Hủy các yêu cầu REQUESTED, status = COMPLETED, closed_with_debt = 1, ghi log kèm số nợ"]
    H --> I(["Công nợ hiện trong hóa đơn và báo cáo, doanh thu không đổi"])
    C --> J(["Kết thúc"])
    E --> J
```

## 3. Sequence Diagram

### 3.1 Đăng nhập (CUS-02, STF-01)

```mermaid
sequenceDiagram
    actor U as Người dùng
    participant APP as Mobile / Web
    participant API as Express (Route-Controller-Service)
    participant DB as MySQL
    U->>APP: Nhập số điện thoại và mật khẩu
    APP->>API: POST /api/v1/auth/login
    API->>DB: SELECT user WHERE phone = ?
    DB-->>API: user (password_hash, role, status)
    alt không tồn tại hoặc sai mật khẩu
        API-->>APP: 401 INVALID_CREDENTIALS
    else tài khoản LOCKED
        API-->>APP: 401 ACCOUNT_LOCKED
    else hợp lệ
        API->>API: bcrypt.compare, ký JWT (sub, role)
        API-->>APP: 200 token và thông tin user
        APP->>APP: Lưu token (secure-store / localStorage)
    end
```

### 3.2 Đặt sân bằng chuyển khoản (CUS-06)

```mermaid
sequenceDiagram
    actor K as Khách
    participant M as Mobile
    participant API as Backend
    participant DB as MySQL
    K->>M: Chọn sân, ngày, khung giờ, BANK_TRANSFER
    M->>API: POST /bookings (courtId, bookingDate, timeSlotIds, paymentMethod)
    API->>API: auth, requireRole CUSTOMER, validate
    API->>DB: BEGIN
    API->>DB: Kiểm tra sân ACTIVE, slot active và liền kề, BR-08
    API->>DB: Tra slot_prices theo day_type, tính court_amount
    API->>DB: INSERT bookings (PENDING, expires_at = now + 30 phút)
    API->>DB: INSERT booking_slots (is_locked = 1)
    alt ER_DUP_ENTRY uq_slot_active
        API->>DB: ROLLBACK
        API-->>M: 409 SLOT_TAKEN
    else thành công
        API->>DB: INSERT booking_status_logs (null to PENDING)
        API->>DB: COMMIT
        API-->>M: 201 booking và paymentInfo (STK, nội dung CK = bookingCode)
        M-->>K: Màn hình chuyển khoản, đếm ngược 30 phút
    end
```

### 3.3 Nhân viên xác nhận thanh toán (STF-06)

```mermaid
sequenceDiagram
    actor NV as Nhân viên
    participant W as Web Admin
    participant API as Backend
    participant DB as MySQL
    NV->>W: Mở chi tiết đơn, bấm Ghi nhận thanh toán
    W->>API: POST /staff/bookings/:id/payments (method, transactionRef)
    API->>API: auth, requireRole STAFF/ADMIN
    API->>DB: BEGIN, SELECT booking FOR UPDATE
    API->>API: Đơn PENDING hoặc CONFIRMED và UNPAID? (hết hạn thì từ chối)
    API->>DB: INSERT payments (PAYMENT, SUCCESS, amount = court_amount, processed_by)
    API->>DB: UPDATE bookings payment_status = PAID, status = CONFIRMED
    API->>DB: INSERT booking_status_logs (nếu đổi trạng thái)
    API->>DB: COMMIT
    API-->>W: 200 booking đã cập nhật
```

### 3.4 Khách hủy đơn đã thanh toán (CUS-09 → STF-09)

```mermaid
sequenceDiagram
    actor K as Khách
    participant M as Mobile
    participant API as Backend
    participant DB as MySQL
    actor NV as Nhân viên
    participant W as Web Admin
    K->>M: Bấm Hủy đơn
    M->>API: POST /bookings/:id/cancel (reason, refundInfo)
    API->>DB: BEGIN, SELECT booking FOR UPDATE
    API->>API: Kiểm tra chủ đơn, trạng thái, còn ít nhất 6 giờ (BR-09)
    API->>DB: UPDATE status = CANCELLED, booking_slots.is_locked = NULL
    API->>DB: INSERT payments (REFUND, PENDING, amount = court_amount, note = refundInfo)
    API->>DB: INSERT booking_status_logs, COMMIT
    API-->>M: 200 đã hủy, chờ hoàn tiền
    NV->>W: Mở danh sách chờ hoàn tiền
    W->>API: GET /staff/refunds?status=PENDING
    NV->>W: Chuyển khoản hoàn cho khách, bấm Xác nhận
    W->>API: POST /staff/payments/:id/confirm-refund
    API->>DB: UPDATE payments SUCCESS, bookings.payment_status = REFUNDED
    API-->>W: 200
```

### 3.5 Job hết hạn giữ chỗ (SYS-01)

```mermaid
sequenceDiagram
    participant J as Scheduler (setInterval 60 giây)
    participant DB as MySQL
    loop mỗi 60 giây
        J->>DB: BEGIN, SELECT id FROM bookings PENDING và expires_at nhỏ hơn NOW() FOR UPDATE
        J->>DB: UPDATE bookings status = EXPIRED
        J->>DB: UPDATE booking_slots is_locked = NULL
        J->>DB: INSERT booking_status_logs (changed_by NULL)
        J->>DB: COMMIT
    end
```

### 3.6 Khách gọi dịch vụ, nhân viên giao (CUS-12, STF-11)

```mermaid
sequenceDiagram
    actor K as Khách
    participant M as Mobile
    participant API as Backend
    participant DB as MySQL
    actor NV as Nhân viên
    participant W as Web Admin
    K->>M: Chọn nước suối x2 và thuê vợt x1, bấm Gửi yêu cầu
    M->>API: POST /bookings/:id/service-orders
    API->>DB: BEGIN, SELECT booking FOR UPDATE
    API->>API: Kiểm tra chủ đơn, CONFIRMED, chưa quá end_time, dịch vụ ACTIVE
    API->>DB: INSERT service_orders (REQUESTED), INSERT service_order_items (unit_price snapshot)
    API->>DB: COMMIT
    API-->>M: 201 yêu cầu REQUESTED
    W->>API: GET /staff/service-orders?status=REQUESTED (làm mới 30 giây)
    API-->>W: Danh sách chờ giao
    NV->>NV: Mang đồ ra sân
    NV->>W: Bấm Đã giao
    W->>API: POST /staff/service-orders/:id/deliver
    API->>DB: BEGIN, khóa booking và order
    API->>DB: UPDATE order DELIVERED, tính lại bookings.service_amount
    API->>DB: COMMIT
    API-->>W: 200
    K->>M: Kéo làm mới, thấy trạng thái Đã giao
```

### 3.7 Trả đồ, thu tiền dịch vụ, hoàn thành đơn (STF-13, STF-14, STF-07)

```mermaid
sequenceDiagram
    actor NV as Nhân viên
    participant W as Web Admin
    participant API as Backend
    participant DB as MySQL
    NV->>W: Khách trả đồ, bấm Đã nhận lại cho từng món thuê
    W->>API: POST /staff/service-order-items/:id/return
    API->>DB: UPDATE returned_at, returned_by
    NV->>W: Mở khối Dịch vụ và hóa đơn
    W->>API: GET /staff/bookings/:id/invoice
    API-->>W: courtAmount, serviceAmount, grandTotal, balance, unreturnedRentals
    NV->>W: Bấm Thu tiền dịch vụ
    W->>API: POST /staff/bookings/:id/service-payments
    API->>DB: BEGIN, SELECT booking FOR UPDATE
    API->>DB: INSERT payments (PAYMENT, SERVICE, SUCCESS, amount = serviceBalance)
    API->>DB: COMMIT
    API-->>W: 200 hóa đơn đã thu đủ
    NV->>W: Bấm Hoàn thành
    W->>API: POST /staff/bookings/:id/complete
    API->>API: Kiểm tra BR-12 và BR-28
    API->>DB: UPDATE bookings status = COMPLETED, INSERT booking_status_logs
    API-->>W: 200
```

## 4. State Diagram

### 4.1 Trạng thái đơn đặt sân (`bookings.status`)

```mermaid
stateDiagram-v2
    [*] --> PENDING : đặt BANK_TRANSFER hoặc VNPAY
    [*] --> CONFIRMED : đặt CASH hoặc nhân viên đặt hộ
    PENDING --> CONFIRMED : ghi nhận thanh toán
    PENDING --> EXPIRED : quá expires_at (job)
    PENDING --> CANCELLED : khách hoặc nhân viên hủy
    CONFIRMED --> CANCELLED : khách hủy trước 6 giờ hoặc nhân viên hủy
    CONFIRMED --> COMPLETED : nhân viên hoàn thành (đã PAID tiền sân, đã đến giờ, thỏa BR-28)
    CONFIRMED --> NO_SHOW : nhân viên đánh dấu (đã đến giờ)
    CONFIRMED --> COMPLETED : ADMIN đóng đơn có công nợ (BR-33)
    COMPLETED --> [*]
    CANCELLED --> [*]
    EXPIRED --> [*]
    NO_SHOW --> [*]
```

Bảng chuyển trạng thái hợp lệ (service phải kiểm tra, mọi cặp khác bị từ chối `409 INVALID_STATUS`):

| Từ | Sang | Ai | Điều kiện |
|---|---|---|---|
| (mới) | PENDING | Khách | `BANK_TRANSFER`/`VNPAY` |
| (mới) | CONFIRMED | Khách / Nhân viên | `CASH`, hoặc nhân viên đặt hộ |
| PENDING | CONFIRMED | Nhân viên / (VNPay callback) | Còn hạn `expires_at` |
| PENDING | EXPIRED | Hệ thống | `expires_at < NOW()` |
| PENDING, CONFIRMED | CANCELLED | Khách | Còn ≥ 6 giờ (BR-09) và chưa có dịch vụ đã giao (BR-29) |
| PENDING, CONFIRMED | CANCELLED | Nhân viên | Có lý do và chưa có dịch vụ đã giao (BR-29) |
| CONFIRMED | COMPLETED | Nhân viên | `PAID` tiền sân, đã đến giờ, thỏa BR-28 (không còn yêu cầu chờ giao, đã nhận lại đồ thuê, đã thu đủ tiền dịch vụ) |
| CONFIRMED | COMPLETED | **ADMIN** | **Đóng đơn có công nợ** (BR-33): đã đến giờ bắt đầu, lý do bắt buộc, bỏ qua điều kiện đã trả đủ và đồ thuê đã trả; `closed_with_debt = 1` |
| CONFIRMED | NO_SHOW | Nhân viên | Đã đến giờ và chưa có dịch vụ đã giao (BR-12) |

### 4.2 Trạng thái thanh toán (`bookings.payment_status`)

```mermaid
stateDiagram-v2
    [*] --> UNPAID
    UNPAID --> PAID : payments PAYMENT SUCCESS
    PAID --> REFUNDED : payments REFUND SUCCESS (sau khi hủy)
    UNPAID --> [*] : đơn hủy hoặc hết hạn khi chưa trả
    REFUNDED --> [*]
    PAID --> [*] : COMPLETED hoặc NO_SHOW
```

### 4.3 Trạng thái yêu cầu dịch vụ (`service_orders.status`)

```mermaid
stateDiagram-v2
    [*] --> REQUESTED : khách gọi dịch vụ
    [*] --> DELIVERED : nhân viên nhập hộ tại quầy
    REQUESTED --> DELIVERED : nhân viên bấm Đã giao
    REQUESTED --> CANCELLED : khách hoặc nhân viên hủy, hoặc đơn sân bị hủy hoặc no-show
    DELIVERED --> CANCELLED : nhân viên hủy khi chưa thu tiền vượt tổng mới (BR-25)
    DELIVERED --> [*]
    CANCELLED --> [*]
```

| Từ | Sang | Ai | Điều kiện / hiệu lực |
|---|---|---|---|
| (mới) | REQUESTED | Khách | Đơn sân `CONFIRMED`, chưa quá giờ kết thúc (BR-24). Chưa tính tiền |
| (mới) | DELIVERED | Nhân viên | Đơn sân `CONFIRMED` (BR-31). Cộng ngay vào `service_amount` |
| REQUESTED | DELIVERED | Nhân viên | Đơn sân còn `CONFIRMED`. Cộng vào `service_amount` |
| REQUESTED | CANCELLED | Khách / Nhân viên / Hệ thống | Hệ thống tự hủy khi đơn sân bị hủy hoặc no-show (BR-29, BR-12) |
| DELIVERED | CANCELLED | Nhân viên | Tiền dịch vụ đã thu ≤ `service_amount` mới (BR-25) |

Đồ thuê (`RENTAL`) có thêm trạng thái con trên từng dòng: **chưa trả** (`returned_at IS NULL`) → **đã trả** (`returned_at` có giá trị) khi nhân viên bấm "Đã nhận lại" (BR-27).

## 5. Class Diagram (mô hình miền, khớp bảng DB)

```mermaid
classDiagram
    class User {
        +int id
        +string fullName
        +string phone
        +string email
        +Role role
        +UserStatus status
        +login()
        +updateProfile()
    }
    class CourtType {
        +int id
        +string name
        +CourtCategory category
        +bool isActive
    }
    class Court {
        +int id
        +string name
        +int capacity
        +CourtStatus status
        +getAvailability(date)
    }
    class TimeSlot {
        +int id
        +time startTime
        +time endTime
        +bool isActive
    }
    class SlotPrice {
        +DayType dayType
        +int price
    }
    class Booking {
        +int id
        +string bookingCode
        +date bookingDate
        +time startTime
        +time endTime
        +int courtAmount
        +int serviceAmount
        +BookingStatus status
        +PaymentMethod paymentMethod
        +PaymentStatus paymentStatus
        +Source source
        +datetime expiresAt
        +cancel(reason)
        +complete()
        +markNoShow()
    }
    class BookingSlot {
        +date slotDate
        +int price
        +bool isLocked
    }
    class Payment {
        +int id
        +PaymentType type
        +PaymentPurpose purpose
        +PaymentMethod method
        +int amount
        +PaymentTxStatus status
        +string transactionRef
        +datetime processedAt
    }
    class BookingStatusLog {
        +BookingStatus fromStatus
        +BookingStatus toStatus
        +string note
        +datetime createdAt
    }
    class Review {
        +int rating
        +string comment
    }
    class Service {
        +int id
        +string name
        +ServiceType type
        +int price
        +ServiceStatus status
    }
    class ServiceOrder {
        +int id
        +ServiceOrderStatus status
        +Source source
        +string note
        +datetime deliveredAt
        +deliver()
        +cancel(reason)
    }
    class ServiceOrderItem {
        +int quantity
        +int unitPrice
        +datetime returnedAt
        +markReturned()
    }

    CourtType "1" --> "0..*" Court : gồm
    CourtType "1" --> "0..*" SlotPrice : có bảng giá
    TimeSlot "1" --> "0..*" SlotPrice : áp giá
    User "0..1" --> "0..*" Booking : đặt (khách có tài khoản)
    User "0..1" --> "0..*" Booking : tạo hộ (nhân viên)
    Court "1" --> "0..*" Booking : được đặt
    Booking "1" *-- "1..3" BookingSlot : gồm các giờ
    TimeSlot "1" --> "0..*" BookingSlot : là
    Court "1" --> "0..*" BookingSlot : khóa giờ
    Booking "1" *-- "0..*" Payment : thanh toán / hoàn
    Booking "1" *-- "0..*" BookingStatusLog : lịch sử
    Booking "1" --> "0..1" Review : được đánh giá
    User "1" --> "0..*" Review : viết
    User "0..1" --> "0..*" Payment : xử lý
    Booking "1" *-- "0..*" ServiceOrder : yêu cầu dịch vụ
    ServiceOrder "1" *-- "1..*" ServiceOrderItem : gồm các dòng
    Service "1" --> "0..*" ServiceOrderItem : được gọi
    User "0..1" --> "0..*" ServiceOrder : tạo / giao
```

Ghi chú: `Booking *-- BookingSlot` là composition (xóa đơn thì mất các giờ). Thực tế không xóa cứng (BR-14).

## 6. Kiểm tra khớp UML ↔ hệ thống

| Thành phần UML | Khớp với |
|---|---|
| Use case CUS/STF/ADM/SYS | `03-actors-functions.md` mục 4 |
| State đơn, State yêu cầu dịch vụ | `01-database.md` mục 6 (`bookings.status`, `service_orders.status`) và `06-api.md` mục 5 |
| Class | Bảng trong `01-database.md` mục 5 (gồm `services`, `service_orders`, `service_order_items`) |
| Sequence | Endpoint trong `06-api.md` |
| Ma trận truy vết đầy đủ | `10-sync-check.md` mục 1 |
