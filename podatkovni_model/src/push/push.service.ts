import webpush, { PushSubscription } from 'web-push';

class PushService {
  private readonly subscriptions = new Map<string, PushSubscription>();
  readonly vapidKeys: { publicKey: string; privateKey: string };

  constructor() {
    this.vapidKeys = webpush.generateVAPIDKeys();
    webpush.setVapidDetails(
      'mailto:studysprint@example.com',
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
    console.log('[Push] VAPID public key:', this.vapidKeys.publicKey);
  }

  subscribe(deviceId: string, subscription: PushSubscription): void {
    this.subscriptions.set(deviceId, subscription);
  }

  unsubscribe(deviceId: string): void {
    this.subscriptions.delete(deviceId);
  }

  async sendToAll(title: string, body: string, data?: unknown): Promise<void> {
    const payload = JSON.stringify({ title, body, data });
    await Promise.allSettled(
      Array.from(this.subscriptions.entries()).map(([id, sub]) =>
        webpush.sendNotification(sub, payload).catch((err: { statusCode?: number }) => {
          if (err.statusCode === 410) this.subscriptions.delete(id);
        })
      )
    );
  }

  async sendToDevice(deviceId: string, title: string, body: string, data?: unknown): Promise<void> {
    const sub = this.subscriptions.get(deviceId);
    if (!sub) return;
    await webpush.sendNotification(sub, JSON.stringify({ title, body, data }));
  }

  get subscriberCount(): number {
    return this.subscriptions.size;
  }
}

export const pushService = new PushService();
