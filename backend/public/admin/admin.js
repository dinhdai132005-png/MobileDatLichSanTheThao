// =====================================================================
// BỘ ĐIỀU KHIỂN WEB ADMIN (admin.js) — CHUẨN PLANT / 05-pages-sitemap.md
// Quản trị viên & Nhân viên (STAFF & ADMIN)
// =====================================================================

const API_BASE = '/api/v1';
const TOKEN_KEY = 'sport_admin_token';
const USER_KEY = 'sport_admin_user';

let currentUser = null;
let currentTab = 'dashboard';
let cachedCourts = [];
let cachedCourtTypes = [];
let cachedTimeSlots = [];
let walkinSelectedSlots = [];

// ================= 1. TIỆN ÍCH CHUNG =================
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  currentUser = user;
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  currentUser = null;
}

function formatMoney(amount) {
  if (amount === undefined || amount === null) return '0 ₫';
  return Number(amount).toLocaleString('vi-VN') + ' ₫';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  return dateStr;
}

function formatDateTime(dtStr) {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return d.toLocaleString('vi-VN', { hour12: false });
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const text = document.getElementById('toast-text');
  if (!toast) return;

  icon.textContent = isError ? '⚠️' : '✅';
  text.textContent = message;
  toast.style.borderColor = isError ? 'var(--danger)' : 'var(--primary)';
  toast.style.display = 'flex';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('active');
}

async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        clearAuth();
        showLoginOverlay();
      }
      const err = new Error(data.message || data.error || 'Có lỗi xảy ra');
      err.status = res.status;
      err.data = data;
      err.errorCode = data.errorCode;
      throw err;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// ================= 2. XÁC THỰC & PHÂN QUYỀN =================
function showLoginOverlay() {
  document.getElementById('login-overlay').style.display = 'flex';
}

function hideLoginOverlay() {
  document.getElementById('login-overlay').style.display = 'none';
}

function fillQuickLogin(phone, pass) {
  document.getElementById('login-phone').value = phone;
  document.getElementById('login-password').value = pass;
}

async function handleLogin(e) {
  e.preventDefault();
  const phone = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const msgEl = document.getElementById('login-msg');
  msgEl.style.display = 'none';

  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    const user = res.data.user || res.data.nguoiDung;
    const token = res.data.token;

    if (user.role === 'CUSTOMER') {
      msgEl.style.display = 'block';
      msgEl.style.background = '#FEE2E2';
      msgEl.style.color = '#B91C1C';
      msgEl.textContent = 'Tài khoản Khách hàng (CUSTOMER) bị từ chối truy cập trang Quản trị!';
      return;
    }

    setAuth(token, user);
    hideLoginOverlay();
    applyUserUI();
    showToast(`Đăng nhập thành công! Chào ${user.full_name || user.hoTen}`);
    switchTab('dashboard');
  } catch (err) {
    msgEl.style.display = 'block';
    msgEl.style.background = '#FEE2E2';
    msgEl.style.color = '#B91C1C';
    msgEl.textContent = err.message || 'Đăng nhập thất bại';
  }
}

function logout() {
  clearAuth();
  showLoginOverlay();
}

function applyUserUI() {
  if (!currentUser) return;
  const userDisplay = document.getElementById('user-display');
  const roleDisplay = document.getElementById('role-display');

  userDisplay.textContent = currentUser.full_name || currentUser.hoTen || currentUser.phone;
  roleDisplay.textContent = currentUser.role;
  roleDisplay.className = `role-tag role-${currentUser.role}`;

  // Phân quyền hiển thị: ẩn nút admin-only nếu role là STAFF
  const adminOnlyElements = document.querySelectorAll('.admin-only');
  adminOnlyElements.forEach((el) => {
    el.style.display = currentUser.role === 'ADMIN' ? '' : 'none';
  });
}

// ================= 3. ĐIỀU HƯỚNG TAB =================
function switchTab(tabId) {
  currentTab = tabId;

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(`'${tabId}'`));
  });

  document.querySelectorAll('.tab-content').forEach((sec) => {
    sec.classList.remove('active');
  });

  const activeSec = document.getElementById(`tab-${tabId}`);
  if (activeSec) activeSec.classList.add('active');

  // Nạp dữ liệu tương ứng của tab
  if (tabId === 'dashboard') loadDashboard();
  else if (tabId === 'schedule') loadSchedule();
  else if (tabId === 'bookings') loadBookings();
  else if (tabId === 'walkin') loadWalkinData();
  else if (tabId === 'refunds') loadRefunds();
  else if (tabId === 'courts') loadCourtTypesAndCourts();
  else if (tabId === 'prices') loadPricingMatrix();
  else if (tabId === 'staff') loadStaff();
  else if (tabId === 'reports') loadReports();
  else if (tabId === 'customers') taiDanhSachKhachHang();
  else if (tabId === 'timeslots') loadTimeSlots();
}

// ================= 4. TAB DASHBOARD (STF-02) =================
async function loadDashboard() {
  try {
    const res = await apiFetch('/staff/dashboard');
    const data = res.data;

    document.getElementById('hom-nay-tong-don').textContent = data.tongDonHomNay ?? 0;
    document.getElementById('hom-nay-doanh-thu').textContent = formatMoney(data.doanhThuHomNay ?? 0);
    document.getElementById('hom-nay-cho-thanh-toan').textContent = data.soDonChoThanhToan ?? 0;
    document.getElementById('hom-nay-ty-le-lap-day').textContent = `${data.tyLeLapDayHomNay ?? 0}%`;

    const tbody = document.getElementById('dashboard-bookings-tbody');
    tbody.innerHTML = '';

    const list = data.donDatGanDay || [];
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">Hôm nay chưa có đơn đặt sân nào</td></tr>';
      return;
    }

    list.forEach((b) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600; color:var(--primary);">${b.maDonDat || b.bookingCode}</td>
        <td>${b.tenKhachHang || b.customerName} <span style="font-size:12px; color:var(--text-muted);">(${b.soDienThoaiKhach || ''})</span></td>
        <td>${b.tenSan || b.courtName}</td>
        <td>${(b.gioBatDau || '').substring(0, 5)} - ${(b.gioKetThuc || '').substring(0, 5)}</td>
        <td style="font-weight:600;">${formatMoney(b.tongTien || b.totalAmount)}</td>
        <td>${renderStatusBadge(b.trangThai || b.status)}</td>
        <td>
          <button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="viewDetail(${b.id})">👁️ Xem</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi khi tải Dashboard: ' + err.message, true);
  }
}

