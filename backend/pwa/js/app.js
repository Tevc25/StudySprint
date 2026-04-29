import { initAuth, isLoggedIn, getToken, getUserId, logout } from './auth.js';
import { initSync, offlineMutate } from './sync.js';
import { initPush } from './push.js';
import { saveGoals, loadGoals as dbLoadGoals, saveTasks, loadTasks as dbLoadTasks } from './db.js';

const API_BASE = 'http://localhost:3000';

// --- State ---
let activeView = 'login';
let currentGoalId = null;
let allGoals = [];
let allTasks = [];

// --- Helpers ---
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

function notify(title, body = '') {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: 'icons/android-chrome-192x192.png' });
  }
}

// --- Views ---
function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(`${name}-view`).classList.add('active');
  activeView = name;

  const navActions = document.getElementById('nav-actions');
  navActions.style.display = name === 'login' ? 'none' : 'flex';
}

// --- Goals ---
async function loadGoals() {
  if (!navigator.onLine) {
    allGoals = await dbLoadGoals();
    renderGoals(allGoals);
    return;
  }
  try {
    allGoals = await apiFetch('/goals');
    await saveGoals(allGoals);
    renderGoals(allGoals);
  } catch (err) {
    allGoals = await dbLoadGoals();
    renderGoals(allGoals);
    notify('Napaka', err.message);
  }
}

function renderGoals(goals) {
  const list = document.getElementById('goals-list');
  if (!goals.length) {
    list.innerHTML = '<p class="empty">Ni ciljev. Dodaj prvega!</p>';
    return;
  }
  list.innerHTML = goals
    .map(
      (g) => `
    <div class="item-card" data-id="${g.id}">
      <img class="lazy" data-src="icons/taptaptap.png" src="" alt="" width="32" height="32" style="border-radius:6px;flex-shrink:0" />
      <div style="flex:1">
        <div class="item-title">${g.title}</div>
        <div class="item-meta">${g.status ?? ''} ${g.deadline ? '· ' + g.deadline : ''}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-sm btn-primary btn-open-tasks" data-id="${g.id}" data-title="${g.title}">Naloge</button>
        <button class="btn btn-sm" style="background:var(--border)" data-action="edit-goal" data-id="${g.id}">Uredi</button>
        <button class="btn btn-sm btn-danger" data-action="delete-goal" data-id="${g.id}">Briši</button>
      </div>
    </div>
  `,
    )
    .join('');

  list.querySelectorAll('.btn-open-tasks').forEach((btn) => {
    btn.addEventListener('click', () => openTasks(btn.dataset.id, btn.dataset.title));
  });
  list.querySelectorAll('[data-action="edit-goal"]').forEach((btn) => {
    btn.addEventListener('click', () => openGoalModal(btn.dataset.id));
  });
  list.querySelectorAll('[data-action="delete-goal"]').forEach((btn) => {
    btn.addEventListener('click', () => deleteGoal(btn.dataset.id));
  });

  lazyLoad();
}

async function deleteGoal(id) {
  try {
    if (!navigator.onLine) {
      await offlineMutate('DELETE', `/goals/${id}`);
    } else {
      await apiFetch(`/goals/${id}`, { method: 'DELETE' });
    }
    notify('Izbrisano', 'Cilj je bil izbrisan');
    loadGoals();
  } catch (err) {
    notify('Napaka', err.message);
  }
}

