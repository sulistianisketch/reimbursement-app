(function () {
  'use strict';

  const STORAGE = { config: 'klaimku.supabase', demo: 'klaimku.demo' };
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modal = document.getElementById('modal');
  const state = { view: 'dashboard', filter: 'all', search: '', demo: true, user: null, employee: null, profile: null, data: null };
  const labels = { dashboard: 'Dashboard', reimbursements: 'Reimbursement', employees: 'Karyawan', departments: 'Departemen', categories: 'Kategori' };
  const masterInfo = {
    employees: { title: 'Master Karyawan', subtitle: 'Kelola data karyawan dan akses akun KlaimKu.', singular: 'karyawan', icon: 'people', columns: ['Karyawan', 'Departemen', 'Peran', 'Status'], fields: ['name', 'department_id', 'role', 'active'] },
    departments: { title: 'Master Departemen', subtitle: 'Atur struktur departemen dan penanggung jawabnya.', singular: 'departemen', icon: 'building', columns: ['Departemen', 'Kode', 'Kepala Departemen', 'Karyawan', 'Status'], fields: ['name', 'code', 'head_name', 'employee_count', 'active'] },
    categories: { title: 'Master Kategori', subtitle: 'Tentukan kategori biaya beserta batas klaimnya.', singular: 'kategori', icon: 'sliders', columns: ['Kategori', 'Kode', 'Batas Klaim', 'Keterangan', 'Status'], fields: ['name', 'code', 'max_amount', 'description', 'active'] }
  };

  const demoSeed = {
    departments: [
      { id: 'd1', name: 'Finance & Accounting', code: 'FIN', head_name: 'Rani Kusuma', active: true },
      { id: 'd2', name: 'People & Culture', code: 'PC', head_name: 'Maya Putri', active: true },
      { id: 'd3', name: 'Product & Technology', code: 'TECH', head_name: 'Dimas Pratama', active: true },
      { id: 'd4', name: 'Sales & Marketing', code: 'GTM', head_name: 'Fajar Nugraha', active: true }
    ],
    categories: [
      { id: 'c1', name: 'Perjalanan Dinas', code: 'TRAVEL', max_amount: 5000000, description: 'Transportasi dan akomodasi kerja', active: true },
      { id: 'c2', name: 'Konsumsi', code: 'MEAL', max_amount: 500000, description: 'Makan dan minum saat bekerja', active: true },
      { id: 'c3', name: 'Perlengkapan Kerja', code: 'SUPPLIES', max_amount: 2000000, description: 'Kebutuhan penunjang pekerjaan', active: true },
      { id: 'c4', name: 'Komunikasi', code: 'COMMS', max_amount: 750000, description: 'Internet dan telepon kerja', active: true }
    ],
    employees: [
      { id: 'e1', name: 'Rani Kusuma', email: 'rani@perusahaan.co.id', department_id: 'd1', role: 'finance', active: true },
      { id: 'e2', name: 'Maya Putri', email: 'maya@perusahaan.co.id', department_id: 'd2', role: 'employee', active: true },
      { id: 'e3', name: 'Dimas Pratama', email: 'dimas@perusahaan.co.id', department_id: 'd3', role: 'employee', active: true },
      { id: 'e4', name: 'Fajar Nugraha', email: 'fajar@perusahaan.co.id', department_id: 'd4', role: 'employee', active: true },
      { id: 'e5', name: 'Nadia Amelia', email: 'nadia@perusahaan.co.id', department_id: 'd3', role: 'employee', active: true }
    ],
    reimbursements: [
      { id: 'r1', employee_id: 'e2', category_id: 'c2', title: 'Konsumsi meeting tim', amount: 285000, expense_date: '2026-10-01', status: 'pending', note: 'Makan siang untuk review sprint', created_at: '2026-10-02T02:00:00Z' },
      { id: 'r2', employee_id: 'e3', category_id: 'c1', title: 'Transportasi ke client', amount: 680000, expense_date: '2026-09-29', status: 'approved', note: 'Perjalanan pertemuan klien', created_at: '2026-10-01T03:30:00Z' },
      { id: 'r3', employee_id: 'e5', category_id: 'c3', title: 'Adaptor dan kabel kerja', amount: 432000, expense_date: '2026-09-27', status: 'pending', note: 'Perlengkapan workstation', created_at: '2026-09-30T04:15:00Z' },
      { id: 'r4', employee_id: 'e4', category_id: 'c4', title: 'Paket data kunjungan', amount: 175000, expense_date: '2026-09-25', status: 'approved', note: 'Paket internet kerja lapangan', created_at: '2026-09-28T02:45:00Z' },
      { id: 'r5', employee_id: 'e2', category_id: 'c1', title: 'Ojek ke kantor cabang', amount: 96000, expense_date: '2026-09-22', status: 'rejected', note: 'Perjalanan koordinasi cabang', rejection_reason: 'Bukti transaksi kurang jelas', created_at: '2026-09-24T01:00:00Z' },
      { id: 'r6', employee_id: 'e3', category_id: 'c2', title: 'Konsumsi workshop', amount: 360000, expense_date: '2026-09-19', status: 'approved', note: 'Konsumsi workshop product', created_at: '2026-09-20T02:30:00Z' }
    ]
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function money(value) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0); }
  function dateLabel(value, options) { if (!value) return '-'; return new Intl.DateTimeFormat('id-ID', options || { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value + (String(value).length === 10 ? 'T00:00:00' : ''))); }
  function initials(name) { return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) { return part[0].toUpperCase(); }).join(''); }
  function nowIso() { return new Date().toISOString(); }
  function readConfig() { try { return JSON.parse(localStorage.getItem(STORAGE.config) || 'null'); } catch (_) { return null; } }
  function saveDemo() { if (state.demo && state.data) localStorage.setItem(STORAGE.demo, JSON.stringify(state.data)); }
  function loadDemo() { try { return Object.assign(clone(demoSeed), JSON.parse(localStorage.getItem(STORAGE.demo) || '{}')); } catch (_) { return clone(demoSeed); } }
  function isFinance() { return state.demo || (state.employee && ['finance', 'admin'].includes(state.employee.role)); }
  function setUser(name, email, role) {
    const shownName = name || email || 'Pengguna';
    document.getElementById('userName').textContent = shownName;
    document.getElementById('userRole').textContent = role === 'admin' ? 'Administrator' : role === 'finance' ? 'Finance manager' : 'Karyawan';
    document.getElementById('userAvatar').textContent = initials(shownName);
    document.getElementById('topAvatar').textContent = initials(shownName);
  }
  function setConnection(connected) {
    state.demo = !connected;
    document.getElementById('connectionLabel').textContent = connected ? 'Supabase terhubung' : 'Mode demo';
    document.querySelector('.connection-dot').classList.toggle('connected', connected);
    document.getElementById('footerConnection').textContent = connected ? 'Database Supabase aktif' : 'Data tersimpan di perangkat ini';
    document.getElementById('logoutButton').hidden = !connected;
  }
  function lookup(table, id) { return (state.data[table] || []).find(function (item) { return item.id === id; }); }
  function relationLabel(table, id) { const item = lookup(table, id); return item ? item.name : 'Data dihapus'; }
  function statusBadge(status) {
    const labelsByStatus = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };
    return '<span class="status-badge status-' + escapeHtml(status) + '">' + (labelsByStatus[status] || escapeHtml(status)) + '</span>';
  }
  function icon(name) {
    const paths = {
      plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.5 4.5"/>', people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.8 19.5v-1.2a5 5 0 0 1 5-5h2.4a5 5 0 0 1 5 5v1.2M16 5a3.5 3.5 0 0 1 0 6.5m2 2a4.5 4.5 0 0 1 3.2 4.3v1.7"/>',
      building: '<path d="M4 20V7.5L12 4l8 3.5V20M2.5 20h19M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M10 20v-3h4v3"/>',
      sliders: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/><circle cx="8" cy="6.5" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="17.5" r="2"/>',
      eye: '<path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>', check: '<path d="m5 12 4 4L19 6"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>',
      edit: '<path d="m14 5 5 5M4 20l4.2-.8L19 8.4 15.6 5 4.8 15.8 4 20Z"/>', trash: '<path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/>', receipt: '<path d="M5 3.5h14v17l-3-2-4 2-4-2-3 2v-17Z"/><path d="M8 8h8m-8 4h8m-8 4h4"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 8h16a2 2 0 0 1 2 2v2h-5a2 2 0 0 0 0 4h5m-5-4v4M7 5V3h11"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || '') + '</svg>';
  }
  function pageHeading(kicker, title, subtitle, button) {
    return '<div class="page-heading"><div><div class="eyebrow">' + escapeHtml(kicker) + '</div><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(subtitle) + '</p></div>' + (button || '') + '</div>';
  }
  function actionButton(action, id, label, iconName, className) {
    return '<button class="row-action" data-action="' + action + '" data-id="' + escapeHtml(id) + '" aria-label="' + escapeHtml(label) + '" title="' + escapeHtml(label) + '">' + icon(iconName) + '</button>';
  }
  function filteredReimbursements() {
    let rows = state.data.reimbursements.slice().sort(function (a, b) { return new Date(b.created_at || b.expense_date) - new Date(a.created_at || a.expense_date); });
    if (!isFinance() && state.employee) rows = rows.filter(function (row) { return row.employee_id === state.employee.id; });
    if (state.filter !== 'all') rows = rows.filter(function (row) { return row.status === state.filter; });
    if (state.search.trim()) {
      const query = state.search.trim().toLowerCase();
      rows = rows.filter(function (row) { const employee = lookup('employees', row.employee_id); const category = lookup('categories', row.category_id); return [row.title, row.note, employee && employee.name, category && category.name, row.id].join(' ').toLowerCase().includes(query); });
    }
    return rows;
  }
  function reimbursementTable(rows, showActions) {
    if (!rows.length) return '<div class="empty-state">Belum ada pengajuan yang cocok. Data baru akan muncul di sini.</div>';
    return '<div class="table-scroll"><table><thead><tr><th>Pengajuan</th><th>Karyawan</th><th>Kategori</th><th>Tanggal</th><th>Nominal</th><th>Status</th>' + (showActions ? '<th>Aksi</th>' : '') + '</tr></thead><tbody>' + rows.map(function (row) {
      const person = lookup('employees', row.employee_id) || { name: 'Karyawan' };
      return '<tr><td><span class="primary-cell">' + escapeHtml(row.title) + '</span><span class="secondary-cell">KK-' + escapeHtml(String(row.id).slice(-5).toUpperCase()) + '</span></td><td><div class="person-cell"><span class="person-initial">' + initials(person.name) + '</span><span><strong>' + escapeHtml(person.name) + '</strong><small>' + escapeHtml(relationLabel('departments', person.department_id)) + '</small></span></div></td><td>' + escapeHtml(relationLabel('categories', row.category_id)) + '</td><td>' + dateLabel(row.expense_date) + '</td><td class="amount-cell">' + money(row.amount) + '</td><td>' + statusBadge(row.status) + '</td>' + (showActions ? '<td><div class="row-actions">' + actionButton('view-reimbursement', row.id, 'Lihat detail', 'eye') + (isFinance() && row.status === 'pending' ? actionButton('approve-reimbursement', row.id, 'Setujui pengajuan', 'check') + actionButton('reject-reimbursement', row.id, 'Tolak pengajuan', 'close') : '') + '</div></td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>';
  }
  function dashboardPage() {
    const rows = state.data.reimbursements;
    const pending = rows.filter(function (row) { return row.status === 'pending'; });
    const approved = rows.filter(function (row) { return row.status === 'approved'; });
    const pendingAmount = pending.reduce(function (total, row) { return total + Number(row.amount); }, 0);
    const approvedAmount = approved.reduce(function (total, row) { return total + Number(row.amount); }, 0);
    const scope = isFinance() || !state.employee ? rows : rows.filter(function (row) { return row.employee_id === state.employee.id; });
    const recent = scope.slice().sort(function (a, b) { return new Date(b.created_at || b.expense_date) - new Date(a.created_at || a.expense_date); }).slice(0, 5);
    const stats = [
      { label: 'Total pengajuan', value: String(scope.length).padStart(2, '0'), foot: '<span class="positive">↗ 12%</span> dibanding bulan lalu', icon: 'receipt', color: '' },
      { label: 'Menunggu persetujuan', value: String(scope.filter(function (row) { return row.status === 'pending'; }).length).padStart(2, '0'), foot: 'Perlu ditinjau', icon: 'clock', color: 'amber' },
      { label: 'Total disetujui', value: money(scope.filter(function (row) { return row.status === 'approved'; }).reduce(function (sum, row) { return sum + Number(row.amount); }, 0)), foot: 'Akumulasi pengajuan disetujui', icon: 'check', color: 'green' },
      { label: 'Dalam proses', value: money(scope.filter(function (row) { return row.status === 'pending'; }).reduce(function (sum, row) { return sum + Number(row.amount); }, 0)), foot: 'Menunggu verifikasi finance', icon: 'wallet', color: 'gray' }
    ];
    const statHtml = stats.map(function (item) { return '<article class="metric-card"><div class="metric-top"><span class="metric-label">' + item.label + '</span><span class="metric-icon ' + item.color + '">' + icon(item.icon) + '</span></div><div class="metric-value">' + item.value + '</div><div class="metric-foot">' + item.foot + '</div></article>'; }).join('');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const chartMonths = Array.from({ length: 8 }, function (_, index) { const date = new Date(now.getFullYear(), now.getMonth() - 7 + index, 1); const monthRows = rows.filter(function (row) { const rowDate = new Date(row.expense_date + 'T00:00:00'); return rowDate.getMonth() === date.getMonth() && rowDate.getFullYear() === date.getFullYear(); }); const total = monthRows.reduce(function (sum, row) { return sum + Number(row.amount); }, 0); const accepted = monthRows.filter(function (row) { return row.status === 'approved'; }).reduce(function (sum, row) { return sum + Number(row.amount); }, 0); return { name: monthNames[date.getMonth()], total: total, accepted: accepted }; });
    const maximum = Math.max.apply(null, chartMonths.map(function (item) { return item.total; }).concat([1000000]));
    const chartBars = chartMonths.map(function (item) { const totalHeight = Math.max(9, Math.round(item.total / maximum * 105)); const acceptedHeight = item.total ? Math.max(6, Math.round(item.accepted / maximum * 105)) : 0; return '<div class="chart-month"><div class="bar-pair"><span class="bar" style="height:' + totalHeight + 'px" title="' + money(item.total) + '"></span><span class="bar approved" style="height:' + acceptedHeight + 'px" title="' + money(item.accepted) + '"></span></div><span>' + item.name + '</span></div>'; }).join('');
    const categoryTotals = state.data.categories.map(function (category) { const categoryRows = rows.filter(function (row) { return row.category_id === category.id; }); return { name: category.name, count: categoryRows.length, amount: categoryRows.reduce(function (sum, row) { return sum + Number(row.amount); }, 0) }; }).filter(function (item) { return item.count; }).sort(function (a, b) { return b.amount - a.amount; }).slice(0, 4);
    const maxCategory = Math.max.apply(null, categoryTotals.map(function (item) { return item.amount; }).concat([1]));
    const categoryRows = categoryTotals.length ? categoryTotals.map(function (item, index) { return '<div class="category-row"><span class="category-mark c' + ((index % 4) + 1) + '"></span><div class="category-info"><strong>' + escapeHtml(item.name) + '</strong><small>' + item.count + ' pengajuan</small><div class="category-track"><span style="width:' + Math.max(8, item.amount / maxCategory * 100) + '%"></span></div></div><span class="category-amount">' + money(item.amount) + '</span></div>'; }).join('') : '<div class="empty-state">Belum ada data kategori.</div>';
    return pageHeading('Ringkasan', 'Selamat datang di KlaimKu', 'Semua klaim perusahaan, sekarang lebih mudah dipantau.', '<button class="button-primary" data-action="new-reimbursement">' + icon('plus') + ' Buat pengajuan</button>') +
      '<section class="metric-grid">' + statHtml + '</section><section class="dashboard-grid"><article class="panel"><div class="panel-header"><div><h2 class="panel-title">Ringkasan reimbursement</h2><p class="panel-subtitle">Pengajuan dan nominal yang disetujui per bulan</p></div><div class="chart-legend"><span><i class="legend-dot"></i>Pengajuan</span><span><i class="legend-dot approved"></i>Disetujui</span></div></div><div class="chart-wrap"><div class="chart"><div class="chart-y"><span>' + money(maximum) + '</span><span>' + money(maximum * .66) + '</span><span>' + money(maximum * .33) + '</span><span>0</span></div><div class="chart-plot">' + chartBars + '</div></div></div></article><article class="panel"><div class="side-summary"><h2 class="panel-title">Kategori teratas</h2><p class="panel-subtitle">Pengeluaran berdasarkan kategori</p>' + categoryRows + '</div></article></section><section class="panel table-panel"><div class="table-toolbar"><div><h2 class="panel-title">Pengajuan terbaru</h2></div><div class="table-actions"><button class="button-quiet" data-view="reimbursements">Lihat semua <span aria-hidden="true">→</span></button></div></div>' + reimbursementTable(recent, isFinance()) + '<div class="table-bottom"><span>Ringkasan aktivitas terbaru</span><span>Total menunggu: <strong>' + money(pendingAmount) + '</strong> <span aria-hidden="true">·</span> Disetujui: <strong>' + money(approvedAmount) + '</strong></span></div></section>';
  }
  function reimbursementsPage() {
    const rows = filteredReimbursements();
    const filterOptions = [['all', 'Semua status'], ['pending', 'Menunggu'], ['approved', 'Disetujui'], ['rejected', 'Ditolak']].map(function (item) { return '<option value="' + item[0] + '" ' + (state.filter === item[0] ? 'selected' : '') + '>' + item[1] + '</option>'; }).join('');
    return pageHeading('Pengelolaan', 'Reimbursement', 'Pantau dan kelola pengajuan penggantian biaya.', '<button class="button-primary" data-action="new-reimbursement">' + icon('plus') + ' Buat pengajuan</button>') + '<section class="panel table-panel"><div class="table-toolbar"><h2 class="panel-title">Daftar pengajuan <span class="secondary-cell" style="display:inline;margin-left:5px">(' + rows.length + ')</span></h2><div class="table-actions"><label class="search-box">' + icon('search') + '<input id="tableSearch" type="search" placeholder="Cari pengajuan..." value="' + escapeHtml(state.search) + '"></label><select class="filter-select" id="statusFilter" aria-label="Filter status">' + filterOptions + '</select></div></div>' + reimbursementTable(rows, true) + '<div class="table-bottom"><span>Menampilkan ' + rows.length + ' pengajuan</span><span>Data diperbarui otomatis</span></div></section>';
  }
  function masterCell(table, row, field) {
    if (field === 'department_id') return '<span class="primary-cell">' + escapeHtml(relationLabel('departments', row.department_id)) + '</span>';
    if (field === 'max_amount') return '<span class="amount-cell">' + money(row.max_amount) + '</span>';
    if (field === 'employee_count') return '<span class="primary-cell">' + state.data.employees.filter(function (person) { return person.department_id === row.id; }).length + ' orang</span>';
    if (field === 'active') return row.active ? '<span class="status-badge status-approved">Aktif</span>' : '<span class="status-badge status-rejected">Nonaktif</span>';
    if (field === 'name' && table === 'employees') return '<div class="person-cell"><span class="person-initial">' + initials(row.name) + '</span><span><strong>' + escapeHtml(row.name) + '</strong><small>' + escapeHtml(row.email) + '</small></span></div>';
    if (field === 'role') return '<span class="primary-cell">' + (row.role === 'admin' ? 'Administrator' : row.role === 'finance' ? 'Finance' : 'Karyawan') + '</span>';
    if (field === 'head_name' && !row.head_name) return '<span class="secondary-cell">Belum ditentukan</span>';
    return '<span class="primary-cell">' + escapeHtml(row[field] || '-') + '</span>';
  }
  function masterPage(table) {
    const meta = masterInfo[table];
    let rows = state.data[table].slice();
    if (state.search.trim()) { const query = state.search.trim().toLowerCase(); rows = rows.filter(function (row) { return JSON.stringify(row).toLowerCase().includes(query); }); }
    const columns = meta.fields.map(function (field, index) { return '<th>' + meta.columns[index] + '</th>'; }).join('');
    const body = rows.length ? rows.map(function (row) { return '<tr>' + meta.fields.map(function (field) { return '<td>' + masterCell(table, row, field) + '</td>'; }).join('') + '<td><div class="row-actions">' + actionButton('edit-master', table + ':' + row.id, 'Ubah ' + meta.singular, 'edit') + (isFinance() ? actionButton('delete-master', table + ':' + row.id, 'Hapus ' + meta.singular, 'trash') : '') + '</div></td></tr>'; }).join('') : '<tr><td colspan="' + (meta.fields.length + 1) + '"><div class="empty-state">Belum ada ' + meta.singular + ' yang cocok.</div></td></tr>';
    const button = isFinance() ? '<button class="button-primary" data-action="new-master" data-table="' + table + '">' + icon('plus') + ' Tambah ' + meta.singular + '</button>' : '';
    return pageHeading('Data master', meta.title, meta.subtitle, button) + '<div class="master-intro"><span class="master-intro-icon">' + icon(meta.icon) + '</span><p>Data ' + escapeHtml(meta.singular) + ' digunakan pada proses pengajuan agar pencatatan reimbursement tetap konsisten.</p></div><div class="master-stats"><strong>' + state.data[table].length + '</strong> ' + meta.singular + '<span class="stat-divider"></span><span>' + state.data[table].filter(function (row) { return row.active !== false; }).length + ' aktif</span></div><section class="panel table-panel"><div class="table-toolbar"><h2 class="panel-title">Daftar ' + meta.singular + '</h2><div class="table-actions"><label class="search-box">' + icon('search') + '<input id="tableSearch" type="search" placeholder="Cari ' + meta.singular + '..." value="' + escapeHtml(state.search) + '"></label></div></div><div class="table-scroll"><table><thead><tr>' + columns + '<th>Aksi</th></tr></thead><tbody>' + body + '</tbody></table></div><div class="table-bottom"><span>' + rows.length + ' data ditampilkan</span><span>KlaimKu Data Master</span></div></section>';
  }
  function render() {
    if (!state.data) return;
    document.querySelectorAll('.nav-link[data-view]').forEach(function (item) { item.classList.toggle('active', item.dataset.view === state.view); });
    document.getElementById('breadcrumbCurrent').textContent = labels[state.view] || 'Dashboard';
    const waiting = state.data.reimbursements.filter(function (row) { return row.status === 'pending'; }).length;
    document.getElementById('pendingCount').textContent = waiting;
    if (state.view === 'dashboard') pageContent.innerHTML = dashboardPage();
    else if (state.view === 'reimbursements') pageContent.innerHTML = reimbursementsPage();
    else pageContent.innerHTML = masterPage(state.view);
    document.getElementById('sidebar').classList.remove('open');
    document.querySelector('.mobile-scrim').classList.remove('visible');
  }
  function toast(message, isError) {
    const node = document.createElement('div'); node.className = 'toast' + (isError ? ' error' : ''); node.innerHTML = '<span class="toast-mark">' + (isError ? '!' : '✓') + '</span><span>' + escapeHtml(message) + '</span>';
    document.getElementById('toastRegion').appendChild(node); window.setTimeout(function () { node.remove(); }, 3200);
  }
  function openModal(content) { modal.innerHTML = content; modalBackdrop.hidden = false; const first = modal.querySelector('input, select, textarea, button'); if (first) first.focus(); }
  function closeModal() { modalBackdrop.hidden = true; modal.innerHTML = ''; }
  function modalHeader(title, subtitle) { return '<header class="modal-header"><div><h2 id="modalTitle">' + escapeHtml(title) + '</h2><p>' + escapeHtml(subtitle) + '</p></div><button type="button" class="modal-close" data-action="close-modal" aria-label="Tutup">×</button></header>'; }
  function optionList(items, selected, emptyLabel) { return '<option value="">' + (emptyLabel || 'Pilih...') + '</option>' + items.filter(function (item) { return item.active !== false; }).map(function (item) { return '<option value="' + escapeHtml(item.id) + '" ' + (item.id === selected ? 'selected' : '') + '>' + escapeHtml(item.name) + '</option>'; }).join(''); }
  function field(label, name, input, full, hint) { return '<div class="field' + (full ? ' full' : '') + '"><label for="field-' + name + '">' + label + '</label>' + input.replace('FIELD_ID', 'field-' + name) + (hint ? '<span class="field-hint">' + hint + '</span>' : '') + '</div>'; }
  function formFooter(primary) { return '<div class="modal-actions"><button type="button" class="button-secondary" data-action="close-modal">Batal</button><button type="submit" class="button-primary">' + primary + '</button></div>'; }
  function openReimbursementForm() {
    const employees = isFinance() ? state.data.employees : state.data.employees.filter(function (item) { return state.employee && item.id === state.employee.id; });
    const personField = isFinance() ? field('Karyawan', 'employee_id', '<select id="FIELD_ID" name="employee_id" required>' + optionList(employees, state.employee && state.employee.id, 'Pilih karyawan') + '</select>') : '';
    const content = modalHeader('Buat pengajuan reimbursement', 'Lengkapi informasi biaya yang ingin diganti.') + '<form class="modal-form" id="reimbursementForm"><div class="form-grid">' + personField + field('Kategori', 'category_id', '<select id="FIELD_ID" name="category_id" required>' + optionList(state.data.categories, '', 'Pilih kategori') + '</select>') + field('Nama pengeluaran', 'title', '<input id="FIELD_ID" name="title" maxlength="120" placeholder="Contoh: Transportasi ke klien" required>', true) + field('Nominal (Rp)', 'amount', '<input id="FIELD_ID" name="amount" type="number" min="1" step="1" placeholder="0" required>') + field('Tanggal transaksi', 'expense_date', '<input id="FIELD_ID" name="expense_date" type="date" max="' + new Date().toISOString().slice(0, 10) + '" value="' + new Date().toISOString().slice(0, 10) + '" required>') + field('Catatan', 'note', '<textarea id="FIELD_ID" name="note" maxlength="500" placeholder="Tambahkan konteks transaksi..."></textarea>', true) + '<div id="formError" class="auth-error"></div></div>' + formFooter('Kirim pengajuan') + '</form>';
    openModal(content);
    document.getElementById('reimbursementForm').addEventListener('submit', submitReimbursement);
  }
  function openMasterForm(table, id) {
    if (!isFinance()) { toast('Hanya tim finance yang dapat mengubah data master.', true); return; }
    const meta = masterInfo[table]; const current = id ? lookup(table, id) : null; const heading = current ? 'Ubah ' + meta.singular : 'Tambah ' + meta.singular;
    let fields = '';
    if (table === 'employees') {
      fields = field('Nama lengkap', 'name', '<input id="FIELD_ID" name="name" maxlength="100" value="' + escapeHtml(current && current.name) + '" required>') + field('Email kerja', 'email', '<input id="FIELD_ID" name="email" type="email" maxlength="255" value="' + escapeHtml(current && current.email) + '" required>') + field('Departemen', 'department_id', '<select id="FIELD_ID" name="department_id" required>' + optionList(state.data.departments, current && current.department_id, 'Pilih departemen') + '</select>') + field('Peran', 'role', '<select id="FIELD_ID" name="role"><option value="employee" ' + (!current || current.role === 'employee' ? 'selected' : '') + '>Karyawan</option><option value="finance" ' + (current && current.role === 'finance' ? 'selected' : '') + '>Finance</option><option value="admin" ' + (current && current.role === 'admin' ? 'selected' : '') + '>Administrator</option></select>') + field('Status akun', 'active', '<select id="FIELD_ID" name="active"><option value="true" ' + (!current || current.active !== false ? 'selected' : '') + '>Aktif</option><option value="false" ' + (current && current.active === false ? 'selected' : '') + '>Nonaktif</option></select>');
    } else if (table === 'departments') {
      fields = field('Nama departemen', 'name', '<input id="FIELD_ID" name="name" maxlength="100" value="' + escapeHtml(current && current.name) + '" required>') + field('Kode departemen', 'code', '<input id="FIELD_ID" name="code" maxlength="20" value="' + escapeHtml(current && current.code) + '" required>') + field('Kepala departemen', 'head_name', '<input id="FIELD_ID" name="head_name" maxlength="100" value="' + escapeHtml(current && current.head_name) + '">') + field('Status', 'active', '<select id="FIELD_ID" name="active"><option value="true" ' + (!current || current.active !== false ? 'selected' : '') + '>Aktif</option><option value="false" ' + (current && current.active === false ? 'selected' : '') + '>Nonaktif</option></select>');
    } else {
      fields = field('Nama kategori', 'name', '<input id="FIELD_ID" name="name" maxlength="100" value="' + escapeHtml(current && current.name) + '" required>') + field('Kode kategori', 'code', '<input id="FIELD_ID" name="code" maxlength="20" value="' + escapeHtml(current && current.code) + '" required>') + field('Batas klaim (Rp)', 'max_amount', '<input id="FIELD_ID" name="max_amount" type="number" min="1" step="1" value="' + escapeHtml(current && current.max_amount) + '" required>') + field('Status', 'active', '<select id="FIELD_ID" name="active"><option value="true" ' + (!current || current.active !== false ? 'selected' : '') + '>Aktif</option><option value="false" ' + (current && current.active === false ? 'selected' : '') + '>Nonaktif</option></select>') + field('Keterangan', 'description', '<textarea id="FIELD_ID" name="description" maxlength="300" placeholder="Deskripsi singkat">' + escapeHtml(current && current.description) + '</textarea>', true);
    }
    openModal(modalHeader(heading, 'Data master akan langsung digunakan dalam pengajuan.') + '<form class="modal-form" id="masterForm" data-table="' + table + '" data-id="' + escapeHtml(id || '') + '"><div class="form-grid">' + fields + '<div id="formError" class="auth-error"></div></div>' + formFooter(current ? 'Simpan perubahan' : 'Simpan data') + '</form>');
    document.getElementById('masterForm').addEventListener('submit', submitMaster);
  }
  function openReimbursementDetail(id) {
    const row = lookup('reimbursements', id); if (!row) return;
    const person = lookup('employees', row.employee_id) || { name: 'Karyawan' };
    const reason = row.rejection_reason ? '<div class="field full"><label>Alasan penolakan</label><span class="field-hint">' + escapeHtml(row.rejection_reason) + '</span></div>' : '';
    openModal(modalHeader('Detail pengajuan', 'KK-' + String(row.id).slice(-5).toUpperCase()) + '<div class="modal-form"><div class="form-grid">' + field('Karyawan', 'detail-person', '<span class="primary-cell">' + escapeHtml(person.name) + '</span>') + field('Kategori', 'detail-category', '<span class="primary-cell">' + escapeHtml(relationLabel('categories', row.category_id)) + '</span>') + field('Pengeluaran', 'detail-title', '<span class="primary-cell">' + escapeHtml(row.title) + '</span>') + field('Nominal', 'detail-amount', '<span class="amount-cell">' + money(row.amount) + '</span>') + field('Tanggal transaksi', 'detail-date', '<span class="primary-cell">' + dateLabel(row.expense_date) + '</span>') + field('Status', 'detail-status', statusBadge(row.status)) + field('Catatan', 'detail-note', '<span class="field-hint">' + escapeHtml(row.note || 'Tidak ada catatan.') + '</span>', true) + reason + '<div class="field full"><div class="modal-actions"><button type="button" class="button-secondary" data-action="close-modal">Tutup</button>' + (isFinance() && row.status === 'pending' ? '<button type="button" class="button-danger" data-action="reject-reimbursement" data-id="' + escapeHtml(row.id) + '">Tolak</button><button type="button" class="button-primary" data-action="approve-reimbursement" data-id="' + escapeHtml(row.id) + '">Setujui</button>' : '') + '</div></div></div></div>');
  }
  function showFormError(message) { const el = document.getElementById('formError'); if (el) { el.textContent = message; el.classList.add('visible'); } else toast(message, true); }
  async function submitReimbursement(event) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); const category = lookup('categories', values.get('category_id'));
    const employeeId = isFinance() ? values.get('employee_id') : state.employee && state.employee.id;
    const payload = { employee_id: employeeId, category_id: values.get('category_id'), title: String(values.get('title')).trim(), amount: Number(values.get('amount')), expense_date: values.get('expense_date'), note: String(values.get('note') || '').trim(), status: 'pending' };
    if (!payload.employee_id) return showFormError('Akun Anda belum terhubung dengan data karyawan. Hubungi administrator.');
    if (category && Number(category.max_amount) && payload.amount > Number(category.max_amount)) return showFormError('Nominal melewati batas kategori sebesar ' + money(category.max_amount) + '.');
    if (state.demo) { payload.id = 'r' + Date.now(); payload.created_at = nowIso(); state.data.reimbursements.unshift(payload); saveDemo(); render(); closeModal(); toast('Pengajuan berhasil dibuat.'); return; }
    try { await api('reimbursements', { method: 'POST', body: payload, prefer: 'return=representation' }); await refreshData(); closeModal(); toast('Pengajuan berhasil dibuat.'); }
    catch (error) { showFormError(error.message); }
  }
  function formRecord(form) {
    const values = new FormData(form); const result = {};
    values.forEach(function (value, key) { result[key] = value; });
    if ('active' in result) result.active = result.active === 'true';
    if ('max_amount' in result) result.max_amount = Number(result.max_amount);
    if ('department_id' in result && !result.department_id) result.department_id = null;
    return result;
  }
  async function submitMaster(event) {
    event.preventDefault(); const form = event.currentTarget; const table = form.dataset.table; const id = form.dataset.id; const record = formRecord(form);
    if (state.demo) {
      if (id) Object.assign(lookup(table, id), record);
      else { record.id = table.slice(0, 1) + Date.now(); state.data[table].push(record); }
      saveDemo(); render(); closeModal(); toast('Data ' + masterInfo[table].singular + ' berhasil disimpan.'); return;
    }
    try {
      const path = table + (id ? '?id=eq.' + encodeURIComponent(id) : '');
      await api(path, { method: id ? 'PATCH' : 'POST', body: record, prefer: 'return=representation' });
      await refreshData(); closeModal(); toast('Data ' + masterInfo[table].singular + ' berhasil disimpan.');
    } catch (error) { showFormError(error.message); }
  }
  async function removeMaster(table, id) {
    const row = lookup(table, id); if (!row) return;
    if (table === 'employees' && state.data.reimbursements.some(function (item) { return item.employee_id === id; })) return toast('Karyawan masih memiliki riwayat reimbursement.', true);
    if (table === 'departments' && state.data.employees.some(function (employee) { return employee.department_id === id; })) return toast('Departemen masih digunakan karyawan.', true);
    if (table === 'categories' && state.data.reimbursements.some(function (item) { return item.category_id === id; })) return toast('Kategori masih digunakan pengajuan.', true);
    if (!window.confirm('Hapus ' + masterInfo[table].singular + ' "' + row.name + '"?')) return;
    try {
      if (state.demo) { state.data[table] = state.data[table].filter(function (item) { return item.id !== id; }); saveDemo(); }
      else { await api(table + '?id=eq.' + encodeURIComponent(id), { method: 'DELETE' }); await refreshData(); }
      render(); toast('Data berhasil dihapus.');
    } catch (error) { toast(error.message, true); }
  }
  async function changeReimbursementStatus(id, status, reason) {
    if (!isFinance()) return toast('Aksi ini hanya tersedia untuk tim finance.', true);
    const row = lookup('reimbursements', id); if (!row || row.status !== 'pending') return;
    try {
      if (state.demo) { row.status = status; if (reason) row.rejection_reason = reason; row.reviewed_at = nowIso(); saveDemo(); }
      else { await api('reimbursements?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: { status: status, rejection_reason: reason || null, reviewed_at: nowIso() }, prefer: 'return=representation' }); await refreshData(); }
      closeModal(); render(); toast(status === 'approved' ? 'Pengajuan disetujui.' : 'Pengajuan ditolak.');
    } catch (error) { toast(error.message, true); }
  }
  async function rejectReimbursement(id) {
    const reason = window.prompt('Masukkan alasan penolakan:'); if (reason === null) return;
    if (!reason.trim()) return toast('Alasan penolakan perlu diisi.', true);
    await changeReimbursementStatus(id, 'rejected', reason.trim());
  }

  function authSession() { try { return JSON.parse(localStorage.getItem('klaimku.session') || 'null'); } catch (_) { return null; } }
  function saveSession(session) {
    if (session) {
      if (!session.expires_at && session.expires_in) session.expires_at = Math.floor(Date.now() / 1000) + session.expires_in;
      localStorage.setItem('klaimku.session', JSON.stringify(session));
    } else localStorage.removeItem('klaimku.session');
  }
  async function api(path, options) {
    const config = readConfig(); if (!config || !config.url || !config.key) throw new Error('Lengkapi URL project dan publishable key Supabase terlebih dahulu.');
    const session = authSession(); const headers = { apikey: config.key, Authorization: 'Bearer ' + (session && session.access_token ? session.access_token : config.key), 'Content-Type': 'application/json' };
    if (options && options.prefer) headers.Prefer = options.prefer;
    if (options && options.headers) Object.assign(headers, options.headers);
    const response = await fetch(config.url.replace(/\/$/, '') + '/rest/v1/' + path, { method: options && options.method || 'GET', headers: headers, body: options && options.body !== undefined ? JSON.stringify(options.body) : undefined });
    const text = await response.text(); let payload = null; try { payload = text ? JSON.parse(text) : null; } catch (_) { payload = text; }
    if (!response.ok) throw new Error(payload && (payload.message || payload.msg || payload.hint) || 'Supabase mengembalikan HTTP ' + response.status + '.');
    return payload;
  }
  async function authRequest(action, values) {
    const config = readConfig(); if (!config) throw new Error('Simpan konfigurasi Supabase terlebih dahulu.');
    const response = await fetch(config.url.replace(/\/$/, '') + '/auth/v1/' + action, { method: 'POST', headers: { apikey: config.key, 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(result.msg || result.message || (result.error_description || result.error) || 'Autentikasi gagal.');
    if (result.access_token) saveSession(result); return result;
  }
  async function fetchTable(table) { return await api(table + '?select=*&order=created_at.desc.nullslast').catch(async function (error) { if (table === 'departments' || table === 'categories') return api(table + '?select=*&order=name.asc'); throw error; }); }
  async function refreshData() {
    const results = await Promise.all(['departments', 'categories', 'employees', 'reimbursements'].map(fetchTable));
    state.data = { departments: results[0] || [], categories: results[1] || [], employees: results[2] || [], reimbursements: results[3] || [] };
    if (state.user) state.employee = state.data.employees.find(function (employee) { return employee.auth_user_id === state.user.id; }) || null;
    if (state.employee) setUser(state.employee.name, state.user.email, state.employee.role); else if (state.user) setUser(state.user.email, state.user.email, 'employee');
    render();
  }
  function configurationModal() {
    const config = readConfig() || {};
    openModal(modalHeader('Hubungkan Supabase', 'Kredensial publishable tetap di browser. Jangan pernah masukkan service_role key.') + '<form class="modal-form" id="configForm"><div class="form-grid"><div class="field full"><label for="supabaseUrl">Project URL</label><input id="supabaseUrl" name="url" type="url" value="' + escapeHtml(config.url || '') + '" placeholder="https://project-id.supabase.co" required></div><div class="field full"><label for="supabaseKey">Publishable key</label><input id="supabaseKey" name="key" type="password" value="' + escapeHtml(config.key || '') + '" placeholder="sb_publishable_... atau anon key" required autocomplete="off"><span class="field-hint">Gunakan publishable key (atau legacy anon key), bukan secret/service_role key. Akses database tetap dijaga oleh RLS.</span></div><div class="field full"><span class="field-hint">Pastikan URL frontend diizinkan pada pengaturan Authentication &gt; URL Configuration Supabase.</span></div><div id="formError" class="auth-error"></div></div><div class="modal-actions"><button type="button" class="button-secondary" data-action="close-modal">Batal</button>' + (config.url ? '<button type="button" class="button-danger" data-action="disconnect-supabase">Hapus konfigurasi</button>' : '') + '<button type="submit" class="button-primary">Simpan &amp; hubungkan</button></div></form>');
    document.getElementById('configForm').addEventListener('submit', async function (event) {
      event.preventDefault(); const form = new FormData(event.currentTarget); const url = String(form.get('url')).trim().replace(/\/$/, ''); const key = String(form.get('key')).trim();
      try {
        const parsed = new URL(url); if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') throw new Error('Gunakan URL project HTTPS Supabase yang valid.');
        localStorage.setItem(STORAGE.config, JSON.stringify({ url: url, key: key }));
        const previousSession = authSession(); saveSession(null);
        try { await api('departments?select=id&limit=1'); } catch (error) { if (/JWT|token|auth|permission|row-level security/i.test(error.message) || previousSession) saveSession(previousSession); else throw error; }
        closeModal();
        if (authSession()) await restoreSupabase(); else { setConnection(true); showAuth(); }
      } catch (error) { showFormError(error.message); }
    });
  }
  function showAuth(errorText) {
    state.demo = false; pageContent.innerHTML = '<section class="auth-screen"><div class="auth-card"><div class="auth-brand"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><rect x="5" y="10" width="30" height="20" rx="4" fill="currentColor"/><path d="M9 15c3 0 5-1 6-3h10c1 2 3 3 6 3v10c-3 0-5 1-6 3H15c-1-2-3-3-6-3V15Z" fill="#fff"/><circle cx="20" cy="20" r="4" fill="#8B78D4"/></svg></span><strong>KlaimKu</strong></div><div class="auth-body"><div class="eyebrow">Akses workspace</div><h1 id="authTitle">Masuk ke KlaimKu</h1><p id="authSubtitle">Gunakan akun perusahaan untuk melihat dan mengelola reimbursement.</p><form class="modal-form" id="authForm"><div class="field" id="authNameField" hidden><label for="authName">Nama lengkap</label><input id="authName" name="name" autocomplete="name" placeholder="Nama Anda"></div><div class="field"><label for="authEmail">Email kerja</label><input id="authEmail" name="email" type="email" autocomplete="email" placeholder="nama@perusahaan.co.id" required></div><div class="field"><label for="authPassword">Kata sandi</label><input id="authPassword" name="password" type="password" autocomplete="current-password" minlength="6" placeholder="Minimal 6 karakter" required></div><div id="authError" class="auth-error ' + (errorText ? 'visible' : '') + '">' + escapeHtml(errorText || '') + '</div><button class="button-primary" type="submit" id="authSubmit" style="width:100%;min-height:39px">Masuk</button></form><div class="auth-foot"><span id="authSwitchText">Belum memiliki akun?</span><button type="button" id="authSwitch">Buat akun</button></div></div></div></section>';
    let signup = false;
    document.getElementById('authSwitch').addEventListener('click', function () {
      signup = !signup;
      document.getElementById('authNameField').hidden = !signup;
      document.getElementById('authName').required = signup;
      document.getElementById('authTitle').textContent = signup ? 'Buat akun KlaimKu' : 'Masuk ke KlaimKu';
      document.getElementById('authSubtitle').textContent = signup ? 'Daftar dengan email perusahaan untuk mulai mengajukan reimbursement.' : 'Gunakan akun perusahaan untuk melihat dan mengelola reimbursement.';
      document.getElementById('authSubmit').textContent = signup ? 'Buat akun' : 'Masuk';
      document.getElementById('authSwitchText').textContent = signup ? 'Sudah memiliki akun?' : 'Belum memiliki akun?';
      document.getElementById('authSwitch').textContent = signup ? 'Masuk' : 'Buat akun';
      document.getElementById('authPassword').autocomplete = signup ? 'new-password' : 'current-password';
    });
    document.getElementById('authForm').addEventListener('submit', async function (event) {
      event.preventDefault(); const data = new FormData(event.currentTarget); const errorEl = document.getElementById('authError'); errorEl.classList.remove('visible');
      try {
        const credentials = { email: data.get('email'), password: data.get('password') };
        if (signup) credentials.data = { full_name: String(data.get('name') || '').trim() };
        const result = await authRequest(signup ? 'signup' : 'token?grant_type=password', credentials);
        if (!result.access_token) { errorEl.textContent = 'Akun dibuat. Cek email untuk konfirmasi, lalu masuk.'; errorEl.classList.add('visible'); return; }
        await restoreSupabase();
      } catch (error) { errorEl.textContent = error.message; errorEl.classList.add('visible'); }
    });
  }
  async function restoreSupabase() {
    const session = authSession(); const config = readConfig();
    if (!config || !session || !session.access_token) { showAuth(); return; }
    if (session.expires_at && session.expires_at * 1000 < Date.now() && session.refresh_token) {
      try { const renewed = await authRequest('token?grant_type=refresh_token', { refresh_token: session.refresh_token }); saveSession(renewed); } catch (_) { saveSession(null); showAuth(); return; }
    }
    try {
      const currentSession = authSession(); const response = await fetch(config.url.replace(/\/$/, '') + '/auth/v1/user', { headers: { apikey: config.key, Authorization: 'Bearer ' + currentSession.access_token } });
      if (!response.ok) throw new Error('Sesi login sudah berakhir. Silakan masuk kembali.');
      state.user = await response.json(); setConnection(true); await refreshData();
      if (!state.employee) showOnboarding();
    } catch (error) { saveSession(null); state.user = null; showAuth(error.message); }
  }
  function showOnboarding() {
    const content = [
      modalHeader('Lengkapi profil karyawan', 'Akun berhasil dibuat. Hubungkan akun dengan data perusahaan Anda.'),
      '<form class="modal-form" id="onboardingForm"><div class="form-grid">',
      field('Nama lengkap', 'name', '<input id="FIELD_ID" name="name" maxlength="100" value="' + escapeHtml(state.user && state.user.user_metadata && state.user.user_metadata.full_name) + '" required>', true),
      field('Departemen', 'department_id', '<select id="FIELD_ID" name="department_id" required>' + optionList(state.data.departments, '', 'Pilih departemen') + '</select>', true),
      '<div class="field full"><span class="field-hint">Tim admin/finance dapat mengubah peran akun melalui Master Karyawan.</span></div></div><div class="modal-actions"><button type="submit" class="button-primary">Simpan profil</button></div></form>'
    ].join('');
    openModal(content);
    document.getElementById('onboardingForm').addEventListener('submit', async function (event) {
      event.preventDefault(); const values = new FormData(event.currentTarget);
      try { await api('rpc/link_employee_profile', { method: 'POST', body: { p_name: String(values.get('name')).trim(), p_department_id: values.get('department_id') } }); closeModal(); await refreshData(); toast('Profil karyawan berhasil dibuat.'); }
      catch (error) { showFormError(error.message); }
    });
  }

  pageContent.addEventListener('click', async function (event) {
    const viewTarget = event.target.closest('[data-view]'); if (viewTarget) { state.view = viewTarget.dataset.view; state.search = ''; state.filter = 'all'; render(); return; }
    const button = event.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action; const id = button.dataset.id;
    if (action === 'new-reimbursement') openReimbursementForm();
    else if (action === 'new-master') openMasterForm(button.dataset.table);
    else if (action === 'edit-master') { const parts = id.split(':'); openMasterForm(parts[0], parts.slice(1).join(':')); }
    else if (action === 'delete-master') { const parts = id.split(':'); await removeMaster(parts[0], parts.slice(1).join(':')); }
    else if (action === 'view-reimbursement') openReimbursementDetail(id);
    else if (action === 'approve-reimbursement') await changeReimbursementStatus(id, 'approved');
    else if (action === 'reject-reimbursement') await rejectReimbursement(id);
    else if (action === 'close-modal') closeModal();
    else if (action === 'disconnect-supabase') { localStorage.removeItem(STORAGE.config); saveSession(null); closeModal(); setConnection(false); state.user = null; state.employee = null; state.data = loadDemo(); render(); toast('Konfigurasi Supabase dihapus.'); }
  });
  document.querySelector('.side-nav').addEventListener('click', function (event) {
    const target = event.target.closest('[data-view]');
    if (!target) return;
    state.view = target.dataset.view;
    state.search = '';
    state.filter = 'all';
    render();
  });
  pageContent.addEventListener('input', function (event) { if (event.target.id === 'tableSearch') { state.search = event.target.value; const start = event.target.selectionStart; render(); const input = document.getElementById('tableSearch'); input.focus(); input.setSelectionRange(start, start); } });
  pageContent.addEventListener('change', function (event) { if (event.target.id === 'statusFilter') { state.filter = event.target.value; render(); } });
  modal.addEventListener('click', async function (event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'close-modal') closeModal();
    else if (button.dataset.action === 'disconnect-supabase') {
      localStorage.removeItem(STORAGE.config);
      saveSession(null);
      closeModal();
      setConnection(false);
      state.user = null;
      state.employee = null;
      state.data = loadDemo();
      render();
      toast('Konfigurasi Supabase dihapus.');
    } else if (button.dataset.action === 'approve-reimbursement') await changeReimbursementStatus(button.dataset.id, 'approved');
    else if (button.dataset.action === 'reject-reimbursement') await rejectReimbursement(button.dataset.id);
  });
  document.getElementById('connectionButton').addEventListener('click', configurationModal);
  document.getElementById('notificationButton').addEventListener('click', function () { state.view = 'reimbursements'; state.filter = 'pending'; state.search = ''; render(); });
  document.getElementById('logoutButton').addEventListener('click', async function () { try { const config = readConfig(); const session = authSession(); if (config && session) await fetch(config.url.replace(/\/$/, '') + '/auth/v1/logout', { method: 'POST', headers: { apikey: config.key, Authorization: 'Bearer ' + session.access_token } }); } catch (_) { /* local logout still clears the session */ } saveSession(null); state.user = null; state.employee = null; setConnection(true); showAuth(); });
  document.getElementById('mobileMenu').addEventListener('click', function () { document.getElementById('sidebar').classList.add('open'); document.querySelector('.mobile-scrim').classList.add('visible'); });
  document.body.insertAdjacentHTML('beforeend', '<div class="mobile-scrim" aria-hidden="true"></div>');
  document.querySelector('.mobile-scrim').addEventListener('click', function () { document.getElementById('sidebar').classList.remove('open'); this.classList.remove('visible'); });
  modalBackdrop.addEventListener('click', function (event) { if (event.target === modalBackdrop) closeModal(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !modalBackdrop.hidden) closeModal(); });
  document.getElementById('todayLabel').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const savedConfig = readConfig();
  if (savedConfig) {
    setConnection(true);
    if (authSession()) restoreSupabase();
    else showAuth();
  } else {
    setConnection(false);
    state.data = loadDemo();
    setUser('Rani Kusuma', 'rani@perusahaan.co.id', 'finance');
    render();
  }
}());