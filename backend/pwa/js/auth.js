const API_BASE = 'http://localhost:3000';

// --- Storage ---
export const getToken = () => localStorage.getItem('access_token');
export const getUserId = () => localStorage.getItem('userId');
export const isLoggedIn = () => !!getToken();

function saveAuth(token, userId) {
  localStorage.setItem('access_token', token);
  localStorage.setItem('userId', userId);
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('userId');
}

// --- API klici ---
async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'password', username: email, password }),
  });
  if (!res.ok) throw new Error('Napačni prijavni podatki');
  return res.json();
}

async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error('Registracija ni uspela');
  return res.json();
}

// --- UI ---
function showLogin() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}

function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

export function initAuth(onLogin) {
  document.getElementById('btn-show-register').addEventListener('click', (e) => {
    e.preventDefault();
    showRegister();
  });

  document.getElementById('btn-show-login').addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
  });

  document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('input-username').value.trim();
    const password = document.getElementById('input-password').value;
    if (!email || !password) return;
    try {
      const data = await login(email, password);
      saveAuth(data.access_token, data.sub ?? email);
      onLogin();
    } catch (err) {
      new Notification('Napaka', { body: err.message });
    }
  });

  document.getElementById('btn-register').addEventListener('click', async () => {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!name || !email || !password) return;
    try {
      await register(name, email, password);
      const data = await login(email, password);
      saveAuth(data.access_token, data.sub ?? email);
      onLogin();
    } catch (err) {
      new Notification('Napaka', { body: err.message });
    }
  });
}
