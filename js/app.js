'use strict';
function handleError(e) {
  if (e && e.code === 'auth') { showScreen('login'); loginError(e.message); return; }
  toast((e && e.message) || 'Có lỗi xảy ra.', 'error');
}

async function enterApp() {
  paintUser();
  showScreen('app');
  await Promise.all([List.load(), List.loadFilters(), Catalog.loadAllActive()]);
  View.booting = true;
  try { if (List.items.length) await Form.open(List.items[0].id); else Form.startNew(); } finally { View.booting = false; }
  View.set('list', true);   // điện thoại: mở app ở màn danh sách
}

async function onLogin(ev) {
  ev.preventDefault();
  const company = $('login-company').value.trim().toLowerCase();
  const user = $('user').value.trim();
  const pass = $('pass').value;
  if (!company || !user || !pass) { loginError('Nhập mã công ty, tên đăng nhập và mật khẩu.'); return; }
  loginError('');
  const btn = $('login-btn'); btn.disabled = true;
  try {
    await Auth.login(company, user, pass);
    $('pass').value = '';
    await enterApp();
  } catch (e) { loginError(e.message); } finally { btn.disabled = false; }
}

function logout() {
  if (Form.dirty && !confirm('Bạn có thay đổi chưa lưu. Vẫn đăng xuất?')) return;
  Auth.clear(); Form.dirty = false;
  showScreen('login');
}

async function start() {
  $('login-form').addEventListener('submit', onLogin);
  $('btn-logout').addEventListener('click', logout);
  Quick.init();
  Combo.attach($('master-customer'), 'customers');
  Combo.attach($('master-product'), 'products');
  $('btn-new').addEventListener('click', () => Form.startNew());
  $('btn-save').addEventListener('click', () => Form.save());
  $('btn-cancel').addEventListener('click', () => Form.cancel());
  $('btn-back').addEventListener('click', () => Form.back());
  $('btn-filter').addEventListener('click', () => List.toggleFilters());
  window.addEventListener('popstate', () => View.onPop());
  $('btn-add-row').addEventListener('click', () => Form.addRow());
  ['filter-lsx', 'filter-customer', 'filter-stage', 'filter-date-from', 'filter-date-to']
    .forEach(id => $(id).addEventListener(id === 'filter-lsx' ? 'input' : 'change', () => { List.markFilters(); List.debounce(); }));
  $('master-status').replaceChildren(...Object.entries(STATUS_ORDER).map(([k, v]) => h('option', { value: k, text: v })));
  ['master-customer', 'master-product', 'master-qty', 'master-start', 'master-due', 'master-status', 'master-note']
    .forEach(id => $(id).addEventListener('input', () => { Form.dirty = true; if (Form.data !== undefined) Form.header({ lsx_code: Form.data ? Form.data.lsx_code : '' }); }));
  // Nạp lại danh mục gợi ý khi quay lại trang (nút Back, đổi tab trình duyệt)
  const refreshCatalog = () => { if (Auth.hasSession() && $('main-app').dataset.show === '1') Catalog.loadAllActive().catch(() => {}); };
  window.addEventListener('pageshow', e => { if (e.persisted) refreshCatalog(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshCatalog(); });
  window.addEventListener('beforeunload', e => { if (Form.dirty) { e.preventDefault(); e.returnValue = ''; } });

  if (Auth.hasSession()) {
    try { await Auth.me(); await enterApp(); return; } catch (e) { Auth.clear(); }
  }
  showScreen('login');
}
start();
