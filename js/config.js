'use strict';
// Địa chỉ API: tự chọn theo nơi chạy giao diện.
const CONFIG = (() => {
  const host = location.hostname;
  const local = host === 'localhost' || host === '127.0.0.1';
  return { API_BASE: local ? 'http://127.0.0.1:5000/api/v1' : 'https://api-sx.technoup.info/api/v1' };
})();
