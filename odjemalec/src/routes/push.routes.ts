// Push notification API routes
import { Router, Request, Response } from "express";
import { pushService } from "../push/push.service";

export const pushRouter = Router();

// GET /api/push/vapid-public-key – returns the VAPID public key for browser subscription
pushRouter.get("/vapid-public-key", (_req: Request, res: Response) => {
  res.json({ success: true, data: { publicKey: pushService.getPublicKey() } });
});

// POST /api/push/subscribe – register a browser push subscription
pushRouter.post("/subscribe", (req: Request, res: Response) => {
  const { endpoint, expirationTime, keys } = req.body ?? {};

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ success: false, message: "Neveljavna push naročnina (manjkajo endpoint ali ključi)." });
    return;
  }

  const id = pushService.subscribe({ endpoint, expirationTime, keys });
  res.status(201).json({ success: true, data: { id, message: "Naročnina uspešno registrirana." } });
});

// DELETE /api/push/subscribe – unregister a push subscription
pushRouter.delete("/subscribe", (req: Request, res: Response) => {
  const { endpoint } = req.body ?? {};
  if (!endpoint) {
    res.status(400).json({ success: false, message: "Manjka endpoint." });
    return;
  }
  const removed = pushService.unsubscribe(endpoint);
  res.json({ success: true, data: { removed } });
});

// POST /api/push/send – send a push notification to all subscribers (for testing/server-triggered events)
pushRouter.post("/send", async (req: Request, res: Response) => {
  const { title = "StudySprint", body = "Nova obvestitev", icon, data } = req.body ?? {};

  const payload = { title, body, icon: icon ?? "/pwa/icons/icon-192.png", data };

  const result = await pushService.sendToAll(payload);
  res.json({ success: true, data: result });
});

// GET /api/push/subscriptions – list active subscriptions count
pushRouter.get("/subscriptions", (_req: Request, res: Response) => {
  const subs = pushService.listSubscriptions();
  res.json({ success: true, data: { count: subs.length } });
});
