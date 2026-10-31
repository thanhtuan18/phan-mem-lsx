'use strict';
// Màn hình Tổng quan sản xuất.
const DEFAULTS = { days: 7, limit: 10 };
const ST_DETAIL = { in_progress: ['info', 'Đang làm'], done: ['ok', 'Hoàn thành'] };
const TAB_LABEL = { all: 'Tất cả', in_progress: 'Đang làm', late: 'Chậm', done: 'Hoàn thành' };
const ACTION_STATUS = { in_progress: 'Đang làm', done: 'Hoàn thành', paused: 'Tạm dừng', cancelled: 'Đã hủy' };

const Dash = {
  tab: 'all',
  settings: { ...DEFAULTS },
  timer: null,

  loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('lsx_dash') || 'null');
      if (s && Number.isInteger(s.days) && s.days >= 0 && s.days <= 365) Dash.settings.days = s.days;
      if (s && Number.isInteger(s.limit) && s.limit >= 1 && s.limit <= 50) Dash.settings.limit = s.limit;
    } catch (e) { /* dùng mặc định */ }
  },
  saveSettings() { try { localStorage.setItem('lsx_dash', JSON.stringify(Dash.settings)); } catch (e) { /* bỏ qua */ } },

  async load() {
    const q = new URLSearchParams({ days: Dash.settings.days, limit: Dash.settings.limit, tab: Dash.tab });
    const d = await api('/dashboard?' + q);
    Dash.render(d);
    $('upd').textContent = new Date().toLocaleTimeString('vi-VN');
  },

  render(d) {
    $('s-t').textContent = fmtNum(d.tiles.target);
    $('s-a').textContent = fmtNum(d.tiles.actual);
    $('s-p').textContent = Math.round(d.tiles.progress) + '%';
    $('s-pb').style.width = Math.min(100, d.tiles.progress) + '%';
    $('s-l').textContent = String(d.tiles.late_count).padStart(2, '0');
    $('tile-late').classList.toggle('zero', d.tiles.late_count === 0);

    $('tab-wrap').replaceChildren(...Object.keys(TAB_LABEL).map(k => {
      const b = h('button', { type: 'button', class: 'fchip' + (k === 'late' ? ' late' : '') + (k === Dash.tab ? ' on' : ''), text: TAB_LABEL[k] + ' (' + d.counts[k] + ')' });
      b.addEventListener('click', () => { Dash.tab = k; Dash.load().catch(handleError); });
      return b;
    }));
    const s = Dash.settings;
    $('set-note').textContent = 'Đang xem: lệnh trong ' + (s.days === 0 ? 'toàn bộ thời gian' : s.days + ' ngày gần nhất (theo Ngày LSX)') +
      ', tối đa ' + s.limit + ' lệnh mỗi nhóm.' + (d.truncated ? ' Còn lệnh khác chưa hiện, hãy tăng số lệnh trong Thiết lập.' : '');

    $('blocks').replaceChildren(...(d.items.length ? d.items.map(Dash.block) : [h('div', { class: 'empty-blk', text: 'Không có lệnh nào trong nhóm này. Thử tăng số ngày trong Thiết lập.' })]));
    $('log').replaceChildren(...(d.log.length ? d.log.map(Dash.logLine) : [h('div', { class: 'empty-blk', text: 'Chưa có thao tác nào được ghi.' })]));
  },

  block(l) {
    const p = Math.round(l.progress);
    const state = l.status === 'done' ? 'ok' : l.status === 'paused' ? 'idle' : l.is_late ? 'late' : 'run';
    const chip = l.is_late ? ['bad', 'Chậm'] : (ACTION_STATUS[l.status] ? [l.status === 'done' ? 'ok' : l.status === 'paused' ? 'idle' : 'info', ACTION_STATUS[l.status]] : ['info', l.status]);
    const rulerState = p >= 100 ? 'ok' : l.is_late ? 'bad' : null;
    const head = h('div', { class: 'blk-h' },
      h('div', {},
        h('div', { class: 'blk-t' }, h('span', { class: 'code', text: l.lsx_code }), h('span', { class: 'pn', text: l.product }), h('span', { class: 'chip', 'data-state': chip[0], text: chip[1] })),
        h('div', { class: 'blk-m' }, h('span', { text: l.customer || '—' }), h('span', { text: l.due_date ? 'Hạn giao ' + fmtDate(l.due_date) : 'Chưa có hạn giao' }))),
      h('div', {},
        h('div', { class: 'blk-p' }, miniRuler(p, rulerState), h('b', { text: p + '%' })),
        l.is_late ? h('div', { class: 'blk-late', text: 'Theo thời gian phải đạt ~' + Math.round(l.expected) + '%' }) : null));
    let body;
    if (l.rows.length) {
      const th = ['Công đoạn', 'Mục tiêu', 'Thực tế', 'Tiến độ', 'Trạng thái', 'Người ghi nhận', 'Cập nhật'];
      const thead = h('thead', {}, h('tr', {}, ...th.map((t, i) => h('th', { class: i === 1 || i === 2 ? 'num' : null, text: t }))));
      const tbody = h('tbody', {}, ...l.rows.map(r => {
        const q = Math.round(r.progress);
        const rowLate = l.is_late && r.status_detail !== 'done' && l.expected !== null && r.progress < l.expected - 15;
        const sd = ST_DETAIL[r.status_detail] || ['info', r.status_detail];
        const td = (label, child, cls) => h('td', { 'data-l': label, class: cls || null }, child);
        return h('tr', { class: rowLate ? 'row-late' : null },
          td('Công đoạn', h('b', { text: r.stage_name }), 'full'),
          td('Mục tiêu', fmtNum(r.target_qty), 'num'),
          td('Thực tế', fmtNum(r.actual_qty), 'num'),
          td('Tiến độ', h('div', { class: 'rate' }, miniRuler(q, q >= 100 ? 'ok' : rowLate ? 'bad' : null), h('b', { text: q + '%' }))),
          td('Trạng thái', h('span', { class: 'chip', 'data-state': sd[0], text: sd[1] })),
          td('Người ghi nhận', r.updated_by || '—'),
          td('Cập nhật', Dash.when(r.updated_at)));
      }));
      body = h('table', { class: 'st' }, thead, tbody);
    } else body = h('div', { class: 'empty-blk', text: 'Chưa có công đoạn nào được ghi nhận.' });
    return h('article', { class: 'blk', 'data-state': state }, head, body);
  },

  when(stamp) {
    if (!stamp) return '—';
    const [d, t] = stamp.split(' ');
    return d === todayISO() ? t.slice(0, 5) : fmtDate(d).slice(0, 5) + ' ' + t.slice(0, 5);
  },

  logLine(x) {
    const b = t => h('b', { text: t });
    let what;
    if (x.action === 'create_lsx') what = ['Tạo lệnh ', b(x.lsx_code)];
    else if (x.action === 'update_actual') what = ['Cập nhật ', b(x.stage_name), ' từ ' + fmtNum(x.qty_before) + ' lên ', b(fmtNum(x.qty_after)), ' cho ' + x.lsx_code];
    else if (x.action === 'stage_status') what = ['Đổi trạng thái ', b(x.stage_name), ' thành ' + (ACTION_STATUS[x.detail] || x.detail) + ' (' + x.lsx_code + ')'];
    else what = ['Đổi trạng thái lệnh ', b(x.lsx_code), ' thành ' + (ACTION_STATUS[x.detail] || x.detail)];
    return h('div', { class: 'log-i' }, h('time', { text: Dash.when(x.created_at) }), h('span', { text: x.who }), h('span', {}, ...what));
  },

  // ----- Thiết lập -----
  openSettings(open) {
    const pop = $('set-pop');
    pop.classList.toggle('show', open);
    $('btn-set').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      $('set-days').value = Dash.settings.days; $('set-limit').value = Dash.settings.limit;
      $('set-err').style.display = 'none'; $('set-days').focus();
    }
  },
  applySettings(days, limit) {
    const d = Number(days), l = Number(limit);
    const err = $('set-err');
    if (!Number.isInteger(d) || d < 0 || d > 365) { err.textContent = 'Số ngày phải là số nguyên từ 0 đến 365.'; err.style.display = 'block'; return; }
    if (!Number.isInteger(l) || l < 1 || l > 50) { err.textContent = 'Số lệnh phải là số nguyên từ 1 đến 50.'; err.style.display = 'block'; return; }
    Dash.settings = { days: d, limit: l };
    Dash.saveSettings();
    Dash.openSettings(false);
    Dash.load().catch(handleError);
  },
};

