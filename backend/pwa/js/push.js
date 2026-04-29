import { getToken } from './auth.js';

const API_BASE = 'http://localhost:3000';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function initPush() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  try {
    const reg = await navigator.serviceWorker.ready;

    // Pridobi VAPID javni ključ
    const res = await fetch(`${API_BASE}/push/vapid-public-key`);
    const { publicKey } = await res.json();

    // Subscribe
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Pošlji subscription na backend
    await fetch(`${API_BASE}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ subscription }),
    });
  } catch (err) {
    console.error('Push init napaka:', err);
  }
}

export async function unsubscribePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return;

    await fetch(`${API_BASE}/push/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    await subscription.unsubscribe();
  } catch (err) {
    console.error('Push unsubscribe napaka:', err);
  }
}
