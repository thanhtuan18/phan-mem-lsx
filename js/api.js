'use strict';
// Gọi API. Tự gắn token, tự làm mới khi hết hạn (1 lần).
class ApiError extends Error {
  constructor(message, code, status) { super(message); this.code = code; this.status = status; }
}

const Store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* bỏ qua */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* bỏ qua */ } },
};

let refreshing = null;

async function rawFetch(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  let res;
  try {
    res = await fetch(CONFIG.API_BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', 'network', 0);
  }
  let json = null;
  try { json = await res.json(); } catch (e) { /* không phải JSON */ }
  if (!res.ok || !json || json.ok === false) {
    const err = json && json.error ? json.error : {};
    throw new ApiError(err.message || 'Có lỗi xảy ra (mã ' + res.status + ').', err.code || 'http_' + res.status, res.status);
  }
  return json.data;
}

async function refreshTokens() {
  const rt = Store.get('lsx_refresh');
  if (!rt) throw new ApiError('Phiên đăng nhập đã hết hạn.', 'auth', 401);
  const data = await rawFetch('/auth/refresh', { method: 'POST', body: { refresh_token: rt } });
  Store.set('lsx_access', data.access_token);
  if (data.refresh_token) Store.set('lsx_refresh', data.refresh_token);
}

async function api(path, opts = {}) {
  try {
    return await rawFetch(path, { ...opts, token: Store.get('lsx_access') });
  } catch (e) {
    if (e.status !== 401 || opts.noRetry) throw e;
    try {
      refreshing = refreshing || refreshTokens().finally(() => { refreshing = null; });
      await refreshing;
    } catch (e2) {
      Auth.clear();
      throw new ApiError('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.', 'auth', 401);
    }
    return rawFetch(path, { ...opts, token: Store.get('lsx_access') });
  }
}
