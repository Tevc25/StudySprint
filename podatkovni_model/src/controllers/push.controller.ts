import { Request, Response } from 'express';
import { pushService } from '../push/push.service';

export const getVapidPublicKey = (_req: Request, res: Response): void => {
  res.json({ success: true, message: 'VAPID public key', data: { publicKey: pushService.vapidKeys.publicKey } });
};

export const subscribe = (req: Request, res: Response): void => {
  const { id, subscription } = req.body as { id?: string; subscription?: object };
  if (!id || !subscription) {
    res.status(400).json({ success: false, message: 'Missing id or subscription' });
    return;
  }
  pushService.subscribe(id, subscription as any);
  res.status(201).json({ success: true, message: 'Subscribed', data: { subscribers: pushService.subscriberCount } });
};

export const unsubscribe = (req: Request, res: Response): void => {
  pushService.unsubscribe(req.params.id);
  res.json({ success: true, message: 'Unsubscribed' });
};

export const sendPushNotification = async (req: Request, res: Response): Promise<void> => {
  const { title = 'StudySprint', body = 'Novo obvestilo', data, deviceId } = req.body as {
    title?: string;
    body?: string;
    data?: unknown;
    deviceId?: string;
  };

  if (deviceId) {
    await pushService.sendToDevice(deviceId, title, body, data);
  } else {
    await pushService.sendToAll(title, body, data);
  }

  res.json({ success: true, message: `Push sent to ${pushService.subscriberCount} subscriber(s)` });
};
