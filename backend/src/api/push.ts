import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/middleware';
import * as svc from '../services/pushService';

const router = Router();

// GET /push/vapid-public-key
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /push/subscribe
router.post('/subscribe', requireAuth, async (req: Request, res: Response) => {
  const { subscription } = req.body;
  if (!subscription) return res.status(400).json({ error: 'Manjka subscription' });
  const userId = req.user!.sub;
  await svc.saveSubscription(userId, subscription);
  res.status(201).json({ message: 'Subscription shranjena' });
});

// DELETE /push/subscribe
router.delete('/subscribe', requireAuth, async (req: Request, res: Response) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'Manjka endpoint' });
  await svc.deleteSubscription(endpoint);
  res.json({ message: 'Subscription izbrisana' });
});

// POST /push/send
router.post('/send', requireAuth, async (req: Request, res: Response) => {
  const { userId, payload } = req.body;
  if (!payload) return res.status(400).json({ error: 'Manjka payload' });
  await svc.sendPushToUser(userId, payload);
  res.json({ message: 'Push obvestilo poslano' });
});

export default router;
