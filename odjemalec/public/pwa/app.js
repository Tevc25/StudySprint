// app.js – StudySprint PWA main application
'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE       = '/api';
const OAUTH_URL      = '/oauth/token';
const CLIENT_ID      = 'studysprint-cli';
const CLIENT_SECRET  = 'studysprint-secret';
const DEFAULT_USER   = 'u-1';
const LAZY_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

// ── Application state ─────────────────────────────────────────────────────────
const state = {
  goals:     [],
  tasks:     [],
  sprints:   [],
  token:     null,
  tokenExp:  0,
  online:    navigator.onLine,
  section:   'goals',
  search:    '',
  filters:   { status: '', priority: '' },
  swReg:     null,
  lazyObserver: null,
};

// ── DOM helpers ───────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ── Toast notifications ───────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = $('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `
    <span class="toast-dot" aria-hidden="true"></span>
    <span class="toast-msg">${esc(message)}</span>
    <button class="toast-close" aria-label="Zapri">&times;</button>
  `;
  el.querySelector('.toast-close').addEventListener('click', () => el.remove());
  container.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ── OS Notifications ──────────────────────────────────────────────────────────
async function notifyOS(title, body, opts = {}) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission === 'granted') {
    if (state.swReg) {
      state.swReg.showNotification(title, {
        body,
        icon: '/pwa/icons/icon-192.png',
        badge: '/pwa/icons/icon-192.png',
        ...opts,
      });
    } else {
      new Notification(title, { body, icon: '/pwa/icons/icon-192.png', ...opts });
    }
  }
}

// ── OAuth token management ────────────────────────────────────────────────────
async function getToken(force = false) {
  const now = Date.now();
  if (!force && state.token && now < state.tokenExp - 30_000) return state.token;

  if (!force) {
    try {
      const stored = JSON.parse(localStorage.getItem('ss_auth') ?? 'null');
      if (stored && now < stored.exp - 30_000) {
        state.token   = stored.token;
        state.tokenExp = stored.exp;
        return state.token;
      }
    } catch { /* ignore */ }
  }

  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope:         'api.read api.write api.sync',
    }),
  });

  if (!res.ok) throw new Error('OAuth avtentikacija ni uspela');

  const data     = await res.json();
  state.token    = data.access_token;
  state.tokenExp = Date.now() + data.expires_in * 1000;

  localStorage.setItem('ss_auth', JSON.stringify({ token: state.token, exp: state.tokenExp }));

  // Share token with service worker for background sync
  if (state.swReg?.active) {
    state.swReg.active.postMessage({ type: 'SAVE_TOKEN', token: state.token });
  }

  return state.token;
}

// ── API fetch wrapper ─────────────────────────────────────────────────────────
async function apiFetch(path, options = {}, retry = false) {
  if (!state.online) throw Object.assign(new Error('Offline'), { offline: true });

  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401 && !retry) {
    await getToken(true);
    return apiFetch(path, options, true);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API napaka ${res.status}`);
  }

  return res.json();
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadGoals() {
  try {
    const { data } = await apiFetch('/goals');
    state.goals = data;
    await db.saveAll('goals', data);
  } catch (e) {
    if (e.offline) {
      state.goals = await db.getAll('goals');
      showToast('Brez povezave – prikazujem lokalne podatke', 'warning');
    } else {
      showToast(`Napaka pri nalaganju ciljev: ${e.message}`, 'error');
    }
  }
  renderGoals();
}

async function loadTasks() {
  try {
    const { data } = await apiFetch('/tasks');
    state.tasks = data;
    await db.saveAll('tasks', data);
  } catch (e) {
    if (e.offline) state.tasks = await db.getAll('tasks');
    else showToast(`Napaka pri nalaganju nalog: ${e.message}`, 'error');
  }
  renderTasks();
}

async function loadSprints() {
  try {
    const { data } = await apiFetch('/sprints');
    state.sprints = data;
    await db.saveAll('sprints', data);
  } catch (e) {
    if (e.offline) state.sprints = await db.getAll('sprints');
    else showToast(`Napaka pri nalaganju sprintov: ${e.message}`, 'error');
  }
  renderSprints();
}

// ── Goal CRUD ─────────────────────────────────────────────────────────────────
async function createGoal(body) {
  const payload = { ...body, userId: DEFAULT_USER };
  try {
    const { data } = await apiFetch('/goals', { method: 'POST', body: JSON.stringify(payload) });
    state.goals.push(data);
    await db.save('goals', data);
    showToast('Cilj je bil ustvarjen!', 'success');
    notifyOS('StudySprint', `Cilj "${data.title}" je bil shranjen.`);
    return data;
  } catch (e) {
    if (e.offline) {
      // Store locally and enqueue for sync
      const tempId = `temp-goal-${Date.now()}`;
      const temp   = { id: tempId, ...payload };
      state.goals.push(temp);
      await db.save('goals', temp);
      await db.enqueueSync({ method: 'POST', resource: 'goals', body: payload });
      showToast('Brez povezave – cilj shranjen lokalno', 'warning');
      return temp;
    }
    showToast(`Napaka: ${e.message}`, 'error');
    throw e;
  }
}

