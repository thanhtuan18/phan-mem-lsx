'use strict';
const List = {
  items: [],
  currentId: null,
  timer: null,

  query() {
    const p = new URLSearchParams();
    const set = (k, id) => { const v = $(id).value.trim(); if (v) p.set(k, v); };
    set('q', 'filter-lsx'); set('customer', 'filter-customer'); set('stage', 'filter-stage');
    set('from', 'filter-date-from'); set('to', 'filter-date-to');
    const s = p.toString();
    return s ? '?' + s : '';
  },
  async load() {
    const d = await api('/lsx' + List.query());
    List.items = d.items;
    List.render();
    if (d.truncated) toast('Chỉ hiện ' + d.items.length + ' lệnh mới nhất. Hãy lọc để thu hẹp.');
  },
  async loadFilters() {
    const d = await api('/lsx/filters');
    const fill = (id, label, arr) => {
      const sel = $(id), keep = sel.value;
      sel.replaceChildren(h('option', { value: '', text: label }));
      arr.forEach(v => sel.append(h('option', { value: v, text: v })));
      sel.value = keep;
    };
    fill('filter-customer', 'Mọi khách hàng', d.customers || []);
    fill('filter-stage', 'Mọi công đoạn', d.stages || []);
  },
  render() {
    $('lsx-count').textContent = List.items.length;
    const box = $('lsx-list-items');
    if (!List.items.length) {
      box.replaceChildren(h('div', { class: 'list-empty', text: 'Không có lệnh nào khớp bộ lọc.' }));
      return;
    }
    box.replaceChildren(...List.items.map(l => {
      const st = STATE_OF[l.status] || 'info';
      const p = Math.round(l.progress || 0);
      const el = h('div', { class: 'lsx-item' + (l.id === List.currentId ? ' active' : ''), 'data-state': st, tabindex: '0', role: 'button' },
        h('div', { class: 'lsx-item-top' }, h('span', { class: 'code', text: l.lsx_code }), h('span', { class: 'chip', 'data-state': st, text: STATUS_ORDER[l.status] || l.status })),
        h('div', { class: 'lsx-item-name', text: l.product }),
        h('div', { class: 'lsx-item-meta' },
          h('span', { class: 'customer-tag' }, icon('i-user'), l.customer || '—'),
          h('span', {}, icon('i-cal'), fmtDate(l.lsx_date))),
        h('div', { class: 'lsx-item-progress' }, miniRuler(p, st === 'ok' ? 'ok' : null), h('b', { text: p + '%' })));
      const open = () => Form.open(l.id);
      el.addEventListener('click', open);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      return el;
    }));
  },
  debounce() { clearTimeout(List.timer); List.timer = setTimeout(() => List.load().catch(handleError), 300); },
  setActive(id) { List.currentId = id; List.render(); },
  toggleFilters() {
    const box = document.querySelector('.filter-box');
    const open = box.classList.toggle('open');
    $('btn-filter').setAttribute('aria-expanded', open ? 'true' : 'false');
  },
  markFilters() {                // chấm báo trên nút Bộ lọc khi đang lọc theo khách / công đoạn / ngày
    const on = ['filter-customer', 'filter-stage', 'filter-date-from', 'filter-date-to'].some(id => $(id).value);
    $('btn-filter').classList.toggle('has', on);
  },
};
