import { Router } from 'express';
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  sendPushNotification
} from '../controllers/push.controller';
import { asyncHandler } from '../utils/async-handler';

export const pushRouter = Router();

pushRouter.get('/vapid-public-key', getVapidPublicKey);
pushRouter.post('/subscribe', subscribe);
pushRouter.delete('/subscribe/:id', unsubscribe);
pushRouter.post('/send', asyncHandler(sendPushNotification));