async function updateGoal(id, body) {
  try {
    const { data } = await apiFetch(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    const idx = state.goals.findIndex(g => g.id === id);
    if (idx >= 0) state.goals[idx] = data;
    await db.save('goals', data);
    showToast('Cilj posodobljen!', 'success');
    notifyOS('StudySprint', `Cilj "${data.title}" posodobljen.`);
    return data;
  } catch (e) {
    if (e.offline) {
      const updated = { id, ...body };
      const idx = state.goals.findIndex(g => g.id === id);
      if (idx >= 0) state.goals[idx] = updated;
      await db.save('goals', updated);
      await db.enqueueSync({ method: 'PUT', resource: 'goals', id, body });
      showToast('Brez povezave – sprememba shranjena lokalno', 'warning');
      return updated;
    }
    showToast(`Napaka: ${e.message}`, 'error');
    throw e;
  }
}

async function deleteGoal(id) {
  try {
    await apiFetch(`/goals/${id}`, { method: 'DELETE' });
    state.goals = state.goals.filter(g => g.id !== id);
    await db.delete('goals', id);
    showToast('Cilj izbrisan.', 'info');
  } catch (e) {
    if (e.offline) {
      state.goals = state.goals.filter(g => g.id !== id);
      await db.delete('goals', id);
      await db.enqueueSync({ method: 'DELETE', resource: 'goals', id });
      showToast('Brez povezave – brisanje zapostavljeno za sinhronizacijo', 'warning');
    } else {
      showToast(`Napaka: ${e.message}`, 'error');
    }
  }
}

// ── Task CRUD ─────────────────────────────────────────────────────────────────
async function createTask(body) {
  try {
    const { data } = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(body) });
    state.tasks.push(data);
    await db.save('tasks', data);
    showToast('Naloga ustvarjena!', 'success');
    return data;
  } catch (e) {
    if (e.offline) {
      const temp = { id: `temp-task-${Date.now()}`, ...body };
      state.tasks.push(temp);
      await db.save('tasks', temp);
      await db.enqueueSync({ method: 'POST', resource: 'tasks', body });
      showToast('Brez povezave – naloga shranjena lokalno', 'warning');
      return temp;
    }
    showToast(`Napaka: ${e.message}`, 'error');
    throw e;
  }
}

async function updateTask(id, body) {
  try {
    const { data } = await apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx >= 0) state.tasks[idx] = data;
    await db.save('tasks', data);
    showToast('Naloga posodobljena!', 'success');
    return data;
  } catch (e) {
    if (e.offline) {
      const updated = { id, ...body };
      const idx = state.tasks.findIndex(t => t.id === id);
      if (idx >= 0) state.tasks[idx] = updated;
      await db.save('tasks', updated);
      await db.enqueueSync({ method: 'PUT', resource: 'tasks', id, body });
      showToast('Brez povezave – sprememba shranjena lokalno', 'warning');
      return updated;
    }
    showToast(`Napaka: ${e.message}`, 'error');
    throw e;
  }
}

async function deleteTask(id) {
  try {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
  } catch (e) {
    if (e.offline) await db.enqueueSync({ method: 'DELETE', resource: 'tasks', id });
    else { showToast(`Napaka: ${e.message}`, 'error'); return; }
  }
  state.tasks = state.tasks.filter(t => t.id !== id);
  await db.delete('tasks', id);
  showToast('Naloga izbrisana.', 'info');
}

// ── Rendering: Goals ──────────────────────────────────────────────────────────
const STATUS_LABELS = { planned: 'Planirano', in_progress: 'V teku', done: 'Zaključeno' };
const PRIORITY_LABELS = { high: 'Visoka', medium: 'Srednja', low: 'Nizka' };

