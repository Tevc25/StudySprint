import { enqueueOp, dequeueAll, clearQueue } from './db.js';
import { getToken } from './auth.js';

const API_BASE = 'http://localhost:3000';

let onSyncCallback = null;

export function initSync(onSync) {
  onSyncCallback = onSync;

  // Ob vnovični vzpostavitvi povezave
  window.addEventListener('online', handleReconnect);

  // SW sporoči da naj sinhroniziramo (Background Sync)
  navigator.serviceWorker?.addEventListener('message', (e) => {
    if (e.data?.type === 'SYNC_QUEUE') handleReconnect();
  });
}

async function handleReconnect() {
  const ops = await dequeueAll();
  if (!ops.length) return;

  const token = getToken();
  let allOk = true;

  for (const op of ops) {
    try {
      await fetch(`${API_BASE}${op.path}`, {
        method: op.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: op.body ? JSON.stringify(op.body) : undefined,
      });
    } catch {
      allOk = false;
      break;
    }
  }

  if (allOk) {
    await clearQueue();
    if (Notification.permission === 'granted') {
      new Notification('StudySprint', { body: 'Offline spremembe sinhronizirane' });
    }
    onSyncCallback?.();
  }
}

export async function offlineMutate(method, path, body) {
  await enqueueOp({ method, path, body });

  // Poskusi registrirati Background Sync
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('offline-queue');
  } catch {
    // Background Sync ni podprt, sync bo ob online eventu
  }
}