// ================= 5. TAB LỊCH SÂN (STF-03) =================
let scheduleDate = new Date().toISOString().substring(0, 10);

async function loadSchedule() {
  const dateInput = document.getElementById('schedule-date');
  if (dateInput && dateInput.value) {
    scheduleDate = dateInput.value;
  } else if (dateInput) {
    dateInput.value = scheduleDate;
  }

  try {
    const res = await apiFetch(`/staff/schedule?date=${scheduleDate}`);
    const data = res.data;
    renderScheduleGrid(data);
  } catch (err) {
    showToast('Lỗi tải lịch sân: ' + err.message, true);
  }
}

function changeScheduleDate(delta) {
  const d = new Date(scheduleDate);
  d.setDate(d.getDate() + delta);
  scheduleDate = d.toISOString().substring(0, 10);
  document.getElementById('schedule-date').value = scheduleDate;
  loadSchedule();
}

function setScheduleToday() {
  scheduleDate = new Date().toISOString().substring(0, 10);
  document.getElementById('schedule-date').value = scheduleDate;
  loadSchedule();
}

function renderScheduleGrid(data) {
  const courts = data.courts || data.danhSachSan || [];
  const slots = data.slots || data.danhSachKhungGio || [];
  const matrix = data.matrix || data.maTran || {};

  const grid = document.getElementById('schedule-grid');
  grid.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'schedule-table';

  const thead = document.createElement('thead');
  let headerHtml = '<tr><th style="width:110px; position:sticky; left:0; z-index:2; background:var(--surface);">Khung Giờ</th>';
  courts.forEach((c) => {
    const statusTag = c.status === 'MAINTENANCE' ? ' <span style="font-size:10px; color:#DC2626;">(Bảo trì)</span>' : '';
    headerHtml += `<th>${c.name || c.tenSan}${statusTag}<br><span style="font-size:11px; font-weight:normal; color:var(--text-muted);">${c.courtTypeName || c.tenLoaiSan || ''}</span></th>`;
  });
  headerHtml += '</tr>';
  thead.innerHTML = headerHtml;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  slots.forEach((s) => {
    const tr = document.createElement('tr');
    const timeLabel = `${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}`;
    let rowHtml = `<td style="position:sticky; left:0; z-index:1; background:var(--surface); font-weight:600; font-size:12px;">${timeLabel}</td>`;

    courts.forEach((c) => {
      const cell = matrix[`${c.id}_${s.id}`] || { status: 'AVAILABLE' };
      let bgStyle = '';
      let content = '';

      if (cell.status === 'BOOKED') {
        bgStyle = 'background: rgba(239, 68, 68, 0.12); border-left: 3px solid #EF4444; cursor: pointer;';
        content = `<div style="font-weight:600; font-size:11px; color:#B91C1C;">${cell.bookingCode || 'ĐÃ ĐẶT'}</div>
                   <div style="font-size:11px; color:var(--text-muted);">${cell.customerName || ''}</div>`;
      } else if (cell.status === 'MAINTENANCE') {
        bgStyle = 'background: rgba(107, 114, 128, 0.12); color:#4B5563;';
        content = '<span style="font-size:11px;">Bảo trì</span>';
      } else if (cell.status === 'PAST') {
        bgStyle = 'background: rgba(156, 163, 175, 0.08); color:#9CA3AF;';
        content = '<span style="font-size:11px;">Đã qua</span>';
      } else {
        bgStyle = 'background: rgba(0, 184, 132, 0.08); color:var(--primary); cursor: pointer;';
        content = `<span style="font-size:11px; font-weight:500;">${formatMoney(cell.price)}</span>`;
      }

      const clickAttr = cell.bookingId ? `onclick="viewDetail(${cell.bookingId})"` : '';
      rowHtml += `<td style="${bgStyle} height:48px; vertical-align:middle; text-align:center;" ${clickAttr}>${content}</td>`;
    });

    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  grid.appendChild(table);
}

// ================= 6. TAB DANH SÁCH ĐƠN (STF-04) =================
let bookingPage = 1;

async function loadBookings(page = 1) {
  bookingPage = page;
  const date = document.getElementById('filter-date')?.value || '';
  const courtId = document.getElementById('filter-court')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';
  const paymentStatus = document.getElementById('filter-payment')?.value || '';
  const keyword = document.getElementById('filter-keyword')?.value || '';

  const params = new URLSearchParams({
    page: String(bookingPage),
    limit: '20',
  });
  if (date) params.append('date', date);
  if (courtId) params.append('courtId', courtId);
  if (status) params.append('status', status);
  if (paymentStatus) params.append('paymentStatus', paymentStatus);
  if (keyword) params.append('keyword', keyword);

  try {
    const res = await apiFetch(`/staff/bookings?${params.toString()}`);
    const items = res.data || [];
    const total = res.pagination?.total || items.length;

    renderBookingsTable(items);
    renderPagination('bookings-pagination', bookingPage, 20, total, 'loadBookings');
  } catch (err) {
    showToast('Lỗi tải danh sách đơn: ' + err.message, true);
  }
}

function renderBookingsTable(items) {
  const tbody = document.getElementById('bookings-tbody');
  tbody.innerHTML = '';

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:24px; color:var(--text-muted);">Không tìm thấy đơn đặt sân phù hợp</td></tr>';
    return;
  }

  items.forEach((b) => {
    const tr = document.createElement('tr');
    const isUnpaid = b.trangThaiThanhToan === 'UNPAID';
    const isConfirmed = b.trangThai === 'CONFIRMED';
    const isPaid = b.trangThaiThanhToan === 'PAID';

    let actionButtons = `
      <button class="btn btn-outline" style="padding:3px 7px; font-size:11.5px;" onclick="viewDetail(${b.id})">👁️</button>
    `;

    if (isUnpaid && (b.trangThai === 'PENDING' || isConfirmed)) {
      actionButtons += `
        <button class="btn btn-primary" style="padding:3px 7px; font-size:11.5px;" title="Ghi nhận thanh toán" onclick="quickPay(${b.id})">💵</button>
      `;
    }

    if (isConfirmed && isPaid) {
      actionButtons += `
        <button class="btn btn-outline" style="padding:3px 7px; font-size:11.5px; color:#10B981; border-color:#10B981;" title="Hoàn thành" onclick="completeBooking(${b.id})">✅</button>
      `;
    }

    if (isConfirmed || b.trangThai === 'PENDING') {
      actionButtons += `
        <button class="btn btn-outline" style="padding:3px 7px; font-size:11.5px; color:#EF4444; border-color:#EF4444;" title="Hủy đơn" onclick="cancelBooking(${b.id})">❌</button>
      `;
    }

    tr.innerHTML = `
      <td style="font-weight:600; color:var(--primary);">${b.maDonDat}</td>
      <td>
        <div style="font-weight:600;">${b.tenKhachHang}</div>
        <div style="font-size:11px; color:var(--text-muted);">${b.soDienThoaiKhach || '—'}</div>
      </td>
      <td>
        <div>${b.tenSan}</div>
        <div style="font-size:11px; color:var(--text-muted);">${b.tenLoaiSan}</div>
      </td>
      <td>${formatDate(b.ngayDat)}</td>
      <td>${(b.gioBatDau || '').substring(0, 5)} - ${(b.gioKetThuc || '').substring(0, 5)}</td>
      <td style="font-weight:600;">${formatMoney(b.tongTien)}</td>
      <td>${renderStatusBadge(b.trangThai)}</td>
      <td>${renderPaymentBadge(b.trangThaiThanhToan)}</td>
      <td style="white-space:nowrap;">${actionButtons}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStatusBadge(status) {
  const map = {
    PENDING: { label: 'Chờ thanh toán', bg: '#FEF3C7', color: '#D97706' },
    CONFIRMED: { label: 'Đã xác nhận', bg: '#D1FAE5', color: '#059669' },
    COMPLETED: { label: 'Hoàn thành', bg: '#E0E7FF', color: '#4338CA' },
    CANCELLED: { label: 'Đã hủy', bg: '#FEE2E2', color: '#DC2626' },
    EXPIRED: { label: 'Hết hạn', bg: '#F3F4F6', color: '#4B5563' },
    NO_SHOW: { label: 'Vắng mặt', bg: '#FEE2E2', color: '#B91C1C' },
  };
  const item = map[status] || { label: status, bg: '#F3F4F6', color: '#374151' };
  return `<span class="badge" style="background:${item.bg}; color:${item.color};">${item.label}</span>`;
}

function renderPaymentBadge(status) {
  const map = {
    UNPAID: { label: 'Chưa thanh toán', bg: '#FEE2E2', color: '#DC2626' },
    PAID: { label: 'Đã thanh toán', bg: '#D1FAE5', color: '#059669' },
    REFUNDED: { label: 'Đã hoàn tiền', bg: '#E0E7FF', color: '#4338CA' },
  };
  const item = map[status] || { label: status, bg: '#F3F4F6', color: '#374151' };
  return `<span class="badge" style="background:${item.bg}; color:${item.color};">${item.label}</span>`;
}

// ================= 7. TAB ĐẶT SÂN TẠI QUẦY (STF-05) =================
async function loadWalkinData() {
  try {
    const res = await apiFetch('/courts');
    cachedCourts = res.data || [];

    const select = document.getElementById('walkin-court');
    select.innerHTML = '<option value="">-- Chọn sân --</option>';
    cachedCourts.filter(c => c.status === 'ACTIVE').forEach(c => {
      select.innerHTML += `<option value="${c.id}">${c.name || c.tenSan} (${c.courtTypeName || c.tenLoaiSan})</option>`;
    });

    const dateInput = document.getElementById('walkin-date');
    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().substring(0, 10);
    }

    walkinSelectedSlots = [];
    document.getElementById('walkin-slots').innerHTML = '<div style="grid-column:1/-1; color:var(--text-muted); font-size:13px;">Vui lòng chọn sân và ngày để xem khung giờ trống</div>';
  } catch (err) {
    showToast('Lỗi tải thông tin đặt quầy: ' + err.message, true);
  }
}

async function loadWalkinSlots() {
  const courtId = document.getElementById('walkin-court').value;
  const date = document.getElementById('walkin-date').value;
  const container = document.getElementById('walkin-slots');
  walkinSelectedSlots = [];

  if (!courtId || !date) {
    container.innerHTML = '<div style="grid-column:1/-1; color:var(--text-muted); font-size:13px;">Vui lòng chọn sân và ngày để xem khung giờ trống</div>';
    return;
  }

  container.innerHTML = '<div style="grid-column:1/-1; color:var(--text-muted); font-size:13px;">Đang tải khung giờ...</div>';

  try {
    const res = await apiFetch(`/courts/${courtId}/availability?date=${date}`);
    const slots = res.data?.slots || res.data?.danhSachKhungGio || [];

    container.innerHTML = '';
    slots.forEach(s => {
      const isAvailable = s.status === 'AVAILABLE';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `quick-btn slot-pill ${isAvailable ? '' : 'disabled'}`;
      btn.style.opacity = isAvailable ? '1' : '0.4';
      btn.style.cursor = isAvailable ? 'pointer' : 'not-allowed';
      btn.innerHTML = `
        <div style="font-weight:600;">${(s.startTime || s.gioBatDau).substring(0, 5)} - ${(s.endTime || s.gioKetThuc).substring(0, 5)}</div>
        <div style="font-size:11px;">${isAvailable ? formatMoney(s.price || s.giaTien) : (s.status === 'BOOKED' ? 'Đã đặt' : 'Bảo trì')}</div>
      `;

      if (isAvailable) {
        btn.onclick = () => toggleWalkinSlot(s.timeSlotId || s.khungGioId || s.id, btn);
      }
      container.appendChild(btn);
    });
  } catch (err) {
    container.innerHTML = `<div style="grid-column:1/-1; color:#EF4444; font-size:13px;">Lỗi: ${err.message}</div>`;
  }
}

function toggleWalkinSlot(slotId, btnElement) {
  slotId = Number(slotId);
  const idx = walkinSelectedSlots.indexOf(slotId);

  if (idx >= 0) {
    walkinSelectedSlots.splice(idx, 1);
    btnElement.style.borderColor = 'var(--border)';
    btnElement.style.background = 'var(--surface-card)';
  } else {
    if (walkinSelectedSlots.length >= 3) {
      showToast('Chỉ được chọn tối đa 3 khung giờ (BR-02)', true);
      return;
    }
    walkinSelectedSlots.push(slotId);
    walkinSelectedSlots.sort((a, b) => a - b);

    // Kiểm tra liền kề
    for (let i = 0; i < walkinSelectedSlots.length - 1; i++) {
      if (walkinSelectedSlots[i + 1] !== walkinSelectedSlots[i] + 1) {
        showToast('Các khung giờ chọn phải LIỀN KỀ nhau (BR-02)', true);
        walkinSelectedSlots.splice(walkinSelectedSlots.indexOf(slotId), 1);
        return;
      }
    }

    btnElement.style.borderColor = 'var(--primary)';
    btnElement.style.background = 'rgba(0, 184, 132, 0.15)';
  }
}

async function handleWalkin(e) {
  e.preventDefault();
  const courtId = Number(document.getElementById('walkin-court').value);
  const date = document.getElementById('walkin-date').value;
  const guestName = document.getElementById('walkin-name').value.trim();
  const guestPhone = document.getElementById('walkin-phone').value.trim();
  const paymentMethod = document.getElementById('walkin-payment-method').value;
  const payNow = document.getElementById('walkin-paynow').checked;
  const note = document.getElementById('walkin-note').value.trim();

  if (walkinSelectedSlots.length === 0) {
    showToast('Vui lòng chọn ít nhất 1 khung giờ', true);
    return;
  }

  const payload = {
    sanId: courtId,
    courtId,
    ngayDat: date,
    bookingDate: date,
    danhSachKhungGioId: walkinSelectedSlots,
    timeSlotIds: walkinSelectedSlots,
    tenKhachHang: guestName,
    guestName,
    soDienThoaiKhach: guestPhone,
    guestPhone,
    phuongThucThanhToan: paymentMethod,
    paymentMethod,
    thanhToanNgay: payNow,
    payNow,
    ghiChu: note || null,
  };

  try {
    const res = await apiFetch('/staff/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    showToast(`Đặt sân tại quầy thành công! Mã đơn: ${res.data.maDonDat || res.data.bookingCode}`);
    document.getElementById('form-walkin').reset();
    walkinSelectedSlots = [];
    switchTab('bookings');
  } catch (err) {
    showToast(err.message || 'Lỗi khi tạo đơn', true);
  }
}

// ================= 8. TAB HOÀN TIỀN (STF-09) =================
async function loadRefunds() {
  try {
    const res = await apiFetch('/staff/refunds');
    const items = res.data || [];
    const tbody = document.getElementById('refunds-tbody');
    tbody.innerHTML = '';

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">Không có yêu cầu hoàn tiền nào đang chờ xử lý</td></tr>';
      return;
    }

    items.forEach((r) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600; color:var(--primary);">${r.maDonDat || r.bookingCode}</td>
        <td>${r.tenKhachHang || r.customerName}</td>
        <td>${r.soDienThoai || r.phone || '—'}</td>
        <td style="font-weight:600; color:#EF4444;">${formatMoney(r.soTien || r.amount)}</td>
        <td>${formatDateTime(r.thoiGianTao || r.createdAt)}</td>
        <td>${r.lyDo || r.reason || 'Khách hủy đơn'}</td>
        <td>
          <button class="btn btn-primary" style="padding:4px 10px; font-size:12px;" onclick="confirmRefund(${r.giaoDichId || r.paymentId || r.id})">
            ✓ Đã Hoàn Tiền
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi tải danh sách hoàn tiền: ' + err.message, true);
  }
}

async function confirmRefund(paymentId) {
  if (!confirm('Bạn có chắc chắn đã hoàn trả tiền thành công cho khách hàng này?')) return;
  try {
    await apiFetch(`/staff/payments/${paymentId}/confirm-refund`, {
      method: 'POST',
    });
    showToast('Xác nhận hoàn tiền thành công!');
    loadRefunds();
  } catch (err) {
    showToast(err.message || 'Lỗi xác nhận hoàn tiền', true);
  }
}

// ================= 9. TAB QUẢN TRỊ SÂN (ADM-01, ADM-02) =================
async function loadCourtTypesAndCourts() {
  try {
    const [typesRes, courtsRes] = await Promise.all([
      apiFetch('/court-types'),
      apiFetch('/admin/courts'),
    ]);

    cachedCourtTypes = typesRes.data || [];
    cachedCourts = courtsRes.data || [];

    // Render Loại sân
    const typesTbody = document.getElementById('loai-san-tbody');
    typesTbody.innerHTML = '';
    cachedCourtTypes.forEach((t) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.id}</td>
        <td style="font-weight:600;">${t.name || t.tenLoaiSan}</td>
        <td style="color:var(--text-muted);">${t.description || t.moTa || '—'}</td>
        <td><span class="badge" style="background:#D1FAE5; color:#059669;">Hoạt động</span></td>
        <td>—</td>
      `;
      typesTbody.appendChild(tr);
    });

    // Cập nhật select loại sân trong form tạo sân
    const courtTypeSelect = document.getElementById('san-loai-chon');
    courtTypeSelect.innerHTML = '<option value="">-- Chọn loại sân --</option>';
    cachedCourtTypes.forEach((t) => {
      courtTypeSelect.innerHTML += `<option value="${t.id}">${t.name || t.tenLoaiSan}</option>`;
    });

    // Render Sân
    const courtsTbody = document.getElementById('courts-tbody');
    courtsTbody.innerHTML = '';
    cachedCourts.forEach((c) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id}</td>
        <td style="font-weight:600;">${c.name || c.tenSan}</td>
        <td>${c.courtTypeName || c.tenLoaiSan || '—'}</td>
        <td style="color:var(--text-muted);">${c.description || c.moTa || '—'}</td>
        <td>${renderCourtStatusBadge(c.status || c.trangThai)}</td>
        <td>
          <select class="form-select" style="padding:4px 8px; font-size:12px; width:130px;" onchange="doiTrangThaiSan(${c.id}, this.value)">
            <option value="ACTIVE" ${c.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
            <option value="MAINTENANCE" ${c.status === 'MAINTENANCE' ? 'selected' : ''}>MAINTENANCE</option>
            <option value="INACTIVE" ${c.status === 'INACTIVE' ? 'selected' : ''}>INACTIVE</option>
          </select>
        </td>
      `;
      courtsTbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi tải danh mục sân: ' + err.message, true);
  }
}

function renderCourtStatusBadge(status) {
  const map = {
    ACTIVE: { label: 'Hoạt động', bg: '#D1FAE5', color: '#059669' },
    MAINTENANCE: { label: 'Bảo trì', bg: '#FEF3C7', color: '#D97706' },
    INACTIVE: { label: 'Ẩn', bg: '#F3F4F6', color: '#6B7280' },
  };
  const item = map[status] || { label: status, bg: '#F3F4F6', color: '#374151' };
  return `<span class="badge" style="background:${item.bg}; color:${item.color};">${item.label}</span>`;
}

async function taoLoaiSan(e) {
  e.preventDefault();
  const name = document.getElementById('loai-san-ten').value.trim();
  const description = document.getElementById('loai-san-mota').value.trim();

  try {
    await apiFetch('/admin/court-types', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    showToast('Tạo loại sân thành công!');
    document.getElementById('loai-san-ten').value = '';
    document.getElementById('loai-san-mota').value = '';
    loadCourtTypesAndCourts();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function taoSan(e) {
  e.preventDefault();
  const courtTypeId = Number(document.getElementById('san-loai-chon').value);
  const name = document.getElementById('san-ten').value.trim();
  const description = document.getElementById('san-mota').value.trim();

  try {
    await apiFetch('/admin/courts', {
      method: 'POST',
      body: JSON.stringify({ courtTypeId, name, description }),
    });
    showToast('Tạo sân mới thành công!');
    document.getElementById('san-ten').value = '';
    document.getElementById('san-mota').value = '';
    loadCourtTypesAndCourts();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function doiTrangThaiSan(courtId, newStatus) {
  try {
    await apiFetch(`/admin/courts/${courtId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    showToast('Cập nhật trạng thái sân thành công!');
    loadCourtTypesAndCourts();
  } catch (err) {
    if (err.errorCode === 'COURT_HAS_FUTURE_BOOKINGS') {
      alert(`Không thể chuyển trạng thái! Sân đang có ${err.data?.futureBookings || ''} đơn đặt trong tương lai (BR-05).`);
    } else {
      showToast(err.message, true);
    }
    loadCourtTypesAndCourts();
  }
}

// ================= 10. TAB BẢNG GIÁ MA TRẬN (ADM-04) =================
let editingPrices = [];

async function loadPricingMatrix() {
  try {
    if (cachedCourtTypes.length === 0) {
      const res = await apiFetch('/court-types');
      cachedCourtTypes = res.data || [];
    }

    const select = document.getElementById('price-court-type-select');
    if (select.children.length === 0) {
      cachedCourtTypes.forEach((t) => {
        select.innerHTML += `<option value="${t.id}">${t.name || t.tenLoaiSan}</option>`;
      });
    }

    const courtTypeId = select.value || cachedCourtTypes[0]?.id;
    if (!courtTypeId) return;

    const [slotsRes, pricesRes] = await Promise.all([
      apiFetch('/time-slots'),
      apiFetch(`/admin/slot-prices?courtTypeId=${courtTypeId}`).catch(() => ({ data: [] })),
    ]);

    cachedTimeSlots = slotsRes.data || [];
    const prices = pricesRes.data || [];
    const priceMap = {};
    prices.forEach((p) => {
      priceMap[`${p.timeSlotId || p.khungGioId}_${p.dayType || p.loaiNgay}`] = p.price || p.giaTien;
    });

    editingPrices = [];
    const tbody = document.getElementById('prices-tbody');
    tbody.innerHTML = '';

    cachedTimeSlots.forEach((s) => {
      const sId = s.id;
      const weekdayPrice = priceMap[`${sId}_WEEKDAY`] ?? 80000;
      const weekendPrice = priceMap[`${sId}_WEEKEND`] ?? 100000;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${(s.startTime || s.gioBatDau).substring(0, 5)} - ${(s.endTime || s.gioKetThuc).substring(0, 5)}</td>
        <td>
          <input type="number" class="form-input" style="width:140px;" value="${weekdayPrice}" step="5000" id="price_${sId}_WEEKDAY" />
        </td>
        <td>
          <input type="number" class="form-input" style="width:140px;" value="${weekendPrice}" step="5000" id="price_${sId}_WEEKEND" />
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi tải bảng giá: ' + err.message, true);
  }
}

async function luuBangGia() {
  const courtTypeId = Number(document.getElementById('price-court-type-select').value);
  if (!courtTypeId) return;

  const priceList = [];
  cachedTimeSlots.forEach((s) => {
    const sId = s.id;
    const weekdayInput = document.getElementById(`price_${sId}_WEEKDAY`);
    const weekendInput = document.getElementById(`price_${sId}_WEEKEND`);

    if (weekdayInput && weekendInput) {
      priceList.push({
        timeSlotId: sId,
        khungGioId: sId,
        dayType: 'WEEKDAY',
        price: Number(weekdayInput.value),
        giaTien: Number(weekdayInput.value),
      });
      priceList.push({
        timeSlotId: sId,
        khungGioId: sId,
        dayType: 'WEEKEND',
        price: Number(weekendInput.value),
        giaTien: Number(weekendInput.value),
      });
    }
  });

  try {
    await apiFetch('/admin/slot-prices', {
      method: 'PUT',
      body: JSON.stringify({
        courtTypeId,
        loaiSanId: courtTypeId,
        prices: priceList,
        danhSachGia: priceList,
      }),
    });
    showToast('Lưu bảng giá thành công!');
  } catch (err) {
    showToast(err.message || 'Lỗi lưu bảng giá', true);
  }
}

// ================= 11. TAB TÀI KHOẢN NHÂN VIÊN (ADM-05) =================
async function loadStaff() {
  try {
    const res = await apiFetch('/admin/staff');
    const items = res.data || [];
    const tbody = document.getElementById('staff-tbody');
    tbody.innerHTML = '';

    items.forEach((u) => {
      const isLocked = u.status === 'LOCKED';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td style="font-weight:600;">${u.fullName || u.full_name || u.hoTen}</td>
        <td>${u.phone || u.soDienThoai}</td>
        <td>${u.email || '—'}</td>
        <td>${isLocked ? '<span class="badge" style="background:#FEE2E2; color:#DC2626;">Khóa</span>' : '<span class="badge" style="background:#D1FAE5; color:#059669;">Hoạt động</span>'}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-outline" style="padding:3px 8px; font-size:11px;" onclick="doiTrangThaiNhanVien(${u.id}, '${isLocked ? 'ACTIVE' : 'LOCKED'}')">
            ${isLocked ? '🔓 Mở' : '🔒 Khóa'}
          </button>
          <button class="btn btn-outline" style="padding:3px 8px; font-size:11px; margin-left:4px;" onclick="doiMatKhauNhanVien(${u.id})">
            🔑 Đổi MK
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi tải nhân viên: ' + err.message, true);
  }
}

async function taoNhanVien(e) {
  e.preventDefault();
  const fullName = document.getElementById('nv-ho-ten').value.trim();
  const phone = document.getElementById('nv-so-dien-thoai').value.trim();
  const email = document.getElementById('nv-email').value.trim() || undefined;
  const password = document.getElementById('nv-mat-khau').value.trim();

  try {
    await apiFetch('/admin/staff', {
      method: 'POST',
      body: JSON.stringify({ fullName, phone, email, password }),
    });
    showToast('Tạo tài khoản nhân viên thành công!');
    document.getElementById('nv-ho-ten').value = '';
    document.getElementById('nv-so-dien-thoai').value = '';
    document.getElementById('nv-email').value = '';
    document.getElementById('nv-mat-khau').value = '';
    loadStaff();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function doiTrangThaiNhanVien(userId, newStatus) {
  try {
    await apiFetch(`/admin/staff/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    showToast('Cập nhật trạng thái nhân viên thành công!');
    loadStaff();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function doiMatKhauNhanVien(userId) {
  const newPass = prompt('Nhập mật khẩu mới cho nhân viên (tối thiểu 6 ký tự):');
  if (!newPass) return;
  if (newPass.length < 6) {
    showToast('Mật khẩu phải từ 6 ký tự trở lên', true);
    return;
  }

  try {
    await apiFetch(`/admin/staff/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword: newPass }),
    });
    showToast('Đổi mật khẩu nhân viên thành công!');
  } catch (err) {
    showToast(err.message, true);
  }
}

// ================= 12. TAB BÁO CÁO (ADM-07) =================
async function loadReports() {
  const from = document.getElementById('rep-from').value || new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10);
  const to = document.getElementById('rep-to').value || new Date().toISOString().substring(0, 10);

  document.getElementById('rep-from').value = from;
  document.getElementById('rep-to').value = to;

  try {
    const [summaryRes, revenueRes] = await Promise.all([
      apiFetch(`/admin/reports/summary?from=${from}&to=${to}`),
      apiFetch(`/admin/reports/revenue?from=${from}&to=${to}`),
    ]);

    const sum = summaryRes.data || {};
    const rev = revenueRes.data || {};

    document.getElementById('rep-occupancy').textContent = `${sum.tyLeLapDay ?? 0}%`;
    document.getElementById('rep-slots-info').textContent = `${sum.soSlotThucTe ?? 0} slot đã đặt / ${sum.tongSlotToiDa ?? 0} slot tối đa`;
    document.getElementById('rep-revenue').textContent = formatMoney(rev.totalRevenue ?? rev.tongDoanhThu ?? 0);

    const tbody = document.getElementById('rep-tbody');
    tbody.innerHTML = '';

    const list = rev.items || [];
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:18px; color:var(--text-muted);">Không có dữ liệu trong khoảng thời gian này</td></tr>';
      return;
    }

    list.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">${formatDate(item.date || item.ngay)}</td>
        <td style="color:#059669;">+${formatMoney(item.paid || item.daThu)}</td>
        <td style="color:#DC2626;">-${formatMoney(item.refunded || item.daHoan)}</td>
        <td style="font-weight:600; color:var(--primary);">${formatMoney(item.revenue || item.doanhThu)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi tải báo cáo: ' + err.message, true);
  }
}

// ================= 13. TAB KHÁCH HÀNG (STF-10, ADM-06) =================
async function taiDanhSachKhachHang() {
  const kw = document.getElementById('khach-tu-khoa')?.value.trim() || '';
  try {
    const res = await apiFetch(`/staff/customers?keyword=${encodeURIComponent(kw)}`);
    const items = res.data || [];
    const tbody = document.getElementById('khach-tbody');
    tbody.innerHTML = '';

    items.forEach((c) => {
      const isLocked = c.status === 'LOCKED';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id}</td>
        <td style="font-weight:600;">${c.fullName || c.full_name || c.hoTen}</td>
        <td>${c.phone || c.soDienThoai}</td>
        <td>${c.email || '—'}</td>
        <td style="font-weight:600;">${c.totalBookings ?? c.tongDonDat ?? 0} đơn</td>
        <td>${isLocked ? '<span class="badge" style="background:#FEE2E2; color:#DC2626;">Khóa</span>' : '<span class="badge" style="background:#D1FAE5; color:#059669;">Hoạt động</span>'}</td>
        <td>
          <button class="btn btn-outline" style="padding:3px 8px; font-size:11px;" onclick="doiTrangThaiKhach(${c.id}, '${isLocked ? 'ACTIVE' : 'LOCKED'}')">
            ${isLocked ? '🔓 Mở' : '🔒 Khóa'}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi tải khách hàng: ' + err.message, true);
  }
}

async function doiTrangThaiKhach(customerId, newStatus) {
  try {
    await apiFetch(`/admin/customers/${customerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    showToast('Cập nhật trạng thái khách hàng thành công!');
    taiDanhSachKhachHang();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ================= 14. TAB KHUNG GIỜ (ADM-03) =================
async function loadTimeSlots() {
  try {
    const res = await apiFetch('/time-slots');
    const items = res.data || [];
    const tbody = document.getElementById('kg-tbody');
    tbody.innerHTML = '';

    items.forEach((s) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.id}</td>
        <td style="font-weight:600;">${(s.startTime || s.gioBatDau).substring(0, 5)} - ${(s.endTime || s.gioKetThuc).substring(0, 5)}</td>
        <td><span class="badge" style="background:#D1FAE5; color:#059669;">Đang dùng</span></td>
        <td>—</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi tải khung giờ: ' + err.message, true);
  }
}

async function taoKhungGio(e) {
  e.preventDefault();
  const startTime = document.getElementById('kg-gio-bat-dau').value;
  const endTime = document.getElementById('kg-gio-ket-thuc').value;

  try {
    await apiFetch('/admin/time-slots', {
      method: 'POST',
      body: JSON.stringify({ startTime, endTime }),
    });
    showToast('Tạo khung giờ thành công!');
    loadTimeSlots();
  } catch (err) {
    showToast(err.message, true);
  }
}

// ================= 15. MODAL CHI TIẾT ĐƠN (STF-04 & T32 / SYS-02) =================
async function viewDetail(bookingId) {
  try {
    const res = await apiFetch(`/staff/bookings/${bookingId}`);
    const b = res.data;
    const content = document.getElementById('modal-detail-content');

    let qrSection = '';
    if (b.thongTinThanhToan) {
      qrSection = `
        <div style="background:#F9FAFB; padding:12px; border-radius:8px; margin-top:12px; border:1px solid #E5E7EB;">
          <div style="font-weight:600; font-size:13px; margin-bottom:6px;">Thông tin chuyển khoản ngân hàng:</div>
          <div style="display:flex; gap:16px; align-items:center;">
            <img src="${b.thongTinThanhToan.qrUrl}" style="width:130px; height:130px; border-radius:6px; border:1px solid #D1D5DB;" />
            <div style="font-size:12.5px; line-height:1.6;">
              <div>Ngân hàng: <b>${b.thongTinThanhToan.tenNganHang}</b></div>
              <div>Số TK: <b>${b.thongTinThanhToan.soTaiKhoan}</b></div>
              <div>Chủ TK: <b>${b.thongTinThanhToan.tenChuTaiKhoan}</b></div>
              <div>Số tiền: <b style="color:var(--primary); font-size:14px;">${formatMoney(b.thongTinThanhToan.soTien)}</b></div>
              <div>Nội dung CK: <b style="color:#DC2626;">${b.thongTinThanhToan.noiDungChuyenKhoan}</b></div>
            </div>
          </div>
        </div>
      `;
    }

    // T32: Nhật ký thay đổi trạng thái booking_status_logs
    let logsHtml = '';
    const logs = b.nhatKyTrangThai || [];
    if (logs.length > 0) {
      logsHtml = `
        <div style="margin-top:16px;">
          <h4 style="font-size:13px; font-weight:700; margin-bottom:8px; color:var(--text);">📋 Lịch Sử Trạng Thái (SYS-02 & T32)</h4>
          <div style="border-left:2px solid var(--border); padding-left:12px; margin-left:6px;">
      `;
      logs.forEach((log) => {
        logsHtml += `
          <div style="margin-bottom:10px; font-size:12px;">
            <div style="font-weight:600;">
              ${log.trangThaiTruoc ? renderStatusBadge(log.trangThaiTruoc) : '<span style="color:var(--text-muted);">Khởi tạo</span>'}
              → ${renderStatusBadge(log.trangThaiSau)}
            </div>
            <div style="color:var(--text-muted); font-size:11px; margin-top:2px;">
              ${formatDateTime(log.thoiGian)} • ${log.tenNguoiThayDoi ? `${log.tenNguoiThayDoi} (${log.vaiTroNguoiThayDoi})` : 'Hệ thống'}
            </div>
            ${log.ghiChu ? `<div style="color:#4B5563; font-style:italic; margin-top:2px;">"${log.ghiChu}"</div>` : ''}
          </div>
        `;
      });
      logsHtml += '</div></div>';
    }

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div>
          <span style="font-size:18px; font-weight:700; color:var(--primary);">${b.maDonDat}</span>
          <span style="font-size:12px; color:var(--text-muted); margin-left:8px;">(${formatDateTime(b.ngayTao)})</span>
        </div>
        <div style="display:flex; gap:6px;">
          ${renderStatusBadge(b.trangThai)}
          ${renderPaymentBadge(b.trangThaiThanhToan)}
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px; background:var(--surface); padding:12px; border-radius:8px; border:1px solid var(--border);">
        <div><b>Khách hàng:</b> ${b.tenKhachHang}</div>
        <div><b>Số điện thoại:</b> ${b.soDienThoaiKhach || '—'}</div>
        <div><b>Sân:</b> ${b.tenSan} (${b.tenLoaiSan})</div>
        <div><b>Ngày đặt:</b> ${formatDate(b.ngayDat)}</div>
        <div><b>Thời gian:</b> ${(b.gioBatDau || '').substring(0, 5)} - ${(b.gioKetThuc || '').substring(0, 5)}</div>
        <div><b>Hình thức TT:</b> ${b.phuongThucThanhToan === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}</div>
        <div><b>Tổng tiền:</b> <span style="font-size:15px; font-weight:700; color:var(--primary);">${formatMoney(b.tongTien)}</span></div>
        <div><b>Nguồn đơn:</b> <span class="badge" style="background:#E0E7FF; color:#4338CA;">${b.nguonDon}</span></div>
      </div>

      ${qrSection}
      ${logsHtml}

      <div style="margin-top:18px; display:flex; justify-content:flex-end; gap:8px;">
        ${b.trangThaiThanhToan === 'UNPAID' && (b.trangThai === 'PENDING' || b.trangThai === 'CONFIRMED') ? `
          <button class="btn btn-primary" onclick="quickPay(${b.id}); closeModal('modal-detail');">💵 Ghi Nhận Thanh Toán</button>
        ` : ''}
        ${b.trangThai === 'CONFIRMED' && b.trangThaiThanhToan === 'PAID' ? `
          <button class="btn btn-outline" style="color:#10B981; border-color:#10B981;" onclick="completeBooking(${b.id}); closeModal('modal-detail');">✅ Hoàn Thành Đơn</button>
        ` : ''}
        ${b.trangThai === 'CONFIRMED' || b.trangThai === 'PENDING' ? `
          <button class="btn btn-outline" style="color:#EF4444; border-color:#EF4444;" onclick="cancelBooking(${b.id}); closeModal('modal-detail');">❌ Hủy Đơn</button>
        ` : ''}
        <button class="btn btn-outline" onclick="closeModal('modal-detail')">Đóng</button>
      </div>
    `;

    openModal('modal-detail');
  } catch (err) {
    showToast('Lỗi xem chi tiết: ' + err.message, true);
  }
}

// ================= 16. CÁC HÀNH ĐỘNG ĐƠN =================
async function quickPay(bookingId) {
  if (!confirm('Xác nhận đã nhận đủ tiền thanh toán cho đơn này?')) return;
  try {
    await apiFetch(`/staff/bookings/${bookingId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ method: 'CASH', note: 'Thanh toán tiền mặt tại quầy' }),
    });
    showToast('Ghi nhận thanh toán thành công!');
    if (currentTab === 'bookings') loadBookings(bookingPage);
    else if (currentTab === 'dashboard') loadDashboard();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function completeBooking(bookingId) {
  if (!confirm('Xác nhận khách đã nhận sân và hoàn thành đơn?')) return;
  try {
    await apiFetch(`/staff/bookings/${bookingId}/complete`, { method: 'POST' });
    showToast('Hoàn thành đơn đặt sân!');
    if (currentTab === 'bookings') loadBookings(bookingPage);
    else if (currentTab === 'dashboard') loadDashboard();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function cancelBooking(bookingId) {
  const reason = prompt('Nhập lý do hủy đơn (bắt buộc):');
  if (reason === null) return;
  if (!reason.trim()) {
    showToast('Lý do hủy đơn không được để trống (BR-09)', true);
    return;
  }

  try {
    await apiFetch(`/staff/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason.trim() }),
    });
    showToast('Hủy đơn thành công!');
    if (currentTab === 'bookings') loadBookings(bookingPage);
    else if (currentTab === 'dashboard') loadDashboard();
  } catch (err) {
    showToast(err.message, true);
  }
}

function renderPagination(containerId, currentPage, pageSize, totalItems, callbackName) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<div style="display:flex; gap:6px; align-items:center; justify-content:center; margin-top:16px;">`;
  html += `<button class="btn btn-outline" style="padding:4px 10px;" ${currentPage <= 1 ? 'disabled' : ''} onclick="${callbackName}(${currentPage - 1})">◀ Trước</button>`;
  html += `<span style="font-size:13px; color:var(--text-muted); margin:0 8px;">Trang ${currentPage} / ${totalPages} (${totalItems} kết quả)</span>`;
  html += `<button class="btn btn-outline" style="padding:4px 10px;" ${currentPage >= totalPages ? 'disabled' : ''} onclick="${callbackName}(${currentPage + 1})">Sau ▶</button>`;
  html += `</div>`;
  container.innerHTML = html;
}

// ================= 17. KHỞI TẠO KHI TẢI TRANG =================
document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  const userJson = localStorage.getItem(USER_KEY);

  if (!token || !userJson) {
    showLoginOverlay();
    return;
  }

  try {
    currentUser = JSON.parse(userJson);
    // Kiểm tra token với backend
    const res = await apiFetch('/auth/me');
    currentUser = res.data.user || res.data.nguoiDung || currentUser;

    if (currentUser.role === 'CUSTOMER') {
      clearAuth();
      showLoginOverlay();
      return;
    }

    applyUserUI();
    switchTab('dashboard');
  } catch (err) {
    clearAuth();
    showLoginOverlay();
  }

  // Lắng nghe sự kiện đổi sân/ngày ở tab walkin
  const walkinCourt = document.getElementById('walkin-court');
  const walkinDate = document.getElementById('walkin-date');
  if (walkinCourt) walkinCourt.addEventListener('change', loadWalkinSlots);
  if (walkinDate) walkinDate.addEventListener('change', loadWalkinSlots);
});