function renderGoals() {
  const q  = state.search.toLowerCase();
  const sf = state.filters.status;
  const pf = state.filters.priority;

  const filtered = state.goals.filter(g => {
    const textMatch = !q || (g.title?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
    return textMatch && (!sf || g.status === sf) && (!pf || g.priority === pf);
  });

  const grid  = $('goalsGrid');
  const empty = $('emptyGoals');
  const countEl = $('goalsCount');
  if (countEl) countEl.textContent = filtered.length || '';

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const imgSeed = g => (g.id ?? 'x').replace(/[^a-z0-9]/gi, 'x').slice(0, 12) || 'default';

  const icEye   = `<svg aria-hidden="true"><use href="#ic-eye"/></svg>`;
  const icEdit  = `<svg aria-hidden="true"><use href="#ic-edit"/></svg>`;
  const icTrash = `<svg aria-hidden="true"><use href="#ic-trash"/></svg>`;
  const icCal   = `<svg style="width:11px;height:11px" aria-hidden="true"><use href="#ic-tasks"/></svg>`;

  grid.innerHTML = filtered.map(g => {
    const dl      = g.deadline ? new Date(g.deadline) : null;
    const overdue = dl && dl < new Date() && g.status !== 'done';
    const seed    = imgSeed(g);

    return `
    <li><article class="goal-card priority-${esc(g.priority)} ${overdue ? 'overdue' : ''}"
             data-id="${esc(g.id)}"
             tabindex="0"
             aria-label="${esc(g.title)}">
      <div class="goal-card-image">
        <img class="goal-img lazy-img"
             src="${LAZY_PLACEHOLDER}"
             data-src="https://picsum.photos/seed/${seed}/400/200"
             alt=""
             width="400" height="200"
             aria-hidden="true">
      </div>
      <div class="goal-card-body">
        <div class="goal-badges">
          <span class="badge badge-${esc(g.status)}">${esc(STATUS_LABELS[g.status] ?? g.status)}</span>
          <span class="badge badge-${esc(g.priority)}">${esc(PRIORITY_LABELS[g.priority] ?? g.priority)}</span>
        </div>
        <h3 class="goal-title">${esc(g.title)}</h3>
        <p class="goal-desc">${esc((g.description ?? '').slice(0, 120))}${(g.description?.length ?? 0) > 120 ? '…' : ''}</p>
        ${dl ? `<p class="goal-deadline ${overdue ? 'overdue' : ''}">${icCal} ${dl.toLocaleDateString('sl-SI')}</p>` : ''}
      </div>
      <div class="goal-card-actions">
        <button class="act-btn" data-action="detail"      data-id="${esc(g.id)}" title="Podrobnosti">${icEye}</button>
        <button class="act-btn" data-action="edit-goal"   data-id="${esc(g.id)}" title="Uredi">${icEdit}</button>
        <button class="act-btn act-danger" data-action="delete-goal" data-id="${esc(g.id)}" title="Izbriši">${icTrash}</button>
      </div>
    </article></li>`;
  }).join('');

  initLazyLoading();
}

// ── Rendering: Tasks ──────────────────────────────────────────────────────────
function renderTasks(goalId = null) {
  const q  = state.search.toLowerCase();
  const filtered = state.tasks.filter(t => {
    const textMatch = !q || (t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    const goalMatch = !goalId || t.goalId === goalId;
    return textMatch && goalMatch;
  });

  if (goalId) {
    // Inline in detail modal
    const el = document.getElementById('detailTasks');
    if (!el) return;
    if (!filtered.length) {
      el.innerHTML = '<p class="detail-empty">Ni nalog za ta cilj.</p>';
      return;
    }
    el.innerHTML = filtered.map(t => taskItemHTML(t)).join('');
    return;
  }

  const list  = $('tasksList');
  const empty = $('emptyTasks');

  if (!filtered.length) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  list.innerHTML = filtered.map(t => `<div class="task-row ${t.status === 'done' ? 'done' : ''}">${taskItemHTML(t)}</div>`).join('');
}

function taskItemHTML(t) {
  const goal = state.goals.find(g => g.id === t.goalId);
  const dl   = t.deadline ? new Date(t.deadline) : null;
  const icEdit  = `<svg aria-hidden="true"><use href="#ic-edit"/></svg>`;
  const icTrash = `<svg aria-hidden="true"><use href="#ic-trash"/></svg>`;
  return `
    <div class="task-check-wrap">
      <input type="checkbox" class="task-check" ${t.status === 'done' ? 'checked' : ''}
             data-action="toggle-task" data-id="${esc(t.id)}" aria-label="Označi kot opravljeno">
    </div>
    <div class="task-body">
      <div class="task-title">${esc(t.title)}</div>
      <div class="task-meta">
        ${goal ? `<span>${esc(goal.title)}</span>` : ''}
        ${dl   ? `<span>${dl.toLocaleDateString('sl-SI')}</span>` : ''}
        ${t.estimatedMinutes ? `<span>${t.estimatedMinutes} min</span>` : ''}
      </div>
    </div>
    <div class="task-actions">
      <button class="act-btn" data-action="edit-task"   data-id="${esc(t.id)}" title="Uredi">${icEdit}</button>
      <button class="act-btn act-danger" data-action="delete-task" data-id="${esc(t.id)}" title="Izbriši">${icTrash}</button>
    </div>`;
}

// ── Rendering: Sprints ────────────────────────────────────────────────────────
function renderSprints() {
  const list  = $('sprintsList');
  const empty = $('emptySprints');

  if (!state.sprints.length) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const icEdit  = `<svg aria-hidden="true"><use href="#ic-edit"/></svg>`;
  const icTrash = `<svg aria-hidden="true"><use href="#ic-trash"/></svg>`;

  list.innerHTML = state.sprints.map(s => {
    const task  = state.tasks.find(t => t.id === s.taskId);
    const start = s.startTime ? new Date(s.startTime) : null;
    return `
    <div class="sprint-row">
      <div class="sprint-body">
        <div class="sprint-title">${task ? esc(task.title) : 'Sprint'}</div>
        <div class="sprint-meta">
          ${start ? start.toLocaleString('sl-SI') + ' · ' : ''}${esc(s.status ?? '—')}${s.notes ? ' · ' + esc(s.notes) : ''}
        </div>
      </div>
      <div class="sprint-badge">${s.durationMinutes ?? '?'} min</div>
      <div class="task-actions">
        <button class="act-btn" data-action="edit-sprint"   data-id="${esc(s.id)}" title="Uredi">${icEdit}</button>
        <button class="act-btn act-danger" data-action="delete-sprint" data-id="${esc(s.id)}" title="Izbriši">${icTrash}</button>
      </div>
    </div>`;
  }).join('');
}

// ── Lazy loading ──────────────────────────────────────────────────────────────
function initLazyLoading() {
  const imgs = document.querySelectorAll('img.lazy-img');
  if (!imgs.length) return;

  if ('IntersectionObserver' in window) {
    if (state.lazyObserver) {
      // Disconnect and recreate to pick up new images
      state.lazyObserver.disconnect();
    }
    state.lazyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const src = img.dataset.src;
        if (!src) return;

        img.addEventListener('load',  () => img.classList.add('loaded'),    { once: true });
        img.addEventListener('error', () => { img.src = LAZY_PLACEHOLDER; img.classList.add('loaded'); }, { once: true });

        img.src = src;
        delete img.dataset.src;
        img.classList.remove('lazy-img');
        state.lazyObserver.unobserve(img);
      });
    }, { rootMargin: '60px 0px', threshold: 0.01 });

    imgs.forEach(img => state.lazyObserver.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    imgs.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
        img.classList.remove('lazy-img', 'loading');
      }
    });
  }
}

