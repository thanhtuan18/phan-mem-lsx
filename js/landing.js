'use strict';
// Form đăng ký trên trang giới thiệu. Dùng đúng API /signup như trang dang-ky.html.
(function () {
  const err = msg => { const b = $('error-box'); b.textContent = msg || ''; b.style.display = msg ? 'block' : 'none'; };
  const LABEL = 'Gửi email kích hoạt';
  $('su-form').addEventListener('submit', async e => {
    e.preventDefault(); err('');
    const body = {
      company_name: $('su-name').value.trim(), company_code: $('su-code').value.trim().toLowerCase(),
      phone: $('su-phone').value.trim(), email: $('su-email').value.trim(), website: $('su-website').value,
    };
    if (!body.company_name || !body.company_code || !body.phone || !body.email) { err('Hãy điền đủ các ô.'); return; }
    if (!$('su-agree').checked) { err('Hãy đồng ý với chính sách bảo mật để tiếp tục.'); return; }
    const b = $('su-btn'); b.disabled = true; b.textContent = 'Đang gửi…';
    try {
      await rawFetch('/signup', { method: 'POST', body });
      $('su-sent-to').textContent = body.email;
      $('su-form').hidden = true; $('su-sent').hidden = false;
    } catch (ex) { err(ex.message); b.disabled = false; b.textContent = LABEL; }
  });
})();
