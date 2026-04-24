// Push notification service – VAPID key management and subscription handling
import webpush from "web-push";
import fs from "node:fs";
import path from "node:path";

const VAPID_FILE = path.resolve(process.cwd(), ".auth", "vapid-keys.json");

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

interface PushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

interface StoredSubscription {
  id: string;
  subscription: PushSubscription;
  createdAt: string;
}

function loadOrGenerateVapidKeys(): VapidKeys {
  try {
    const raw = fs.readFileSync(VAPID_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<VapidKeys>;
    if (parsed.publicKey && parsed.privateKey) {
      return { publicKey: parsed.publicKey, privateKey: parsed.privateKey };
    }
  } catch {
    // Generate fresh keys
  }

  const keys = webpush.generateVAPIDKeys();
  fs.mkdirSync(path.dirname(VAPID_FILE), { recursive: true });
  fs.writeFileSync(VAPID_FILE, JSON.stringify(keys, null, 2) + "\n", "utf-8");
  console.log("[push] Generated new VAPID keys.");
  return keys;
}

class PushService {
  private readonly keys: VapidKeys;
  private readonly subscriptions = new Map<string, StoredSubscription>();

  constructor() {
    this.keys = loadOrGenerateVapidKeys();
    webpush.setVapidDetails(
      "mailto:studysprint@example.com",
      this.keys.publicKey,
      this.keys.privateKey
    );
    console.log(`[push] VAPID public key: ${this.keys.publicKey.slice(0, 20)}...`);
  }

  getPublicKey(): string {
    return this.keys.publicKey;
  }

  subscribe(subscription: PushSubscription): string {
    const id = subscription.endpoint.slice(-16).replace(/[^a-z0-9]/gi, "x");
    this.subscriptions.set(id, {
      id,
      subscription,
      createdAt: new Date().toISOString(),
    });
    console.log(`[push] New subscription registered: ${id}`);
    return id;
  }

  unsubscribe(endpoint: string): boolean {
    for (const [id, stored] of this.subscriptions) {
      if (stored.subscription.endpoint === endpoint) {
        this.subscriptions.delete(id);
        return true;
      }
    }
    return false;
  }

  listSubscriptions(): StoredSubscription[] {
    return [...this.subscriptions.values()];
  }

  async sendToAll(payload: object): Promise<{ sent: number; failed: number }> {
    const message = JSON.stringify(payload);
    let sent = 0;
    let failed = 0;

    for (const [id, stored] of this.subscriptions) {
      try {
        await webpush.sendNotification(stored.subscription as webpush.PushSubscription, message);
        sent++;
      } catch (err: unknown) {
        console.error(`[push] Failed to send to ${id}:`, err instanceof Error ? err.message : err);
        // Remove expired subscriptions
        if ((err as { statusCode?: number }).statusCode === 410) {
          this.subscriptions.delete(id);
        }
        failed++;
      }
    }

    return { sent, failed };
  }

  async sendToOne(subscriptionId: string, payload: object): Promise<void> {
    const stored = this.subscriptions.get(subscriptionId);
    if (!stored) throw new Error(`Subscription ${subscriptionId} not found`);
    await webpush.sendNotification(stored.subscription as webpush.PushSubscription, JSON.stringify(payload));
  }
}

export const pushService = new PushService();
