'use strict';

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE            = 'http://localhost:3000';
const OAUTH_CLIENT_ID     = 'studysprint-cli';
const OAUTH_CLIENT_SECRET = 'studysprint-secret';
const DB_NAME             = 'studysprint-db';
const DB_VERSION          = 2;
const OFFLINE_STORE       = 'offline-queue';
const TODO_STORE          = 'todos';
const DEVICE_ID           = (() => {
  let id = localStorage.getItem('ss-device-id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('ss-device-id', id); }
  return id;
})();

// ── Entity definitions (used for CRUD modals) ─────────────────────────────────
const ENTITIES = {
  tasks: {
    label: 'Naloge', icon: '✅', endpoint: '/api/tasks',
    fields: [
      { key: 'title',            label: 'Naslov',     type: 'text',           required: true },
      { key: 'description',      label: 'Opis',       type: 'textarea',       required: false },
      { key: 'deadline',         label: 'Rok',        type: 'datetime-local', required: false },
      { key: 'status',           label: 'Status',     type: 'select',         required: true,  options: ['todo','in_progress','done'] },
      { key: 'estimatedMinutes', label: 'Čas (min)',  type: 'number',         required: false, default: 30 },
      { key: 'order',            label: 'Vrstni red', type: 'number',         required: false, default: 1 },
      { key: 'goalId',           label: 'Goal ID',    type: 'text',           required: false }
    ],
    displayField: 'title', searchFields: ['title', 'description']
  },
  goals: {
    label: 'Cilji', icon: '🎯', endpoint: '/api/goals',
    fields: [
      { key: 'title',       label: 'Naslov',     type: 'text',           required: true },
      { key: 'description', label: 'Opis',       type: 'textarea',       required: false },
      { key: 'deadline',    label: 'Rok',        type: 'datetime-local', required: false },
      { key: 'priority',    label: 'Prioriteta', type: 'select',         required: true, options: ['low','medium','high'] },
      { key: 'status',      label: 'Status',     type: 'select',         required: true, options: ['planned','in_progress','completed','cancelled'] },
      { key: 'userId',      label: 'User ID',    type: 'text',           required: true,  default: 'user-1' },
      { key: 'subjectId',   label: 'Subject ID', type: 'text',           required: false }
    ],
    displayField: 'title', searchFields: ['title', 'description']
  },
  subjects: {
    label: 'Predmeti', icon: '📚', endpoint: '/api/subjects',
    fields: [
      { key: 'name',        label: 'Ime',     type: 'text',     required: true },
      { key: 'description', label: 'Opis',    type: 'textarea', required: false },
      { key: 'color',       label: 'Barva',   type: 'color',    required: true,  default: '#2D8CFF' },
      { key: 'userId',      label: 'User ID', type: 'text',     required: true,  default: 'user-1' }
    ],
    displayField: 'name', searchFields: ['name', 'description']
  },
  sprints: {
    label: 'Sprinti', icon: '⚡', endpoint: '/api/sprints',
    fields: [
      { key: 'startTime',       label: 'Začetek',        type: 'datetime-local', required: false },
      { key: 'endTime',         label: 'Konec',          type: 'datetime-local', required: false },
      { key: 'durationMinutes', label: 'Trajanje (min)', type: 'number',         required: true,  default: 25 },
      { key: 'status',          label: 'Status',         type: 'select',         required: true,  options: ['planned','active','finished','cancelled'] },
      { key: 'notes',           label: 'Opombe',         type: 'textarea',       required: false },
      { key: 'userId',          label: 'User ID',        type: 'text',           required: true,  default: 'user-1' },
      { key: 'taskId',          label: 'Task ID',        type: 'text',           required: false }
    ],
    displayField: 'notes', searchFields: ['notes']
  },
  progress: {
    label: 'Napredek', icon: '📈', endpoint: '/api/progress',
    fields: [
      { key: 'date',                label: 'Datum',             type: 'date',   required: true },
      { key: 'completedTasks',      label: 'Opravljene naloge', type: 'number', required: true, default: 0 },
      { key: 'sprintCount',         label: 'Štev. sprintov',    type: 'number', required: true, default: 0 },
      { key: 'totalStudyMinutes',   label: 'Skupaj minut',      type: 'number', required: true, default: 0 },
      { key: 'completionPercentage',label: 'Dokončano (%)',      type: 'number', required: true, default: 0 },
      { key: 'userId',              label: 'User ID',           type: 'text',   required: true, default: 'user-1' }
    ],
    displayField: 'date', searchFields: ['date']
  },
  reminders: {
    label: 'Opomniki', icon: '🔔', endpoint: '/api/reminders',
    fields: [
      { key: 'type',         label: 'Tip',           type: 'select',         required: true, options: ['goal','task','general'] },
      { key: 'scheduledFor', label: 'Načrtovano za', type: 'datetime-local', required: true },
      { key: 'status',       label: 'Status',        type: 'select',         required: true, options: ['pending','sent','cancelled'] },
      { key: 'channel',      label: 'Kanal',         type: 'select',         required: true, options: ['push','email','in_app'] },
      { key: 'userId',       label: 'User ID',       type: 'text',           required: true, default: 'user-1' },
      { key: 'goalId',       label: 'Goal ID',       type: 'text',           required: false },
      { key: 'taskId',       label: 'Task ID',       type: 'text',           required: false }
    ],
    displayField: 'type', searchFields: ['type', 'channel']
  },
  groups: {
    label: 'Skupine', icon: '👥', endpoint: '/api/groups',
    fields: [
      { key: 'name',            label: 'Ime',      type: 'text',     required: true },
      { key: 'description',     label: 'Opis',     type: 'textarea', required: false },
      { key: 'createdByUserId', label: 'Ustvaril', type: 'text',     required: true, default: 'user-1' }
    ],
    displayField: 'name', searchFields: ['name', 'description']
  },
  'group-memberships': {
    label: 'Člani skupin', icon: '🤝', endpoint: '/api/group-memberships',
    fields: [
      { key: 'userId',  label: 'User ID',  type: 'text',   required: true, default: 'user-1' },
      { key: 'groupId', label: 'Group ID', type: 'text',   required: true },
      { key: 'role',    label: 'Vloga',    type: 'select', required: true, options: ['owner','member','moderator'] }
    ],
    displayField: 'userId', searchFields: ['userId', 'groupId'],
    noUpdate: true
  },
  'group-challenges': {
    label: 'Izzivi skupin', icon: '🏆', endpoint: '/api/group-challenges',
    fields: [
      { key: 'title',       label: 'Naslov',          type: 'text',     required: true },
      { key: 'description', label: 'Opis',            type: 'textarea', required: false },
      { key: 'startDate',   label: 'Začetek',         type: 'date',     required: true },
      { key: 'endDate',     label: 'Konec',           type: 'date',     required: true },
      { key: 'targetValue', label: 'Ciljna vrednost', type: 'number',   required: true, default: 5 },
      { key: 'status',      label: 'Status',          type: 'select',   required: true, options: ['planned','active','completed','cancelled'] },
      { key: 'groupId',     label: 'Group ID',        type: 'text',     required: true }
    ],
    displayField: 'title', searchFields: ['title', 'description']
  }
};

// ── Application state ─────────────────────────────────────────────────────────
const state = {
  currentView:   'dashboard',
  currentEntity: 'tasks',
  taskFilter:    'all',
  taskSearch:    '',
  token:         null,
  tokenExpiry:   0,
  editingId:     null,
  isOnline:      navigator.onLine,
  todoVisible:   false,
  cache: {
    tasks: [], goals: [], subjects: [], sprints: [], progress: [],
    reminders: [], groups: [], 'group-memberships': [], 'group-challenges': []
  }
};

// ── Sprint state ──────────────────────────────────────────────────────────────
const sprintSt = {
  active:           false,
  id:               null,
  taskTitle:        '',
  remainingSeconds: 0,
  totalSeconds:     0,
  intervalId:       null
};

// ── IndexedDB ─────────────────────────────────────────────────────────────────
let db = null;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      Object.keys(ENTITIES).forEach((entity) => {
        if (!database.objectStoreNames.contains(entity))
          database.createObjectStore(entity, { keyPath: 'id' });
      });
      if (!database.objectStoreNames.contains(OFFLINE_STORE)) {
        const os = database.createObjectStore(OFFLINE_STORE, { keyPath: 'queueId', autoIncrement: true });
        os.createIndex('entity', 'entity');
      }
      if (!database.objectStoreNames.contains(TODO_STORE))
        database.createObjectStore(TODO_STORE, { keyPath: 'id' });
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

function dbGetAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

function dbPut(storeName, item) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(item);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

function dbReplaceAll(storeName, items) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    items.forEach((item) => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror    = (e) => reject(e.target.error);
  });
}

