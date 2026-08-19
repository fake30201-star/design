const TOKEN_KEY = 'atelier_admin_token';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = Object.assign({}, options.headers, {
    Authorization: 'Bearer ' + token
  });
  const res = await fetch(url, Object.assign({}, options, { headers }));
  if (res.status === 401) {
    clearToken();
    window.location.href = '/admin/login.html';
    throw new Error('unauthorized');
  }
  return res;
}

async function guardAdminPage() {
  const token = getToken();
  if (!token) {
    window.location.href = '/admin/login.html';
    return false;
  }
  try {
    const res = await fetch('/api/admin/check', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('bad token');
    return true;
  } catch {
    clearToken();
    window.location.href = '/admin/login.html';
    return false;
  }
}

async function logoutAdmin() {
  try { await authFetch('/api/admin/logout', { method: 'POST' }); } catch {}
  clearToken();
  window.location.href = '/admin/login.html';
}