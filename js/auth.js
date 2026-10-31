'use strict';
const Auth = {
  user: null,
  hasSession() { return !!Store.get('lsx_access'); },
  clear() { Store.del('lsx_access'); Store.del('lsx_refresh'); Auth.user = null; },
  async login(company, username, password) {
    const d = await rawFetch('/auth/login', { method: 'POST', body: { company_code: company, username, password } });
    Store.set('lsx_access', d.access_token);
    Store.set('lsx_refresh', d.refresh_token);
    Auth.user = d.user || { company_code: company, username };
    return Auth.user;
  },
  async me() {
    const d = await api('/auth/me');
    Auth.user = d.user || d;
    return Auth.user;
  },
};

function showScreen(which) {
  $('login-screen').dataset.show = which === 'login' ? '1' : '';
  $('main-app').dataset.show = which === 'app' ? '1' : '';
}
function loginError(msg) {
  const b = $('error-box');
  b.textContent = msg || '';
  b.style.display = msg ? 'block' : 'none';
}
function paintUser() {
  const u = Auth.user || {};
  const name = u.full_name || u.username || '';
  $('user-name').textContent = name;
  $('user-company').textContent = u.company_code || '';
  $('user-avatar').textContent = (name[0] || '?').toUpperCase();
}