// ── Goal modal ────────────────────────────────────────────────────────────────
function openGoalModal(goalId = null) {
  const modal = $('goalModal');
  const title = $('goalModalTitle');
  const form  = $('goalForm');

  $('goalTitleError').textContent = '';
  form.reset();
  $('goalId').value = '';

  if (goalId) {
    const g = state.goals.find(g => g.id === goalId);
    if (!g) return;
    title.textContent   = 'Uredi cilj';
    $('goalId').value   = g.id;
    $('goalTitle').value = g.title ?? '';
    $('goalDesc').value  = g.description ?? '';
    $('goalPriority').value = g.priority ?? 'medium';
    $('goalStatus').value   = g.status   ?? 'planned';
    if (g.deadline) {
      $('goalDeadline').value = new Date(g.deadline).toISOString().slice(0, 16);
    }
  } else {
    title.textContent = 'Nov cilj';
  }

  modal.showModal();
  requestAnimationFrame(() => $('goalTitle').focus());
}

function closeGoalModal() {
  $('goalModal').close();
}

// ── Task modal ────────────────────────────────────────────────────────────────
function openTaskModal(taskId = null, prefillGoalId = null) {
  const modal = $('taskModal');
  $('taskTitleError').textContent = '';
  $('taskForm').reset();
  $('taskId').value = '';

  // Populate goal select
  const goalSel = $('taskGoalId');
  goalSel.innerHTML = '<option value="">— brez cilja —</option>';
  state.goals.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.title;
    goalSel.appendChild(opt);
  });

  if (taskId) {
    const t = state.tasks.find(t => t.id === taskId);
    if (!t) return;
    $('taskModalTitle').textContent = 'Uredi nalogo';
    $('taskId').value    = t.id;
    $('taskTitle').value = t.title ?? '';
    $('taskDesc').value  = t.description ?? '';
    $('taskStatus').value  = t.status ?? 'planned';
    $('taskMinutes').value = t.estimatedMinutes ?? 25;
    $('taskGoalId').value  = t.goalId ?? '';
    if (t.deadline) $('taskDeadline').value = new Date(t.deadline).toISOString().slice(0, 16);
  } else {
    $('taskModalTitle').textContent = 'Nova naloga';
    if (prefillGoalId) $('taskGoalId').value = prefillGoalId;
  }

  modal.showModal();
  requestAnimationFrame(() => $('taskTitle').focus());
}

function closeTaskModal() {
  $('taskModal').close();
}

// ── Sprint modal ──────────────────────────────────────────────────────────────
function openSprintModal(sprintId = null) {
  const modal = $('sprintModal');
  $('sprintForm').reset();
  $('sprintId').value = '';
  $('sprintStartError').textContent = '';

  // Populate task select
  const taskSel = $('sprintTaskId');
  taskSel.innerHTML = '<option value="">— brez naloge —</option>';
  state.tasks.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.title;
    taskSel.appendChild(opt);
  });

  if (sprintId) {
    const s = state.sprints.find(s => s.id === sprintId);
    if (!s) return;
    $('sprintModalTitle').textContent = 'Uredi sprint';
    $('sprintId').value = s.id;
    $('sprintStatus').value   = s.status ?? 'active';
    $('sprintDuration').value = s.durationMinutes ?? 25;
    $('sprintNotes').value    = s.notes ?? '';
    $('sprintTaskId').value   = s.taskId ?? '';
    if (s.startTime) $('sprintStart').value = new Date(s.startTime).toISOString().slice(0, 16);
  } else {
    $('sprintModalTitle').textContent = 'Nov sprint';
    $('sprintStart').value = new Date().toISOString().slice(0, 16);
  }

  modal.showModal();
  requestAnimationFrame(() => $('sprintStart').focus());
}

function closeSprintModal() {
  $('sprintModal').close();
}

async function createSprint(body) {
  try {
    const { data } = await apiFetch('/sprints', { method: 'POST', body: JSON.stringify(body) });
    state.sprints.unshift(data);
    await db.save('sprints', data);
    notifyOS('StudySprint', 'Sprint dodan.');
    return data;
  } catch (e) {
    if (!e.offline) showToast(`Napaka: ${e.message}`, 'error');
    else await db.enqueueSync({ method: 'POST', resource: 'sprints', body });
    throw e;
  }
}