function handleError(e) {
  if (e && e.code === 'auth') { location.href = 'index.html'; return; }
  toast((e && e.message) || 'Có lỗi xảy ra.', 'error');
}

function tick() {
  const n = new Date();
  $('clock').textContent = n.toLocaleTimeString('vi-VN', { hour12: false });
  $('datenow').textContent = n.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

async function start() {
  if (!Auth.hasSession()) { location.href = 'index.html'; return; }
  try { await Auth.me(); } catch (e) { Auth.clear(); location.href = 'index.html'; return; }
  paintUser();
  $('btn-logout').addEventListener('click', () => { Auth.clear(); location.href = 'index.html'; });
  Dash.loadSettings();
  tick(); setInterval(tick, 1000);
  $('btn-set').addEventListener('click', () => Dash.openSettings(!$('set-pop').classList.contains('show')));
  $('set-apply').addEventListener('click', () => Dash.applySettings($('set-days').value, $('set-limit').value));
  $('set-reset').addEventListener('click', () => Dash.applySettings(DEFAULTS.days, DEFAULTS.limit));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') Dash.openSettings(false); });
  document.addEventListener('mousedown', e => { if (!e.target.closest('.set-wrap')) Dash.openSettings(false); });
  ['set-days', 'set-limit'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key === 'Enter') $('set-apply').click(); }));
  try { await Dash.load(); } catch (e) { handleError(e); }
  Dash.timer = setInterval(() => { if (document.visibilityState === 'visible') Dash.load().catch(() => {}); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') Dash.load().catch(() => {}); });
}
start();