function dbDelete(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

// ── OAuth ─────────────────────────────────────────────────────────────────────
async function getToken() {
  if (state.token && Date.now() < state.tokenExpiry - 30_000) return state.token;

  const res = await fetch(`${API_BASE}/oauth/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET
    })
  });

  if (!res.ok) throw new Error('OAuth: pridobivanje žetona ni uspelo');
  const data        = await res.json();
  state.token       = data.access_token;
  state.tokenExpiry = Date.now() + data.expires_in * 1000;
  return state.token;
}

// ── API layer ─────────────────────────────────────────────────────────────────
async function apiRequest(method, path, body = null) {
  const token   = await getToken();
  const options = {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);

  const res  = await fetch(`${API_BASE}${path}`, options);
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function fetchEntity(key) {
  const cfg = ENTITIES[key];
  try {
    if (!state.isOnline) throw new Error('offline');
    const result     = await apiRequest('GET', cfg.endpoint);
    state.cache[key] = Array.isArray(result.data) ? result.data : [];
    await dbReplaceAll(key, state.cache[key]);
  } catch (_) {
    state.cache[key] = await dbGetAll(key);
    if (!state.isOnline) showBanner('Offline: prikazujem predpomnjene podatke', 'warning');
  }
  return state.cache[key];
}

// ── Offline queue ─────────────────────────────────────────────────────────────
async function enqueueOfflineOperation(entity, operation, id, payload) {
  const entry = { entity, operation, id, payload, timestamp: Date.now() };
  await dbPut(OFFLINE_STORE, entry);
  return entry;
}

async function processOfflineQueue() {
  const queue = await dbGetAll(OFFLINE_STORE);
  if (!queue.length) return;

  showBanner(`Sinhronizacija ${queue.length} lokalnih sprememb…`, 'info');
  let ok = 0, fail = 0;

  for (const entry of queue) {
    try {
      const ep = ENTITIES[entry.entity]?.endpoint;
      if (!ep) { fail++; continue; }

      if (entry.operation === 'create')      await apiRequest('POST',   ep,                  entry.payload);
      else if (entry.operation === 'update') await apiRequest('PUT',    `${ep}/${entry.id}`, entry.payload);
      else if (entry.operation === 'delete') await apiRequest('DELETE', `${ep}/${entry.id}`);

      await dbDelete(OFFLINE_STORE, entry.queueId);
      ok++;
    } catch (_) { fail++; }
  }

  showBanner(`Sinhronizacija: ${ok} uspešnih, ${fail} neuspešnih`, ok > 0 ? 'success' : 'error');
  if (ok > 0) await renderCurrentView();
}

// ── CRUD operations ───────────────────────────────────────────────────────────
async function doCreateItem(entityKey, payload) {
  const cfg = ENTITIES[entityKey];
  try {
    const result = await apiRequest('POST', cfg.endpoint, payload);
    await dbPut(entityKey, result.data);
    showBanner('Uspešno ustvarjeno!', 'success');
    notifyOS('StudySprint', `Nov zapis (${cfg.label}) ustvarjen`);
    state.cache[entityKey] = await dbGetAll(entityKey);
  } catch (err) {
    if (!state.isOnline) {
      const tempItem = { ...payload, id: `temp-${Date.now()}` };
      await dbPut(entityKey, tempItem);
      await enqueueOfflineOperation(entityKey, 'create', null, payload);
      state.cache[entityKey] = await dbGetAll(entityKey);
      showBanner('Offline: sprememba bo sinhronizirana ob ponovni vzpostavitvi', 'warning');
    } else {
      showBanner(`Napaka: ${err.message}`, 'error');
      return false;
    }
  }
  return true;
}

async function doUpdateItem(entityKey, id, payload) {
  const cfg = ENTITIES[entityKey];
  try {
    const result = await apiRequest('PUT', `${cfg.endpoint}/${id}`, payload);
    await dbPut(entityKey, result.data);
    showBanner('Uspešno posodobljeno!', 'success');
    state.cache[entityKey] = await dbGetAll(entityKey);
  } catch (err) {
    if (!state.isOnline) {
      await enqueueOfflineOperation(entityKey, 'update', id, payload);
      showBanner('Offline: posodobitev bo sinhronizirana', 'warning');
    } else {
      showBanner(`Napaka: ${err.message}`, 'error');
      return false;
    }
  }
  return true;
}

async function doDeleteItem(entityKey, id) {
  if (!confirm('Izbriši ta zapis?')) return false;
  const cfg = ENTITIES[entityKey];
  try {
    await apiRequest('DELETE', `${cfg.endpoint}/${id}`);
    await dbDelete(entityKey, id);
    showBanner('Uspešno izbrisano!', 'success');
    state.cache[entityKey] = await dbGetAll(entityKey);
  } catch (err) {
    if (!state.isOnline) {
      await dbDelete(entityKey, id);
      await enqueueOfflineOperation(entityKey, 'delete', id, null);
      state.cache[entityKey] = await dbGetAll(entityKey);
      showBanner('Offline: brisanje bo sinhronizirano', 'warning');
    } else {
      showBanner(`Napaka: ${err.message}`, 'error');
      return false;
    }
  }
  return true;
}

// ── Sprint timer ──────────────────────────────────────────────────────────────
async function startSprint(taskId, taskTitle, durationMinutes) {
  if (sprintSt.active) return;

  let sprintId = null;
  try {
    const result = await apiRequest('POST', '/api/sprints', {
      startTime:       new Date().toISOString(),
      durationMinutes,
      status:          'active',
      notes:           `Sprint: ${taskTitle}`,
      userId:          'user-1',
      ...(taskId ? { taskId } : {})
    });
    sprintId = result.data.id;
    await dbPut('sprints', result.data);
  } catch (_) {
    sprintId = `temp-${Date.now()}`;
  }

  sprintSt.active           = true;
  sprintSt.id               = sprintId;
  sprintSt.taskTitle        = taskTitle;
  sprintSt.totalSeconds     = durationMinutes * 60;
  sprintSt.remainingSeconds = durationMinutes * 60;

  sprintSt.intervalId = setInterval(() => {
    sprintSt.remainingSeconds--;
    updateSprintDisplays();
    if (sprintSt.remainingSeconds <= 0) finishSprint();
  }, 1000);

  updateSprintDisplays();
  showBanner(`Sprint začet! ${durationMinutes} min – ${taskTitle}`, 'success');
  notifyOS('StudySprint', `Sprint začet: ${taskTitle}`);
}

async function finishSprint() {
  if (!sprintSt.active) return;
  clearInterval(sprintSt.intervalId);

  try {
    await apiRequest('PUT', `/api/sprints/${sprintSt.id}`, {
      endTime: new Date().toISOString(),
      status:  'finished'
    });
  } catch (_) { /* best effort */ }

  notifyOS('StudySprint', `Sprint zaključen! 🎉 ${sprintSt.taskTitle}`);
  showBanner('Sprint uspešno zaključen! 🎉', 'success');

  sprintSt.active           = false;
  sprintSt.id               = null;
  sprintSt.taskTitle        = '';
  sprintSt.remainingSeconds = 0;
  sprintSt.intervalId       = null;

  await fetchEntity('sprints');
  updateSprintDisplays();
  if (state.currentView === 'dashboard' || state.currentView === 'sprints')
    await renderCurrentView();
}

async function cancelSprint() {
  if (!sprintSt.active || !confirm('Prekini trenutni sprint?')) return;
  clearInterval(sprintSt.intervalId);

  try {
    await apiRequest('PUT', `/api/sprints/${sprintSt.id}`, { status: 'cancelled' });
  } catch (_) { /* best effort */ }

  sprintSt.active     = false;
  sprintSt.id         = null;
  sprintSt.intervalId = null;
  showBanner('Sprint prekinjen', 'warning');
  updateSprintDisplays();
  if (state.currentView === 'dashboard' || state.currentView === 'sprints')
    await renderCurrentView();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateSprintDisplays() {
  document.querySelectorAll('[data-sprint-timer]').forEach((el) => {
    const uid = el.dataset.sprintTimer;
    if (sprintSt.active) {
      const pct = Math.round((1 - sprintSt.remainingSeconds / sprintSt.totalSeconds) * 100);
      el.innerHTML = `
        <div class="timer-ring-wrap">
          <svg class="timer-ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" class="ring-bg"/>
            <circle cx="40" cy="40" r="34" class="ring-fill"
              stroke-dasharray="${(2 * Math.PI * 34).toFixed(2)}"
              stroke-dashoffset="${(2 * Math.PI * 34 * (1 - pct / 100)).toFixed(2)}"/>
          </svg>
          <span class="timer-time">${formatTime(sprintSt.remainingSeconds)}</span>
        </div>
        <div class="timer-info">
          <strong>${esc(sprintSt.taskTitle)}</strong>
          <span>${pct}% opravljeno</span>
        </div>
        <button class="btn btn-danger btn-sm" id="btn-cancel-sprint-${uid}">■ Prekini</button>
      `;
      document.getElementById(`btn-cancel-sprint-${uid}`)
        ?.addEventListener('click', cancelSprint);
    } else {
      el.innerHTML = `<p class="empty-hint">Ni aktivnega sprinta.</p>`;
    }
  });
}

// ── Navigation ────────────────────────────────────────────────────────────────
function switchView(view) {
  state.currentView = view;
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  renderCurrentView();
}

async function renderCurrentView() {
  switch (state.currentView) {
    case 'dashboard': return renderDashboard();
    case 'tasks':     return renderTasksView();
    case 'sprints':   return renderSprintsView();
    case 'progress':  return renderProgressView();
    case 'more':      return renderMoreView();
    default:          return renderDashboard();
  }
}

// ── Dashboard view ────────────────────────────────────────────────────────────
async function renderDashboard() {
  setMainHTML('<div class="loading-state">Nalaganje…</div>');
  await Promise.all([fetchEntity('tasks'), fetchEntity('sprints'), fetchEntity('progress')]);

  const tasks   = state.cache.tasks;
  const now     = new Date();
  const today   = now.toDateString();

  const pending   = tasks.filter((t) => t.status !== 'done');
  const overdue   = pending.filter((t) => t.deadline && new Date(t.deadline) < now && new Date(t.deadline).toDateString() !== today);
  const dueToday  = pending.filter((t) => t.deadline && new Date(t.deadline).toDateString() === today);
  const noDue     = pending.filter((t) => !t.deadline);
  const showcase  = [...overdue, ...dueToday, ...noDue].slice(0, 6);

  const todayProgress   = state.cache.progress.find((p) => new Date(p.date).toDateString() === today);
  const doneCnt         = tasks.filter((t) => t.status === 'done').length;
  const finishedSprints = state.cache.sprints.filter((s) => s.status === 'finished').length;

  setMainHTML(`
    <div class="view view-dashboard">
      <div class="dash-greeting">
        <div>
          <h2>${getGreeting()}! 👋</h2>
          <p class="date-str">${formatDayStr()}</p>
        </div>
        <div class="dash-mini-stats">
          <span class="mini-stat"><strong>${doneCnt}</strong> dokončano</span>
          <span class="mini-stat"><strong>${pending.length}</strong> preostalo</span>
        </div>
      </div>

      <section class="dash-section">
        <div class="dash-section-header">
          <h3>⚡ Aktivni sprint</h3>
        </div>
        <div class="sprint-widget" data-sprint-timer="dash"></div>
        ${!sprintSt.active ? `
          <button class="btn btn-primary btn-full mt-8" id="btn-quick-sprint">▶ Pojdi na sprintanje</button>
        ` : ''}
      </section>

      <section class="dash-section">
        <div class="dash-section-header">
          <h3>✅ Naloge</h3>
          <button class="link-btn" data-switch-view="tasks">Vse →</button>
        </div>
        ${showcase.length ? `
          <div class="task-quick-list">
            ${showcase.map((t) => `
              <div class="task-quick-item${overdue.includes(t) ? ' overdue' : ''}">
                <button class="tq-check${t.status === 'done' ? ' checked' : ''}" data-id="${t.id}" title="Označi kot dokončano">
                  ${t.status === 'done' ? '✓' : ''}
                </button>
                <span class="tq-title">${esc(t.title)}</span>
                <span class="tq-meta">
                  ${t.deadline ? `<span class="tq-deadline${overdue.includes(t) ? ' late' : ''}">${formatDeadline(t.deadline)}</span>` : ''}
                  ${t.estimatedMinutes ? `<span class="tq-dur">${t.estimatedMinutes}min</span>` : ''}
                </span>
              </div>
            `).join('')}
          </div>
        ` : '<p class="empty-hint">Vse naloge so dokončane! 🎉</p>'}
      </section>

      <section class="dash-stats-row">
        <div class="stat-card">
          <span class="stat-num">${doneCnt}</span>
          <span class="stat-label">Dokončane<br>naloge</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${finishedSprints}</span>
          <span class="stat-label">Zaključeni<br>sprinti</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${todayProgress ? todayProgress.totalStudyMinutes : 0}</span>
          <span class="stat-label">Minut<br>danes</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">${todayProgress ? todayProgress.completionPercentage : 0}%</span>
          <span class="stat-label">Dokončano<br>danes</span>
        </div>
      </section>
    </div>
  `);

  updateSprintDisplays();

  document.querySelectorAll('.tq-check').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const task = state.cache.tasks.find((t) => t.id === btn.dataset.id);
      if (!task) return;
      await doUpdateItem('tasks', task.id, { ...task, status: task.status === 'done' ? 'todo' : 'done' });
      renderDashboard();
    });
  });

  document.querySelectorAll('[data-switch-view]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.switchView));
  });

  document.getElementById('btn-quick-sprint')
    ?.addEventListener('click', () => switchView('sprints'));
}

// ── Tasks view ────────────────────────────────────────────────────────────────
async function renderTasksView() {
  setMainHTML('<div class="loading-state">Nalaganje nalog…</div>');
  await fetchEntity('tasks');

  const all      = state.cache.tasks;
  const filtered = all.filter((t) => {
    const matchFilter = state.taskFilter === 'all' || t.status === state.taskFilter;
    const matchSearch = !state.taskSearch.trim() ||
      t.title.toLowerCase().includes(state.taskSearch.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(state.taskSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all:         all.length,
    todo:        all.filter((t) => t.status === 'todo').length,
    in_progress: all.filter((t) => t.status === 'in_progress').length,
    done:        all.filter((t) => t.status === 'done').length
  };

  setMainHTML(`
    <div class="view view-tasks">
      <div class="view-toolbar">
        <div class="filter-tabs">
          ${[['all','Vse'],['todo','Čaka'],['in_progress','V teku'],['done','Dokončano']].map(([k, l]) => `
            <button class="filter-tab${state.taskFilter === k ? ' active' : ''}" data-filter="${k}">
              ${l} <span class="filter-count">${counts[k]}</span>
            </button>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-task">+ Naloga</button>
      </div>

      <div class="search-bar">
        <input type="search" id="task-search" value="${esc(state.taskSearch)}"
          placeholder="Iskanje nalog… (Alt+F)" autocomplete="off">
      </div>

      <div class="task-list" id="task-list">
        ${filtered.length
          ? filtered.map((t) => renderTaskCard(t)).join('')
          : `<div class="empty-state">
               <p>Ni nalog${state.taskFilter !== 'all' ? ' v tem filtru' : ''}.</p>
               <button class="btn btn-primary" id="btn-add-task-empty">+ Dodaj nalogo</button>
             </div>`
        }
      </div>
    </div>
  `);

  document.querySelectorAll('.filter-tab').forEach((btn) => {
    btn.addEventListener('click', () => { state.taskFilter = btn.dataset.filter; renderTasksView(); });
  });

  const searchEl = document.getElementById('task-search');
  if (searchEl) {
    searchEl.addEventListener('input', (e) => { state.taskSearch = e.target.value; renderTasksView(); });
    if (state.taskSearch) { searchEl.focus(); searchEl.setSelectionRange(9999, 9999); }
  }

  ['btn-add-task', 'btn-add-task-empty'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () => openAddModal('tasks'));
  });

  wireTaskCardActions();
}

function renderTaskCard(task) {
  const statusLabel = { todo: 'Čaka', in_progress: 'V teku', done: 'Dokončano' }[task.status] || task.status;
  const isOverdue   = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
  return `
    <div class="task-card task-${task.status}${isOverdue ? ' task-overdue' : ''}">
      <button class="task-status-btn" data-id="${task.id}" data-status="${task.status}" title="Klikni za naslednji status">
        ${{ todo: '○', in_progress: '◷', done: '✓' }[task.status] || '○'}
      </button>
      <div class="task-card-body">
        <div class="task-card-title">${esc(task.title)}</div>
        <div class="task-card-meta">
          <span class="status-badge status-${task.status}">${statusLabel}</span>
          ${task.deadline ? `<span class="meta-item${isOverdue ? ' meta-danger' : ''}">📅 ${formatDeadline(task.deadline)}</span>` : ''}
          ${task.estimatedMinutes ? `<span class="meta-item">⏱ ${task.estimatedMinutes} min</span>` : ''}
        </div>
        ${task.description ? `<div class="task-card-desc">${esc(task.description)}</div>` : ''}
      </div>
      <div class="task-card-actions">
        <button class="icon-btn" data-edit-id="${task.id}" title="Uredi">✏️</button>
        <button class="icon-btn icon-btn-danger" data-delete-id="${task.id}" title="Izbriši">🗑</button>
      </div>
    </div>
  `;
}

function wireTaskCardActions() {
  const cycle = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
  document.querySelectorAll('.task-status-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const task = state.cache.tasks.find((t) => t.id === btn.dataset.id);
      if (!task) return;
      await doUpdateItem('tasks', task.id, { ...task, status: cycle[task.status] || 'todo' });
      renderTasksView();
    });
  });
  document.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal('tasks', btn.dataset.editId));
  });
  document.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await doDeleteItem('tasks', btn.dataset.deleteId);
      renderTasksView();
    });
  });
}

