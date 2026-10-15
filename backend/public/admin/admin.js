// =====================================================================
// BỘ ĐIỀU KHIỂN WEB ADMIN (admin.js) — CHUẨN PLANT / 05-pages-sitemap.md
// Quản trị viên & Nhân viên (STAFF & ADMIN) — Hỗ trợ 100% nghiệp vụ v1.2
// =====================================================================

const API_BASE = '/api/v1';
const TOKEN_KEY = 'sport_admin_token';
const USER_KEY = 'sport_admin_user';

let currentUser = null;
let currentTab = 'dashboard';
let cachedCourts = [];
let cachedCourtTypes = [];
let cachedTimeSlots = [];
let cachedServices = [];
let cachedStaff = [];
let walkinSelectedSlots = [];
let scheduleDate = new Date().toISOString().substring(0, 10);
let autoRefreshTimer = null;

// ================= 1. TIỆN ÍCH CHUNG =================
function initTheme() {
  const saved = localStorage.getItem('admin_theme') || 'light';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('admin_theme', theme);
  const icon = document.getElementById('theme-icon');
  const text = document.getElementById('theme-text');
  if (icon && text) {
    if (theme === 'dark') {
      icon.textContent = '🌙';
      text.textContent = 'Chế độ Tối';
    } else {
      icon.textContent = '☀️';
      text.textContent = 'Chế độ Sáng';
    }
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  showToast(next === 'dark' ? '🌙 Đã chuyển sang Giao diện Tối' : '☀️ Đã chuyển sang Giao diện Sáng');
  if (currentTab === 'schedule') {
    loadSchedule();
  }
}

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
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '0 ₫';
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
      const err = new Error(data.message || data.error?.message || 'Có lỗi xảy ra');
      err.code = data.error?.code;
      err.status = res.status;
      throw err;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// ================= 2. XÁC THỰC & ĐĂNG NHẬP (STF-01, BR-18) =================
function showLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function hideLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'none';
}

function fillQuickLogin(phone, password) {
  const phoneEl = document.getElementById('login-phone');
  const passEl = document.getElementById('login-password');
  if (phoneEl) phoneEl.value = phone;
  if (passEl) passEl.value = password;
  const roleName = phone === '0900000001' ? '👑 Quản Trị Viên (Admin)' : '👨‍💼 Nhân Viên Quầy (Staff)';
  showToast(`Đã điền tài khoản: ${roleName}. Bấm Đăng Nhập để vào!`);
}

async function handleLogin(e) {
  e.preventDefault();
  const phone = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-password').value;
  const msgDiv = document.getElementById('login-msg');
  msgDiv.style.display = 'none';

  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    const { token, user } = res.data;

    // BR-18: Chặn tài khoản khách hàng CUSTOMER vào trang admin
    if (user.role === 'CUSTOMER') {
      msgDiv.textContent = '⛔ Tài khoản khách hàng không có quyền truy cập trang Quản trị & Vận hành (BR-18). Vui lòng đăng nhập tài khoản STAFF hoặc ADMIN.';
      msgDiv.style.background = 'rgba(239, 68, 68, 0.2)';
      msgDiv.style.color = '#FCA5A5';
      msgDiv.style.border = '1px solid var(--danger)';
      msgDiv.style.display = 'block';
      return;
    }

    setAuth(token, user);
    hideLoginOverlay();
    applyUserUI();
    showToast(`Xin chào, ${user.fullName} (${user.role})!`);
    loadInitialData();
  } catch (err) {
    msgDiv.textContent = err.message || 'Số điện thoại hoặc mật khẩu không chính xác';
    msgDiv.style.background = 'rgba(239, 68, 68, 0.2)';
    msgDiv.style.color = '#FCA5A5';
    msgDiv.style.border = '1px solid var(--danger)';
    msgDiv.style.display = 'block';
  }
}

function logout() {
  clearAuth();
  showLoginOverlay();
  showToast('Đã đăng xuất tài khoản an toàn.');
}

function applyUserUI() {
  if (!currentUser) return;
  const userDisp = document.getElementById('user-display');
  const roleDisp = document.getElementById('role-display');

  if (userDisp) userDisp.textContent = currentUser.fullName || currentUser.phone;
  if (roleDisp) {
    roleDisp.textContent = currentUser.role;
    roleDisp.className = `role-tag role-${currentUser.role}`;
  }

  // Ẩn các menu admin-only nếu vai trò là STAFF
  const adminElements = document.querySelectorAll('.admin-only');
  adminElements.forEach((el) => {
    el.style.display = currentUser.role === 'ADMIN' ? '' : 'none';
  });
}

function checkAuthOnLoad() {
  const token = getToken();
  const userStr = localStorage.getItem(USER_KEY);

  if (!token || !userStr) {
    showLoginOverlay();
    return false;
  }

  try {
    currentUser = JSON.parse(userStr);
    if (currentUser.role === 'CUSTOMER') {
      clearAuth();
      showLoginOverlay();
      return false;
    }
    hideLoginOverlay();
    applyUserUI();
    return true;
  } catch {
    clearAuth();
    showLoginOverlay();
    return false;
  }
}

// ================= 3. ĐIỀU HƯỚNG TAB =================
function switchTab(tabId) {
  currentTab = tabId;

  // Cập nhật nav buttons
  document.querySelectorAll('aside .nav-btn').forEach((btn) => {
    btn.classList.remove('active');
    const onclickAttr = btn.getAttribute('onclick') || '';
    if (onclickAttr.includes(`'${tabId}'`)) {
      btn.classList.add('active');
    }
  });

  // Cập nhật tab contents
  document.querySelectorAll('.tab-content').forEach((sec) => sec.classList.remove('active'));
  const activeSec = document.getElementById(`tab-${tabId}`);
  if (activeSec) activeSec.classList.add('active');

  // Nạp dữ liệu tương ứng của tab
  if (tabId === 'dashboard') loadDashboard();
  else if (tabId === 'schedule') loadSchedule();
  else if (tabId === 'bookings') loadBookings();
  else if (tabId === 'walkin') loadWalkinData();
  else if (tabId === 'service-orders') loadServiceOrders();
  else if (tabId === 'catering') loadProcurementData();
  else if (tabId === 'refunds') loadRefunds();
  else if (tabId === 'customers') taiDanhSachKhachHang();
  else if (tabId === 'courts') loadCourtTypesAndCourts();
  else if (tabId === 'timeslots') loadTimeSlots();
  else if (tabId === 'prices') loadPricingMatrix();
  else if (tabId === 'services') loadAdminServices();
  else if (tabId === 'inventory') loadInventory();
  else if (tabId === 'staff') loadStaff();
  else if (tabId === 'reports') loadReports();
}

function xemDonQuaGio() {
  switchTab('bookings');
  const chk = document.getElementById('filter-overdue');
  if (chk) chk.checked = true;
  loadBookings();
}

function xemDonChoThanhToan() {
  switchTab('bookings');
  const sel = document.getElementById('filter-status');
  if (sel) sel.value = 'PENDING';
  loadBookings();
}

