'use strict';
// Màn hình Danh mục: xem, tìm, thêm, sửa, ngừng dùng / dùng lại.
const Page = {
  kind: 'customers',
  rows: { customers: null, products: null, stages: null },   // dữ liệu đầy đủ (kể cả ngừng dùng)

  async load(kind) {
    const d = await api('/' + kind);
    Page.rows[kind] = d.items;
  },
  tabs() {
    $('tabs').replaceChildren(...Object.entries(CAT_META).map(([k, m]) => {
      const n = (Page.rows[k] || []).filter(i => i.is_active).length;
      const b = h('button', { class: 'tab' + (k === Page.kind ? ' on' : ''), type: 'button' }, m.tab, h('b', { text: Page.rows[k] ? n : '…' }));
      b.addEventListener('click', async () => { Page.kind = k; if (!Page.rows[k]) await Page.load(k).catch(handleError); Page.render(); });
      return b;
    }));
  },
  render() {
    Page.tabs();
    const m = CAT_META[Page.kind], q = norm($('q').value), all = $('show-off').checked;
    $('btn-add-t').textContent = 'Thêm ' + m.one;
    $('thead').replaceChildren(...[m.nameLabel, 'Mã', m.extraLabel, 'Ghi chú', 'Trạng thái', ''].map((t, i) => h('th', {}, i === 5 ? h('span', { class: 'sr-only', text: 'Thao tác' }) : t)));
    const list = (Page.rows[Page.kind] || []).filter(it => (all || it.is_active) && (!q || norm(it[m.nameKey]).includes(q) || norm(it[m.codeKey]).includes(q)));
    $('tbody').replaceChildren(...list.map(it => {
      const on = it.is_active;
      const ed = h('button', { class: 'ib', type: 'button', 'aria-label': 'Sửa' }, icon('i-edit'));
      const tg = h('button', { class: 'ib', type: 'button', 'aria-label': on ? 'Ngừng dùng' : 'Dùng lại', title: on ? 'Ngừng dùng' : 'Dùng lại' }, icon(on ? 'i-pause' : 'i-play'));
      ed.addEventListener('click', () => Quick.open(Page.kind, { item: it }, () => Page.reload()));
      tg.addEventListener('click', () => Page.toggle(it));
      const extra = it[m.extraKey];
      return h('tr', { class: on ? null : 'off' },
        h('td', { class: 'nm', text: it[m.nameKey] }),
        h('td', { text: it[m.codeKey] || '—' }),
        h('td', { class: 'c-x', text: extra === null || extra === undefined || extra === '' ? '—' : String(extra) }),
        h('td', { class: 'c-note', text: it.note || '' }),
        h('td', { class: 'c-st' }, h('span', { class: 'chip', 'data-state': on ? 'ok' : 'off', text: on ? 'Đang dùng' : 'Ngừng dùng' })),
        h('td', { class: 'c-act' }, h('div', { class: 'acts' }, ed, tg)));
    }));
    const empty = $('empty');
    empty.hidden = list.length > 0;
    empty.textContent = q ? 'Không có mục nào khớp.' : 'Chưa có ' + m.one + ' nào. Chọn “Thêm ' + m.one + '” để bắt đầu.';
  },
  async reload() { await Page.load(Page.kind); Page.render(); },
  async toggle(it) {
    const m = CAT_META[Page.kind];
    try {
      await api('/' + Page.kind + '/' + it.id, { method: 'PUT', body: { is_active: !it.is_active } });
      await Page.reload();
      toast(it.is_active ? 'Đã ngừng dùng “' + it[m.nameKey] + '”. Lệnh cũ không bị ảnh hưởng.' : 'Đã dùng lại “' + it[m.nameKey] + '”');
    } catch (e) { handleError(e); }
  },
};

function handleError(e) {
  if (e && e.code === 'auth') { location.href = 'index.html'; return; }
  toast((e && e.message) || 'Có lỗi xảy ra.', 'error');
}

async function start() {
  if (!Auth.hasSession()) { location.href = 'index.html'; return; }
  try { await Auth.me(); } catch (e) { Auth.clear(); location.href = 'index.html'; return; }
  paintUser();
  Quick.init();
  $('btn-logout').addEventListener('click', () => { Auth.clear(); location.href = 'index.html'; });
  $('q').addEventListener('input', Page.render);
  $('show-off').addEventListener('change', Page.render);
  $('btn-add').addEventListener('click', () => Quick.open(Page.kind, {}, () => Page.reload()));
  Page.tabs();
  try { await Promise.all(Object.keys(CAT_META).map(k => Page.load(k))); } catch (e) { handleError(e); }
  Page.render();
}
start();
