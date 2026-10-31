'use strict';
// Tiện ích giao diện dùng chung. Không dùng innerHTML với dữ liệu người dùng.
const $ = id => document.getElementById(id);

const STATUS_ORDER = { in_progress: 'Đang làm', done: 'Hoàn thành', paused: 'Tạm dừng', cancelled: 'Đã hủy' };
const DETAIL_STATUS = { in_progress: 'Đang làm', done: 'Hoàn thành' };
const STATE_OF = { in_progress: 'info', done: 'ok', paused: 'idle', cancelled: 'off' };

const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const fmtNum = n => num(n).toLocaleString('vi-VN');
const fmtDate = d => { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
const todayISO = () => {
  const t = new Date(Date.now() + 7 * 3600e3); // UTC+7
  return t.toISOString().slice(0, 10);
};

// h('div', {class:'x', data-state:'ok'}, child, 'text') -> phần tử DOM
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids) if (kid !== null && kid !== undefined) el.append(kid);
  return el;
}
function icon(id, cls) {
  const NS = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', cls || 'i');
  const u = document.createElementNS(NS, 'use');
  u.setAttribute('href', '#' + id);
  s.append(u);
  return s;
}
function miniRuler(pct, state) {
  const i = h('i'); i.style.width = Math.max(0, Math.min(100, pct)) + '%';
  return h('span', { class: 'mini-ruler', 'data-state': state || null }, i);
}

let toastTimer;
function toast(msg, kind) {
  const t = $('toast');
  $('toast-text').textContent = msg;
  if (kind) t.dataset.kind = kind; else delete t.dataset.kind;
  t.querySelector('use').setAttribute('href', kind === 'error' ? '#i-alert' : '#i-check');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), kind === 'error' ? 4500 : 2200);
}