// ================= 4. TAB DASHBOARD (STF-02, TC-63) =================
async function loadDashboard() {
  try {
    const res = await apiFetch('/staff/dashboard');
    const data = res.data;

    // Cập nhật KPI
    document.getElementById('kpi-total').textContent = data.bookings?.total ?? data.tongDonHomNay ?? 0;
    document.getElementById('kpi-confirmed').textContent = data.bookings?.confirmed ?? data.donDaXacNhan ?? 0;
    document.getElementById('kpi-completed').textContent = data.bookings?.completed ?? data.donHoanThanh ?? 0;
    document.getElementById('kpi-revenue').textContent = formatMoney(data.revenue?.total ?? data.doanhThuHomNay ?? 0);
    document.getElementById('kpi-pending-hold').textContent = data.bookings?.pendingHold ?? data.soDonChoThanhToan ?? 0;
    document.getElementById('kpi-pending-refund').textContent = data.pendingRefunds ?? data.soDonChoHoanTien ?? 0;
    document.getElementById('kpi-pending-services').textContent = data.pendingServiceOrders ?? data.soYeuCauDichVuChoGiao ?? 0;
    document.getElementById('kpi-overdue-bookings').textContent = data.overdueBookings ?? data.soDonQuaGio ?? 0;

    // Nạp danh sách đơn hôm nay
    const todayRes = await apiFetch(`/staff/bookings?date=${new Date().toISOString().substring(0, 10)}&limit=10`);
    const list = todayRes.data?.items || [];
    const tbody = document.getElementById('dashboard-bookings-tbody');
    tbody.innerHTML = '';

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">Hôm nay chưa có đơn đặt sân nào</td></tr>';
      return;
    }

    list.forEach((b) => {
      const tr = document.createElement('tr');
      const custName = b.customerName || b.customer?.name || 'Khách vãng lai';
      const custPhone = b.customerPhone || b.customer?.phone || '';
      const cName = b.courtName || b.court?.name || '';
      tr.innerHTML = `
        <td style="font-weight:700; color:var(--primary); font-family:var(--font-mono);">${b.bookingCode}</td>
        <td>${custName} <span style="font-size:12px; color:var(--text-muted);">(${custPhone})</span></td>
        <td>${cName}</td>
        <td>${(b.startTime || '').substring(0, 5)} - ${(b.endTime || '').substring(0, 5)}</td>
        <td style="font-weight:700;">${formatMoney(b.grandTotal || b.courtAmount)}</td>
        <td>${renderStatusBadge(b.status)}</td>
        <td>${renderPaymentBadge(b.paymentStatus)}</td>
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

// ================= 5. TAB LỊCH SÂN (STF-03, BR-03) =================
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

let cachedScheduleData = null;

function filterScheduleByCourt() {
  if (!cachedScheduleData) return;
  const courtId = document.getElementById('schedule-court-filter')?.value;
  if (!courtId) {
    renderScheduleGrid(cachedScheduleData, false);
  } else {
    const filteredCourts = (cachedScheduleData.courts || []).filter(
      (c) => String(c.id || c.courtId) === String(courtId)
    );
    renderScheduleGrid({ ...cachedScheduleData, courts: filteredCourts }, false);
  }
}

function renderScheduleGrid(data, updateFilter = true) {
  if (updateFilter) {
    cachedScheduleData = data;
    const courtFilterSelect = document.getElementById('schedule-court-filter');
    if (courtFilterSelect) {
      const currentVal = courtFilterSelect.value;
      let optionsHtml = '<option value="">🏟️ Tất cả sân</option>';
      (data.courts || []).forEach((c) => {
        const id = c.id || c.courtId;
        const name = c.name || c.courtName;
        optionsHtml += `<option value="${id}">${name} (${c.courtTypeName || ''})</option>`;
      });
      courtFilterSelect.innerHTML = optionsHtml;
      if (currentVal && (data.courts || []).some((c) => String(c.id || c.courtId) === String(currentVal))) {
        courtFilterSelect.value = currentVal;
      }
    }
  }

  const courts = data.courts || [];
  const timeSlots = data.timeSlots || [];

  const grid = document.getElementById('schedule-grid');
  grid.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'schedule-table';
  table.style.width = '100%';

  const thead = document.createElement('thead');
  let headerHtml = '<tr><th style="width:125px; position:sticky; left:0; z-index:11; background:var(--th-bg); color:var(--text); border:1px solid var(--border);">Khung Giờ</th>';
  courts.forEach((c) => {
    const statusTag = c.status === 'MAINTENANCE' ? ' <span style="font-size:11px; font-weight:800; color:var(--danger);">(Bảo trì)</span>' : '';
    const capTag = c.capacity ? ` · Sức chứa ${c.capacity} người` : '';
    const cName = c.name || c.courtName || '';
    const cTypeName = c.courtTypeName || '';
    headerHtml += `<th style="background:var(--th-bg); color:var(--text); border:1px solid var(--border);">${cName}${statusTag}<br><span style="font-size:11px; font-weight:600; color:var(--text-muted);">${cTypeName}${capTag}</span></th>`;
  });
  headerHtml += '</tr>';
  thead.innerHTML = headerHtml;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  timeSlots.forEach((slot) => {
    const tr = document.createElement('tr');
    const timeLabel = `${slot.startTime.substring(0, 5)} - ${slot.endTime.substring(0, 5)}`;
    let rowHtml = `<td style="position:sticky; left:0; z-index:5; background:var(--th-bg); color:var(--text); font-weight:800; font-size:12.5px; font-family:var(--font-mono); border:1px solid var(--border); text-align:center;">${timeLabel}</td>`;

    courts.forEach((c) => {
      const cell = c.slots?.find((s) => s.timeSlotId === slot.id) || { status: 'AVAILABLE' };
      let bgStyle = '';
      let content = '';

      const isBooked = cell.status === 'BOOKED' || Boolean(cell.booking) || Boolean(cell.bookingId);

      if (isBooked) {
        const b = cell.booking || cell;
        const isPending = (cell.bookingStatus || b.status) === 'PENDING';
        bgStyle = isPending
          ? 'background: var(--warning-light); border-left: 4px solid var(--warning); cursor: pointer;'
          : 'background: var(--accent-light); border-left: 4px solid var(--accent); cursor: pointer;';
        content = `
          <div style="font-weight:800; font-size:12px; color:${isPending ? 'var(--warning)' : 'var(--accent)'}; font-family:var(--font-mono);">${cell.bookingCode || b.bookingCode || 'ĐÃ ĐẶT'}</div>
          <div style="font-size:11.5px; font-weight:700; color:var(--text); margin-top:2px;">${cell.customerName || b.customerName || ''}</div>
        `;
      } else if (cell.status === 'MAINTENANCE' || c.status === 'MAINTENANCE') {
        bgStyle = 'background: var(--danger-light); color:var(--danger);';
        content = '<span style="font-size:11.5px; font-weight:800;">🔧 Bảo trì</span>';
      } else if (cell.status === 'PAST') {
        bgStyle = 'background: var(--surface-card); color:var(--text-muted); opacity:0.75;';
        content = '<span style="font-size:11.5px; font-weight:600;">⏳ Đã qua</span>';
      } else {
        bgStyle = 'background: var(--primary-light); color:var(--primary); cursor: pointer; transition: all 0.15s ease;';
        content = `<div style="font-size:12.5px; font-weight:800; color:var(--primary);">${formatMoney(cell.price)}</div>
                   <div style="font-size:10px; color:var(--text-muted); font-weight:700; margin-top:2px;">⚡ Bấm đặt</div>`;
      }

      const bookingId = cell.bookingId || cell.booking?.id;
      const clickAttr = bookingId
        ? `onclick="viewDetail(${bookingId})"`
        : cell.status === 'AVAILABLE'
        ? `onclick="quickBookWalkin(${c.id || c.courtId}, '${scheduleDate}', ${slot.id})"`
        : '';

      rowHtml += `<td style="${bgStyle} height:54px; vertical-align:middle; text-align:center; border:1px solid var(--border);" ${clickAttr}>${content}</td>`;
    });

    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  grid.appendChild(table);
}

function quickBookWalkin(courtId, date, slotId) {
  switchTab('walkin');
  document.getElementById('walkin-court').value = courtId;
  document.getElementById('walkin-date').value = date;
  loadWalkinSlots().then(() => {
    // Tự động tick slot đó
    const btn = document.querySelector(`[data-slot-id="${slotId}"]`);
    if (btn) btn.click();
  });
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
  const overdue = document.getElementById('filter-overdue')?.checked || false;

  const params = new URLSearchParams({
    page: String(bookingPage),
    limit: '20',
  });
  if (date) params.append('date', date);
  if (courtId) params.append('courtId', courtId);
  if (status) params.append('status', status);
  if (paymentStatus) params.append('paymentStatus', paymentStatus);
  if (keyword) params.append('keyword', keyword);
  if (overdue) params.append('overdue', 'true');

  try {
    const res = await apiFetch(`/staff/bookings?${params.toString()}`);
    const items = res.data?.items || [];
    renderBookingsTable(items);
  } catch (err) {
    showToast('Lỗi tải danh sách đơn: ' + err.message, true);
  }
}

function renderBookingsTable(items) {
  const tbody = document.getElementById('bookings-tbody');
  tbody.innerHTML = '';

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:24px;">Không tìm thấy đơn đặt sân phù hợp</td></tr>';
    return;
  }

  items.forEach((b) => {
    const custName = b.customerName || b.customer?.name || 'Khách vãng lai';
    const custPhone = b.customerPhone || b.customer?.phone || '';
    const cName = b.courtName || b.court?.name || '';
    const cTypeName = b.courtTypeName || b.court?.courtTypeName || '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:700; color:var(--primary); font-family:var(--font-mono);">${b.bookingCode}</td>
      <td>${custName}<br><span style="font-size:12px; color:var(--text-muted);">${custPhone}</span></td>
      <td>${cName}<br><span style="font-size:11px; color:var(--text-muted);">${cTypeName}</span></td>
      <td>${formatDate(b.bookingDate)}<br><span style="font-size:12px; font-weight:600;">${(b.startTime || '').substring(0, 5)} - ${(b.endTime || '').substring(0, 5)}</span></td>
      <td style="font-weight:600;">${formatMoney(b.courtAmount)}</td>
      <td style="color:${b.serviceAmount > 0 ? 'var(--info)' : 'var(--text-muted)'}; font-weight:600;">${formatMoney(b.serviceAmount)}</td>
      <td style="font-weight:700; color:#FFFFFF;">${formatMoney(b.grandTotal || (Number(b.courtAmount) + Number(b.serviceAmount)))}</td>
      <td>${renderStatusBadge(b.status)}</td>
      <td>${renderPaymentBadge(b.paymentStatus)}</td>
      <td>
        <button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="viewDetail(${b.id})">👁️ Chi Tiết</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStatusBadge(status) {
  const map = {
    PENDING: { label: 'Chờ giữ chỗ', bg: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', border: '#F59E0B' },
    CONFIRMED: { label: 'Đã xác nhận', bg: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', border: '#3B82F6' },
    CHECKED_IN: { label: 'Đã check-in', bg: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '#10B981' },
    COMPLETED: { label: 'Hoàn thành', bg: 'rgba(139, 92, 246, 0.2)', color: '#C4B5FD', border: '#8B5CF6' },
    CANCELLED: { label: 'Đã hủy', bg: 'rgba(239, 68, 68, 0.2)', color: '#F87171', border: '#EF4444' },
    EXPIRED: { label: 'Hết hạn giữ', bg: 'rgba(107, 114, 128, 0.2)', color: '#94A3B8', border: '#64748B' },
    NO_SHOW: { label: 'Vắng mặt', bg: 'rgba(239, 68, 68, 0.3)', color: '#FCA5A5', border: '#DC2626' },
  };
  const item = map[status] || { label: status, bg: 'rgba(107, 114, 128, 0.2)', color: '#CBD5E1', border: '#64748B' };
  return `<span class="badge" style="background:${item.bg}; color:${item.color}; border: 1px solid ${item.border};">${item.label}</span>`;
}

function renderPaymentBadge(status) {
  const map = {
    UNPAID: { label: 'Chưa thanh toán', bg: 'rgba(239, 68, 68, 0.2)', color: '#F87171', border: '#EF4444' },
    PAID: { label: 'Đã thanh toán', bg: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '#10B981' },
    REFUND_PENDING: { label: 'Chờ hoàn tiền', bg: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', border: '#F59E0B' },
    REFUNDED: { label: 'Đã hoàn tiền', bg: 'rgba(139, 92, 246, 0.2)', color: '#C4B5FD', border: '#8B5CF6' },
  };
  const item = map[status] || { label: status, bg: 'rgba(107, 114, 128, 0.2)', color: '#CBD5E1', border: '#64748B' };
  return `<span class="badge" style="background:${item.bg}; color:${item.color}; border: 1px solid ${item.border};">${item.label}</span>`;
}

// ================= 7. TAB ĐẶT SÂN TẠI QUẦY (STF-05, BR-02, BR-03, TC-61) =================
async function loadWalkinData() {
  try {
    const res = await apiFetch('/courts');
    cachedCourts = res.data || [];

    const select = document.getElementById('walkin-court');
    const filterCourt = document.getElementById('filter-court');

    select.innerHTML = '<option value="">-- Chọn sân --</option>';
    if (filterCourt) filterCourt.innerHTML = '<option value="">Tất cả sân</option>';

    cachedCourts.filter((c) => c.status === 'ACTIVE').forEach((c) => {
      const opt = `<option value="${c.id}">${c.name} (${c.courtTypeName})</option>`;
      select.innerHTML += opt;
      if (filterCourt) filterCourt.innerHTML += opt;
    });

    const dateInput = document.getElementById('walkin-date');
    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().substring(0, 10);
    }

    walkinSelectedSlots = [];
    document.getElementById('walkin-slots').innerHTML = '<div style="grid-column:1/-1; color:var(--text-muted); font-size:13px;">Vui lòng chọn sân và ngày để xem khung giờ trống</div>';
  } catch (err) {
    showToast('Lỗi tải danh mục sân: ' + err.message, true);
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

  container.innerHTML = '<div style="grid-column:1/-1; color:var(--text-muted); font-size:13px;">Đang tải khung giờ trống...</div>';

  try {
    // STF-05 & TC-61: Gọi endpoint availability theo quy tắc nhân viên để cho phép chọn slot đang diễn ra!
    const res = await apiFetch(`/staff/courts/${courtId}/availability?date=${date}`);
    const slots = res.data?.slots || [];

    container.innerHTML = '';
    slots.forEach((s) => {
      const isAvailable = s.status === 'AVAILABLE';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-slot-id', s.timeSlotId);
      btn.className = `quick-btn ${isAvailable ? '' : 'disabled'}`;
      btn.style.opacity = isAvailable ? '1' : '0.4';
      btn.style.cursor = isAvailable ? 'pointer' : 'not-allowed';
      btn.innerHTML = `
        <div style="font-weight:700; font-family:var(--font-mono);">${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}</div>
        <div style="font-size:11px;">${isAvailable ? formatMoney(s.price) : (s.status === 'BOOKED' ? 'Đã đặt' : 'Bảo trì')}</div>
      `;

      if (isAvailable) {
        btn.onclick = () => toggleWalkinSlot(s.timeSlotId, btn);
      }
      container.appendChild(btn);
    });
  } catch (err) {
    container.innerHTML = `<div style="grid-column:1/-1; color:var(--danger); font-size:13px;">Lỗi: ${err.message}</div>`;
  }
}

function toggleWalkinSlot(slotId, btn) {
  const idx = walkinSelectedSlots.indexOf(slotId);
  if (idx >= 0) {
    walkinSelectedSlots.splice(idx, 1);
    btn.style.background = 'var(--surface-card)';
    btn.style.borderColor = 'var(--border)';
    btn.style.color = 'var(--text)';
  } else {
    if (walkinSelectedSlots.length >= 3) {
      showToast('Chỉ được chọn tối đa 3 khung giờ liên tiếp (BR-02)', true);
      return;
    }
    walkinSelectedSlots.push(slotId);
    btn.style.background = 'var(--primary)';
    btn.style.borderColor = 'var(--primary)';
    btn.style.color = '#FFFFFF';
  }
}

function toggleWalkinCustomerType() {
  const isGuest = document.querySelector('input[name="walkin-customer-type"]:checked').value === 'GUEST';
  document.getElementById('walkin-guest-fields').style.display = isGuest ? 'grid' : 'none';
  document.getElementById('walkin-member-fields').style.display = isGuest ? 'none' : 'block';
}

function toggleWalkinPaymentMethod() {
  const payNow = document.getElementById('walkin-paynow').value === 'true';
  document.getElementById('walkin-method-group').style.display = payNow ? 'flex' : 'none';
}

async function timKhachHangChoWalkin() {
  const kw = document.getElementById('walkin-search-customer').value.trim();
  if (!kw) return showToast('Vui lòng nhập từ khóa tìm kiếm khách hàng', true);

  try {
    const res = await apiFetch(`/staff/customers?keyword=${encodeURIComponent(kw)}`);
    const customers = res.data || [];
    const sel = document.getElementById('walkin-customer-select');
    sel.innerHTML = '<option value="">-- Chọn khách hàng --</option>';

    customers.forEach((c) => {
      sel.innerHTML += `<option value="${c.id}">${c.fullName} (${c.phone}) - ${c.email || 'Chưa có email'}</option>`;
    });

    if (customers.length === 0) {
      showToast('Không tìm thấy khách hàng nào với từ khóa trên', true);
    } else {
      showToast(`Đã tìm thấy ${customers.length} khách hàng.`);
    }
  } catch (err) {
    showToast('Lỗi tìm khách: ' + err.message, true);
  }
}

async function handleCreateWalkIn(e) {
  e.preventDefault();
  const courtId = Number(document.getElementById('walkin-court').value);
  const bookingDate = document.getElementById('walkin-date').value;
  const payNow = document.getElementById('walkin-paynow').value === 'true';
  const paymentMethod = document.getElementById('walkin-payment-method').value;
  const note = document.getElementById('walkin-note').value;

  if (walkinSelectedSlots.length === 0) {
    return showToast('Vui lòng chọn ít nhất 1 khung giờ', true);
  }

  const isGuest = document.querySelector('input[name="walkin-customer-type"]:checked').value === 'GUEST';
  let payload = {
    courtId,
    bookingDate,
    timeSlotIds: walkinSelectedSlots,
    payNow,
    paymentMethod: payNow ? paymentMethod : undefined,
    note,
  };

  if (isGuest) {
    const guestName = document.getElementById('walkin-guest-name').value.trim();
    const guestPhone = document.getElementById('walkin-guest-phone').value.trim();
    if (!guestPhone) return showToast('Vui lòng nhập số điện thoại khách vãng lai', true);
    payload.guestName = guestName;
    payload.guestPhone = guestPhone;
  } else {
    const customerId = document.getElementById('walkin-customer-select').value;
    if (!customerId) return showToast('Vui lòng chọn khách hàng có tài khoản', true);
    payload.customerId = Number(customerId);
  }

  try {
    const res = await apiFetch('/staff/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    showToast(`Đặt sân thành công! Mã đơn: ${res.data.bookingCode}`);
    switchTab('bookings');
  } catch (err) {
    showToast('Đặt sân thất bại: ' + err.message, true);
  }
}

// ================= 8. TAB HÀNG ĐỢI DỊCH VỤ (STF-11, STF-15, TC-59) =================
async function loadServiceOrders() {
  const status = document.getElementById('filter-so-status')?.value || '';
  const url = status ? `/staff/service-orders?status=${status}` : '/staff/service-orders';

  try {
    const res = await apiFetch(url);
    const orders = Array.isArray(res.data) ? res.data : (res.data?.items || []);
    renderServiceOrdersTable(orders);
    await loadServiceAvailability();
  } catch (err) {
    showToast('Lỗi tải hàng đợi dịch vụ: ' + err.message, true);
  }
}

function renderServiceOrdersTable(orders) {
  const tbody = document.getElementById('service-orders-tbody');
  tbody.innerHTML = '';

  const orderList = Array.isArray(orders) ? orders : (orders?.items || []);

  if (orderList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:20px;">Hiện không có yêu cầu dịch vụ nào</td></tr>';
    return;
  }

  orderList.forEach((so) => {
    const tr = document.createElement('tr');
    const itemsText = (so.items || [])
      .map((it) => `<div style="font-size:12.5px;">• <strong>${it.name || it.serviceName || 'Dịch vụ'}</strong> × ${it.quantity} (${formatMoney(it.unitPrice)})</div>`)
      .join('');

    const actions = so.status === 'REQUESTED'
      ? `<div style="display:flex; gap:6px;">
           <button class="btn btn-primary" style="padding:4px 8px; font-size:12px;" onclick="giaoYeuCauDichVu(${so.id})">🚀 Đã Giao</button>
           <button class="btn btn-danger" style="padding:4px 8px; font-size:12px;" onclick="huyYeuCauDichVu(${so.id})">❌ Hủy</button>
         </div>`
      : `<span style="font-size:12px; color:var(--text-muted);">${so.status}</span>`;

    const bookingId = so.booking?.id || so.bookingId;
    const bookingCode = so.booking?.bookingCode || so.bookingCode || '—';
    const courtName = so.booking?.courtName || so.courtName || '—';
    const customerName = so.booking?.customerName || so.customerName || 'Khách';
    const customerPhone = so.booking?.customerPhone || so.customerPhone || '';

    tr.innerHTML = `
      <td style="font-weight:700; font-family:var(--font-mono);">#${so.id}</td>
      <td style="font-weight:600; color:var(--primary); cursor:pointer;" onclick="viewDetail(${bookingId})">${bookingCode}</td>
      <td>${courtName}</td>
      <td>${customerName}<br><span style="font-size:11px; color:var(--text-muted);">${customerPhone}</span></td>
      <td>${itemsText}</td>
      <td style="font-style:italic; font-size:12px;">${so.note || '—'}</td>
      <td style="font-size:12px;">${formatDateTime(so.createdAt)}</td>
      <td>${renderStatusBadge(so.status)}</td>
      <td>${actions}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function giaoYeuCauDichVu(orderId) {
  if (!confirm(`Xác nhận đã giao đồ cho yêu cầu dịch vụ #${orderId}? Tiền dịch vụ sẽ được tính vào đơn đặt sân.`)) return;

  try {
    await apiFetch(`/staff/service-orders/${orderId}/deliver`, { method: 'POST' });
    showToast(`Đã giao thành công yêu cầu #${orderId}!`);
    loadServiceOrders();
  } catch (err) {
    showToast('Lỗi khi cập nhật giao hàng: ' + err.message, true);
  }
}

async function huyYeuCauDichVu(orderId) {
  const reason = prompt('Nhập lý do hủy yêu cầu dịch vụ này:');
  if (!reason) return;

  try {
    await apiFetch(`/staff/service-orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    showToast(`Đã hủy yêu cầu #${orderId}`);
    loadServiceOrders();
  } catch (err) {
    showToast('Lỗi khi hủy yêu cầu: ' + err.message, true);
  }
}

async function loadServiceAvailability() {
  try {
    const res = await apiFetch('/services');
    cachedServices = Array.isArray(res.data) ? res.data : (res.data?.items || []);
    const tbody = document.getElementById('service-availability-tbody');
    tbody.innerHTML = '';

    if (cachedServices.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">Không có dịch vụ nào</td></tr>';
      return;
    }

    cachedServices.forEach((sv) => {
      const tr = document.createElement('tr');
      const isAvailable = sv.status === 'ACTIVE';
      const toggleBtn = isAvailable
        ? `<button class="btn btn-warning" style="padding:4px 8px; font-size:12px;" onclick="doiTrangThaiBanDichVu(${sv.id}, 'OUT_OF_STOCK')">⚠️ Đánh dấu Hết hàng</button>`
        : `<button class="btn btn-primary" style="padding:4px 8px; font-size:12px;" onclick="doiTrangThaiBanDichVu(${sv.id}, 'ACTIVE')">✅ Mở bán lại</button>`;

      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700;">${sv.id}</td>
        <td style="font-weight:600;">${sv.name}</td>
        <td><span class="badge" style="background:rgba(59, 130, 246, 0.2); color:#60A5FA;">${sv.category || sv.type || 'Dịch vụ'}</span></td>
        <td style="font-weight:700;">${formatMoney(sv.price)} / ${sv.unit}</td>
        <td>${isAvailable ? '<span style="color:#10B981; font-weight:700;">● Còn hàng (ACTIVE)</span>' : '<span style="color:#F59E0B; font-weight:700;">● Tạm hết hàng (OUT_OF_STOCK)</span>'}</td>
        <td>${toggleBtn}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Lỗi tải trạng thái hàng dịch vụ', err);
  }
}

async function doiTrangThaiBanDichVu(id, status) {
  try {
    await apiFetch(`/staff/services/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    showToast('Cập nhật trạng thái mặt hàng thành công!');
    loadServiceAvailability();
  } catch (err) {
    showToast('Lỗi cập nhật mặt hàng: ' + err.message, true);
  }
}

// ================= 9. TAB XỬ LÝ HOÀN TIỀN (STF-09, BR-34, TC-31) =================
let currentRefundStatus = 'PENDING';
let currentRefundKeyword = '';
let refundItemsCache = [];

async function loadRefunds() {
  try {
    const statusParam = currentRefundStatus === 'ALL' ? '' : `status=${currentRefundStatus}`;
    const kwParam = currentRefundKeyword ? `&keyword=${encodeURIComponent(currentRefundKeyword)}` : '';
    const query = [statusParam, kwParam].filter(Boolean).join('&');
    const url = `/staff/refunds${query ? '?' + query : ''}`;

    const res = await apiFetch(url);
    const data = res.data || {};
    refundItemsCache = data.items || [];

    // Cập nhật thống kê thẻ KPI
    if (data.stats) {
      const elTotal = document.getElementById('rf-stat-total');
      const elTotalAmt = document.getElementById('rf-stat-total-amt');
      const elPending = document.getElementById('rf-stat-pending');
      const elPendingAmt = document.getElementById('rf-stat-pending-amt');
      const elSuccess = document.getElementById('rf-stat-success');
      const elSuccessAmt = document.getElementById('rf-stat-success-amt');

      if (elTotal) elTotal.textContent = data.stats.totalCount || 0;
      if (elTotalAmt) elTotalAmt.textContent = formatMoney(data.stats.totalAmount || 0);
      if (elPending) elPending.textContent = data.stats.pendingCount || 0;
      if (elPendingAmt) elPendingAmt.textContent = formatMoney(data.stats.pendingAmount || 0);
      if (elSuccess) elSuccess.textContent = data.stats.successCount || 0;
      if (elSuccessAmt) elSuccessAmt.textContent = formatMoney(data.stats.successAmount || 0);

      // Cập nhật số liệu chờ hoàn trên Dashboard nếu có
      const dashKpi = document.getElementById('kpi-pending-refund');
      if (dashKpi) dashKpi.textContent = data.stats.pendingCount || 0;
    }

    renderRefundsTable(refundItemsCache);
  } catch (err) {
    showToast('Lỗi tải danh sách hoàn tiền: ' + err.message, true);
  }
}

function filterRefunds(status) {
  currentRefundStatus = status;

  // Cập nhật style nút lọc
  ['all', 'pending', 'success'].forEach((type) => {
    const btn = document.getElementById(`rf-btn-filter-${type}`);
    if (btn) {
      if (
        (type === 'all' && status === 'ALL') ||
        (type === 'pending' && status === 'PENDING') ||
        (type === 'success' && status === 'SUCCESS')
      ) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });

  loadRefunds();
}

function triggerRefundSearch() {
  const kwInput = document.getElementById('rf-search-keyword');
  currentRefundKeyword = kwInput ? kwInput.value.trim() : '';
  loadRefunds();
}

function onRefundSearchKeyUp(e) {
  if (e.key === 'Enter') {
    triggerRefundSearch();
  }
}

function renderRefundsTable(refunds) {
  const tbody = document.getElementById('refunds-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (refunds.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:40px 20px; color:var(--text-muted);">
          <div style="font-size:36px; margin-bottom:10px;">💸</div>
          <strong style="font-size:15px; color:var(--text-main);">Không có khoản hoàn tiền nào</strong>
          <p style="font-size:12.5px; margin-top:4px;">
            ${currentRefundStatus === 'PENDING' ? 'Hiện không có đơn nào đang chờ nhân viên chuyển khoản.' : 'Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.'}
          </p>
          <button class="btn btn-outline" style="margin-top:12px; font-size:12px;" onclick="taoMauHoanTienDemo()">⚡ Tạo thử đơn mẫu hoàn tiền</button>
        </td>
      </tr>
    `;
    return;
  }

  refunds.forEach((rf) => {
    const tr = document.createElement('tr');
    const isPending = rf.status === 'PENDING';

    const statusBadge = isPending
      ? `<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FBBF24; border:1px solid rgba(245, 158, 11, 0.4); font-weight:700;">⏳ PENDING</span>`
      : `<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#10B981; border:1px solid rgba(16, 185, 129, 0.4); font-weight:700;">✅ REFUNDED</span>`;

    const actionBtn = isPending
      ? `<button class="btn btn-primary" style="padding:6px 12px; font-size:12px; background:#059669; border-color:#059669;" onclick="moModalXacNhanHoanTien(${rf.paymentId})">💸 Chuyển Hoàn</button>`
      : `<button class="btn btn-outline" style="padding:5px 11px; font-size:12px;" onclick="moModalChiTietHoanTien(${rf.paymentId})">👁️ Đối Soát</button>`;

    tr.innerHTML = `
      <td style="font-family:var(--font-mono); font-weight:700; color:var(--text-muted);">#${rf.paymentId}</td>
      <td>
        <span style="font-weight:700; color:var(--primary); cursor:pointer; font-family:var(--font-mono);" onclick="viewDetail(${rf.booking.id})">${rf.booking.bookingCode}</span>
        <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
          🏟️ ${rf.booking.courtName || ''} • 📅 ${rf.booking.bookingDate || ''}
        </div>
      </td>
      <td>
        <strong>${rf.booking.customerName}</strong>
        <div style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">${rf.booking.customerPhone || 'N/A'}</div>
      </td>
      <td style="font-weight:800; font-size:14.5px; color:var(--danger);">${formatMoney(rf.amount)}</td>
      <td>
        <div style="background:rgba(59, 130, 246, 0.08); padding:6px 10px; border-radius:6px; font-family:var(--font-mono); font-size:12px; border-left:3px solid var(--info); word-break:break-all;">
          ${rf.refundInfo || 'Chưa cung cấp STK'}
        </div>
        ${rf.booking.cancelReason ? `<div style="font-size:11px; color:var(--text-muted); font-style:italic; margin-top:3px;">Lý do: ${rf.booking.cancelReason}</div>` : ''}
      </td>
      <td style="font-size:12px; color:var(--text-muted);">
        ${formatDateTime(rf.createdAt)}
        ${rf.processedAt ? `<div style="font-size:11px; color:var(--primary); margin-top:2px;">Hoàn lúc: ${formatDateTime(rf.processedAt)}</div>` : ''}
      </td>
      <td>${statusBadge}</td>
      <td style="text-align: right;">${actionBtn}</td>
    `;
    tbody.appendChild(tr);
  });
}

function moModalXacNhanHoanTien(paymentId) {
  const rf = refundItemsCache.find((item) => item.paymentId === paymentId);
  if (!rf) {
    showToast('Không tìm thấy thông tin khoản hoàn tiền!', true);
    return;
  }

  document.getElementById('confirm-rf-payment-id').value = rf.paymentId;
  document.getElementById('confirm-rf-amount').textContent = formatMoney(rf.amount);
  document.getElementById('confirm-rf-code').textContent = rf.booking.bookingCode;
  document.getElementById('confirm-rf-court').textContent = `${rf.booking.courtName || ''} (${rf.booking.bookingDate || ''})`;
  document.getElementById('confirm-rf-customer').textContent = rf.booking.customerName;
  document.getElementById('confirm-rf-phone').textContent = rf.booking.customerPhone || 'N/A';
  document.getElementById('confirm-rf-reason').textContent = rf.booking.cancelReason || 'Khách tự hủy trên ứng dụng';

  const rawInfo = rf.refundInfo || '';
  document.getElementById('confirm-rf-bank-info').textContent = rawInfo || 'Chưa có thông tin nhận tiền';

  // Trích xuất số tài khoản từ thông tin
  const accMatch = rawInfo.match(/\b\d{6,16}\b/);
  const accNo = accMatch ? accMatch[0] : '';
  document.getElementById('confirm-rf-raw-acc').value = accNo || rawInfo;

  // Xác định mã ngân hàng để sinh VietQR
  let bankCode = 'Vietcombank';
  if (/MB|mb|MBBANK/i.test(rawInfo)) bankCode = 'MB';
  else if (/Techcombank|TCB/i.test(rawInfo)) bankCode = 'TCB';
  else if (/BIDV/i.test(rawInfo)) bankCode = 'BIDV';
  else if (/ACB/i.test(rawInfo)) bankCode = 'ACB';
  else if (/VPBank|VPB/i.test(rawInfo)) bankCode = 'VPB';
  else if (/Vietinbank|CTG/i.test(rawInfo)) bankCode = 'ICB';
  else if (/TPBank|TPB/i.test(rawInfo)) bankCode = 'TPB';
  else if (/Agribank/i.test(rawInfo)) bankCode = 'VBA';

  const targetAcc = accNo || '0123456789';
  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${targetAcc}-compact2.png?amount=${rf.amount}&addInfo=${encodeURIComponent('HOAN TIEN ' + rf.booking.bookingCode)}`;
  const qrImg = document.getElementById('confirm-rf-qr-img');
  if (qrImg) qrImg.src = qrUrl;

  // Mặc định sinh mã đối soát ngân hàng gợi ý
  const defaultRef = `REFUND-${Date.now().toString().slice(-6)}`;
  document.getElementById('confirm-rf-txn-ref').value = defaultRef;
  document.getElementById('confirm-rf-note').value = `Nhân viên đối soát và hoàn tiền đơn ${rf.booking.bookingCode}`;

  openModal('modal-confirm-refund');
}

function copyRefundAccount() {
  const acc = document.getElementById('confirm-rf-raw-acc').value || document.getElementById('confirm-rf-bank-info').textContent;
  if (!acc) return;
  navigator.clipboard.writeText(acc).then(() => {
    showToast('Đã sao chép thông tin tài khoản hoàn tiền!');
  }).catch(() => {
    showToast('Thông tin: ' + acc);
  });
}

async function handleConfirmRefundSubmit(e) {
  e.preventDefault();
  const paymentId = document.getElementById('confirm-rf-payment-id').value;
  const transactionRef = document.getElementById('confirm-rf-txn-ref').value.trim();
  const note = document.getElementById('confirm-rf-note').value.trim();

  const submitBtn = document.getElementById('btn-submit-refund');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Đang xử lý...';
  }

  try {
    await apiFetch(`/staff/payments/${paymentId}/confirm-refund`, {
      method: 'POST',
      body: JSON.stringify({ transactionRef, note }),
    });

    closeModal('modal-confirm-refund');
    showToast('Xác nhận hoàn tiền thành công! Trạng thái đơn đã cập nhật REFUNDED.');
    loadRefunds();
  } catch (err) {
    showToast('Lỗi xác nhận hoàn tiền: ' + err.message, true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Xác Nhận Đã Chuyển Tiền';
    }
  }
}

function moModalChiTietHoanTien(paymentId) {
  const rf = refundItemsCache.find((item) => item.paymentId === paymentId);
  if (!rf) return;

  const content = document.getElementById('refund-detail-content');
  if (!content) return;

  content.innerHTML = `
    <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:16px; margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:10px;">
        <span style="font-size:14px; font-weight:700;">Giao Dịch Hoàn Tiền #${rf.paymentId}</span>
        <span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#10B981; font-weight:700;">✅ SUCCESS</span>
      </div>
      <div style="font-size:13px; line-height:1.8; color:var(--text-main);">
        <div><strong>Mã đơn đặt:</strong> <span style="font-family:var(--font-mono); color:var(--primary); font-weight:700;">${rf.booking.bookingCode}</span></div>
        <div><strong>Sân thể thao:</strong> ${rf.booking.courtName || 'N/A'} (Ngày: ${rf.booking.bookingDate || 'N/A'})</div>
        <div><strong>Khách hàng:</strong> ${rf.booking.customerName} - ${rf.booking.customerPhone || 'N/A'}</div>
        <div><strong>Số tiền hoàn:</strong> <span style="font-weight:800; color:var(--danger); font-size:15px;">${formatMoney(rf.amount)}</span></div>
        <div><strong>Mã giao dịch đối soát:</strong> <span style="font-family:var(--font-mono); font-weight:700; color:var(--info);">${rf.transactionRef || 'N/A'}</span></div>
        <div><strong>Người xử lý:</strong> ${rf.processorName || `Nhân viên #${rf.processorId || 2}`}</div>
        <div><strong>Thời gian gửi yêu cầu:</strong> ${formatDateTime(rf.createdAt)}</div>
        <div><strong>Thời gian xử lý:</strong> ${formatDateTime(rf.processedAt)}</div>
      </div>
    </div>
    <div style="background:rgba(59, 130, 246, 0.06); border:1px solid rgba(59, 130, 246, 0.25); border-radius:10px; padding:12px;">
      <div style="font-size:12px; font-weight:700; color:var(--info); margin-bottom:4px;">THÔNG TIN TÀI KHOẢN NHẬN HOÀN TIỀN:</div>
      <div style="font-family:var(--font-mono); font-size:13px; font-weight:600; color:#1E40AF;">${rf.refundInfo || 'Chưa cung cấp'}</div>
      ${rf.booking.cancelReason ? `<div style="font-size:12px; color:var(--text-muted); margin-top:6px; font-style:italic;">Lý do khách hủy: ${rf.booking.cancelReason}</div>` : ''}
    </div>
  `;

  openModal('modal-refund-detail');
}

async function taoMauHoanTienDemo() {
  try {
    const res = await apiFetch('/staff/refunds/demo-seed', { method: 'POST' });
    showToast(res.message || 'Đã tạo dữ liệu mẫu hoàn tiền thành công!');
    loadRefunds();
  } catch (err) {
    showToast('Lỗi tạo mẫu hoàn tiền: ' + err.message, true);
  }
}

// ================= 10. TAB KHÁCH HÀNG (STF-10, ADM-06, TC-66) =================
async function taiDanhSachKhachHang() {
  const kw = document.getElementById('khach-tu-khoa').value.trim();
  const url = currentUser?.role === 'ADMIN'
    ? (kw ? `/admin/customers?keyword=${encodeURIComponent(kw)}` : '/admin/customers')
    : `/staff/customers?keyword=${encodeURIComponent(kw)}`;

  try {
    const res = await apiFetch(url);
    const customers = res.data?.items || res.data || [];
    renderCustomersTable(customers);
  } catch (err) {
    showToast('Lỗi tải danh sách khách: ' + err.message, true);
  }
}

function renderCustomersTable(customers) {
  const tbody = document.getElementById('khach-tbody');
  tbody.innerHTML = '';

  if (customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">Không tìm thấy khách hàng nào</td></tr>';
    return;
  }

  customers.forEach((c) => {
    const tr = document.createElement('tr');
    const isLocked = c.status === 'LOCKED';
    let actions = '—';

    if (currentUser?.role === 'ADMIN') {
      const lockBtn = isLocked
        ? `<button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="doiTrangThaiKhach(${c.id}, 'ACTIVE')">🔓 Mở khóa</button>`
        : `<button class="btn btn-danger" style="padding:4px 8px; font-size:12px;" onclick="doiTrangThaiKhach(${c.id}, 'LOCKED')">🔒 Khóa</button>`;
      const resetBtn = `<button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="datLaiMatKhauKhach(${c.id}, '${c.fullName}')">🔑 Đặt lại MK</button>`;
      actions = `<div style="display:flex; gap:6px;">${lockBtn} ${resetBtn}</div>`;
    }

    tr.innerHTML = `
      <td style="font-family:var(--font-mono); font-weight:700;">#${c.id}</td>
      <td style="font-weight:600;">${c.fullName}</td>
      <td style="font-family:var(--font-mono);">${c.phone}</td>
      <td>${c.email || '—'}</td>
      <td style="font-weight:700;">${c.totalBookings ?? c.bookingCount ?? 0}</td>
      <td>${isLocked ? '<span style="color:#EF4444; font-weight:700;">🔒 ĐÃ KHÓA</span>' : '<span style="color:#10B981; font-weight:700;">HOẠT ĐỘNG</span>'}</td>
      <td>${actions}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function doiTrangThaiKhach(customerId, status) {
  if (!confirm(`Bạn có chắc chắn muốn ${status === 'LOCKED' ? 'KHÓA' : 'MỞ KHÓA'} tài khoản khách này?`)) return;

  try {
    await apiFetch(`/admin/customers/${customerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    showToast(`Đã cập nhật trạng thái khách hàng sang ${status}`);
    taiDanhSachKhachHang();
  } catch (err) {
    showToast('Lỗi cập nhật: ' + err.message, true);
  }
}

async function datLaiMatKhauKhach(customerId, name) {
  if (!confirm(`Xác nhận đặt lại mật khẩu ngẫu nhiên cho khách ${name}?`)) return;

  try {
    const res = await apiFetch(`/admin/customers/${customerId}/reset-password`, { method: 'POST' });
    alert(`🔑 Mật khẩu tạm mới của khách [${name}] là:\n\n${res.data.temporaryPassword}\n\nVui lòng thông báo cho khách hàng.`);
  } catch (err) {
    showToast('Lỗi đặt lại mật khẩu: ' + err.message, true);
  }
}

// ================= 11. TAB SÂN & LOẠI SÂN (ADMIN, BR-05, BR-30) =================
async function loadCourtTypesAndCourts() {
  try {
    const [resTypes, resCourts] = await Promise.all([
      apiFetch('/admin/court-types'),
      apiFetch('/admin/courts'),
    ]);

    cachedCourtTypes = resTypes.data || [];
    cachedCourts = resCourts.data || [];

    // Render loại sân
    const tbodyTypes = document.getElementById('loai-san-tbody');
    tbodyTypes.innerHTML = '';
    const sanLoaiSelect = document.getElementById('san-loai-chon');
    if (sanLoaiSelect) sanLoaiSelect.innerHTML = '<option value="">-- Chọn loại sân --</option>';

    cachedCourtTypes.forEach((t) => {
      if (sanLoaiSelect) sanLoaiSelect.innerHTML += `<option value="${t.id}">${t.name} (${t.category})</option>`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700;">#${t.id}</td>
        <td style="font-weight:700;">${t.name}</td>
        <td><span class="badge" style="background:rgba(59, 130, 246, 0.2); color:#60A5FA;">${t.category}</span></td>
        <td>${t.description || '—'}</td>
        <td>${t.isActive ? '<span style="color:#10B981; font-weight:700;">Hoạt động</span>' : '<span style="color:#EF4444; font-weight:700;">Tắt</span>'}</td>
        <td>
          <button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="batTatLoaiSan(${t.id})">Đổi trạng thái</button>
        </td>
      `;
      tbodyTypes.appendChild(tr);
    });

    // Render sân (Quy hoạch vị trí cố định)
    const tbodyCourts = document.getElementById('courts-tbody');
    tbodyCourts.innerHTML = '';

    cachedCourts.forEach((c) => {
      const tr = document.createElement('tr');
      const statusSelect = `
        <select class="form-select" style="padding:4px 8px; font-size:12px;" onchange="doiTrangThaiSan(${c.id}, this.value)">
          <option value="ACTIVE" ${c.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE (Hoạt động)</option>
          <option value="MAINTENANCE" ${c.status === 'MAINTENANCE' ? 'selected' : ''}>MAINTENANCE (Bảo trì)</option>
          <option value="INACTIVE" ${c.status === 'INACTIVE' ? 'selected' : ''}>INACTIVE (Tạm ngưng)</option>
        </select>
      `;

      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700; color:var(--primary);">Vị trí #${c.id}</td>
        <td style="font-weight:700;">${c.name}</td>
        <td><span class="badge" style="background:rgba(59, 130, 246, 0.2); color:#60A5FA;">${c.courtTypeName || c.courtType?.name || '—'}</span></td>
        <td>${c.capacity ? `<strong>${c.capacity}</strong> người` : '—'}</td>
        <td style="color:var(--text-muted); font-size:12.5px;">${c.description || '—'}</td>
        <td>${renderCourtStatusBadge(c.status)}</td>
        <td>${statusSelect}</td>
        <td>
          <button class="btn btn-outline" style="padding:5px 10px; font-size:12px; white-space:nowrap;" onclick="moModalDoiMucDichSan(${c.id})">
            🔄 Đổi mục đích
          </button>
        </td>
      `;
      tbodyCourts.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi tải danh mục sân: ' + err.message, true);
  }
}

function renderCourtStatusBadge(status) {
  if (status === 'ACTIVE') return '<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#34D399;">Hoạt động</span>';
  if (status === 'MAINTENANCE') return '<span class="badge" style="background:rgba(239, 68, 68, 0.2); color:#F87171;">Bảo trì</span>';
  return '<span class="badge" style="background:rgba(107, 114, 128, 0.2); color:#94A3B8;">Tạm ngưng</span>';
}

// ================= MỞ MODAL CHUYỂN ĐỔI MỤC ĐÍCH SỬ DỤNG SÂN (GÓP Ý GIẢNG VIÊN) =================
function moModalDoiMucDichSan(courtId) {
  const court = cachedCourts.find((c) => c.id === courtId);
  if (!court) return;

  document.getElementById('edit-court-id').value = court.id;
  document.getElementById('edit-court-position').value = `Vị trí mặt bằng quy hoạch sân #${court.id}`;
  document.getElementById('edit-court-name').value = court.name || '';
  document.getElementById('edit-court-capacity').value = court.capacity || '';
  document.getElementById('edit-court-image').value = court.imageUrl || '';
  document.getElementById('edit-court-desc').value = court.description || '';

  // Nạp danh sách loại sân vào select
  const select = document.getElementById('edit-court-type');
  select.innerHTML = '';
  cachedCourtTypes.forEach((t) => {
    const isSelected = (court.courtType?.id === t.id) || (court.courtTypeId === t.id);
    select.innerHTML += `<option value="${t.id}" ${isSelected ? 'selected' : ''}>${t.name} (${t.category === 'SPORT' ? 'Môn Thể Thao' : 'Khu Sự Kiện'})</option>`;
  });

  openModal('modal-edit-court');
}

async function handleSaveReassignCourt(e) {
  e.preventDefault();
  const courtId = Number(document.getElementById('edit-court-id').value);
  const courtTypeId = Number(document.getElementById('edit-court-type').value);
  const name = document.getElementById('edit-court-name').value.trim();
  const capacityStr = document.getElementById('edit-court-capacity').value;
  const imageUrl = document.getElementById('edit-court-image').value.trim() || null;
  const description = document.getElementById('edit-court-desc').value.trim() || null;

  const payload = {
    courtTypeId,
    name,
    capacity: capacityStr ? Number(capacityStr) : null,
    imageUrl,
    description,
  };

  try {
    await apiFetch(`/admin/courts/${courtId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    closeModal('modal-edit-court');
    showToast('Chuyển đổi mục đích sử dụng sân thành công!');
    loadCourtTypesAndCourts();
  } catch (err) {
    // Nếu vướng đơn đặt trong tương lai, ném cảnh báo rõ ràng
    alert(`⚠️ Không thể chuyển đổi mục đích sử dụng:\n\n${err.message}`);
  }
}

async function taoLoaiSan(e) {
  e.preventDefault();
  const name = document.getElementById('ls-ten').value.trim();
  const category = document.getElementById('ls-phanloai').value;
  const description = document.getElementById('ls-mota').value.trim();

  try {
    await apiFetch('/admin/court-types', {
      method: 'POST',
      body: JSON.stringify({ name, category, description }),
    });
    showToast('Thêm loại sân mới thành công!');
    document.getElementById('ls-ten').value = '';
    document.getElementById('ls-mota').value = '';
    loadCourtTypesAndCourts();
  } catch (err) {
    showToast('Lỗi thêm loại sân: ' + err.message, true);
  }
}

async function batTatLoaiSan(id) {
  try {
    await apiFetch(`/admin/court-types/${id}/active`, { method: 'PATCH' });
    showToast('Đã đổi trạng thái loại sân!');
    loadCourtTypesAndCourts();
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

async function doiTrangThaiSan(courtId, status) {
  try {
    await apiFetch(`/admin/courts/${courtId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    showToast(`Đã cập nhật trạng thái sân sang ${status}`);
    loadCourtTypesAndCourts();
  } catch (err) {
    // BR-05: Chặn chuyển sang bảo trì nếu còn đơn tương lai
    alert(`⚠️ Không thể chuyển trạng thái sân:\n\n${err.message}`);
    loadCourtTypesAndCourts();
  }
}

// ================= 12. TAB KHUNG GIỜ (ADMIN) =================
async function loadTimeSlots() {
  try {
    const res = await apiFetch('/admin/time-slots');
    cachedTimeSlots = res.data || [];
    const tbody = document.getElementById('kg-tbody');
    tbody.innerHTML = '';

    cachedTimeSlots.forEach((ts) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700;">#${ts.id}</td>
        <td style="font-weight:700; font-family:var(--font-mono); font-size:14px;">${ts.startTime.substring(0, 5)} → ${ts.endTime.substring(0, 5)}</td>
        <td>${ts.isActive ? '<span style="color:#10B981; font-weight:700;">Đang dùng</span>' : '<span style="color:#EF4444; font-weight:700;">Khóa</span>'}</td>
        <td>
          <button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="batTatKhungGio(${ts.id})">Bật / Tắt</button>
        </td>
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
    showToast('Thêm khung giờ mới thành công!');
    loadTimeSlots();
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

async function batTatKhungGio(id) {
  try {
    await apiFetch(`/admin/time-slots/${id}/active`, { method: 'PATCH' });
    showToast('Đã đổi trạng thái khung giờ!');
    loadTimeSlots();
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

// ================= 13. TAB BẢNG GIÁ MA TRẬN (ADMIN, TC-35) =================
async function loadPricingMatrix() {
  const select = document.getElementById('price-court-type-select');
  if (cachedCourtTypes.length === 0) {
    const resTypes = await apiFetch('/admin/court-types');
    cachedCourtTypes = resTypes.data || [];
  }

  if (select.children.length === 0) {
    select.innerHTML = '';
    cachedCourtTypes.forEach((t) => {
      select.innerHTML += `<option value="${t.id}">${t.name} (${t.category})</option>`;
    });
  }

  const courtTypeId = select.value || cachedCourtTypes[0]?.id;
  if (!courtTypeId) return;

  try {
    const res = await apiFetch(`/admin/slot-prices?courtTypeId=${courtTypeId}`);
    const prices = res.data || [];
    renderPricingTable(prices);
  } catch (err) {
    showToast('Lỗi tải bảng giá: ' + err.message, true);
  }
}

function renderPricingTable(prices) {
  const tbody = document.getElementById('prices-tbody');
  tbody.innerHTML = '';

  prices.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:700; font-family:var(--font-mono);">${p.startTime.substring(0, 5)} - ${p.endTime.substring(0, 5)}</td>
      <td>
        <input type="number" class="form-input price-input-weekday" data-slot-id="${p.timeSlotId}" value="${p.weekdayPrice || 0}" style="width:160px; font-weight:700;" />
      </td>
      <td>
        <input type="number" class="form-input price-input-weekend" data-slot-id="${p.timeSlotId}" value="${p.weekendPrice || 0}" style="width:160px; font-weight:700;" />
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function luuBangGia() {
  const courtTypeId = Number(document.getElementById('price-court-type-select').value);
  const weekdayInputs = document.querySelectorAll('.price-input-weekday');
  const weekendInputs = document.querySelectorAll('.price-input-weekend');

  const prices = [];
  weekdayInputs.forEach((inp) => {
    const timeSlotId = Number(inp.getAttribute('data-slot-id'));
    const weekdayPrice = Number(inp.value);
    prices.push({ courtTypeId, timeSlotId, dayType: 'WEEKDAY', price: weekdayPrice });
  });

  weekendInputs.forEach((inp) => {
    const timeSlotId = Number(inp.getAttribute('data-slot-id'));
    const weekendPrice = Number(inp.value);
    prices.push({ courtTypeId, timeSlotId, dayType: 'WEEKEND', price: weekendPrice });
  });

  try {
    await apiFetch('/admin/slot-prices', {
      method: 'PUT',
      body: JSON.stringify({ prices }),
    });
    showToast('Đã lưu toàn bộ bảng giá ma trận thành công! (Áp dụng cho các đơn đặt mới)');
    loadPricingMatrix();
  } catch (err) {
    showToast('Lỗi lưu bảng giá: ' + err.message, true);
  }
}

// ================= 14. TAB DANH MỤC DỊCH VỤ ADMIN (ADM-08, TC-46) =================
async function loadAdminServices() {
  try {
    const res = await apiFetch('/admin/services');
    const services = res.data || [];
    const tbody = document.getElementById('admin-services-tbody');
    tbody.innerHTML = '';

    services.forEach((s) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700;">#${s.id}</td>
        <td style="font-weight:700;">${s.name}</td>
        <td><span class="badge" style="background:rgba(59, 130, 246, 0.2); color:#60A5FA;">${s.category}</span></td>
        <td>${s.unit}</td>
        <td style="font-weight:800; color:var(--primary); font-family:var(--font-mono);">${formatMoney(s.price)}</td>
        <td>${renderServiceStatusBadge(s.status)}</td>
        <td style="font-size:12px; color:var(--text-muted);">${s.description || '—'}</td>
        <td>
          <button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="suaGiaDichVuAdmin(${s.id}, ${s.price}, '${s.name}')">✏️ Sửa Giá</button>
          <button class="btn btn-outline" style="padding:4px 8px; font-size:12px; margin-left:4px;" onclick="doiTrangThaiDichVuAdmin(${s.id}, '${s.status}')">Đổi TT</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi tải danh mục dịch vụ: ' + err.message, true);
  }
}

function renderServiceStatusBadge(status) {
  if (status === 'ACTIVE') return '<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#34D399;">Hoạt động</span>';
  if (status === 'OUT_OF_STOCK') return '<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FBBF24;">Tạm hết</span>';
  return '<span class="badge" style="background:rgba(239, 68, 68, 0.2); color:#F87171;">Ngưng bán</span>';
}

async function taoDichVuAdmin(e) {
  e.preventDefault();
  const name = document.getElementById('dv-ten').value.trim();
  const category = document.getElementById('dv-phanloai').value;
  const unit = document.getElementById('dv-donvi').value.trim();
  const price = Number(document.getElementById('dv-gia').value);
  const description = document.getElementById('dv-mota').value.trim();

  try {
    await apiFetch('/admin/services', {
      method: 'POST',
      body: JSON.stringify({ name, category, unit, price, description }),
    });
    showToast('Thêm dịch vụ mới thành công!');
    document.getElementById('dv-ten').value = '';
    document.getElementById('dv-donvi').value = '';
    document.getElementById('dv-gia').value = '';
    document.getElementById('dv-mota').value = '';
    loadAdminServices();
  } catch (err) {
    showToast('Lỗi thêm dịch vụ: ' + err.message, true);
  }
}

async function suaGiaDichVuAdmin(id, oldPrice, name) {
  const newPriceStr = prompt(`Sửa giá niêm yết cho [${name}] (giá cũ: ${formatMoney(oldPrice)}):\nGiá mới chỉ áp dụng cho yêu cầu phát sinh sau này (TC-46).`, oldPrice);
  if (!newPriceStr) return;
  const price = Number(newPriceStr);
  if (isNaN(price) || price < 0) return showToast('Giá không hợp lệ', true);

  try {
    await apiFetch(`/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ price }),
    });
    showToast('Đã cập nhật giá dịch vụ thành công!');
    loadAdminServices();
  } catch (err) {
    showToast('Lỗi cập nhật giá: ' + err.message, true);
  }
}

async function doiTrangThaiDichVuAdmin(id, currentStatus) {
  const nextStatus = currentStatus === 'ACTIVE' ? 'OUT_OF_STOCK' : currentStatus === 'OUT_OF_STOCK' ? 'INACTIVE' : 'ACTIVE';
  try {
    await apiFetch(`/admin/services/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    showToast(`Đã đổi trạng thái dịch vụ sang ${nextStatus}`);
    loadAdminServices();
  } catch (err) {
    showToast('Lỗi đổi trạng thái: ' + err.message, true);
  }
}

// ================= 15. TAB TÀI KHOẢN NHÂN VIÊN (ADM-05, TC-36, TC-37) =================
async function loadStaff() {
  try {
    const res = await apiFetch('/admin/staff');
    const list = res.data || [];
    cachedStaff = list;
    const tbody = document.getElementById('staff-tbody');
    tbody.innerHTML = '';

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">Chưa có tài khoản nhân viên nào</td></tr>';
      return;
    }

    list.forEach((st) => {
      const tr = document.createElement('tr');
      const isLocked = st.status === 'LOCKED';
      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700;">#${st.id}</td>
        <td style="font-weight:700;">${st.fullName}</td>
        <td style="font-family:var(--font-mono);">${st.phone}</td>
        <td>${st.email || '—'}</td>
        <td>${isLocked ? '<span style="color:#EF4444; font-weight:700;">🔒 ĐÃ KHÓA</span>' : '<span style="color:#10B981; font-weight:700;">HOẠT ĐỘNG</span>'}</td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="moModalSuaNhanVien(${st.id})">✏️ Sửa</button>
            <button class="btn btn-outline" style="padding:4px 8px; font-size:12px;" onclick="moModalDoiMatKhauNhanVien(${st.id}, '${st.fullName}', '${st.phone}')">🔑 Đổi MK</button>
            <button class="btn ${isLocked ? 'btn-outline' : 'btn-danger'}" style="padding:4px 8px; font-size:12px;" onclick="doiTrangThaiNhanVien(${st.id}, '${isLocked ? 'ACTIVE' : 'LOCKED'}')">
              ${isLocked ? '🔓 Mở khóa' : '🔒 Khóa'}
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Lỗi tải danh sách nhân viên: ' + err.message, true);
  }
}

function moModalSuaNhanVien(staffId) {
  const st = cachedStaff.find((s) => s.id === staffId);
  if (!st) return showToast('Không tìm thấy thông tin nhân viên', true);

  document.getElementById('edit-staff-id').value = st.id;
  document.getElementById('edit-staff-name').value = st.fullName || '';
  document.getElementById('edit-staff-phone').value = st.phone || '';
  document.getElementById('edit-staff-email').value = st.email || '';
  openModal('modal-edit-staff');
}

async function handleSaveEditStaff(e) {
  e.preventDefault();
  const staffId = Number(document.getElementById('edit-staff-id').value);
  const fullName = document.getElementById('edit-staff-name').value.trim();
  const phone = document.getElementById('edit-staff-phone').value.trim();
  const email = document.getElementById('edit-staff-email').value.trim();

  if (!fullName) return showToast('Vui lòng nhập họ và tên nhân viên', true);
  if (!phone || !/^0\d{9}$/.test(phone)) return showToast('Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0', true);

  try {
    await apiFetch(`/admin/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify({ fullName, phone, email: email || null }),
    });
    showToast('Cập nhật thông tin nhân viên thành công!');
    closeModal('modal-edit-staff');
    loadStaff();
  } catch (err) {
    showToast('Lỗi cập nhật nhân viên: ' + err.message, true);
  }
}

function moModalDoiMatKhauNhanVien(staffId, fullName, phone) {
  document.getElementById('reset-staff-id').value = staffId;
  document.getElementById('reset-staff-target-name').textContent = `${fullName} (${phone})`;
  document.getElementById('reset-staff-new-pass').value = '';
  document.getElementById('reset-staff-confirm-pass').value = '';
  openModal('modal-reset-staff-password');
}

async function handleSaveResetStaffPassword(e) {
  e.preventDefault();
  const staffId = Number(document.getElementById('reset-staff-id').value);
  const newPassword = document.getElementById('reset-staff-new-pass').value;
  const confirmPassword = document.getElementById('reset-staff-confirm-pass').value;

  if (newPassword.length < 6) {
    return showToast('Mật khẩu mới phải có tối thiểu 6 ký tự', true);
  }
  if (newPassword !== confirmPassword) {
    return showToast('Mật khẩu xác nhận không trùng khớp', true);
  }

  try {
    await apiFetch(`/admin/staff/${staffId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    showToast('Đổi mật khẩu nhân viên thành công!');
    closeModal('modal-reset-staff-password');
  } catch (err) {
    showToast('Lỗi đặt lại mật khẩu: ' + err.message, true);
  }
}

async function taoNhanVien(e) {
  e.preventDefault();
  const fullName = document.getElementById('nv-ho-ten').value.trim();
  const phone = document.getElementById('nv-so-dien-thoai').value.trim();
  const email = document.getElementById('nv-email').value.trim();
  const password = document.getElementById('nv-mat-khau').value;

  try {
    await apiFetch('/admin/staff', {
      method: 'POST',
      body: JSON.stringify({ fullName, phone, email, password }),
    });
    showToast('Tạo tài khoản nhân viên thành công! (Vai trò STAFF - TC-37)');
    document.getElementById('nv-ho-ten').value = '';
    document.getElementById('nv-so-dien-thoai').value = '';
    document.getElementById('nv-email').value = '';
    document.getElementById('nv-mat-khau').value = '';
    loadStaff();
  } catch (err) {
    showToast('Lỗi tạo nhân viên: ' + err.message, true);
  }
}

async function doiTrangThaiNhanVien(id, status) {
  try {
    await apiFetch(`/admin/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    showToast('Đã đổi trạng thái tài khoản nhân viên!');
    loadStaff();
  } catch (err) {
    // TC-36: Chặn tự khóa chính mình / khóa admin cuối
    alert(`⚠️ Thao tác bị từ chối:\n\n${err.message}`);
  }
}

// ================= 16. TAB BÁO CÁO (ADMIN - ADM-07, BR-32, TC-58) =================
let cachedReportsData = {
  revenue: {},
  summary: {},
  services: [],
  itemized: {},
};
let currentServiceTypeFilter = 'ALL';

// Nút chọn khoảng ngày nhanh (Quick presets)
function chonKhoangNgay(preset) {
  const fromEl = document.getElementById('rep-from');
  const toEl = document.getElementById('rep-to');
  const today = new Date();
  const todayStr = today.toISOString().substring(0, 10);

  document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));

  if (preset === 'today') {
    fromEl.value = todayStr;
    toEl.value = todayStr;
    event?.target?.classList.add('active');
  } else if (preset === '7days') {
    const d7 = new Date();
    d7.setDate(today.getDate() - 6);
    fromEl.value = d7.toISOString().substring(0, 10);
    toEl.value = todayStr;
    event?.target?.classList.add('active');
  } else if (preset === 'this_month') {
    fromEl.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    toEl.value = todayStr;
    document.getElementById('btn-preset-month')?.classList.add('active');
  } else if (preset === 'last_month') {
    const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    const prevMonthFirstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    fromEl.value = prevMonthFirstDay.toISOString().substring(0, 10);
    toEl.value = prevMonthLastDay.toISOString().substring(0, 10);
    event?.target?.classList.add('active');
  } else if (preset === 'all') {
    fromEl.value = '';
    toEl.value = '';
    event?.target?.classList.add('active');
  }

  loadReports();
}

async function loadReports() {
  const fromEl = document.getElementById('rep-from');
  const toEl = document.getElementById('rep-to');

  if (fromEl && !fromEl.value && toEl && !toEl.value) {
    const today = new Date();
    fromEl.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    toEl.value = today.toISOString().substring(0, 10);
  }

  const from = fromEl ? fromEl.value : '';
  const to = toEl ? toEl.value : '';

  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  try {
    const [revRes, summaryRes, servicesRes, itemizedRes] = await Promise.all([
      apiFetch(`/admin/reports/revenue?${params.toString()}`),
      apiFetch(`/admin/reports/summary?${params.toString()}`),
      apiFetch(`/admin/reports/services?${params.toString()}`),
      apiFetch(`/admin/reports/itemized-breakdown?${params.toString()}`),
    ]);

    const rev = revRes.data || {};
    const sum = summaryRes.data || {};
    const services = Array.isArray(servicesRes.data?.allServices)
      ? servicesRes.data.allServices
      : (Array.isArray(servicesRes.data?.topServices) ? servicesRes.data.topServices : (Array.isArray(servicesRes.data) ? servicesRes.data : []));
    const itemized = itemizedRes.data || {};

    cachedReportsData = { revenue: rev, summary: sum, services, itemized };

    // 1. CẬP NHẬT 7 THẺ KPI CHI TIẾT TỪNG KHOẢN
    const courtRev = Number(itemized.summary?.courtRevenue ?? rev.courtRevenue ?? sum.revenue?.court ?? 0);
    const drinkRev = Number(itemized.summary?.drinkRevenue ?? rev.drinkRevenue ?? sum.revenue?.drinks ?? 0);
    const rentalRev = Number(itemized.summary?.rentalRevenue ?? rev.rentalRevenue ?? sum.revenue?.rentals ?? 0);
    const packageRev = Number(itemized.summary?.packageRevenue ?? rev.packageRevenue ?? sum.revenue?.packages ?? 0);
    const refundRev = Number(itemized.summary?.totalRefund ?? rev.refundAmount ?? sum.revenue?.totalRefunded ?? 0);
    const netRev = Number(itemized.summary?.netRevenue ?? rev.totalRevenue ?? sum.revenue?.netRevenue ?? (courtRev + drinkRev + rentalRev + packageRev - refundRev));

    document.getElementById('rep-court-rev').textContent = formatMoney(courtRev);
    document.getElementById('rep-drink-rev').textContent = formatMoney(drinkRev);
    document.getElementById('rep-rental-rev').textContent = formatMoney(rentalRev);
    document.getElementById('rep-package-rev').textContent = formatMoney(packageRev);
    document.getElementById('rep-refund-rev').textContent = formatMoney(refundRev);
    document.getElementById('rep-net-rev').textContent = formatMoney(netRev);
    document.getElementById('rep-occupancy').textContent = `${sum.occupancyRate ?? sum.tyLeLapDay ?? 0}%`;

    // Phụ chú số lượng
    const catDrink = itemized.categories?.find((c) => c.key === 'DRINK');
    const catRental = itemized.categories?.find((c) => c.key === 'RENTAL');
    const catPkg = itemized.categories?.find((c) => c.key === 'PACKAGE');

    if (document.getElementById('rep-drink-sub')) {
      document.getElementById('rep-drink-sub').textContent = `${catDrink?.qty || 0} chai / lon / ly đã bán`;
    }
    if (document.getElementById('rep-rental-sub')) {
      document.getElementById('rep-rental-sub').textContent = `${catRental?.qty || 0} lượt thuê dụng cụ`;
    }
    if (document.getElementById('rep-package-sub')) {
      document.getElementById('rep-package-sub').textContent = `${catPkg?.qty || 0} gói combo / tiệc`;
    }

    // 2. THANH TỶ TRỌNG CƠ CẤU DOANH THU TRỰC QUAN
    const totalGross = (itemized.summary?.courtPaid || courtRev) + drinkRev + rentalRev + packageRev;
    const pCourt = totalGross > 0 ? ((courtRev / totalGross) * 100).toFixed(1) : 0;
    const pDrink = totalGross > 0 ? ((drinkRev / totalGross) * 100).toFixed(1) : 0;
    const pRental = totalGross > 0 ? ((rentalRev / totalGross) * 100).toFixed(1) : 0;
    const pPkg = totalGross > 0 ? ((packageRev / totalGross) * 100).toFixed(1) : 0;

    const barCourt = document.getElementById('bar-court');
    const barDrinks = document.getElementById('bar-drinks');
    const barRentals = document.getElementById('bar-rentals');
    const barPackages = document.getElementById('bar-packages');

    if (barCourt) {
      barCourt.style.width = `${pCourt}%`;
      barCourt.title = `Tiền sân: ${formatMoney(courtRev)} (${pCourt}%)`;
    }
    if (barDrinks) {
      barDrinks.style.width = `${pDrink}%`;
      barDrinks.title = `Nước uống: ${formatMoney(drinkRev)} (${pDrink}%)`;
    }
    if (barRentals) {
      barRentals.style.width = `${pRental}%`;
      barRentals.title = `Thuê đồ: ${formatMoney(rentalRev)} (${pRental}%)`;
    }
    if (barPackages) {
      barPackages.style.width = `${pPkg}%`;
      barPackages.title = `Gói tiệc: ${formatMoney(packageRev)} (${pPkg}%)`;
    }

    if (document.getElementById('leg-court-val')) {
      document.getElementById('leg-court-val').textContent = `${formatMoney(courtRev)} (${pCourt}%)`;
    }
    if (document.getElementById('leg-drinks-val')) {
      document.getElementById('leg-drinks-val').textContent = `${formatMoney(drinkRev)} (${pDrink}%)`;
    }
    if (document.getElementById('leg-rentals-val')) {
      document.getElementById('leg-rentals-val').textContent = `${formatMoney(rentalRev)} (${pRental}%)`;
    }
    if (document.getElementById('leg-packages-val')) {
      document.getElementById('leg-packages-val').textContent = `${formatMoney(packageRev)} (${pPkg}%)`;
    }
    if (document.getElementById('leg-refund-val')) {
      document.getElementById('leg-refund-val').textContent = formatMoney(refundRev);
    }
    if (document.getElementById('rep-comp-total-text')) {
      document.getElementById('rep-comp-total-text').textContent = `Tổng doanh thu thực nhận: ${formatMoney(netRev)}`;
    }

    // 3. BẢNG PHÂN TÍCH CƠ CẤU DOANH THU CHI TIẾT TỪNG KHOẢN MỤC
    renderCategoriesBreakdownTable(itemized.categories, courtRev, refundRev, netRev);

    // 4. BẢNG CHI TIẾT DOANH THU TỪNG KHOẢN THEO NGÀY
    renderDailyItemizedTable(rev.items || rev.daily || []);

    // 5. BẢNG CHI TIẾT MẶT HÀNG DỊCH VỤ
    renderServicesTable(services, currentServiceTypeFilter);

    // 6. SỔ NHẬT KÝ THU TIỀN CHI TIẾT (ITEMIZED LEDGER)
    renderLedgerTable(itemized.recentTransactions || []);
  } catch (err) {
    showToast('Lỗi tải báo cáo chi tiết: ' + err.message, true);
  }
}

// Render Bảng 1: Cơ cấu doanh thu theo từng khoản
function renderCategoriesBreakdownTable(categories, courtRev, refundRev, netRev) {
  const tbody = document.getElementById('rep-categories-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const list = Array.isArray(categories) && categories.length > 0 ? categories : [
    { key: 'COURT', name: 'Tiền thuê sân', icon: '🏟️', amount: courtRev, grossAmount: courtRev, refundAmount: 0, percentage: 100 },
    { key: 'DRINK', name: 'Nước uống giải khát', icon: '🥤', amount: 0, grossAmount: 0, refundAmount: 0, percentage: 0 },
    { key: 'RENTAL', name: 'Thuê dụng cụ & đồ chơi', icon: '🏸', amount: 0, grossAmount: 0, refundAmount: 0, percentage: 0 },
    { key: 'PACKAGE', name: 'Gói combo & dịch vụ tiệc', icon: '📦', amount: 0, grossAmount: 0, refundAmount: 0, percentage: 0 },
  ];

  list.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 700;">
        <span style="font-size: 16px; margin-right: 6px;">${c.icon || '📌'}</span>
        ${c.name}
        <div style="font-size: 11.5px; color: var(--text-muted); font-weight: normal; margin-top: 2px;">${c.description || ''}</div>
      </td>
      <td><span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60A5FA;">${c.key}</span></td>
      <td style="font-weight: 600;">${c.qty !== undefined ? `${c.qty} ${c.unit || ''}` : '—'}</td>
      <td style="font-weight: 700;">${formatMoney(c.grossAmount ?? c.amount)}</td>
      <td style="color: var(--danger); font-weight: 600;">${c.refundAmount ? `−${formatMoney(c.refundAmount)}` : '0 ₫'}</td>
      <td style="font-weight: 800; color: #34D399;">${formatMoney(c.amount)}</td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width: 60px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow:hidden;">
            <div style="width: ${c.percentage || 0}%; height: 100%; background: var(--primary);"></div>
          </div>
          <span style="font-weight: 700;">${c.percentage || 0}%</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Dòng hoàn tiền tổng
  if (refundRev > 0) {
    const trRef = document.createElement('tr');
    trRef.style.background = 'rgba(239, 68, 68, 0.05)';
    trRef.innerHTML = `
      <td style="font-weight: 700; color: var(--danger);">🔄 Hoàn tiền cho khách (Đơn hủy hợp lệ)</td>
      <td><span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #F87171;">REFUND</span></td>
      <td>—</td>
      <td>0 ₫</td>
      <td style="color: var(--danger); font-weight: 700;">−${formatMoney(refundRev)}</td>
      <td style="color: var(--danger); font-weight: 700;">−${formatMoney(refundRev)}</td>
      <td>—</td>
    `;
    tbody.appendChild(trRef);
  }

  // Dòng Tổng Cộng Thực Nhận
  const trTotal = document.createElement('tr');
  trTotal.style.background = 'rgba(16, 185, 129, 0.1)';
  trTotal.style.fontWeight = '800';
  trTotal.innerHTML = `
    <td style="color: #34D399; font-size: 14px;">💵 TỔNG DOANH THU THỰC NHẬN (NET)</td>
    <td><span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34D399;">NET_REV</span></td>
    <td>—</td>
    <td>—</td>
    <td style="color: var(--danger);">−${formatMoney(refundRev)}</td>
    <td style="color: #34D399; font-size: 15px;">${formatMoney(netRev)}</td>
    <td style="color: #34D399;">100%</td>
  `;
  tbody.appendChild(trTotal);
}

// Render Bảng 2: Chi tiết doanh thu từng khoản theo ngày
function renderDailyItemizedTable(dailyItems) {
  const tbody = document.getElementById('rep-tbody');
  const tfoot = document.getElementById('rep-tfoot');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (tfoot) tfoot.innerHTML = '';

  if (!dailyItems || dailyItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">Không có dữ liệu trong kỳ báo cáo</td></tr>';
    return;
  }

  let sumCourt = 0, sumDrinks = 0, sumRentals = 0, sumPackages = 0, sumServices = 0, sumRefund = 0, sumNet = 0;

  dailyItems.forEach((d) => {
    const cRev = d.court?.revenue ?? d.courtRevenue ?? 0;
    const dAmt = d.drinks?.amount ?? 0;
    const rAmt = d.rentals?.amount ?? 0;
    const pAmt = d.packages?.amount ?? 0;
    const sRev = d.service?.revenue ?? (dAmt + rAmt + pAmt);
    const refAmt = d.refundAmount ?? ((d.court?.refunded || 0) + (d.service?.refunded || 0));
    const net = d.revenue ?? (cRev + sRev - refAmt);

    sumCourt += cRev;
    sumDrinks += dAmt;
    sumRentals += rAmt;
    sumPackages += pAmt;
    sumServices += sRev;
    sumRefund += refAmt;
    sumNet += net;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:700;">${formatDate(d.date)}</td>
      <td>${formatMoney(cRev)}</td>
      <td style="color:#34D399;">${formatMoney(dAmt)}</td>
      <td style="color:#A78BFA;">${formatMoney(rAmt)}</td>
      <td style="color:#FCD34D;">${formatMoney(pAmt)}</td>
      <td style="font-weight:700; color:var(--info);">${formatMoney(sRev)}</td>
      <td style="color:var(--danger);">${refAmt > 0 ? '−' + formatMoney(refAmt) : '0 ₫'}</td>
      <td style="font-weight:800; color:#34D399;">${formatMoney(net)}</td>
    `;
    tbody.appendChild(tr);
  });

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td>TỔNG CỘNG</td>
        <td>${formatMoney(sumCourt)}</td>
        <td style="color:#34D399;">${formatMoney(sumDrinks)}</td>
        <td style="color:#A78BFA;">${formatMoney(sumRentals)}</td>
        <td style="color:#FCD34D;">${formatMoney(sumPackages)}</td>
        <td style="color:var(--info);">${formatMoney(sumServices)}</td>
        <td style="color:var(--danger);">${sumRefund > 0 ? '−' + formatMoney(sumRefund) : '0 ₫'}</td>
        <td style="color:#34D399; font-size:14.5px;">${formatMoney(sumNet)}</td>
      </tr>
    `;
  }
}

// Lọc tab con mặt hàng dịch vụ
function locBangDichVu(type) {
  currentServiceTypeFilter = type;
  document.querySelectorAll('.pill-tab').forEach((b) => b.classList.remove('active'));
  if (type === 'ALL') document.getElementById('pill-all')?.classList.add('active');
  else if (type === 'DRINK') document.getElementById('pill-drink')?.classList.add('active');
  else if (type === 'RENTAL') document.getElementById('pill-rental')?.classList.add('active');
  else if (type === 'PACKAGE') document.getElementById('pill-package')?.classList.add('active');

  renderServicesTable(cachedReportsData.services || [], type);
}

// Render Bảng 3: Chi tiết dịch vụ
function renderServicesTable(services, filterType = 'ALL') {
  const tbody = document.getElementById('rep-services-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = filterType === 'ALL' ? services : services.filter((s) => s.type === filterType);

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">Không có dịch vụ phát sinh thuộc nhóm này trong kỳ</td></tr>';
    return;
  }

  filtered.forEach((s) => {
    const tr = document.createElement('tr');
    let typeBadge = '<span class="badge" style="background:rgba(59, 130, 246, 0.2); color:#60A5FA;">Khác</span>';
    if (s.type === 'DRINK') {
      typeBadge = '<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#34D399;">🥤 Nước uống</span>';
    } else if (s.type === 'RENTAL') {
      typeBadge = '<span class="badge" style="background:rgba(139, 92, 246, 0.2); color:#C4B5FD;">🏸 Thuê dụng cụ</span>';
    } else if (s.type === 'PACKAGE') {
      typeBadge = '<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FCD34D;">📦 Gói combo</span>';
    }

    tr.innerHTML = `
      <td style="font-family:var(--font-mono); font-weight:700;">#${s.serviceId || s.id}</td>
      <td style="font-weight:700;">${s.name || s.serviceName}</td>
      <td>${typeBadge}</td>
      <td>${s.unit || 'cái'}</td>
      <td style="font-family:var(--font-mono);">${formatMoney(s.unitPrice || 0)}</td>
      <td style="font-weight:800; font-size:14px;">${s.qty ?? s.totalQuantity ?? 0} ${s.unit || ''}</td>
      <td style="font-weight:800; color:var(--info); font-size:14px;">${formatMoney(s.amount ?? s.totalRevenue ?? 0)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Tìm kiếm & lọc Sổ nhật ký chi tiết
function timKiemSoChiTiet() {
  const kw = (document.getElementById('rep-ledger-search')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('rep-ledger-filter')?.value || 'ALL';
  const list = cachedReportsData.itemized?.recentTransactions || [];

  const filtered = list.filter((item) => {
    const matchCat = cat === 'ALL' || item.itemCategory === cat;
    const matchKw =
      !kw ||
      (item.bookingCode || '').toLowerCase().includes(kw) ||
      (item.customerName || '').toLowerCase().includes(kw) ||
      (item.customerPhone || '').toLowerCase().includes(kw) ||
      (item.itemName || '').toLowerCase().includes(kw);
    return matchCat && matchKw;
  });

  renderLedgerTable(filtered);
}

// Render Bảng 4: Sổ nhật ký giao dịch
function renderLedgerTable(transactions) {
  const tbody = document.getElementById('rep-ledger-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:20px;">Chưa có giao dịch phát sinh trong kỳ</td></tr>';
    return;
  }

  transactions.forEach((t) => {
    const tr = document.createElement('tr');
    let catBadge = '';
    if (t.itemCategory === 'COURT') catBadge = '<span class="badge" style="background:rgba(59, 130, 246, 0.2); color:#60A5FA;">🏟️ Tiền sân</span>';
    else if (t.itemCategory === 'DRINK') catBadge = '<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#34D399;">🥤 Nước uống</span>';
    else if (t.itemCategory === 'RENTAL') catBadge = '<span class="badge" style="background:rgba(139, 92, 246, 0.2); color:#C4B5FD;">🏸 Thuê đồ</span>';
    else if (t.itemCategory === 'PACKAGE') catBadge = '<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FCD34D;">📦 Gói combo</span>';
    else catBadge = `<span class="badge">${t.categoryName || 'Dịch vụ'}</span>`;

    tr.innerHTML = `
      <td style="font-family:var(--font-mono); font-weight:700; color:var(--accent); cursor:pointer;" onclick="openBookingDetail(${t.bookingId})">${t.bookingCode}</td>
      <td style="font-size:12.5px; color:var(--text-muted);">${t.createdAt}</td>
      <td>
        <div style="font-weight:600;">${t.customerName || 'Khách vãng lai'}</div>
        <div style="font-size:11.5px; color:var(--text-muted);">${t.customerPhone || ''}</div>
      </td>
      <td>${catBadge}</td>
      <td style="font-weight:700;">${t.itemName}</td>
      <td style="font-weight:600;">${t.quantity} ${t.unit || ''}</td>
      <td style="font-family:var(--font-mono);">${formatMoney(t.unitPrice || 0)}</td>
      <td style="font-weight:800; color:#34D399;">${formatMoney(t.totalAmount || 0)}</td>
      <td><span class="badge" style="background:rgba(255,255,255,0.06);">${t.paymentMethod || 'CASH'}</span></td>
      <td><span class="badge" style="background:rgba(16, 185, 129, 0.15); color:#34D399;">${t.status || 'SUCCESS'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// 7. XUẤT BÁO CÁO EXCEL / CSV (UTF-8 BOM CHO EXCEL HIỂN THỊ CHUẨN TIẾNG VIỆT)
function xuatBaoCaoCSV() {
  const from = document.getElementById('rep-from')?.value || 'toan-bo';
  const to = document.getElementById('rep-to')?.value || 'hien-tai';
  const { revenue, summary, services, itemized } = cachedReportsData;

  const lines = [];
  lines.push('HỆ THỐNG VẬN HÀNH SÂN THỂ THAO 24/7');
  lines.push('BÁO CÁO CHI TIẾT DOANH THU & KHOẢN THU DỊCH VỤ');
  lines.push(`Kỳ báo cáo: Từ ${from} đến ${to}`);
  lines.push(`Thời điểm xuất: ${new Date().toLocaleString('vi-VN')}`);
  lines.push('');

  // 1. Tổng kết
  lines.push('=== 1. TỔNG HỢP DOANH THU TỪNG KHOẢN ===');
  lines.push('Hạng mục,Doanh thu gốc (VNĐ),Hoàn tiền (VNĐ),Doanh thu thực (VNĐ),Tỷ trọng (%)');
  if (Array.isArray(itemized.categories)) {
    itemized.categories.forEach((c) => {
      lines.push(`"${c.name}",${c.grossAmount ?? c.amount},${c.refundAmount ?? 0},${c.amount},${c.percentage || 0}%`);
    });
  }
  lines.push(`"Tổng tiền đã hoàn lại",0,${itemized.summary?.totalRefund || 0},-${itemized.summary?.totalRefund || 0},--`);
  lines.push(`"TỔNG THỰC NHẬN (NET)",-,${itemized.summary?.totalRefund || 0},${itemized.summary?.netRevenue || 0},100%`);
  lines.push('');

  // 2. Chi tiết theo ngày
  lines.push('=== 2. DOANH THU CHI TIẾT THEO NGÀY ===');
  lines.push('Ngày,Tiền sân (VNĐ),Nước uống (VNĐ),Thuê đồ (VNĐ),Gói tiệc (VNĐ),Tổng dịch vụ (VNĐ),Tiền hoàn (VNĐ),Thực nhận (VNĐ)');
  const daily = revenue.items || [];
  daily.forEach((d) => {
    const cRev = d.court?.revenue ?? 0;
    const dAmt = d.drinks?.amount ?? 0;
    const rAmt = d.rentals?.amount ?? 0;
    const pAmt = d.packages?.amount ?? 0;
    const sRev = d.service?.revenue ?? (dAmt + rAmt + pAmt);
    const refAmt = d.refundAmount ?? 0;
    const net = d.revenue ?? 0;
    lines.push(`"${d.date}",${cRev},${dAmt},${rAmt},${pAmt},${sRev},${refAmt},${net}`);
  });
  lines.push('');

  // 3. Chi tiết dịch vụ
  lines.push('=== 3. CHI TIẾT MẶT HÀNG DỊCH VỤ PHÁT SINH ===');
  lines.push('Mã dịch vụ,Tên dịch vụ,Phân loại,Đơn vị tính,Đơn giá (VNĐ),Số lượng đã bán/thuê,Tổng doanh thu (VNĐ)');
  services.forEach((s) => {
    lines.push(`#${s.serviceId || s.id},"${s.name}","${s.type}","${s.unit || ''}",${s.unitPrice || 0},${s.qty || 0},${s.amount || 0}`);
  });
  lines.push('');

  // 4. Sổ chi tiết giao dịch
  lines.push('=== 4. SỔ NHẬT KÝ CHI TIẾT GIAO DỊCH ===');
  lines.push('Mã đơn,Thời gian,Khách hàng,Số điện thoại,Khoản mục,Tên món/sân,Số lượng,Đơn giá (VNĐ),Thành tiền (VNĐ),Hình thức TT,Trạng thái');
  const txs = itemized.recentTransactions || [];
  txs.forEach((t) => {
    lines.push(`"${t.bookingCode}","${t.createdAt}","${t.customerName || ''}","${t.customerPhone || ''}","${t.categoryName || t.itemCategory}","${t.itemName}",${t.quantity},${t.unitPrice || 0},${t.totalAmount || 0},"${t.paymentMethod || 'CASH'}","${t.status || 'SUCCESS'}"`);
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bao_Cao_Doanh_Thu_Chi_Tiet_${from}_${to}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ Đã xuất file báo cáo chi tiết thành công!');
}

// 8. IN BÁO CÁO (PRINT PREVIEW)
function inBaoCao() {
  window.print();
}


// ================= 17. MODAL CHI TIẾT ĐƠN & HÓA ĐƠN TỔNG HỢP (STF-04, STF-14, BR-28) =================
let currentDetailBookingId = null;
let currentDetailInvoice = null;

async function viewDetail(bookingId) {
  currentDetailBookingId = bookingId;
  const container = document.getElementById('modal-detail-content');
  container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">Đang tải chi tiết đơn & hóa đơn tổng hợp...</div>';
  openModal('modal-detail');

  try {
    const [resBooking, resInvoice] = await Promise.all([
      apiFetch(`/staff/bookings/${bookingId}`),
      apiFetch(`/staff/bookings/${bookingId}/invoice`),
    ]);

    const b = resBooking.data;
    const inv = resInvoice.data;
    currentDetailInvoice = inv;

    renderDetailContent(b, inv);
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger); padding:20px;">Lỗi tải chi tiết đơn: ${err.message}</div>`;
  }
}

function renderDetailContent(b, inv) {
  const container = document.getElementById('modal-detail-content');

  // Bảng kê các món dịch vụ
  let serviceOrdersHtml = '';
  const orders = inv.serviceOrders || [];
  if (orders.length === 0) {
    serviceOrdersHtml = '<div style="color:var(--text-muted); font-size:13px; padding:10px 0;">Chưa có yêu cầu dịch vụ phát sinh nào cho đơn này.</div>';
  } else {
    serviceOrdersHtml = `
      <div class="table-container" style="margin: 10px 0;">
        <table>
          <thead>
            <tr>
              <th>Mã YC</th>
              <th>Món Dịch Vụ</th>
              <th>Phân Loại</th>
              <th>SL</th>
              <th>Đơn Giá</th>
              <th>Thành Tiền</th>
              <th>Trạng Thái</th>
              <th>Đồ Thuê</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((so) => (so.items || []).map((it) => {
              const isRental = it.category === 'RENTAL';
              let rentalAction = '—';
              if (isRental) {
                if (it.returnedAt) {
                  rentalAction = '<span style="color:#10B981; font-weight:700;">Đã trả</span>';
                } else if (so.status === 'DELIVERED') {
                  rentalAction = `<button class="btn btn-purple" style="padding:2px 6px; font-size:11px;" onclick="traDoThue(${it.id})">📦 Đã nhận lại</button>`;
                } else {
                  rentalAction = '<span style="color:var(--text-muted);">Chưa giao</span>';
                }
              }

              return `
                <tr>
                  <td style="font-family:var(--font-mono);">#${so.id}</td>
                  <td style="font-weight:600;">${it.serviceName}</td>
                  <td><span class="badge" style="background:rgba(59, 130, 246, 0.2); color:#60A5FA;">${it.category}</span></td>
                  <td style="font-weight:700;">${it.quantity}</td>
                  <td>${formatMoney(it.unitPrice)}</td>
                  <td style="font-weight:700;">${formatMoney(it.totalPrice || it.quantity * it.unitPrice)}</td>
                  <td>${renderStatusBadge(so.status)}</td>
                  <td>${rentalAction}</td>
                </tr>
              `;
            }).join('')).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Khối nút hành động
  let actionButtonsHtml = '<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:20px;">';

  // 1. Nút thêm dịch vụ tại quầy (đơn CONFIRMED/CHECKED_IN)
  if (['CONFIRMED', 'CHECKED_IN'].includes(b.status)) {
    actionButtonsHtml += `<button class="btn btn-outline" onclick="openAddServiceModal(${b.id})">➕ Thêm Dịch Vụ Tại Quầy</button>`;
    actionButtonsHtml += `<button class="btn btn-outline" style="border-color:#10B981; color:#10B981;" onclick="moModalThemHoaDonMuaHo(${b.id})">🧾 + Hóa Đơn Mua Hộ Ngoài</button>`;
  }

  // 1.5. Nút Xác nhận khách đến sân (Check-in) cho đơn CONFIRMED
  if (b.status === 'CONFIRMED') {
    actionButtonsHtml += `<button class="btn btn-primary" style="background:#059669; border-color:#10B981;" onclick="xacNhanCheckIn(${b.id})">📍 Xác Nhận Khách Đến Sân (Check-in)</button>`;
  }

  // 2. Nút thu tiền dịch vụ (nếu còn nợ dịch vụ)
  if (inv.serviceBalance > 0 && ['CONFIRMED', 'CHECKED_IN'].includes(b.status)) {
    actionButtonsHtml += `<button class="btn btn-warning" onclick="openPayServiceModal(${b.id}, ${inv.serviceBalance})">💵 Thu Tiền Dịch Vụ (${formatMoney(inv.serviceBalance)})</button>`;
  }

  // 3. Nút ghi nhận thanh toán tiền sân (nếu tiền sân chưa trả)
  if (b.paymentStatus === 'UNPAID' && ['PENDING', 'CONFIRMED'].includes(b.status)) {
    actionButtonsHtml += `<button class="btn btn-primary" onclick="ghiNhanThanhToanTienSan(${b.id})">✅ Ghi Nhận TT Tiền Sân (${formatMoney(b.courtAmount)})</button>`;
  }

  // 4. Nút Hoàn thành đơn (CONFIRMED/CHECKED_IN)
  if (['CONFIRMED', 'CHECKED_IN'].includes(b.status)) {
    actionButtonsHtml += `<button class="btn btn-primary" onclick="hoanThanhDonDat(${b.id})">🏆 Hoàn Thành Đơn</button>`;
  }

  // 5. Nút No-Show (Vắng mặt)
  if (['CONFIRMED', 'CHECKED_IN'].includes(b.status)) {
    actionButtonsHtml += `<button class="btn btn-danger" onclick="danhDauNoShow(${b.id})">🚫 Đánh Dấu Vắng Mặt (No-Show)</button>`;
  }

  // 6. Nút Hủy đơn
  if (['PENDING', 'CONFIRMED'].includes(b.status)) {
    actionButtonsHtml += `<button class="btn btn-danger" onclick="nhanVienHuyDon(${b.id})">❌ Hủy Đơn</button>`;
  }

  // 7. Nút Đóng đơn có công nợ (chỉ ADMIN - ADM-09, BR-33)
  if (currentUser?.role === 'ADMIN' && ['CONFIRMED', 'CHECKED_IN'].includes(b.status)) {
    actionButtonsHtml += `<button class="btn btn-danger" style="background:#7F1D1D; border-color:#EF4444;" onclick="openCloseWithDebtModal(${b.id})">⚠️ Đóng Đơn Có Công Nợ</button>`;
  }

  actionButtonsHtml += '</div>';

  // Bảng kê các hóa đơn mua hộ ngoài nếu có
  let procurementHtml = '';
  const procInvoices = inv.procurementInvoices || [];
  if (procInvoices.length > 0) {
    procurementHtml = `
      <div style="margin-top:16px;">
        <div style="font-size:14px; font-weight:700; display:flex; justify-content:space-between; align-items:center;">
          <span>🧾 Hóa Đơn Mua Hộ Ngoài (Đi Chợ BBQ, Hải Sản, Đồ Ăn Ngoài):</span>
          <button class="btn btn-outline" style="padding:2px 8px; font-size:11.5px; border-color:#10B981; color:#10B981;" onclick="moModalThemHoaDonMuaHo(${b.id})">➕ Thêm Hóa Đơn Mua Hộ</button>
        </div>
        <div class="table-container" style="margin: 8px 0;">
          <table>
            <thead>
              <tr>
                <th>Khoản Chi & Nhà CC</th>
                <th>Chứng Từ</th>
                <th>Số HĐ / Ngày</th>
                <th>Tiền Bill Gốc</th>
                <th>Phí Phục Vụ</th>
                <th>Tổng Gộp</th>
                <th>Ảnh Bill</th>
              </tr>
            </thead>
            <tbody>
              ${procInvoices.map((p) => `
                <tr>
                  <td><strong>${p.title}</strong><br><span style="font-size:11px; color:var(--text-muted);">${p.supplier || 'Bên ngoài'}</span></td>
                  <td><span class="badge" style="background:${p.docType === 'ELECTRONIC' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color:${p.docType === 'ELECTRONIC' ? '#34D399' : '#FBBF24'};">${p.docType === 'ELECTRONIC' ? '🟢 HĐ Điện Tử' : '🟡 HĐ Giấy'}</span></td>
                  <td><span style="font-family:var(--font-mono); font-weight:700;">${p.invoiceNumber || '—'}</span><br><span style="font-size:11px; color:var(--text-muted);">${formatDate(p.invoiceDate)}</span></td>
                  <td style="font-family:var(--font-mono);">${formatMoney(p.invoiceAmount)}</td>
                  <td style="font-family:var(--font-mono); color:#FBBF24;">${p.serviceFee > 0 ? '+' + formatMoney(p.serviceFee) : '0 ₫'}</td>
                  <td style="font-weight:700; font-family:var(--font-mono); color:#34D399;">${formatMoney(p.totalAmount)}</td>
                  <td>
                    ${p.billImageUrl ? `<button class="btn btn-outline" style="padding:2px 6px; font-size:11px;" onclick="moModalXemAnhChungTuDirect('${encodeURIComponent(p.billImageUrl)}', '${encodeURIComponent(p.title)}', '${p.invoiceNumber || ''}', '${formatMoney(p.totalAmount)}')">🔍 Xem Bill</button>` : '<span style="color:var(--text-muted); font-size:11px;">Không có</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  const inHouseAmount = inv.inHouseServiceAmount ?? (inv.serviceAmount - (inv.procurementAmount || 0));
  const procAmount = inv.procurementAmount ?? 0;

  container.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
      <div>
        <div style="font-size:12px; color:var(--text-muted);">Mã đơn đặt sân:</div>
        <div style="font-size:18px; font-weight:800; color:var(--primary); font-family:var(--font-mono);">${b.bookingCode}</div>
      </div>
      <div>
        <div style="font-size:12px; color:var(--text-muted);">Trạng thái & Thanh toán:</div>
        <div style="display:flex; gap:8px; margin-top:4px;">
          ${renderStatusBadge(b.status)}
          ${renderPaymentBadge(b.paymentStatus)}
          ${b.closedWithDebt ? '<span class="badge" style="background:#7F1D1D; color:#FCA5A5;">ĐÃ ĐÓNG CÔNG NỢ</span>' : ''}
        </div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:14px; background:var(--surface-card); padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border); font-size:13.5px; margin-bottom:16px;">
      <div><strong>Khách hàng:</strong> ${b.customerName || 'Vãng lai'} (${b.customerPhone || '—'})</div>
      <div><strong>Sân thể thao:</strong> ${b.courtName} (${b.courtTypeName})</div>
      <div><strong>Ngày chơi:</strong> ${formatDate(b.bookingDate)}</div>
      <div><strong>Khung giờ:</strong> ${(b.startTime || '').substring(0, 5)} - ${(b.endTime || '').substring(0, 5)}</div>
      <div><strong>Nguồn đơn:</strong> <span class="badge" style="background:rgba(59, 130, 246, 0.2); color:#60A5FA;">${b.source || 'APP'}</span></div>
      <div><strong>Ghi chú:</strong> ${b.note || '—'}</div>
    </div>

    <!-- HÓA ĐƠN TỔNG HỢP (INVOICE PANEL) -->
    <div class="invoice-card">
      <div style="font-size:15px; font-weight:800; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
        <span>🧾 Bảng Kê Hóa Đơn & Dịch Vụ Phát Sinh</span>
        <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">(Chỉ tính dịch vụ đã giao & hóa đơn mua hộ đã duyệt)</span>
      </div>

      <div class="invoice-row">
        <span>Tiền thuê sân:</span>
        <strong style="font-family:var(--font-mono);">${formatMoney(inv.courtAmount)}</strong>
      </div>
      <div class="invoice-row">
        <span>• Dịch vụ nội bộ cơ sở (Đồ uống, Thuê đồ, Combo):</span>
        <strong style="font-family:var(--font-mono); color:#10B981;">${formatMoney(inHouseAmount)}</strong>
      </div>
      <div class="invoice-row">
        <span>• Chi phí mua hộ / Đi chợ ngoài theo hóa đơn:</span>
        <strong style="font-family:var(--font-mono); color:#F59E0B;">${formatMoney(procAmount)}</strong>
      </div>
      <div class="invoice-row" style="background:rgba(255,255,255,0.02); padding:6px 8px; border-radius:6px; margin:4px 0;">
        <span style="font-weight:600;">Tổng tiền dịch vụ & tiệc tùng:</span>
        <strong style="font-family:var(--font-mono); color:var(--info); font-size:14.5px;">${formatMoney(inv.serviceAmount)}</strong>
      </div>
      <div class="invoice-row total">
        <span>TỔNG CỘNG HÓA ĐƠN (Grand Total):</span>
        <span style="font-size:18px; color:#34D399; font-family:var(--font-mono);">${formatMoney(inv.grandTotal)}</span>
      </div>
      <div class="invoice-row">
        <span>Đã thanh toán thực tế:</span>
        <span style="font-family:var(--font-mono); color:#10B981;">${formatMoney(inv.paidAmount)}</span>
      </div>
      <div class="invoice-row" style="border-top:1px dashed var(--border); margin-top:6px; padding-top:8px;">
        <span style="font-weight:700; color:${inv.balance > 0 ? 'var(--warning)' : '#10B981'};">SỐ TIỀN CÒN THIẾU (Balance Due):</span>
        <span style="font-size:18px; font-weight:800; font-family:var(--font-mono); color:${inv.balance > 0 ? 'var(--warning)' : '#10B981'};">${formatMoney(inv.balance)}</span>
      </div>
      ${inv.unreturnedRentals > 0 ? `<div style="margin-top:8px; padding:6px 10px; background:rgba(239, 68, 68, 0.15); border:1px solid var(--danger); border-radius:6px; font-size:12.5px; color:#FCA5A5;">⚠️ Còn <strong>${inv.unreturnedRentals}</strong> món đồ thuê chưa được trả lại! (BR-28 chặn hoàn thành đơn)</div>` : ''}
    </div>

    <!-- DANH SÁCH CHI TIẾT MÓN DỊCH VỤ NỘI BỘ -->
    <div style="margin-top:16px;">
      <div style="font-size:14px; font-weight:700;">Danh Sách Món Nội Bộ Đã Gọi:</div>
      ${serviceOrdersHtml}
    </div>

    <!-- DANH SÁCH HÓA ĐƠN MUA HỘ NGOÀI NẾU CÓ -->
    ${procurementHtml}

    ${actionButtonsHtml}
  `;
}

// Hành động chi tiết đơn
async function ghiNhanThanhToanTienSan(bookingId) {
  const method = prompt('Chọn phương thức thanh toán tiền sân (CASH hoặc BANK_TRANSFER):', 'CASH');
  if (!method) return;

  try {
    await apiFetch(`/staff/bookings/${bookingId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ method: method.toUpperCase() }),
    });
    showToast('Ghi nhận thanh toán tiền sân thành công!');
    viewDetail(bookingId);
  } catch (err) {
    showToast('Lỗi thanh toán: ' + err.message, true);
  }
}

async function xacNhanCheckIn(bookingId) {
  if (!confirm('Xác nhận khách hàng đã có mặt tại sân và nhận sân thi đấu?')) return;
  try {
    const res = await apiFetch(`/staff/bookings/${bookingId}/check-in`, { method: 'POST' });
    showToast(res.message || 'Xác nhận khách đến sân (Check-in) thành công!');
    viewDetail(bookingId);
    if (typeof loadBookings === 'function') loadBookings(bookingPage);
  } catch (err) {
    showToast('Lỗi check-in: ' + err.message, true);
  }
}

async function hoanThanhDonDat(bookingId) {
  if (!confirm('Xác nhận hoàn tất phiên chơi và hoàn thành đơn này?')) return;

  try {
    await apiFetch(`/staff/bookings/${bookingId}/complete`, { method: 'POST' });
    showToast('Đơn đặt sân đã được hoàn thành thành công!');
    viewDetail(bookingId);
  } catch (err) {
    // BR-28: Hiển thị lý do chặn hoàn thành
    alert(`⚠️ Không thể hoàn thành đơn đặt sân:\n\n${err.message}`);
  }
}

async function danhDauNoShow(bookingId) {
  if (!confirm('Xác nhận khách vắng mặt (No-Show)? Slot sẽ được giải phóng và không hoàn tiền (BR-12).')) return;

  try {
    await apiFetch(`/staff/bookings/${bookingId}/no-show`, { method: 'POST' });
    showToast('Đã đánh dấu đơn vắng mặt (No-Show)!');
    viewDetail(bookingId);
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

async function nhanVienHuyDon(bookingId) {
  const reason = prompt('Nhập lý do nhân viên hủy đơn (bắt buộc theo STF-08):');
  if (!reason) return;

  try {
    const res = await apiFetch(`/staff/bookings/${bookingId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    if (res.data.refundPending) {
      alert('Đơn đã được hủy! Do khách đã thanh toán tiền sân, giao dịch đã được chuyển sang danh sách CHỜ HOÀN TIỀN.');
    } else {
      showToast('Đã hủy đơn thành công!');
    }
    viewDetail(bookingId);
  } catch (err) {
    showToast('Lỗi hủy đơn: ' + err.message, true);
  }
}

async function traDoThue(orderItemId) {
  if (!confirm('Xác nhận khách đã trả lại dụng cụ / đồ thuê này?')) return;

  try {
    await apiFetch(`/staff/service-order-items/${orderItemId}/return`, { method: 'POST' });
    showToast('Đã ghi nhận nhận lại đồ thuê!');
    if (currentDetailBookingId) viewDetail(currentDetailBookingId);
  } catch (err) {
    showToast('Lỗi trả đồ thuê: ' + err.message, true);
  }
}

// Modal Thêm Dịch Vụ Tại Quầy
async function openAddServiceModal(bookingId) {
  document.getElementById('add-service-booking-id').value = bookingId;
  const select = document.getElementById('add-service-item');
  select.innerHTML = '<option value="">-- Đang tải danh sách món... --</option>';
  openModal('modal-add-service');

  try {
    const res = await apiFetch('/services');
    const services = res.data || [];
    select.innerHTML = '<option value="">-- Chọn món dịch vụ --</option>';

    services.filter((s) => s.status === 'ACTIVE').forEach((s) => {
      select.innerHTML += `<option value="${s.id}">${s.name} (${s.category}) — ${formatMoney(s.price)}/${s.unit}</option>`;
    });
  } catch (err) {
    select.innerHTML = '<option value="">Lỗi tải danh mục dịch vụ</option>';
  }
}

async function handleStaffAddService(e) {
  e.preventDefault();
  const bookingId = Number(document.getElementById('add-service-booking-id').value);
  const serviceId = Number(document.getElementById('add-service-item').value);
  const quantity = Number(document.getElementById('add-service-qty').value);
  const note = document.getElementById('add-service-note').value;

  try {
    await apiFetch(`/staff/bookings/${bookingId}/service-orders`, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ serviceId, quantity }],
        note,
      }),
    });

    closeModal('modal-add-service');
    showToast('Đã thêm dịch vụ thành công! (Tự động vào trạng thái ĐÃ GIAO - BR-31)');
    viewDetail(bookingId);
  } catch (err) {
    showToast('Lỗi thêm dịch vụ: ' + err.message, true);
  }
}

// Modal Thu Tiền Dịch Vụ
function openPayServiceModal(bookingId, balance) {
  document.getElementById('pay-service-booking-id').value = bookingId;
  document.getElementById('pay-service-amount-display').value = formatMoney(balance);
  openModal('modal-pay-service');
}

async function handleStaffPayService(e) {
  e.preventDefault();
  const bookingId = Number(document.getElementById('pay-service-booking-id').value);
  const method = document.getElementById('pay-service-method').value;
  const transactionRef = document.getElementById('pay-service-ref').value;

  try {
    await apiFetch(`/staff/bookings/${bookingId}/service-payments`, {
      method: 'POST',
      body: JSON.stringify({ method, transactionRef }),
    });

    closeModal('modal-pay-service');
    showToast('Đã thu tiền dịch vụ thành công!');
    viewDetail(bookingId);
  } catch (err) {
    showToast('Lỗi thu tiền dịch vụ: ' + err.message, true);
  }
}

// Modal Đóng Đơn Có Công Nợ (ADMIN ONLY - ADM-09, BR-33, TC-64)
function openCloseWithDebtModal(bookingId) {
  document.getElementById('close-debt-booking-id').value = bookingId;
  document.getElementById('close-debt-reason').value = '';
  openModal('modal-close-debt');
}

async function handleAdminCloseWithDebt(e) {
  e.preventDefault();
  const bookingId = Number(document.getElementById('close-debt-booking-id').value);
  const reason = document.getElementById('close-debt-reason').value.trim();

  if (!reason) return showToast('Vui lòng nhập lý do đóng đơn có công nợ', true);

  try {
    await apiFetch(`/admin/bookings/${bookingId}/close-with-debt`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    closeModal('modal-close-debt');
    showToast('Đã đóng đơn có công nợ thành công! (closed_with_debt = 1)');
    viewDetail(bookingId);
  } catch (err) {
    showToast('Lỗi đóng đơn công nợ: ' + err.message, true);
  }
}

// ================= 18. KHỞI TẠO ỨNG DỤNG =================
async function loadInitialData() {
  await loadDashboard();
  loadWalkinData();

  // Đặt bộ tự làm mới định kỳ mỗi 10 giây (R4: POLL_INTERVAL_MS = 10000)
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(() => {
    if (currentTab === 'dashboard') loadDashboard();
    else if (currentTab === 'schedule') loadSchedule();
    else if (currentTab === 'bookings') loadBookings();
    else if (currentTab === 'service-orders') loadServiceOrders();
    else if (currentTab === 'catering') loadProcurementData();
    else if (currentTab === 'inventory') loadInventory();
    else if (currentTab === 'refunds') loadRefunds();
  }, 10000);
}

// ================= 17. TAB QUẢN LÝ TỒN KHO & BIẾN ĐỘNG (STAFF & ADMIN) =================
let cachedInventory = [];

async function loadInventory() {
  try {
    const endpoint = currentUser && currentUser.role === 'ADMIN' ? '/admin/inventory' : '/staff/inventory';
    const res = await apiFetch(endpoint);
    cachedInventory = res.data || [];

    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (cachedInventory.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color:var(--text-muted); padding:20px;">Không có dịch vụ nào trong kho</td></tr>';
      return;
    }

    cachedInventory.forEach((item) => {
      const tr = document.createElement('tr');
      const isAdmin = currentUser && currentUser.role === 'ADMIN';

      let statusBadge = '<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#34D399;">Đủ hàng</span>';
      if (item.serviceStatus === 'INACTIVE' || item.stockStatus === 'INACTIVE') {
        statusBadge = '<span class="badge" style="background:rgba(239, 68, 68, 0.2); color:#F87171; border:1px solid rgba(239, 68, 68, 0.4);">🚫 Ngưng bán</span>';
      } else if (item.stockStatus === 'OUT_OF_STOCK') {
        statusBadge = '<span class="badge" style="background:rgba(239, 68, 68, 0.2); color:#F87171;">Hết hàng</span>';
      } else if (item.stockStatus === 'LOW_STOCK') {
        statusBadge = '<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FBBF24;">Sắp hết</span>';
      }

      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700;">#${item.serviceId || item.id}</td>
        <td style="font-weight:700;">${item.serviceName}</td>
        <td><span class="badge" style="background:rgba(59, 130, 246, 0.2); color:#60A5FA;">${item.type}</span></td>
        <td>${item.unit}</td>
        <td style="font-family:var(--font-mono);">${formatMoney(item.price)}</td>
        <td style="font-weight:800; font-family:var(--font-mono);">${item.quantity}</td>
        <td style="color:#FBBF24; font-family:var(--font-mono);">${item.reservedQuantity}</td>
        <td style="font-weight:800; color:${item.availableQuantity > 0 ? '#34D399' : '#F87171'}; font-family:var(--font-mono);">${item.availableQuantity}</td>
        <td style="font-family:var(--font-mono);">${item.threshold}</td>
        <td>${statusBadge}</td>
        <td class="admin-only" style="${isAdmin ? '' : 'display:none;'}">
          ${(item.serviceStatus === 'INACTIVE' || item.stockStatus === 'INACTIVE') ? `
            <span style="font-size:11px; color:#F87171; font-weight:600; font-style:italic;">(Ngưng bán)</span>
          ` : `
            <button class="btn btn-outline" style="padding:4px 8px; font-size:11px;" onclick="moModalNhapKhoChon(${item.serviceId || item.id})">📥 Nhập</button>
            <button class="btn btn-outline" style="padding:4px 8px; font-size:11px; margin-left:4px;" onclick="moModalDieuChinhKhoChon(${item.serviceId || item.id})">⚖️ Chỉnh</button>
          `}
          <button class="btn btn-outline" style="padding:4px 8px; font-size:11px; margin-left:4px;" onclick="capNhatNguongKho(${item.serviceId || item.id}, ${item.threshold}, '${item.serviceName}')">⚙️ Ngưỡng</button>
          <button class="btn btn-outline" style="padding:4px 8px; font-size:11px; margin-left:4px;" onclick="xemLichSuKho(${item.serviceId || item.id})">📜 Log</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    applyUserUI();
  } catch (err) {
    showToast('Lỗi tải danh sách tồn kho: ' + err.message, true);
  }
}

function napOptionDichVu(selectId, defaultId = null) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '';
  const activeItems = cachedInventory.filter((item) => item.serviceStatus !== 'INACTIVE' && item.stockStatus !== 'INACTIVE');
  if (activeItems.length === 0) {
    sel.innerHTML = '<option value="">-- Không có dịch vụ nào đang bán --</option>';
    return;
  }
  activeItems.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.serviceId || item.id;
    opt.textContent = `[#${item.serviceId || item.id}] ${item.serviceName} (Khả dụng: ${item.availableQuantity} ${item.unit})`;
    if (defaultId && (item.serviceId === defaultId || item.id === defaultId)) {
      opt.selected = true;
    }
    sel.appendChild(opt);
  });
}

function moModalNhapKho() {
  napOptionDichVu('nhap-kho-service-id');
  document.getElementById('nhap-kho-quantity').value = '';
  document.getElementById('nhap-kho-note').value = '';
  openModal('modal-nhap-kho');
}

function moModalNhapKhoChon(serviceId) {
  const item = cachedInventory.find((i) => (i.serviceId || i.id) === serviceId);
  if (item && (item.serviceStatus === 'INACTIVE' || item.stockStatus === 'INACTIVE')) {
    return showToast(`Dịch vụ [${item.serviceName}] đang ở trạng thái Ngưng bán. Vui lòng mở bán lại trước khi nhập kho!`, true);
  }
  napOptionDichVu('nhap-kho-service-id', serviceId);
  document.getElementById('nhap-kho-quantity').value = '';
  document.getElementById('nhap-kho-note').value = '';
  openModal('modal-nhap-kho');
}

async function xuLyNhapKho(e) {
  e.preventDefault();
  const serviceId = Number(document.getElementById('nhap-kho-service-id').value);
  const quantity = Number(document.getElementById('nhap-kho-quantity').value);
  const note = document.getElementById('nhap-kho-note').value.trim();

  try {
    await apiFetch('/admin/inventory/import', {
      method: 'POST',
      body: JSON.stringify({ serviceId, quantity, note }),
    });
    showToast('Nhập kho thành công!');
    closeModal('modal-nhap-kho');
    loadInventory();
  } catch (err) {
    showToast('Lỗi nhập kho: ' + err.message, true);
  }
}

function moModalDieuChinhKho() {
  napOptionDichVu('dc-kho-service-id');
  document.getElementById('dc-kho-quantity').value = '';
  document.getElementById('dc-kho-reason').value = '';
  openModal('modal-dieu-chinh-kho');
}

function moModalDieuChinhKhoChon(serviceId) {
  const item = cachedInventory.find((i) => (i.serviceId || i.id) === serviceId);
  if (item && (item.serviceStatus === 'INACTIVE' || item.stockStatus === 'INACTIVE')) {
    return showToast(`Dịch vụ [${item.serviceName}] đang ở trạng thái Ngưng bán. Vui lòng mở bán lại trước khi điều chỉnh!`, true);
  }
  napOptionDichVu('dc-kho-service-id', serviceId);
  document.getElementById('dc-kho-quantity').value = '';
  document.getElementById('dc-kho-reason').value = '';
  openModal('modal-dieu-chinh-kho');
}

async function xuLyDieuChinhKho(e) {
  e.preventDefault();
  const serviceId = Number(document.getElementById('dc-kho-service-id').value);
  const type = document.getElementById('dc-kho-type').value;
  const quantity = Number(document.getElementById('dc-kho-quantity').value);
  const reason = document.getElementById('dc-kho-reason').value.trim();

  try {
    await apiFetch('/admin/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ serviceId, type, quantity, reason }),
    });
    showToast('Điều chỉnh kho thành công!');
    closeModal('modal-dieu-chinh-kho');
    loadInventory();
  } catch (err) {
    showToast('Lỗi điều chỉnh kho: ' + err.message, true);
  }
}

async function capNhatNguongKho(serviceId, currentThreshold, serviceName) {
  const newThresholdStr = prompt(`Cập nhật ngưỡng cảnh báo kho cho [${serviceName}] (ngưỡng hiện tại: ${currentThreshold}):`, currentThreshold);
  if (newThresholdStr === null) return;
  const threshold = Number(newThresholdStr);
  if (isNaN(threshold) || threshold < 0) return showToast('Ngưỡng không hợp lệ', true);

  try {
    await apiFetch(`/admin/inventory/${serviceId}/threshold`, {
      method: 'PATCH',
      body: JSON.stringify({ threshold }),
    });
    showToast('Đã cập nhật ngưỡng cảnh báo kho!');
    loadInventory();
  } catch (err) {
    showToast('Lỗi cập nhật ngưỡng: ' + err.message, true);
  }
}

async function xemLichSuKho(serviceId = null) {
  try {
    const url = serviceId ? `/admin/inventory/transactions?serviceId=${serviceId}` : '/admin/inventory/transactions';
    const res = await apiFetch(url);
    const transactions = res.data?.items || [];

    const tbody = document.getElementById('lich-su-kho-tbody');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:20px;">Chưa có biến động kho nào</td></tr>';
    } else {
      transactions.forEach((tx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-size:12px;">${formatDateTime(tx.createdAt)}</td>
          <td style="font-weight:700;">${tx.serviceName}</td>
          <td><span class="badge" style="background:rgba(59, 130, 246, 0.2); color:#60A5FA;">${tx.type}</span></td>
          <td style="font-weight:800; font-family:var(--font-mono);">${tx.quantity}</td>
          <td style="font-family:var(--font-mono);">${tx.quantityBefore}</td>
          <td style="font-weight:800; font-family:var(--font-mono);">${tx.quantityAfter}</td>
          <td>${tx.performerName || 'Hệ thống'}</td>
          <td style="font-size:12px; color:var(--text-muted);">${tx.note || '—'}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    openModal('modal-lich-su-kho');
  } catch (err) {
    showToast('Lỗi tải lịch sử biến động kho: ' + err.message, true);
  }
}

// ================= 19. TAB DỊCH VỤ TIỆC & HÓA ĐƠN MUA HỘ (2 PHƯƠNG THỨC) =================
let cachedProcurements = [];
let currentCateringSubTab = 'external';

async function loadProcurementData() {
  const costType = document.getElementById('procure-filter-cost-type')?.value || 'ALL';
  const docType = document.getElementById('procure-filter-doc-type')?.value || '';
  const status = document.getElementById('procure-filter-status')?.value || 'ALL';
  const kw = (document.getElementById('procure-search-keyword')?.value || '').trim();

  const params = new URLSearchParams();
  if (costType && costType !== 'ALL') params.append('loaiChiPhi', costType);
  if (docType) params.append('loaiChungTu', docType);
  if (status && status !== 'ALL') params.append('trangThai', status);
  if (kw) params.append('tuKhoa', kw);

  try {
    const [resList, resSummary] = await Promise.all([
      apiFetch(`/staff/procurement-invoices?${params.toString()}`),
      apiFetch('/staff/procurement-invoices/summary'),
    ]);

    cachedProcurements = resList.data || [];
    const sum = resSummary.data || {};

    // Cập nhật 5 thẻ KPI
    const elCount = document.getElementById('procure-kpi-count');
    const elSubCount = document.getElementById('procure-kpi-sub-count');
    const elInvAmt = document.getElementById('procure-kpi-invoice-amount');
    const elFee = document.getElementById('procure-kpi-service-fee');
    const elGrand = document.getElementById('procure-kpi-grand-total');
    const elDocRatio = document.getElementById('procure-kpi-doc-ratio');

    if (elCount) elCount.textContent = sum.totalInvoices || 0;
    if (elSubCount) elSubCount.textContent = `${sum.billedCount || 0} đã gộp đơn / ${sum.pendingCount || 0} chờ duyệt`;
    if (elInvAmt) elInvAmt.textContent = formatMoney(sum.totalInvoiceAmount || 0);
    if (elFee) elFee.textContent = formatMoney(sum.totalServiceFee || 0);
    if (elGrand) elGrand.textContent = formatMoney(sum.grandProcurementTotal || 0);
    if (elDocRatio) elDocRatio.textContent = `${sum.electronicCount || 0} E-HD / ${sum.paperCount || 0} Giấy`;

    renderProcurementTable(cachedProcurements);

    // Nếu đang ở tab nội bộ thì nạp menu nội bộ
    if (currentCateringSubTab === 'inhouse') {
      renderCateringInhouseMenu();
    }
  } catch (err) {
    showToast('Lỗi tải dữ liệu mua hộ: ' + err.message, true);
  }
}

function renderProcurementTable(invoices) {
  const tbody = document.getElementById('procurement-invoices-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (invoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align:center; padding:36px 20px; color:var(--text-muted);">
          <div style="font-size:36px; margin-bottom:8px;">🧾</div>
          <strong style="font-size:15px; color:var(--text);">Chưa có hóa đơn mua hộ ngoại vi nào</strong>
          <p style="font-size:12.5px; margin-top:4px;">Bấm nút <strong>"+ Tiếp Nhận Hóa Đơn Mua Hộ Mới"</strong> để ghi nhận hóa đơn đi chợ hoặc dịch vụ bên ngoài.</p>
        </td>
      </tr>
    `;
    return;
  }

  invoices.forEach((item) => {
    const tr = document.createElement('tr');

    const isElectronic = item.documentType === 'ELECTRONIC';
    const docBadge = isElectronic
      ? '<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#34D399; border:1px solid rgba(16, 185, 129, 0.4);">🟢 HĐ Điện Tử</span>'
      : '<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FBBF24; border:1px solid rgba(245, 158, 11, 0.4);">🟡 HĐ Giấy / Bill</span>';

    let costTypeName = '📦 Chi phí khác';
    if (item.expenseType === 'GROCERY') costTypeName = '🥩 Đi chợ BBQ, hải sản';
    else if (item.expenseType === 'CATERING') costTypeName = '🍱 Đặt món nhà hàng ngoài';
    else if (item.expenseType === 'EQUIPMENT') costTypeName = '🔊 Thuê thiết bị ngoài';
    else if (item.expenseType === 'OTHER') costTypeName = '🍾 Phụ thu đồ mang đến / Khác';

    let imgPreview = '<span style="color:var(--text-muted); font-size:11px;">Chưa đính kèm</span>';
    if (item.invoiceImageUrl) {
      imgPreview = `
        <div style="display:inline-flex; align-items:center; gap:6px;">
          <img src="${item.invoiceImageUrl}" style="width:36px; height:36px; object-fit:cover; border-radius:6px; border:1px solid var(--border); cursor:pointer;" onclick="moModalXemAnhChungTu(${item.id})" title="Bấm để phóng to xem ảnh bill" />
          <button class="btn btn-outline" style="padding:2px 6px; font-size:11px;" onclick="moModalXemAnhChungTu(${item.id})">🔍 Xem</button>
        </div>
      `;
    }

    let statusBadge = '<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#10B981;">Đã gộp đơn (BILLED)</span>';
    if (item.status === 'CONFIRMED') {
      statusBadge = '<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FBBF24;">Chờ TT (CONFIRMED)</span>';
    } else if (item.status === 'CANCELLED') {
      statusBadge = '<span class="badge" style="background:rgba(239, 68, 68, 0.2); color:#F87171;">Đã hủy</span>';
    }

    tr.innerHTML = `
      <td style="font-family:var(--font-mono); font-weight:700;">#${item.id}</td>
      <td>
        <span style="font-family:var(--font-mono); font-weight:700; color:var(--primary); cursor:pointer;" onclick="viewDetail(${item.bookingId})">${item.bookingCode}</span>
        <div style="font-size:11.5px; color:var(--text-muted);">${item.customerName} · ${item.customerPhone}</div>
        <div style="font-size:11px; color:#60A5FA;">🏟️ ${item.courtName} (${formatDate(item.bookingDate)})</div>
      </td>
      <td>
        <div style="font-weight:700;">${item.title}</div>
        <div style="font-size:11.5px; color:var(--text-muted);">${costTypeName} · Nơi mua: <strong>${item.supplier || 'Bên ngoài'}</strong></div>
        ${item.itemsDetail ? `<div style="font-size:11px; color:#A78BFA; font-style:italic; margin-top:2px;">Món: ${item.itemsDetail}</div>` : ''}
      </td>
      <td>
        <div style="font-family:var(--font-mono); font-weight:700;">${item.invoiceNumber || '—'}</div>
        <div style="font-size:11.5px; color:var(--text-muted);">Ngày: ${formatDate(item.invoiceDate)}</div>
      </td>
      <td>${docBadge}</td>
      <td>${imgPreview}</td>
      <td style="font-family:var(--font-mono);">${formatMoney(item.invoiceAmount)}</td>
      <td style="font-family:var(--font-mono); color:#FBBF24;">${item.serviceFee > 0 ? '+' + formatMoney(item.serviceFee) : '0 ₫'}</td>
      <td style="font-weight:800; font-family:var(--font-mono); color:#34D399; font-size:14px;">${formatMoney(item.totalAmount)}</td>
      <td>${statusBadge}</td>
      <td style="text-align:right;">
        <div style="display:flex; justify-content:flex-end; gap:4px; flex-wrap:wrap;">
          <button class="btn btn-outline" style="padding:4px 8px; font-size:11px;" onclick="doiTrangThaiHoaDonMuaHo(${item.id}, '${item.status}')" title="Đổi trạng thái">🔄 Đổi TT</button>
          <button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="xoaHoaDonMuaHo(${item.id})" title="Xóa khoản chi">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function chuyenTabConTiec(subTab) {
  currentCateringSubTab = subTab;
  const btnExt = document.getElementById('btn-catering-tab-external');
  const btnIn = document.getElementById('btn-catering-tab-inhouse');
  const viewExt = document.getElementById('catering-view-external');
  const viewIn = document.getElementById('catering-view-inhouse');

  if (subTab === 'external') {
    if (btnExt) btnExt.classList.add('active');
    if (btnIn) btnIn.classList.remove('active');
    if (viewExt) viewExt.style.display = 'block';
    if (viewIn) viewIn.style.display = 'none';
    loadProcurementData();
  } else {
    if (btnExt) btnExt.classList.remove('active');
    if (btnIn) btnIn.classList.add('active');
    if (viewExt) viewExt.style.display = 'none';
    if (viewIn) viewIn.style.display = 'block';
    renderCateringInhouseMenu();
  }
}

async function renderCateringInhouseMenu() {
  const tbody = document.getElementById('catering-inhouse-menu-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">Đang tải thực đơn nội bộ...</td></tr>';

  try {
    const res = await apiFetch('/services');
    const services = res.data || [];
    tbody.innerHTML = '';

    if (services.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">Chưa có dịch vụ nội bộ nào</td></tr>';
      return;
    }

    services.forEach((s) => {
      const tr = document.createElement('tr');
      let catBadge = '';
      if (s.category === 'DRINK') catBadge = '<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#34D399;">🥤 Nước uống tủ mát</span>';
      else if (s.category === 'RENTAL') catBadge = '<span class="badge" style="background:rgba(139, 92, 246, 0.2); color:#C4B5FD;">🏸 Dụng cụ, bàn ghế</span>';
      else if (s.category === 'PACKAGE') catBadge = '<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FCD34D;">📦 Gói combo tiệc</span>';
      else catBadge = `<span class="badge">${s.category}</span>`;

      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700;">#${s.id}</td>
        <td style="font-weight:700;">${s.name}<br><span style="font-size:11px; color:var(--text-muted);">${s.description || ''}</span></td>
        <td>${catBadge}</td>
        <td>${s.unit || 'món'}</td>
        <td style="font-family:var(--font-mono); font-weight:700;">${formatMoney(s.price)}</td>
        <td style="font-weight:700; color:#34D399;">Sẵn có trong kho</td>
        <td>${s.status === 'ACTIVE' ? '<span style="color:#10B981; font-weight:700;">✅ Sẵn sàng</span>' : '<span style="color:#EF4444; font-weight:700;">Tạm hết</span>'}</td>
        <td style="text-align:right;">
          <button class="btn btn-outline" style="padding:4px 10px; font-size:12px; border-color:#10B981; color:#10B981;" onclick="moModalGoiDichVuTiecNoiBo(null, ${s.id})">
            ➕ Chọn Món Này
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger); text-align:center; padding:20px;">Lỗi: ${err.message}</td></tr>`;
  }
}

async function moModalThemHoaDonMuaHo(defaultBookingId = null) {
  const selBooking = document.getElementById('procure-booking-id');
  selBooking.innerHTML = '<option value="">-- Đang nạp danh sách đơn đặt tiệc... --</option>';

  // Đặt ngày hôm nay mặc định
  document.getElementById('procure-invoice-date').value = new Date().toISOString().substring(0, 10);
  document.getElementById('procure-title').value = '';
  document.getElementById('procure-supplier').value = '';
  document.getElementById('procure-invoice-code').value = '';
  document.getElementById('procure-items-detail').value = '';
  document.getElementById('procure-original-amount').value = '';
  document.getElementById('procure-service-fee').value = '0';
  document.getElementById('procure-calc-total').value = '0 ₫';
  document.getElementById('procure-img-url').value = '';
  document.getElementById('procure-note').value = '';

  openModal('modal-add-procurement');

  try {
    const res = await apiFetch('/staff/bookings?limit=50');
    const bookings = res.data?.items || [];

    selBooking.innerHTML = '<option value="">-- Chọn đơn đặt tiệc / sự kiện --</option>';
    const validBookings = bookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'EXPIRED');

    validBookings.forEach((b) => {
      const isSel = defaultBookingId && b.id === Number(defaultBookingId) ? 'selected' : '';
      selBooking.innerHTML += `<option value="${b.id}" ${isSel}>${b.bookingCode} · ${b.customerName || 'Khách'} (${b.courtName} - ${formatDate(b.bookingDate)})</option>`;
    });

    if (defaultBookingId) {
      selBooking.value = defaultBookingId;
    }
  } catch (err) {
    showToast('Lỗi nạp đơn: ' + err.message, true);
  }
}

function tinhTongTienMuaHoForm() {
  const original = Number(document.getElementById('procure-original-amount')?.value || 0);
  const fee = Number(document.getElementById('procure-service-fee')?.value || 0);
  const total = Math.max(0, original + fee);
  const calcEl = document.getElementById('procure-calc-total');
  if (calcEl) calcEl.value = formatMoney(total);
}

function doiLoaiChungTuMau(val) {
  const codeInput = document.getElementById('procure-invoice-code');
  if (val === 'ELECTRONIC') {
    if (!codeInput.value) codeInput.value = 'HD-E-' + Date.now().toString().slice(-6);
  } else {
    if (!codeInput.value) codeInput.value = 'BILL-P-' + Date.now().toString().slice(-6);
  }
}

function dienAnhMauChungTu() {
  const docType = document.getElementById('procure-doc-type').value;
  const input = document.getElementById('procure-img-url');
  if (docType === 'ELECTRONIC') {
    input.value = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80';
  } else {
    input.value = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';
  }
  showToast('Đã điền link ảnh hóa đơn mẫu thực tế!');
}

async function handleCreateProcurementSubmit(e) {
  e.preventDefault();
  const donDatId = Number(document.getElementById('procure-booking-id').value);
  const loaiChiPhi = document.getElementById('procure-expense-type').value;
  const tenKhoanChi = document.getElementById('procure-title').value.trim();
  const nhaCungCap = document.getElementById('procure-supplier').value.trim();
  const loaiChungTu = document.getElementById('procure-doc-type').value;
  const soHoaDon = document.getElementById('procure-invoice-code').value.trim();
  const ngayHoaDon = document.getElementById('procure-invoice-date').value;
  const chiTietMon = document.getElementById('procure-items-detail').value.trim();
  const tienHoaDon = Number(document.getElementById('procure-original-amount').value);
  const phiPhucVu = Number(document.getElementById('procure-service-fee').value || 0);
  const hinhAnhChungTu = document.getElementById('procure-img-url').value.trim();
  const ghiChu = document.getElementById('procure-note').value.trim();

  if (!donDatId) return showToast('Vui lòng chọn đơn đặt sân/tiệc tương ứng', true);
  if (!tenKhoanChi) return showToast('Vui lòng nhập tên khoản chi hộ', true);
  if (!tienHoaDon || tienHoaDon <= 0) return showToast('Số tiền hóa đơn phải lớn hơn 0', true);

  try {
    const res = await apiFetch('/staff/procurement-invoices', {
      method: 'POST',
      body: JSON.stringify({
        donDatId,
        loaiChiPhi,
        tenKhoanChi,
        nhaCungCap,
        loaiChungTu,
        soHoaDon,
        ngayHoaDon,
        chiTietMon,
        tienHoaDon,
        phiPhucVu,
        hinhAnhChungTu,
        ghiChu,
      }),
    });

    closeModal('modal-add-procurement');
    showToast(res.message || 'Đã tiếp nhận hóa đơn mua hộ và gộp vào đơn tiệc thành công!');
    loadProcurementData();

    // Nếu modal chi tiết đơn đang mở, refresh lại
    if (currentDetailBookingId && currentDetailBookingId === donDatId) {
      viewDetail(donDatId);
    }
  } catch (err) {
    showToast('Lỗi tạo hóa đơn mua hộ: ' + err.message, true);
  }
}

function moModalXemAnhChungTu(id) {
  const item = cachedProcurements.find((p) => p.id === id);
  if (!item) return;

  const titleEl = document.getElementById('view-bill-modal-title');
  const contentEl = document.getElementById('view-bill-modal-content');
  const metaEl = document.getElementById('view-bill-modal-meta');

  if (titleEl) titleEl.textContent = `🧾 Hóa Đơn #${item.id}: ${item.title}`;

  const isElec = item.documentType === 'ELECTRONIC';
  const badgeHtml = isElec
    ? '<span class="badge" style="background:rgba(16, 185, 129, 0.2); color:#34D399;">🟢 HÓA ĐƠN ĐIỆN TỬ</span>'
    : '<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:#FBBF24;">🟡 HÓA ĐƠN GIẤY / BIÊN NHẬN</span>';

  const imgHtml = item.invoiceImageUrl
    ? `<img src="${item.invoiceImageUrl}" style="max-width:100%; max-height:450px; border-radius:8px; border:1px solid var(--border); box-shadow:var(--shadow);" alt="Hóa đơn chứng từ" />`
    : '<div style="padding:40px; color:var(--text-muted); background:var(--surface); border-radius:8px;">Hóa đơn này không có file ảnh đính kèm</div>';

  if (contentEl) {
    contentEl.innerHTML = `
      <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
        <div>${badgeHtml}</div>
        <div style="font-size:13px; font-weight:700; color:#34D399; font-family:var(--font-mono); font-size:16px;">${formatMoney(item.totalAmount)}</div>
      </div>
      <div style="background:var(--surface-card); border:1px solid var(--border); border-radius:8px; padding:12px; font-size:12.5px; text-align:left; margin-bottom:12px; line-height:1.6;">
        <div><strong>Mã đơn tiệc:</strong> <span style="font-family:var(--font-mono); color:var(--primary);">${item.bookingCode}</span> (${item.customerName} - ${item.customerPhone})</div>
        <div><strong>Nhà cung cấp / Cửa hàng:</strong> ${item.supplier || 'Không xác định'} | <strong>Số HĐ:</strong> ${item.invoiceNumber || '—'}</div>
        <div><strong>Ngày lập bill:</strong> ${formatDate(item.invoiceDate)} | <strong>Tiền gốc:</strong> ${formatMoney(item.invoiceAmount)} | <strong>Phí công:</strong> ${formatMoney(item.serviceFee)}</div>
        ${item.itemsDetail ? `<div><strong>Món hàng mua hộ:</strong> ${item.itemsDetail}</div>` : ''}
        ${item.note ? `<div><strong>Ghi chú:</strong> ${item.note}</div>` : ''}
      </div>
      ${imgHtml}
    `;
  }

  if (metaEl) {
    metaEl.textContent = `Người tiếp nhận: ${item.creatorName || 'Nhân viên'} · Thời điểm ghi: ${item.createdAt}`;
  }

  openModal('modal-view-invoice-img');
}

function moModalXemAnhChungTuDirect(imgUrlEnc, titleEnc, invoiceNumber, totalFormatted) {
  const imgUrl = decodeURIComponent(imgUrlEnc);
  const title = decodeURIComponent(titleEnc);

  const titleEl = document.getElementById('view-bill-modal-title');
  const contentEl = document.getElementById('view-bill-modal-content');
  const metaEl = document.getElementById('view-bill-modal-meta');

  if (titleEl) titleEl.textContent = `🧾 Hóa Đơn: ${title}`;
  if (contentEl) {
    contentEl.innerHTML = `
      <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700;">Số HĐ: ${invoiceNumber || '—'}</span>
        <span style="font-weight:800; color:#34D399; font-family:var(--font-mono); font-size:16px;">${totalFormatted}</span>
      </div>
      <img src="${imgUrl}" style="max-width:100%; max-height:450px; border-radius:8px; border:1px solid var(--border);" alt="Hóa đơn" />
    `;
  }
  if (metaEl) metaEl.textContent = 'Chứng từ đối soát khách hàng & kế toán';
  openModal('modal-view-invoice-img');
}

async function doiTrangThaiHoaDonMuaHo(id, currentStatus) {
  const nextStatus = currentStatus === 'BILLED' ? 'CONFIRMED' : 'BILLED';
  if (!confirm(`Chuyển trạng thái hóa đơn #${id} sang [${nextStatus}]?`)) return;

  try {
    await apiFetch(`/staff/procurement-invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ trangThai: nextStatus }),
    });
    showToast(`Đã cập nhật trạng thái hóa đơn mua hộ sang ${nextStatus}`);
    loadProcurementData();
    if (currentDetailBookingId) viewDetail(currentDetailBookingId);
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

async function xoaHoaDonMuaHo(id) {
  if (!confirm(`Bạn có chắc chắn muốn XÓA hóa đơn mua hộ #${id}? Tiền dịch vụ của đơn tiệc sẽ được tự động trừ đi.`)) return;

  try {
    await apiFetch(`/staff/procurement-invoices/${id}`, { method: 'DELETE' });
    showToast(`Đã xóa hóa đơn mua hộ #${id} thành công!`);
    loadProcurementData();
    if (currentDetailBookingId) viewDetail(currentDetailBookingId);
  } catch (err) {
    showToast('Lỗi xóa hóa đơn: ' + err.message, true);
  }
}

async function moModalGoiDichVuTiecNoiBo(defaultBookingId = null, defaultServiceId = null) {
  const selBooking = document.getElementById('catering-internal-booking-id');
  const selService = document.getElementById('catering-internal-service-id');

  selBooking.innerHTML = '<option value="">-- Đang nạp danh sách đơn... --</option>';
  selService.innerHTML = '<option value="">-- Đang nạp thực đơn nội bộ... --</option>';
  document.getElementById('catering-internal-qty').value = '1';
  document.getElementById('catering-internal-note').value = '';

  openModal('modal-catering-internal');

  try {
    const [resBookings, resServices] = await Promise.all([
      apiFetch('/staff/bookings?limit=50'),
      apiFetch('/services'),
    ]);

    const bookings = (resBookings.data?.items || []).filter((b) => b.status !== 'CANCELLED' && b.status !== 'EXPIRED');
    const services = (resServices.data || []).filter((s) => s.status === 'ACTIVE');

    selBooking.innerHTML = '<option value="">-- Chọn đơn tiệc / sân --</option>';
    bookings.forEach((b) => {
      const isSel = (defaultBookingId && b.id === Number(defaultBookingId)) ? 'selected' : '';
      selBooking.innerHTML += `<option value="${b.id}" ${isSel}>${b.bookingCode} · ${b.customerName || 'Khách'} (${b.courtName} - ${formatDate(b.bookingDate)})</option>`;
    });

    selService.innerHTML = '<option value="">-- Chọn món dịch vụ nội bộ --</option>';
    services.forEach((s) => {
      const isSel = (defaultServiceId && s.id === Number(defaultServiceId)) ? 'selected' : '';
      selService.innerHTML += `<option value="${s.id}" ${isSel}>${s.name} (${s.category}) — ${formatMoney(s.price)}/${s.unit}</option>`;
    });

    if (defaultBookingId) selBooking.value = defaultBookingId;
    if (defaultServiceId) selService.value = defaultServiceId;
  } catch (err) {
    showToast('Lỗi nạp dữ liệu: ' + err.message, true);
  }
}

async function handleCateringInternalSubmit(e) {
  e.preventDefault();
  const bookingId = Number(document.getElementById('catering-internal-booking-id').value);
  const serviceId = Number(document.getElementById('catering-internal-service-id').value);
  const quantity = Number(document.getElementById('catering-internal-qty').value);
  const note = document.getElementById('catering-internal-note').value.trim();

  if (!bookingId) return showToast('Vui lòng chọn đơn tiệc/sân', true);
  if (!serviceId) return showToast('Vui lòng chọn món dịch vụ', true);
  if (quantity <= 0) return showToast('Số lượng phải lớn hơn 0', true);

  try {
    await apiFetch(`/staff/bookings/${bookingId}/service-orders`, {
      method: 'POST',
      body: JSON.stringify({
        items: [{ serviceId, quantity }],
        note,
      }),
    });

    closeModal('modal-catering-internal');
    showToast('Đã xuất món nội bộ cho đơn tiệc thành công! (Tự động GIAO & tính vào đơn)');
    if (currentCateringSubTab === 'inhouse') renderCateringInhouseMenu();
    if (currentDetailBookingId && currentDetailBookingId === bookingId) {
      viewDetail(bookingId);
    }
  } catch (err) {
    showToast('Lỗi: ' + err.message, true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const isAuth = checkAuthOnLoad();
  if (isAuth) {
    loadInitialData();
  }
});
