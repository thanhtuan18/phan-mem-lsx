'use strict';
// Hộp thoại thêm nhanh / sửa một mục danh mục.
const Quick = {
  kind: null, item: null, done: null,
  open(kind, opts, done) {
    opts = opts || {};
    const m = CAT_META[kind], it = opts.item || null;
    Quick.kind = kind; Quick.item = it; Quick.done = done; Quick.select = !!opts.select;
    $('qm-title').textContent = (it ? 'Sửa ' : (opts.select ? 'Thêm nhanh ' : 'Thêm ')) + m.one;
    $('qm-sub').textContent = it ? 'Đổi tên không làm đổi các lệnh sản xuất đã lập.' : (Quick.select ? 'Mục mới sẽ được chọn ngay.' : 'Mục mới sẽ xuất hiện trong danh sách chọn khi lập lệnh.');
    $('qm-name-label').textContent = m.nameLabel;
    $('qm-extra-label').textContent = m.extraLabel + ' (không bắt buộc)';
    $('qm-extra').placeholder = m.extraPh;
    $('qm-name').value = it ? it[m.nameKey] : (opts.name || '');
    $('qm-code').value = it ? (it[m.codeKey] || '') : '';
    $('qm-extra').value = it ? (it[m.extraKey] ?? '') : '';
    $('qm-note').value = it ? (it.note || '') : '';
    $('qm-err').style.display = 'none';
    $('qm-save').textContent = (it || !Quick.select) ? 'Lưu' : 'Lưu và chọn';
    $('modal-back').classList.add('show');
    setTimeout(() => $('qm-name').focus(), 30);
  },
  close() { $('modal-back').classList.remove('show'); },
  error(msg) { const e = $('qm-err'); e.textContent = msg; e.style.display = 'block'; },
  async save(ev) {
    ev.preventDefault();
    const m = CAT_META[Quick.kind];
    const name = $('qm-name').value.trim();
    if (!name) { Quick.error('Nhập tên trước khi lưu.'); return; }
    const body = {
      [m.nameKey]: name,
      [m.codeKey]: $('qm-code').value.trim().toUpperCase(),
      [m.extraKey]: $('qm-extra').value.trim(),
      note: $('qm-note').value.trim(),
    };
    const btn = $('qm-save'); btn.disabled = true;
    try {
      const d = Quick.item
        ? await api('/' + Quick.kind + '/' + Quick.item.id, { method: 'PUT', body })
        : await api('/' + Quick.kind, { method: 'POST', body });
      Quick.close();
      toast(Quick.item ? 'Đã lưu “' + name + '”' : 'Đã thêm “' + name + '”' + (Quick.select ? ' và chọn' : ''));
      if (Quick.done) Quick.done(d);
    } catch (e) {
      if (e.code === 'auth') { Quick.close(); handleError(e); } else Quick.error(e.message);
    } finally { btn.disabled = false; }
  },
  init() {
    $('quick-form').addEventListener('submit', Quick.save);
    $('qm-cancel').addEventListener('click', Quick.close);
    $('modal-back').addEventListener('mousedown', e => { if (e.target.id === 'modal-back') Quick.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') Quick.close(); });
  },
};
