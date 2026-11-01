'use strict';
// Dùng chung cho dang-ky.html và kich-hoat.html (nhận biết theo phần tử có trong trang).
(function () {
  const err = msg => { const b = $('error-box'); b.textContent = msg || ''; b.style.display = msg ? 'block' : 'none'; };
  const busy = (on, label) => { const b = $('su-btn'); b.disabled = on; if (label) b.textContent = label; };

  if ($('su-website')) {            // ---- trang đăng ký ----
    const LABEL = 'Gửi email kích hoạt';
    $('su-form').addEventListener('submit', async e => {
      e.preventDefault(); err('');
      const body = {
        company_name: $('su-name').value.trim(), company_code: $('su-code').value.trim().toLowerCase(),
        phone: $('su-phone').value.trim(), email: $('su-email').value.trim(), website: $('su-website').value,
      };
      if (!body.company_name || !body.company_code || !body.phone || !body.email) { err('Hãy điền đủ các ô.'); return; }
      if (!$('su-agree').checked) { err('Hãy đồng ý với chính sách bảo mật để tiếp tục.'); return; }
      busy(true, 'Đang gửi…');
      try {
        await rawFetch('/signup', { method: 'POST', body });
        $('su-sent-to').textContent = body.email;
        $('su-form').hidden = true; $('su-sent').hidden = false;
      } catch (ex) { err(ex.message); busy(false, LABEL); }
    });
    return;
  }

  // ---- trang kích hoạt ----
  const token = new URLSearchParams(location.search).get('token') || '';
  const show = id => { ['su-loading', 'su-bad', 'su-form', 'su-ok'].forEach(x => { $(x).hidden = x !== id; }); };
  (async () => {
    if (!token) { show('su-bad'); return; }
    try {
      const d = await rawFetch('/signup/info', { method: 'POST', body: { token } });
      $('su-name').textContent = d.company_name; $('su-code').textContent = d.company_code; $('su-user').textContent = d.username;
      show('su-form');
    } catch (ex) { $('su-bad-msg').textContent = ex.message; show('su-bad'); }
  })();
  $('su-form').addEventListener('submit', async e => {
    e.preventDefault(); err('');
    const p = $('su-pass').value;
    if (p.length < 8) { err('Mật khẩu phải từ 8 ký tự trở lên.'); return; }
    if (p !== $('su-pass2').value) { err('Hai lần nhập mật khẩu chưa khớp.'); return; }
    busy(true, 'Đang kích hoạt…');
    try {
      const d = await rawFetch('/signup/confirm', { method: 'POST', body: { token, password: p } });
      $('su-ok-code').textContent = d.company_code; $('su-ok-user').textContent = d.username;
      history.replaceState(null, '', 'kich-hoat.html');     // bỏ token khỏi thanh địa chỉ
      show('su-ok');
    } catch (ex) { err(ex.message); busy(false, 'Kích hoạt tài khoản'); }
  });
})();
