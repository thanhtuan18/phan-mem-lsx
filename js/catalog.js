'use strict';
// Danh mục dùng chung: khách hàng, sản phẩm, công đoạn.
const CAT_META = {
  customers: { one: 'khách hàng', nameKey: 'customer_name', codeKey: 'customer_code', extraKey: 'phone', extraLabel: 'Số điện thoại', extraPh: 'Ví dụ: 0903 123 456', nameLabel: 'Tên khách hàng', tab: 'Khách hàng' },
  products: { one: 'sản phẩm', nameKey: 'product_name', codeKey: 'product_code', extraKey: 'unit', extraLabel: 'Đơn vị tính', extraPh: 'cái, bộ, kg, m…', nameLabel: 'Tên sản phẩm', tab: 'Sản phẩm' },
  stages: { one: 'công đoạn', nameKey: 'stage_name', codeKey: 'stage_code', extraKey: 'sort_order', extraLabel: 'Thứ tự (số)', extraPh: '1, 2, 3…', nameLabel: 'Tên công đoạn', tab: 'Công đoạn' },
};
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

const Catalog = {
  active: { customers: [], products: [], stages: [] },   // chỉ mục đang dùng, để gợi ý
  async loadActive(kind) {
    const d = await api('/' + kind + '?active=1');
    Catalog.active[kind] = d.items;
    return d.items;
  },
  loadAllActive() { return Promise.all(Object.keys(CAT_META).map(k => Catalog.loadActive(k))); },
  name(kind, it) { return it[CAT_META[kind].nameKey]; },
  code(kind, it) { return it[CAT_META[kind].codeKey] || ''; },
};

// Ô vừa chọn vừa gõ, có nút + thêm nhanh.
const Combo = {
  openList: null,
  attach(input, kind, opts) {
    opts = opts || {};
    const wrap = h('div', { class: 'combo' });
    input.replaceWith(wrap);
    const plus = h('button', { class: 'combo-plus', type: 'button', 'aria-label': 'Thêm nhanh ' + CAT_META[kind].one }, icon('i-plus'));
    const list = h('div', { class: 'combo-list', role: 'listbox' });
    wrap.append(input, plus, list);
    input.setAttribute('autocomplete', 'off');

    const place = () => {
      const r = input.getBoundingClientRect();
      list.style.left = r.left + 'px'; list.style.top = (r.bottom + 4) + 'px';
      list.style.width = Math.max(r.width, 240) + 'px';
    };
    const close = () => { wrap.classList.remove('open'); if (Combo.openList === close) Combo.openList = null; };
    const pick = name => {
      input.value = name;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (opts.onPick) opts.onPick(Catalog.active[kind].find(i => Catalog.name(kind, i) === name));
      close();
    };
    const render = () => {
      const q = norm(input.value.trim());
      const hit = Catalog.active[kind].filter(it => !q || norm(Catalog.name(kind, it)).includes(q) || norm(Catalog.code(kind, it)).includes(q));
      const exact = Catalog.active[kind].some(it => norm(Catalog.name(kind, it)) === q);
      const rows = hit.map(it => {
        const o = h('div', { class: 'combo-opt', role: 'option' }, h('span', { text: Catalog.name(kind, it) }), h('small', { text: Catalog.code(kind, it) }));
        o.addEventListener('mousedown', e => { e.preventDefault(); pick(Catalog.name(kind, it)); });
        return o;
      });
      if (!hit.length) rows.push(h('div', { class: 'combo-empty', text: 'Chưa có trong danh mục.' }));
      if (input.value.trim() && !exact) {
        const add = h('div', { class: 'combo-opt add' }, h('span', { text: '+ Thêm nhanh “' + input.value.trim() + '”' }));
        add.addEventListener('mousedown', e => { e.preventDefault(); close(); openQuick(input.value.trim()); });
        rows.push(add);
      }
      list.replaceChildren(...rows);
    };
    const open = () => { if (Combo.openList && Combo.openList !== close) Combo.openList(); render(); place(); wrap.classList.add('open'); Combo.openList = close; };
    const openQuick = name => Quick.open(kind, { name, select: true }, item => {
      Catalog.active[kind].push(item);
      Catalog.active[kind].sort((a, b) => Catalog.name(kind, a).localeCompare(Catalog.name(kind, b), 'vi'));
      pick(Catalog.name(kind, item));
    });
    input.addEventListener('focus', open);
    input.addEventListener('input', () => { if (document.activeElement === input) open(); });
    input.addEventListener('blur', () => setTimeout(close, 120));
    input.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    plus.addEventListener('click', () => openQuick(input.value.trim()));
    window.addEventListener('scroll', () => { if (wrap.classList.contains('open')) close(); }, true);
    return wrap;
  },
};
