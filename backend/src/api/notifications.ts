import { Router, Request, Response } from 'express';
import * as svc from '../services/notificationService';

const router = Router();

// GET /notifications
router.get('/', async (_req: Request, res: Response) => {
  const notifications = await svc.getAllNotifications();
  res.json(notifications);
});

// GET /notifications/:id
router.get('/:id', async (req: Request, res: Response) => {
  const notification = await svc.getNotificationById(req.params.id);
  if (!notification) return res.status(404).json({ error: 'Obvestilo ni najdeno' });
  res.json(notification);
});

// POST /notifications
router.post('/', async (req: Request, res: Response) => {
  const { title, message, userId, type } = req.body;
  if (!title || !message || !userId) {
    return res.status(400).json({ error: 'Manjkajo obvezna polja: title, message, userId' });
  }
  const notification = await svc.createNotification({
    title,
    message,
    userId,
    type: type ?? 'system',
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(notification);
});

// DELETE /notifications/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const ok = await svc.deleteNotification(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Obvestilo ni najdeno' });
  res.json({ message: 'Obvestilo izbrisano' });
});

export default router;