function openGoalModal(id) {
  const goal = id ? allGoals.find((g) => g.id === id) : null;
  document.getElementById('modal-title').textContent = goal ? 'Uredi cilj' : 'Nov cilj';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group"><label>Naslov</label><input id="m-title" value="${goal?.title ?? ''}" /></div>
    <div class="form-group"><label>Opis</label><input id="m-desc" value="${goal?.description ?? ''}" /></div>
    <div class="form-group"><label>Rok</label><input id="m-deadline" type="date" value="${goal?.deadline ?? ''}" /></div>
  `;
  openModal(async () => {
    const data = {
      title: document.getElementById('m-title').value.trim(),
      description: document.getElementById('m-desc').value.trim(),
      deadline: document.getElementById('m-deadline').value,
      userId: getUserId(),
      status: 'active',
    };
    if (!data.title) return;
    try {
      if (!navigator.onLine) {
        await offlineMutate(goal ? 'PUT' : 'POST', goal ? `/goals/${id}` : '/goals', data);
      } else if (goal) {
        await apiFetch(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      } else {
        await apiFetch('/goals', { method: 'POST', body: JSON.stringify(data) });
      }
      notify('Shranjeno', goal ? 'Cilj posodobljen' : 'Cilj dodan');
      closeModal();
      loadGoals();
    } catch (err) {
      notify('Napaka', err.message);
    }
  });
}

// --- Tasks ---
async function openTasks(goalId, goalTitle) {
  currentGoalId = goalId;
  document.getElementById('tasks-title').textContent = `Naloge: ${goalTitle}`;
  showView('tasks');
  loadTasks();
}

async function loadTasks() {
  if (!navigator.onLine) {
    const all = await dbLoadTasks();
    allTasks = all.filter((t) => t.goalId === currentGoalId);
    renderTasks(allTasks);
    return;
  }
  try {
    const tasks = await apiFetch('/tasks');
    await saveTasks(tasks);
    allTasks = tasks.filter((t) => t.goalId === currentGoalId);
    renderTasks(allTasks);
  } catch (err) {
    const all = await dbLoadTasks();
    allTasks = all.filter((t) => t.goalId === currentGoalId);
    renderTasks(allTasks);
    notify('Napaka', err.message);
  }
}

function renderTasks(tasks) {
  const list = document.getElementById('tasks-list');
  if (!tasks.length) {
    list.innerHTML = '<p class="empty">Ni nalog. Dodaj prvo!</p>';
    return;
  }
  list.innerHTML = tasks
    .map(
      (t) => `
    <div class="item-card" data-id="${t.id}">
      <div>
        <div class="item-title">${t.title}</div>
        <div class="item-meta">${t.completed ? '✓ Končano' : 'V teku'} ${t.deadline ? '· ' + t.deadline : ''}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-sm" style="background:var(--border)" data-action="edit-task" data-id="${t.id}">Uredi</button>
        <button class="btn btn-sm btn-danger" data-action="delete-task" data-id="${t.id}">Briši</button>
      </div>
    </div>
  `,
    )
    .join('');

  list.querySelectorAll('[data-action="edit-task"]').forEach((btn) => {
    btn.addEventListener('click', () => openTaskModal(btn.dataset.id));
  });
  list.querySelectorAll('[data-action="delete-task"]').forEach((btn) => {
    btn.addEventListener('click', () => deleteTask(btn.dataset.id));
  });
}

async function deleteTask(id) {
  try {
    if (!navigator.onLine) {
      await offlineMutate('DELETE', `/tasks/${id}`);
    } else {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    }
    notify('Izbrisano', 'Naloga je bila izbrisana');
    loadTasks();
  } catch (err) {
    notify('Napaka', err.message);
  }
}

function openTaskModal(id) {
  const task = id ? allTasks.find((t) => t.id === id) : null;
  document.getElementById('modal-title').textContent = task ? 'Uredi nalogo' : 'Nova naloga';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group"><label>Naslov</label><input id="m-title" value="${task?.title ?? ''}" /></div>
    <div class="form-group"><label>Opis</label><input id="m-desc" value="${task?.description ?? ''}" /></div>
    <div class="form-group"><label>Rok</label><input id="m-deadline" type="date" value="${task?.deadline ?? ''}" /></div>
    <div class="form-group">
      <label>
        <input id="m-completed" type="checkbox" ${task?.completed ? 'checked' : ''} style="width:auto;margin-right:0.4rem" />
        Končano
      </label>
    </div>
  `;
  openModal(async () => {
    const data = {
      title: document.getElementById('m-title').value.trim(),
      description: document.getElementById('m-desc').value.trim(),
      deadline: document.getElementById('m-deadline').value,
      completed: document.getElementById('m-completed').checked,
      goalId: currentGoalId,
      userId: getUserId(),
    };
    if (!data.title) return;
    try {
      if (!navigator.onLine) {
        await offlineMutate(task ? 'PUT' : 'POST', task ? `/tasks/${id}` : '/tasks', data);
      } else if (task) {
        await apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      } else {
        await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) });
      }
      notify('Shranjeno', task ? 'Naloga posodobljena' : 'Naloga dodana');
      closeModal();
      loadTasks();
    } catch (err) {
      notify('Napaka', err.message);
    }
  });
}

// --- Modal ---
let modalSaveCallback = null;

function openModal(onSave) {
  modalSaveCallback = onSave;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  modalSaveCallback = null;
}

// --- Lazy Loading ---
function lazyLoad() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  });
  document.querySelectorAll('img.lazy').forEach((img) => observer.observe(img));
}

// --- Search ---
document.getElementById('search-goals').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderGoals(allGoals.filter((g) => g.title.toLowerCase().includes(q)));
});

document.getElementById('search-tasks').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderTasks(allTasks.filter((t) => t.title.toLowerCase().includes(q)));
});

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    if (activeView === 'goals') openGoalModal(null);
    else if (activeView === 'tasks') openTaskModal(null);
  }
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    if (activeView === 'goals') document.getElementById('search-goals').focus();
    else if (activeView === 'tasks') document.getElementById('search-tasks').focus();
  }
  if (e.key === 'Escape') closeModal();
});

// --- Nav ---
document.getElementById('btn-logout').addEventListener('click', () => {
  logout();
  showView('login');
});

document.getElementById('btn-back').addEventListener('click', () => {
  showView('goals');
  loadGoals();
});

document.getElementById('btn-add-goal').addEventListener('click', () => openGoalModal(null));
document.getElementById('btn-add-task').addEventListener('click', () => openTaskModal(null));
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-save').addEventListener('click', () => modalSaveCallback?.());
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// --- Init ---
function onLogin() {
  document.getElementById('nav-user').textContent = getUserId() ?? '';
  showView('goals');
  loadGoals();
  initSync(() => loadGoals());
  initPush();
}

initAuth(onLogin);

if (isLoggedIn()) {
  onLogin();
}

window.showView = showView;
window.openGoalModal = openGoalModal;
window.openTaskModal = openTaskModal;
window.logout = logout;