async function updateSprint(id, body) {
  try {
    const { data } = await apiFetch(`/sprints/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    const idx = state.sprints.findIndex(s => s.id === id);
    if (idx >= 0) state.sprints[idx] = data;
    await db.save('sprints', data);
    notifyOS('StudySprint', 'Sprint posodobljen.');
    return data;
  } catch (e) {
    if (!e.offline) showToast(`Napaka: ${e.message}`, 'error');
    else await db.enqueueSync({ method: 'PUT', resource: 'sprints', id, body });
    throw e;
  }
}

async function deleteSprint(id) {
  try {
    await apiFetch(`/sprints/${id}`, { method: 'DELETE' });
    state.sprints = state.sprints.filter(s => s.id !== id);
    await db.delete('sprints', id);
  } catch (e) {
    if (!e.offline) showToast(`Napaka: ${e.message}`, 'error');
    else await db.enqueueSync({ method: 'DELETE', resource: 'sprints', id });
    throw e;
  }
}

// ── Goal detail modal ─────────────────────────────────────────────────────────
function openDetailModal(goalId) {
  const g = state.goals.find(g => g.id === goalId);
  if (!g) return;

  $('detailModalTitle').textContent = g.title;

  const dl      = g.deadline ? new Date(g.deadline) : null;
  const overdue = dl && dl < new Date() && g.status !== 'done';

  const icEdit  = `<svg aria-hidden="true"><use href="#ic-edit"/></svg>`;
  const icPlus  = `<svg aria-hidden="true"><use href="#ic-plus"/></svg>`;
  const icTrash = `<svg aria-hidden="true"><use href="#ic-trash"/></svg>`;

  $('detailModalBody').innerHTML = `
    <div class="detail-meta">
      <span class="badge badge-${esc(g.status)}">${esc(STATUS_LABELS[g.status] ?? g.status)}</span>
      <span class="badge badge-${esc(g.priority)}">${esc(PRIORITY_LABELS[g.priority] ?? g.priority)}</span>
      ${dl ? `<span class="goal-deadline ${overdue ? 'overdue' : ''}">${dl.toLocaleDateString('sl-SI')}</span>` : ''}
    </div>
    <p class="detail-desc">${esc(g.description ?? '(brez opisa)')}</p>
    <div class="detail-actions">
      <button class="btn btn-ghost" data-action="edit-goal"         data-id="${esc(g.id)}">${icEdit} Uredi</button>
      <button class="btn btn-primary" data-action="new-task-for-goal" data-id="${esc(g.id)}">${icPlus} Naloga</button>
      <button class="btn btn-danger"  data-action="delete-goal"     data-id="${esc(g.id)}">${icTrash} Izbriši</button>
    </div>
    <p class="detail-section-label">Naloge</p>
    <div class="detail-tasks" id="detailTasks"></div>
  `;

  $('detailModal').showModal();
  renderTasks(goalId);
}

function closeDetailModal() {
  $('detailModal').close();
}

// ── Confirm delete modal ──────────────────────────────────────────────────────
function confirmDelete(message, onConfirm) {
  $('confirmMessage').textContent = message;
  $('confirmModal').showModal();

  // Replace button to detach any previous listener
  const oldBtn = $('confirmOkBtn');
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);

  newBtn.addEventListener('click', async () => {
    $('confirmModal').close();
    await onConfirm();
  });
}

$('confirmCancelBtn').addEventListener('click', () => $('confirmModal').close());
// Close on backdrop click (click outside dialog box)
$('confirmModal').addEventListener('click', e => {
  if (e.target === $('confirmModal')) $('confirmModal').close();
});

// ── Section navigation ────────────────────────────────────────────────────────
function switchSection(name) {
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.hidden = true;
  });
  const target = $(`section-${name}`);
  if (target) { target.hidden = false; target.classList.add('active'); }

  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.section === name);
    l.setAttribute('aria-current', l.dataset.section === name ? 'page' : 'false');
  });

  state.section = name;

  if (name === 'tasks'   && !state.tasks.length)   loadTasks();
  if (name === 'sprints' && !state.sprints.length)  loadSprints();
}

// ── Online / offline handling ─────────────────────────────────────────────────
let offlineBanner = null;

function setOnline(online) {
  state.online = online;
  const pill  = $('statusPill');
  const label = $('statusLabel');
  if (pill)  pill.classList.toggle('offline', !online);
  if (label) label.textContent = online ? 'online' : 'offline';

  if (!online) {
    if (!offlineBanner) {
      offlineBanner = document.createElement('div');
      offlineBanner.className = 'offline-banner';
      offlineBanner.textContent = 'Brez internetne povezave – način brez povezave';
      document.body.prepend(offlineBanner);
    }
  } else {
    offlineBanner?.remove();
    offlineBanner = null;
    showToast('Spet ste online!', 'success');
    syncPending();
  }
}

window.addEventListener('online',  () => setOnline(true));
window.addEventListener('offline', () => setOnline(false));

// ── Manual sync ───────────────────────────────────────────────────────────────
async function syncPending() {
  if (!state.online || !state.swReg) return;

  const count = await db.pendingSyncCount();
  if (count === 0) { showToast('Ni čakajočih sprememb.', 'info'); return; }

  if ('sync' in state.swReg) {
    await state.swReg.sync.register('ss-sync-pending');
    showToast(`Sinhronizacija v teku (${count} sprememb)…`, 'info');
  } else {
    // Fallback: sync directly in the page
    await manualSync();
  }
}

async function manualSync() {
  const pending = await db.getPendingSync();
  if (!pending.length) return;

  let synced = 0;
  for (const op of pending) {
    try {
      const url = op.id ? `/api/${op.resource}/${op.id}` : `/api/${op.resource}`;
      await apiFetch(url.replace('/api', ''), {
        method: op.method,
        body: op.body ? JSON.stringify(op.body) : undefined,
      });
      await db.removeSyncEntry(op._syncId);
      synced++;
    } catch { /* leave for next attempt */ }
  }

  if (synced) {
    showToast(`${synced} sprememb(a) sinhroniziranih!`, 'success');
    notifyOS('StudySprint', `${synced} lokalne spremembe so bile sinhroniziran.`);
    await loadGoals();
    if (state.section === 'tasks')   await loadTasks();
    if (state.section === 'sprints') await loadSprints();
  }
}

// ── Push subscription ─────────────────────────────────────────────────────────
async function subscribeToPush() {
  if (!state.swReg || !('PushManager' in window)) {
    showToast('Push obvestila niso podprta v tem brskalniku.', 'warning');
    return;
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    showToast('Obvestila niso dovoljena.', 'warning');
    return;
  }

  try {
    // Get VAPID public key
    const { data } = await apiFetch('/push/vapid-public-key');
    const vapidKey = urlBase64ToUint8Array(data.publicKey);

    let sub = await state.swReg.pushManager.getSubscription();
    if (!sub) {
      sub = await state.swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
    }

    // Send subscription to server
    const subJSON = sub.toJSON();
    await apiFetch('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subJSON),
    });

    showToast('Push obvestila so vključena!', 'success');
  } catch (e) {
    showToast(`Napaka pri naročanju: ${e.message}`, 'error');
    console.error('[push] Subscribe error:', e);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const mod = e.ctrlKey || e.metaKey;

  // Alt+G – new goal
  if (e.altKey && e.code === 'KeyG') {
    e.preventDefault();
    openGoalModal();
  }

  // Alt+N – new task (Naloga)
  if (e.altKey && e.code === 'KeyN') {
    e.preventDefault();
    openTaskModal();
  }

  // Alt+S – new sprint
  if (e.altKey && e.code === 'KeyS') {
    e.preventDefault();
    openSprintModal();
  }

  // Ctrl+F – focus search
  if (mod && e.key === 'f') {
    e.preventDefault();
    $('searchInput').focus();
    $('searchInput').select();
  }

  // Ctrl+S – submit open modal form
  if (mod && e.key === 's') {
    e.preventDefault();
    if ($('goalModal').open)   $('goalForm').requestSubmit();
    else if ($('taskModal').open)   $('taskForm').requestSubmit();
    else if ($('sprintModal').open) $('sprintForm').requestSubmit();
  }
  // native <dialog> elements handle Esc automatically
});

// ── Global click delegation ───────────────────────────────────────────────────
document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id     = btn.dataset.id;

  switch (action) {
    case 'detail':
      closeDetailModal();
      openDetailModal(id);
      break;

    case 'edit-goal':
      $('detailModal').close();
      openGoalModal(id);
      break;

    case 'delete-goal':
      $('detailModal').close();
      confirmDelete('Ali res želite izbrisati ta cilj?', async () => {
        await deleteGoal(id);
        renderGoals();
        notifyOS('StudySprint', 'Cilj izbrisan.');
      });
      break;

    case 'new-task-for-goal':
      $('detailModal').close();
      openTaskModal(null, id);
      break;

    case 'edit-task':
      openTaskModal(id);
      break;

    case 'delete-task':
      confirmDelete('Ali res želite izbrisati to nalogo?', async () => {
        await deleteTask(id);
        renderTasks();
      });
      break;

    case 'edit-sprint':
      openSprintModal(id);
      break;

    case 'delete-sprint':
      confirmDelete('Ali res želite izbrisati ta sprint?', async () => {
        await deleteSprint(id);
        renderSprints();
        notifyOS('StudySprint', 'Sprint izbrisan.');
      });
      break;

    case 'new-sprint':
      openSprintModal();
      break;

    case 'toggle-task': {
      const t = state.tasks.find(t => t.id === id);
      if (!t) break;
      const newStatus = t.status === 'done' ? 'planned' : 'done';
      await updateTask(id, { ...t, status: newStatus });
      renderTasks(state.section === 'goals' ? null : null);
      break;
    }
  }
});

// Goal card click (open detail)
document.addEventListener('click', e => {
  const card = e.target.closest('.goal-card');
  if (!card || e.target.closest('[data-action]')) return;
  openDetailModal(card.dataset.id);
});

// Goal card keyboard (Enter/Space)
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.goal-card');
  if (!card) return;
  e.preventDefault();
  openDetailModal(card.dataset.id);
});

// ── Form submissions ──────────────────────────────────────────────────────────
$('goalForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id    = $('goalId').value;
  const title = $('goalTitle').value.trim();

  $('goalTitleError').textContent = '';
  if (!title) { $('goalTitleError').textContent = 'Naslov je obvezen.'; $('goalTitle').focus(); return; }

  const body = {
    title,
    description: $('goalDesc').value.trim(),
    deadline:    $('goalDeadline').value ? new Date($('goalDeadline').value).toISOString() : '',
    priority:    $('goalPriority').value,
    status:      $('goalStatus').value,
  };

  try {
    if (id) await updateGoal(id, body);
    else    await createGoal(body);
    closeGoalModal();
    renderGoals();
  } catch { /* toast shown inside CRUD fn */ }
});

$('taskForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id    = $('taskId').value;
  const title = $('taskTitle').value.trim();

  $('taskTitleError').textContent = '';
  if (!title) { $('taskTitleError').textContent = 'Naslov je obvezen.'; $('taskTitle').focus(); return; }

  const body = {
    title,
    description:       $('taskDesc').value.trim(),
    deadline:          $('taskDeadline').value ? new Date($('taskDeadline').value).toISOString() : '',
    status:            $('taskStatus').value,
    estimatedMinutes:  Number($('taskMinutes').value) || 25,
    goalId:            $('taskGoalId').value || undefined,
  };

  try {
    if (id) await updateTask(id, body);
    else    await createTask(body);
    closeTaskModal();
    renderTasks();
  } catch { /* toast shown inside CRUD fn */ }
});

$('sprintForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id    = $('sprintId').value;
  const start = $('sprintStart').value;

  $('sprintStartError').textContent = '';
  if (!start) { $('sprintStartError').textContent = 'Začetek je obvezen.'; $('sprintStart').focus(); return; }

  const startISO = new Date(start).toISOString();
  const duration = Number($('sprintDuration').value) || 25;
  const endISO   = new Date(new Date(start).getTime() + duration * 60000).toISOString();

  const body = {
    startTime:       startISO,
    endTime:         endISO,
    durationMinutes: duration,
    status:          $('sprintStatus').value,
    notes:           $('sprintNotes').value.trim(),
    userId:          DEFAULT_USER,
    taskId:          $('sprintTaskId').value || undefined,
  };

  try {
    if (id) await updateSprint(id, body);
    else    await createSprint(body);
    closeSprintModal();
    renderSprints();
  } catch { /* toast shown inside CRUD fn */ }
});

// ── Header / nav wiring ───────────────────────────────────────────────────────
$('newGoalBtn').addEventListener('click', () => openGoalModal());
$('emptyNewGoalBtn').addEventListener('click', () => openGoalModal());
$('newTaskBtn').addEventListener('click', () => openTaskModal());
$('newSprintBtn').addEventListener('click', () => openSprintModal());

$('closeGoalModal').addEventListener('click', closeGoalModal);
$('cancelGoalBtn').addEventListener('click', closeGoalModal);
$('goalModal').addEventListener('click', e => { if (e.target === $('goalModal')) closeGoalModal(); });

$('closeTaskModal').addEventListener('click', closeTaskModal);
$('cancelTaskBtn').addEventListener('click', closeTaskModal);
$('taskModal').addEventListener('click', e => { if (e.target === $('taskModal')) closeTaskModal(); });

$('closeSprintModal').addEventListener('click', closeSprintModal);
$('cancelSprintBtn').addEventListener('click', closeSprintModal);
$('sprintModal').addEventListener('click', e => { if (e.target === $('sprintModal')) closeSprintModal(); });

$('closeDetailModal').addEventListener('click', closeDetailModal);
$('detailModal').addEventListener('click', e => { if (e.target === $('detailModal')) closeDetailModal(); });

// Sidebar toggle
const sidebar = $('sidebar');
$('menuBtn').addEventListener('click', () => {
  const isMobile = window.innerWidth < 641;
  if (isMobile) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('closed');
    document.getElementById('app').classList.toggle('sidebar-closed', sidebar.classList.contains('closed'));
  }
});

// Nav links
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    switchSection(link.dataset.section);
    if (window.innerWidth < 641) sidebar.classList.remove('open');
  });
});

// Search
$('searchInput').addEventListener('input', e => {
  state.search = e.target.value;
  if (state.section === 'goals') renderGoals();
  if (state.section === 'tasks') renderTasks();
});

// Filters
$('statusFilter').addEventListener('change', e => { state.filters.status = e.target.value; renderGoals(); });
$('priorityFilter').addEventListener('change', e => { state.filters.priority = e.target.value; renderGoals(); });

// Sync button
$('syncNowBtn').addEventListener('click', async () => {
  if (!state.online) { showToast('Ni internetne povezave.', 'error'); return; }
  showToast('Ročna sinhronizacija…', 'info');
  await loadGoals();
  await loadTasks();
  showToast('Podatki posodobljeni!', 'success');
});

// Test push button
$('sendPushBtn').addEventListener('click', async () => {
  try {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'StudySprint', body: 'Testno push obvestilo!' }),
    });
    const json = await res.json();
    if (json.data?.sent > 0) showToast('Push obvestilo poslano!', 'success');
    else showToast('Ni aktivnih naročnikov. Omogočite push obvestila.', 'warning');
  } catch (e) {
    showToast(`Napaka: ${e.message}`, 'error');
  }
});

// ── Service Worker registration ───────────────────────────────────────────────
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register('/pwa/sw.js', { scope: '/pwa/' });
    state.swReg = reg;
    console.log('[sw] Registered:', reg.scope);

    // Listen for messages from SW (sync events)
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'SYNC_START') showToast(`Sinhronizacija ${e.data.count} sprememb…`, 'info');
      if (e.data?.type === 'SYNC_DONE')  {
        showToast(`Sinhronizirano: ${e.data.synced} / ${e.data.total}`, 'success');
        loadGoals();
      }
    });

    // Request push permission and subscribe
    await subscribeToPush();
  } catch (e) {
    console.error('[sw] Registration failed:', e);
  }
}

// ── URL action params (manifest shortcuts) ────────────────────────────────────
function handleUrlParams() {
  const params = new URLSearchParams(location.search);
  const action = params.get('action');
  if (action === 'new-goal') openGoalModal();
  if (action === 'new-task') openTaskModal();
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  setOnline(navigator.onLine);

  // Load from local DB first for instant display
  const [localGoals, localTasks] = await Promise.all([
    db.getAll('goals'),
    db.getAll('tasks'),
  ]);

  if (localGoals.length) { state.goals = localGoals; renderGoals(); }
  if (localTasks.length)   state.tasks  = localTasks;

  // Then fetch fresh data from server
  await loadGoals();
  await loadTasks();

  await registerServiceWorker();
  handleUrlParams();
  initVoiceCommands();
}

// ── Voice Commands (Web Speech API) ──────────────────────────────────────────
let voiceRecognition = null;
let voiceListening   = false;

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = 'en-US';
  utt.rate   = 1;
  utt.pitch  = 1;
  window.speechSynthesis.speak(utt);
}

const VOICE_COMMANDS = [
  {
    patterns: ['new goal', 'add goal', 'create goal'],
    action:   () => { openGoalModal();          speak('Opening new goal.'); },
  },
  {
    patterns: ['new task', 'add task', 'create task'],
    action:   () => { openTaskModal();          speak('Opening new task.'); },
  },
  {
    patterns: ['new sprint', 'add sprint', 'start sprint'],
    action:   () => { openSprintModal();        speak('Opening new sprint.'); },
  },
  {
    patterns: ['show goals', 'goals', 'my goals'],
    action:   () => { switchSection('goals');   speak('Showing goals.'); },
  },
  {
    patterns: ['show tasks', 'tasks', 'my tasks'],
    action:   () => { switchSection('tasks');   speak('Showing tasks.'); },
  },
  {
    patterns: ['show sprints', 'sprints', 'my sprints'],
    action:   () => { switchSection('sprints'); speak('Showing sprints.'); },
  },
  {
    patterns: ['close', 'cancel', 'never mind'],
    action:   () => {
      if ($('goalModal').open)   closeGoalModal();
      if ($('taskModal').open)   closeTaskModal();
      if ($('sprintModal').open) closeSprintModal();
      if ($('detailModal').open) closeDetailModal();
      speak('Closed.');
    },
  },
  {
    patterns: ['sync', 'synchronize', 'synchronise'],
    action:   () => { $('syncNowBtn').click();  speak('Synchronizing.'); },
  },
  {
    patterns: ['help', 'what can you do', 'commands'],
    action:   () => speak(
      'Available commands: new goal, new task, new sprint, ' +
      'show goals, show tasks, show sprints, ' +
      'search, close, sync, help.'
    ),
  },
];

function handleVoiceTranscript(transcript) {
  const t = transcript.toLowerCase().trim();

  // "search <query>" – fill the search box
  if (t.startsWith('search ')) {
    const query = t.slice(7).trim();
    if (query) {
      $('searchInput').value = query;
      $('searchInput').dispatchEvent(new Event('input'));
      speak(`Searching for ${query}.`);
      return;
    }
  }

  // Match patterns (exact or substring)
  for (const cmd of VOICE_COMMANDS) {
    if (cmd.patterns.some(p => t === p || t.includes(p))) {
      cmd.action();
      return;
    }
  }

  speak(`Sorry, I didn't understand that.`);
  showToast(`Neprepoznan ukaz: "${transcript}"`, 'error');
}

function setVoiceListening(active) {
  voiceListening = active;
  const btn  = $('voiceBtn');
  const pill = $('voicePill');
  if (btn)  btn.classList.toggle('listening', active);
  if (btn)  btn.setAttribute('aria-pressed', String(active));
  if (pill) pill.hidden = !active;
}

function initVoiceCommands() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    const btn = $('voiceBtn');
    if (btn) { btn.disabled = true; btn.title = 'Prepoznava govora ni podprta v tem brskalniku.'; }
    return;
  }

  const rec = new SR();
  rec.continuous     = false;
  rec.interimResults = false;
  rec.lang           = 'en-US';

  rec.onresult = e => {
    const transcript = e.results[e.results.length - 1][0].transcript.trim();
    showToast(`"${transcript}"`, 'info');
    handleVoiceTranscript(transcript);
  };

  rec.onend = () => setVoiceListening(false);

  rec.onerror = e => {
    setVoiceListening(false);
    if (e.error !== 'no-speech' && e.error !== 'aborted') {
      showToast(`Napaka mikrofona: ${e.error}`, 'error');
    }
  };

  voiceRecognition = rec;

  $('voiceBtn').addEventListener('click', () => {
    if (voiceListening) {
      rec.stop();
      setVoiceListening(false);
    } else {
      rec.start();
      setVoiceListening(true);
    }
  });

  // Alt+V keyboard shortcut
  document.addEventListener('keydown', e => {
    if (e.altKey && e.code === 'KeyV' && !e.target.matches('input,textarea,select')) {
      e.preventDefault();
      $('voiceBtn').click();
    }
  });
}

// ── PWA install prompt ────────────────────────────────────────────────────────
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = $('installBtn');
  if (btn) btn.hidden = false;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const btn = $('installBtn');
  if (btn) btn.hidden = true;
  showToast('Aplikacija nameščena!', 'success');
});

$('installBtn').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') deferredInstallPrompt = null;
});

init();