// ── Sprints view ──────────────────────────────────────────────────────────────
async function renderSprintsView() {
  setMainHTML('<div class="loading-state">Nalaganje…</div>');
  await Promise.all([fetchEntity('sprints'), fetchEntity('tasks')]);

  const pendingTasks = state.cache.tasks.filter((t) => t.status !== 'done');
  const history      = [...state.cache.sprints].sort((a, b) =>
    new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()
  );

  setMainHTML(`
    <div class="view view-sprints">

      ${sprintSt.active ? `
        <section class="dash-section">
          <h3>⚡ Aktivni sprint</h3>
          <div class="sprint-widget sprint-widget-lg" data-sprint-timer="sprints"></div>
        </section>
      ` : `
        <section class="sprint-start-panel">
          <h3>Začni nov sprint</h3>
          <div class="form-group">
            <label>Naloga (neobvezno)</label>
            <select id="sprint-task-sel">
              <option value="">– prosti sprint –</option>
              ${pendingTasks.map((t) => `<option value="${t.id}" data-title="${esc(t.title)}">${esc(t.title)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Trajanje</label>
            <div class="duration-grid">
              ${[15, 25, 30, 50].map((d) => `
                <button class="dur-btn${d === 25 ? ' active' : ''}" data-dur="${d}">${d} min</button>
              `).join('')}
            </div>
          </div>
          <button class="btn btn-primary btn-full btn-lg" id="btn-start-sprint">▶ Začni sprint</button>
        </section>
      `}

      <section class="dash-section">
        <h3>Zgodovina sprintov</h3>
        ${history.length ? `
          <div class="sprint-history">
            ${history.slice(0, 20).map((s) => `
              <div class="sprint-history-item">
                <span class="sh-icon">${{ active:'⚡', finished:'✓', cancelled:'✕', planned:'○' }[s.status] || '?'}</span>
                <div class="sh-body">
                  <span class="sh-title">${esc(s.notes || '–')}</span>
                  <span class="sh-meta">${s.durationMinutes} min · ${s.startTime ? formatDate(s.startTime) : '–'}</span>
                </div>
                <span class="status-badge status-${s.status}">${s.status}</span>
              </div>
            `).join('')}
          </div>
        ` : '<p class="empty-hint">Še ni zgodovine sprintov.</p>'}
      </section>
    </div>
  `);

  updateSprintDisplays();

  let selectedDuration = 25;
  document.querySelectorAll('.dur-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dur-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDuration = parseInt(btn.dataset.dur, 10);
    });
  });

  document.getElementById('btn-start-sprint')?.addEventListener('click', async () => {
    const sel       = document.getElementById('sprint-task-sel');
    const taskId    = sel?.value || null;
    const taskTitle = taskId
      ? sel?.options[sel.selectedIndex]?.dataset.title || 'Naloga'
      : 'Prosti sprint';
    await startSprint(taskId, taskTitle, selectedDuration);
    renderSprintsView();
  });
}

// ── Progress view ─────────────────────────────────────────────────────────────
async function renderProgressView() {
  setMainHTML('<div class="loading-state">Nalaganje…</div>');
  await fetchEntity('progress');

  const records    = [...state.cache.progress].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalMin   = records.reduce((s, r) => s + (r.totalStudyMinutes || 0), 0);
  const totalTasks = records.reduce((s, r) => s + (r.completedTasks || 0), 0);
  const totalSp    = records.reduce((s, r) => s + (r.sprintCount || 0), 0);

  setMainHTML(`
    <div class="view view-progress">
      <div class="progress-summary">
        <div class="stat-card"><span class="stat-num">${totalTasks}</span><span class="stat-label">Skupaj nalog</span></div>
        <div class="stat-card"><span class="stat-num">${totalSp}</span><span class="stat-label">Skupaj sprintov</span></div>
        <div class="stat-card"><span class="stat-num">${totalMin}</span><span class="stat-label">Skupaj minut</span></div>
      </div>

      <div class="view-toolbar" style="margin-bottom:0">
        <h3>Dnevni napredek</h3>
        <button class="btn btn-primary btn-sm" id="btn-add-progress">+ Dodaj</button>
      </div>

      ${records.length ? `
        <div class="progress-list">
          ${records.map((r) => `
            <div class="progress-record">
              <div class="pr-date">${formatDate(r.date)}</div>
              <div class="pr-bars">
                <div class="pr-bar-row">
                  <span class="pr-label">Naloge</span>
                  <div class="pr-bar-track"><div class="pr-bar-fill" style="width:${Math.min(100, (r.completedTasks || 0) * 10)}%"></div></div>
                  <span class="pr-val">${r.completedTasks}</span>
                </div>
                <div class="pr-bar-row">
                  <span class="pr-label">Dokončano</span>
                  <div class="pr-bar-track"><div class="pr-bar-fill accent" style="width:${Math.min(100, r.completionPercentage || 0)}%"></div></div>
                  <span class="pr-val">${r.completionPercentage}%</span>
                </div>
                <div class="pr-bar-row">
                  <span class="pr-label">Čas</span>
                  <div class="pr-bar-track"><div class="pr-bar-fill success" style="width:${Math.min(100, (r.totalStudyMinutes || 0) / 2)}%"></div></div>
                  <span class="pr-val">${r.totalStudyMinutes}min</span>
                </div>
              </div>
              <div class="pr-actions">
                <button class="icon-btn" data-edit-prog="${r.id}">✏️</button>
                <button class="icon-btn icon-btn-danger" data-del-prog="${r.id}">🗑</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<p class="empty-hint">Ni zabeleženih podatkov o napredku.</p>'}
    </div>
  `);

  document.getElementById('btn-add-progress')?.addEventListener('click', () => openAddModal('progress'));
  document.querySelectorAll('[data-edit-prog]').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal('progress', btn.dataset.editProg))
  );
  document.querySelectorAll('[data-del-prog]').forEach((btn) =>
    btn.addEventListener('click', async () => { await doDeleteItem('progress', btn.dataset.delProg); renderProgressView(); })
  );
}

// ── More view ─────────────────────────────────────────────────────────────────
function renderMoreView() {
  const moreEntities = [
    ['goals',             '🎯', 'Cilji'],
    ['subjects',          '📚', 'Predmeti'],
    ['reminders',         '🔔', 'Opomniki'],
    ['groups',            '👥', 'Skupine'],
    ['group-memberships', '🤝', 'Člani skupin'],
    ['group-challenges',  '🏆', 'Izzivi skupin']
  ];

  setMainHTML(`
    <div class="view view-more">
      <section class="more-section">
        <h3 class="more-section-title">Upravljanje</h3>
        <div class="more-grid">
          ${moreEntities.map(([key, icon, label]) => `
            <button class="more-card" data-more-entity="${key}">
              <span class="more-card-icon">${icon}</span>
              <span class="more-card-label">${label}</span>
            </button>
          `).join('')}
        </div>
      </section>

      <section class="more-section">
        <h3 class="more-section-title">Aplikacija</h3>
        <div class="more-list">
          <button class="more-list-item" id="btn-push-more"><span>🔔</span><span>Aktiviraj push obvestila</span></button>
          <button class="more-list-item" id="btn-sync-more"><span>🔄</span><span>Ročna sinhronizacija</span></button>
          <a class="more-list-item" href="/ER/mermaid-diagram.png" target="_blank" rel="noopener">
            <span>📊</span><span>ER diagram</span><span class="more-arrow">↗</span>
          </a>
        </div>
      </section>

      <section class="more-section">
        <h3 class="more-section-title">Bližnjice tipkovnice</h3>
        <div class="shortcuts-list">
          <div class="shortcut-item"><kbd>Alt+N</kbd> Nova naloga</div>
          <div class="shortcut-item"><kbd>Alt+T</kbd> Todo seznam</div>
          <div class="shortcut-item"><kbd>Alt+F</kbd> Iskanje nalog</div>
          <div class="shortcut-item"><kbd>Alt+S</kbd> Sinhronizacija</div>
          <div class="shortcut-item"><kbd>Esc</kbd> Zapri</div>
        </div>
      </section>
    </div>
  `);

  document.querySelectorAll('[data-more-entity]').forEach((btn) =>
    btn.addEventListener('click', () => renderEntityList(btn.dataset.moreEntity))
  );
  document.getElementById('btn-push-more')?.addEventListener('click', subscribeToPush);
  document.getElementById('btn-sync-more')?.addEventListener('click', async () => {
    showBanner('Sinhronizacija…', 'info');
    await processOfflineQueue();
    showBanner('Podatki osveženi', 'success');
  });
}

// ── Entity list (More → entity) ───────────────────────────────────────────────
async function renderEntityList(key) {
  const cfg = ENTITIES[key];
  setMainHTML('<div class="loading-state">Nalaganje…</div>');
  await fetchEntity(key);

  setMainHTML(`
    <div class="view view-entity-list">
      <div class="entity-list-header">
        <button class="btn btn-secondary btn-sm" id="btn-back-more">← Nazaj</button>
        <h2>${cfg.icon} ${cfg.label}</h2>
        ${!cfg.noUpdate ? `<button class="btn btn-primary btn-sm" id="btn-add-entity">+ Dodaj</button>` : '<span></span>'}
      </div>
      ${state.cache[key].length ? `
        <div class="entity-list">
          ${state.cache[key].map((item) => `
            <div class="entity-card">
              <div class="entity-card-main">
                <div class="entity-card-title">${esc(item[cfg.displayField] ?? item.id)}</div>
                <div class="entity-card-id">${item.id}</div>
              </div>
              <div class="entity-card-actions">
                ${!cfg.noUpdate ? `<button class="icon-btn" data-edit-ent="${item.id}">✏️</button>` : ''}
                <button class="icon-btn icon-btn-danger" data-del-ent="${item.id}">🗑</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<p class="empty-hint">Ni podatkov.</p>'}
    </div>
  `);

  document.getElementById('btn-back-more')?.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === 'more'));
    renderMoreView();
  });
  document.getElementById('btn-add-entity')?.addEventListener('click', () => openAddModal(key));
  document.querySelectorAll('[data-edit-ent]').forEach((btn) =>
    btn.addEventListener('click', () => openEditModal(key, btn.dataset.editEnt))
  );
  document.querySelectorAll('[data-del-ent]').forEach((btn) =>
    btn.addEventListener('click', async () => { await doDeleteItem(key, btn.dataset.delEnt); renderEntityList(key); })
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openAddModal(entityKey) {
  state.currentEntity = entityKey;
  state.editingId     = null;
  document.getElementById('modal-title').textContent = `Dodaj – ${ENTITIES[entityKey].label}`;
  renderForm(null);
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('entity-form').querySelector('input,textarea,select')?.focus();
}

function openEditModal(entityKey, id) {
  state.currentEntity = entityKey;
  const item = state.cache[entityKey]?.find((i) => i.id === id);
  if (!item) return;
  state.editingId = id;
  document.getElementById('modal-title').textContent = `Uredi – ${ENTITIES[entityKey].label}`;
  renderForm(item);
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  state.editingId = null;
}

function renderForm(item) {
  const cfg  = ENTITIES[state.currentEntity];
  const form = document.getElementById('entity-form');
  form.innerHTML = cfg.fields.map((f) => {
    let val = item ? (item[f.key] ?? '') : (f.default ?? '');
    if (f.type === 'datetime-local' && val) val = String(val).slice(0, 16);

    let input;
    if (f.type === 'textarea') {
      input = `<textarea name="${f.key}"${f.required ? ' required' : ''}>${esc(String(val))}</textarea>`;
    } else if (f.type === 'select') {
      input = `<select name="${f.key}"${f.required ? ' required' : ''}>
        ${!f.required ? `<option value="">– izberi –</option>` : ''}
        ${f.options.map((o) => `<option value="${o}"${o === val ? ' selected' : ''}>${o}</option>`).join('')}
      </select>`;
    } else {
      input = `<input type="${f.type}" name="${f.key}" value="${esc(String(val))}"${f.required ? ' required' : ''}>`;
    }
    return `<div class="form-group">
      <label>${f.label}${f.required ? ' <span class="req">*</span>' : ''}</label>
      ${input}
    </div>`;
  }).join('');
}

function collectFormData() {
  const cfg  = ENTITIES[state.currentEntity];
  const form = document.getElementById('entity-form');
  const data = {};
  cfg.fields.forEach((f) => {
    const el = form.querySelector(`[name="${f.key}"]`);
    if (!el || el.value === '') return;
    if (f.type === 'number')                           data[f.key] = Number(el.value);
    else if (f.type === 'datetime-local' && el.value)  data[f.key] = new Date(el.value).toISOString();
    else                                               data[f.key] = el.value;
  });
  return data;
}

// ── Todo list ─────────────────────────────────────────────────────────────────
async function loadTodos() {
  const todos = await dbGetAll(TODO_STORE);
  todos.sort((a, b) => a.createdAt - b.createdAt);
  renderTodos(todos);
}

async function addTodo(text) {
  if (!text.trim()) return;
  const todo = { id: crypto.randomUUID(), text: text.trim(), done: false, createdAt: Date.now() };
  await dbPut(TODO_STORE, todo);
  await loadTodos();
}

async function toggleTodo(id) {
  const todos = await dbGetAll(TODO_STORE);
  const todo  = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  await dbPut(TODO_STORE, todo);
  await loadTodos();
}

async function deleteTodo(id) {
  await dbDelete(TODO_STORE, id);
  await loadTodos();
}

function renderTodos(todos) {
  const list = document.getElementById('todo-list');
  if (!list) return;
  if (!todos.length) {
    list.innerHTML = '<li class="todo-empty">Ni nalog. Dodaj prvo spodaj.</li>';
  } else {
    list.innerHTML = todos.map((t) => `
      <li class="todo-item${t.done ? ' done' : ''}">
        <button class="todo-check" data-id="${t.id}">${t.done ? '✓' : ''}</button>
        <span class="todo-text">${esc(t.text)}</span>
        <button class="todo-del" data-id="${t.id}" aria-label="Izbriši">✕</button>
      </li>
    `).join('');
    list.querySelectorAll('.todo-check').forEach((btn) => btn.addEventListener('click', () => toggleTodo(btn.dataset.id)));
    list.querySelectorAll('.todo-del').forEach((btn)   => btn.addEventListener('click', () => deleteTodo(btn.dataset.id)));
  }
  const count   = todos.filter((t) => !t.done).length;
  const counter = document.getElementById('todo-count');
  if (counter) counter.textContent = count ? `${count} preostalih` : 'Vse opravljeno!';
}

function toggleTodoPanel() {
  state.todoVisible = !state.todoVisible;
  document.getElementById('todo-panel')?.classList.toggle('hidden', !state.todoVisible);
  document.getElementById('btn-todo')?.classList.toggle('active', state.todoVisible);
  if (state.todoVisible) { loadTodos(); document.getElementById('todo-input')?.focus(); }
}

// ── Notifications ─────────────────────────────────────────────────────────────
let bannerTimer = null;

function showBanner(message, type = 'info') {
  const el = document.getElementById('notification-banner');
  el.textContent = message;
  el.className   = `banner ${type}`;
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.classList.add('hidden'), 4500);
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

function notifyOS(title, body) {
  if (Notification.permission === 'granted')
    new Notification(title, { body, icon: '/pwa/icons/icon.svg' });
}

// ── Push ──────────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64     = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    if (!(await requestNotificationPermission())) return;
    const keyRes       = await fetch(`${API_BASE}/push/vapid-public-key`);
    const { data }     = await keyRes.json();
    const reg          = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey)
    });
    await fetch(`${API_BASE}/push/subscribe`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: DEVICE_ID, subscription })
    });
    showBanner('Push obvestila aktivirana', 'success');
  } catch (err) {
    console.warn('Push subscription failed:', err);
  }
}

// ── Lazy images ───────────────────────────────────────────────────────────────
function initLazyImages() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      });
    }, { rootMargin: '200px' });
    images.forEach((img) => observer.observe(img));
  } else {
    images.forEach((img) => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
  }
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'n') {
      e.preventDefault();
      if (state.currentView === 'tasks') openAddModal('tasks');
      else { switchView('tasks'); setTimeout(() => openAddModal('tasks'), 100); }
    } else if (e.altKey && e.key === 't') {
      e.preventDefault(); toggleTodoPanel();
    } else if (e.altKey && e.key === 'f') {
      e.preventDefault();
      if (state.currentView !== 'tasks') { switchView('tasks'); setTimeout(() => document.getElementById('task-search')?.focus(), 150); }
      else document.getElementById('task-search')?.focus();
    } else if (e.altKey && e.key === 's') {
      e.preventDefault();
      processOfflineQueue();
    } else if (e.key === 'Escape') {
      closeModal();
      if (state.todoVisible) toggleTodoPanel();
    }
  });
}

// ── Network monitoring ────────────────────────────────────────────────────────
function setupNetworkMonitoring() {
  const dot = document.getElementById('online-dot');
  window.addEventListener('online', async () => {
    state.isOnline = true;
    dot?.classList.remove('offline');
    showBanner('Povezava vzpostavljena – sinhronizacija…', 'success');
    notifyOS('StudySprint', 'Ponovna vzpostavitev povezave');
    await processOfflineQueue();
  });
  window.addEventListener('offline', () => {
    state.isOnline = false;
    dot?.classList.add('offline');
    showBanner('Brez povezave – offline način', 'warning');
    notifyOS('StudySprint', 'Izguba omrežne povezave');
  });
  if (dot && !state.isOnline) dot.classList.add('offline');
}

// ── Service worker ────────────────────────────────────────────────────────────
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try { await navigator.serviceWorker.register('/pwa/sw.js', { scope: '/pwa/' }); }
  catch (err) { console.warn('SW registration failed:', err); }
}

// ── Utility ───────────────────────────────────────────────────────────────────
function esc(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

function setMainHTML(html) {
  document.getElementById('app-main').innerHTML = html;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Dobra noč';
  if (h < 12) return 'Dobro jutro';
  if (h < 18) return 'Dober dan';
  return 'Dober večer';
}

function formatDayStr() {
  return new Date().toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDeadline(dateStr) {
  if (!dateStr) return '';
  const d    = new Date(dateStr);
  const now  = new Date();
  const diff = Math.round((d.setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86_400_000);
  if (diff < -1)  return `${Math.abs(diff)} dni zamude`;
  if (diff === -1) return 'včeraj';
  if (diff === 0)  return 'danes';
  if (diff === 1)  return 'jutri';
  if (diff < 7)   return `čez ${diff} dni`;
  return formatDate(dateStr);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function init() {
  try {
    db = await openDatabase();
    await registerServiceWorker();
    await requestNotificationPermission();

    setupKeyboardShortcuts();
    setupNetworkMonitoring();

    // Bottom nav
    document.querySelectorAll('.nav-btn').forEach((btn) =>
      btn.addEventListener('click', () => switchView(btn.dataset.view))
    );

    // Header buttons
    document.getElementById('btn-todo').addEventListener('click', toggleTodoPanel);
    document.getElementById('btn-push').addEventListener('click', subscribeToPush);
    document.getElementById('btn-sync').addEventListener('click', async () => {
      showBanner('Sinhronizacija…', 'info');
      await processOfflineQueue();
      await renderCurrentView();
    });

    // Todo panel
    document.getElementById('btn-todo-close').addEventListener('click', toggleTodoPanel);
    document.getElementById('todo-input').addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') { await addTodo(e.target.value); e.target.value = ''; }
    });
    document.getElementById('btn-todo-add').addEventListener('click', async () => {
      const input = document.getElementById('todo-input');
      await addTodo(input.value);
      input.value = '';
      input.focus();
    });

    // Modal
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal')) closeModal();
    });
    document.getElementById('entity-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data    = collectFormData();
      const key     = state.currentEntity;
      const success = state.editingId
        ? await doUpdateItem(key, state.editingId, data)
        : await doCreateItem(key, data);
      if (success) { closeModal(); await renderCurrentView(); }
    });

    await renderCurrentView();
    setTimeout(subscribeToPush, 3000);

  } catch (err) {
    console.error('Init error:', err);
    setMainHTML(`<div class="error-state">Napaka pri zagonu: ${esc(err.message)}</div>`);
  }
}

document.addEventListener('DOMContentLoaded', init);
