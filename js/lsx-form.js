'use strict';
const Form = {
  id: null,      // null = đang thêm mới
  data: null,    // dữ liệu gốc từ máy chủ
  dirty: false,

  async open(id) {
    if (Form.dirty && !confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và mở lệnh khác?')) return;
    const d = await api('/lsx/' + id);
    Form.id = id; Form.data = d;
    Form.fill(d);
    List.setActive(id);
  },
  startNew() {
    if (Form.dirty && !confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và tạo lệnh mới?')) return;
    Form.id = null; Form.data = null;
    Form.fill({ lsx_code: '', lsx_date: todayISO(), start_date: todayISO(), due_date: '', customer: '', product: '', order_qty: '', status: 'in_progress', note: '', rows: [] });
    List.setActive(null);
    $('master-customer').focus();
  },
  fill(d) {
    $('master-lsx-code').value = d.lsx_code || 'Tự cấp khi lưu';
    $('master-date').value = d.lsx_date || todayISO();
    $('master-customer').value = d.customer || '';
    $('master-product').value = d.product || '';
    $('master-qty').value = d.order_qty ?? '';
    $('master-start').value = d.start_date || '';
    $('master-due').value = d.due_date || '';
    $('master-status').value = d.status || 'in_progress';
    $('master-note').value = d.note || '';
    $('detail-body').replaceChildren();
    (d.rows || []).forEach(r => Form.addRow(r, true));
    Form.header(d);
    Form.summary();
    Form.dirty = false;
  },
  header(d) {
    $('display-lsx-title').textContent = d.lsx_code || 'Lệnh mới';
    const st = d.lsx_code ? (STATE_OF[$('master-status').value] || 'info') : 'info';
    const sub = $('display-sub-info');
    sub.replaceChildren(...[
      h('span', { class: 'chip', 'data-state': st, text: STATUS_ORDER[$('master-status').value] || '' }),
      $('master-product').value ? h('span', { class: 'meta-product', text: $('master-product').value }) : null,
      $('master-customer').value ? h('span', { class: 'meta-item' }, icon('i-user'), $('master-customer').value) : null,
      h('span', { class: 'meta-item', text: d.lsx_code ? 'Đang chỉnh sửa' : 'Thêm mới' })].filter(Boolean));
  },

  addRow(r, silent) {
    r = r || { posting_date: todayISO(), stage_name: '', stage_code: '', target_qty: 0, actual_qty: 0, status_detail: 'in_progress' };
    const inp = (cls, type, val, extra) => h('input', { class: cls, type, value: val ?? '', ...extra });
    const sel = h('select', { class: 'col-status' }, ...Object.entries(DETAIL_STATUS).map(([k, v]) => h('option', { value: k, text: v })));
    sel.value = r.status_detail || 'in_progress';
    const rate = h('div', { class: 'rate rate-cell' }, miniRuler(0), h('span', { class: 'rate-num', text: '0%' }));
    const del = h('button', { class: 'btn-del', type: 'button', 'aria-label': 'Xóa dòng' }, icon('i-trash'));
    const td = (label, child, cls) => h('td', { 'data-label': label, class: cls || null }, child);
    const tr = h('tr', {},
      td('Ngày', inp('col-date', 'date', r.posting_date)),
      td('Công đoạn', inp('col-name', 'text', r.stage_name, { placeholder: 'Chọn hoặc gõ công đoạn', maxlength: '100' })),
      td('Mã', inp('col-code', 'text', r.stage_code, { placeholder: 'Mã', maxlength: '20' })),
      td('Mục tiêu', inp('col-tg tg-num', 'number', r.target_qty, { min: '0', step: '0.01', inputmode: 'decimal' })),
      td('Thực tế', inp('col-ac ac-num', 'number', r.actual_qty, { min: '0', step: '0.01', inputmode: 'decimal' })),
      td('Tỷ lệ', rate),
      td('Trạng thái', sel),
      td('', del, 'act'));
    tr.dataset.rowId = r.id ?? '';
    Combo.attach(tr.querySelector('.col-name'), 'stages', { onPick: it => {
      if (it && it.stage_code) tr.querySelector('.col-code').value = it.stage_code;
    } });
    tr.addEventListener('input', () => { Form.rate(tr); Form.summary(); Form.dirty = true; });
    sel.addEventListener('change', () => { Form.rowState(tr); Form.summary(); Form.dirty = true; });
    del.addEventListener('click', () => { tr.remove(); Form.summary(); Form.dirty = true; });
    $('detail-body').append(tr);
    Form.rate(tr); Form.rowState(tr);
    if (!silent) { Form.summary(); Form.dirty = true; tr.querySelector('.col-name').focus(); }
  },
  rate(tr) {
    const tg = num(tr.querySelector('.tg-num').value), ac = num(tr.querySelector('.ac-num').value);
    const p = tg ? Math.round(ac / tg * 100) : 0;
    tr.querySelector('.rate-num').textContent = p + '%';
    const bar = tr.querySelector('.mini-ruler');
    bar.firstElementChild.style.width = Math.min(100, p) + '%';
    if (p >= 100) bar.dataset.state = 'ok'; else delete bar.dataset.state;
  },
  rowState(tr) {
    const s = tr.querySelector('.col-status');
    if (s.value === 'done') s.dataset.state = 'ok'; else delete s.dataset.state;
  },
  summary() {
    const rows = [...$('detail-body').children];
    let plan = 0, act = 0, done = 0, sum = 0;
    rows.forEach(tr => {
      const tg = num(tr.querySelector('.tg-num').value), ac = num(tr.querySelector('.ac-num').value);
      plan += tg; act += ac; sum += tg ? Math.min(100, ac / tg * 100) : 0;
      if (tr.querySelector('.col-status').value === 'done') done++;
    });
    const p = rows.length ? Math.round(sum / rows.length) : 0;
    $('stat-plan').textContent = fmtNum(plan);
    $('stat-actual').textContent = fmtNum(act);
    $('stat-done').textContent = done + '/' + rows.length;
    const ru = $('ruler');
    ru.style.setProperty('--p', p + '%');
    if (p >= 100) ru.dataset.state = 'ok'; else delete ru.dataset.state;
    $('ruler-pin').textContent = p + '%';
    $('table-empty').hidden = rows.length > 0;
  },

  collect() {
    const body = {
      customer: $('master-customer').value.trim(),
      product: $('master-product').value.trim(),
      order_qty: $('master-qty').value === '' ? null : $('master-qty').value,
      start_date: $('master-start').value || null,
      due_date: $('master-due').value || null,
      status: $('master-status').value,
      note: $('master-note').value.trim(),
      rows: [...$('detail-body').children].map(tr => {
        const row = {
          posting_date: tr.querySelector('.col-date').value || null,
          stage_name: tr.querySelector('.col-name').value.trim(),
          stage_code: tr.querySelector('.col-code').value.trim(),
          target_qty: tr.querySelector('.tg-num').value || 0,
          actual_qty: tr.querySelector('.ac-num').value || 0,
          status_detail: tr.querySelector('.col-status').value,
        };
        if (tr.dataset.rowId) row.id = Number(tr.dataset.rowId);
        return row;
      }),
    };
    if (!body.start_date) delete body.start_date; // máy chủ tự lấy hôm nay khi tạo mới
    return body;
  },
  async save() {
    const btn = $('btn-save');
    btn.disabled = true;
    try {
      const body = Form.collect();
      const d = Form.id === null
        ? await api('/lsx', { method: 'POST', body })
        : await api('/lsx/' + Form.id, { method: 'PUT', body });
      Form.id = d.id; Form.data = d;
      Form.fill(d);
      List.currentId = d.id;
      await Promise.all([List.load(), List.loadFilters()]);
      toast('Đã lưu dữ liệu');
    } catch (e) { handleError(e); } finally { btn.disabled = false; }
  },
  cancel() {
    if (Form.dirty && !confirm('Bỏ các thay đổi chưa lưu?')) return;
    Form.dirty = false;
    if (Form.id !== null && Form.data) Form.fill(Form.data); else Form.startNew();
  },
};
